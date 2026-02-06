import { Request, Response } from 'express'
import prisma from '../config/database'
import { logger } from '../utils/logger'
import { tenantMercadoPagoService } from '../services/tenant-mercadopago.service'

interface ExternalReference {
  type: 'tenant_portal_payment'
  paymentGroupId: string
  obligationIds: number[]
}

/**
 * POST /api/webhooks/mercadopago/tenant
 * Webhook para recibir notificaciones de pago de MercadoPago
 */
export const handleTenantPaymentWebhook = async (req: Request, res: Response) => {
  try {
    const { type, data, action } = req.body

    logger.info(`[TENANT WEBHOOK] Received: type=${type}, action=${action}, data=${JSON.stringify(data)}`)

    // MercadoPago sends different notification types
    // We only care about payment notifications
    if (type !== 'payment' && action !== 'payment.created' && action !== 'payment.updated') {
      logger.info(`[TENANT WEBHOOK] Ignoring notification type: ${type}`)
      return res.status(200).send('OK')
    }

    const paymentId = data?.id
    if (!paymentId) {
      logger.warn('[TENANT WEBHOOK] No payment ID in notification')
      return res.status(200).send('OK')
    }

    // Validate webhook signature (in production)
    const isValid = tenantMercadoPagoService.validateWebhookSignature(
      req.headers['x-signature'] as string,
      req.headers['x-request-id'] as string,
      paymentId.toString()
    )

    if (!isValid) {
      logger.warn('[TENANT WEBHOOK] Invalid signature')
      return res.status(401).send('Invalid signature')
    }

    // Get payment details from MercadoPago
    const payment = await tenantMercadoPagoService.getPayment(paymentId.toString())

    if (!payment) {
      logger.warn(`[TENANT WEBHOOK] Payment not found: ${paymentId}`)
      return res.status(200).send('OK')
    }

    // Only process approved payments
    if (payment.status !== 'approved') {
      logger.info(`[TENANT WEBHOOK] Payment not approved: ${payment.status}`)
      return res.status(200).send('OK')
    }

    // Parse external reference
    let externalRef: ExternalReference
    try {
      externalRef = JSON.parse(payment.external_reference)
    } catch (e) {
      logger.error('[TENANT WEBHOOK] Invalid external reference')
      return res.status(200).send('OK')
    }

    if (externalRef.type !== 'tenant_portal_payment') {
      logger.info('[TENANT WEBHOOK] Not a tenant portal payment')
      return res.status(200).send('OK')
    }

    const { paymentGroupId, obligationIds } = externalRef

    // Check if already processed (idempotency)
    const existingPayment = await prisma.obligationPayment.findFirst({
      where: { paymentGroupId }
    })

    if (existingPayment) {
      logger.info(`[TENANT WEBHOOK] Payment already processed: ${paymentGroupId}`)
      return res.status(200).send('OK')
    }

    // Process each obligation
    for (const obligationId of obligationIds) {
      const obligation = await prisma.obligation.findUnique({
        where: { id: obligationId }
      })

      if (!obligation) {
        logger.warn(`[TENANT WEBHOOK] Obligation not found: ${obligationId}`)
        continue
      }

      const amountToPay = obligation.amount - obligation.paidAmount

      // Create ObligationPayment
      await prisma.obligationPayment.create({
        data: {
          userId: obligation.userId,
          obligationId: obligation.id,
          amount: amountToPay,
          paymentDate: new Date(payment.date_approved || payment.date_created),
          method: 'mercadopago',
          reference: paymentId.toString(),
          source: 'tenant_portal',
          paymentGroupId
        }
      })

      // Update obligation status
      const newPaidAmount = obligation.paidAmount + amountToPay
      const newStatus = newPaidAmount >= obligation.amount ? 'paid' : 'partial'

      await prisma.obligation.update({
        where: { id: obligationId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus
        }
      })

      logger.info(`[TENANT WEBHOOK] Processed obligation ${obligationId}: ${amountToPay} -> ${newStatus}`)
    }

    logger.info(`[TENANT WEBHOOK] Payment group processed: ${paymentGroupId}`)
    return res.status(200).send('OK')
  } catch (error) {
    logger.error('[TENANT WEBHOOK] Error:', error)
    // Always return 200 to avoid retries for unrecoverable errors
    return res.status(200).send('OK')
  }
}

/**
 * POST /api/webhooks/mercadopago/tenant/mock
 * Endpoint para simular pagos en desarrollo
 */
export const simulateTenantPayment = async (req: Request, res: Response) => {
  try {
    const { paymentGroupId, obligationIds, status = 'approved' } = req.body

    if (!paymentGroupId || !obligationIds || !Array.isArray(obligationIds)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'paymentGroupId and obligationIds are required'
      })
    }

    logger.info(`[TENANT MOCK PAYMENT] Simulating ${status} payment for group: ${paymentGroupId}`)

    if (status !== 'approved') {
      return res.json({
        success: true,
        message: `Payment simulation: ${status}`,
        processed: false
      })
    }

    // Check if already processed
    const existingPayment = await prisma.obligationPayment.findFirst({
      where: { paymentGroupId }
    })

    if (existingPayment) {
      return res.json({
        success: true,
        message: 'Payment already processed',
        processed: false
      })
    }

    // Process each obligation
    const results = []
    for (const obligationId of obligationIds) {
      const obligation = await prisma.obligation.findUnique({
        where: { id: obligationId }
      })

      if (!obligation) {
        results.push({ obligationId, status: 'not_found' })
        continue
      }

      if (obligation.status === 'paid') {
        results.push({ obligationId, status: 'already_paid' })
        continue
      }

      const amountToPay = obligation.amount - obligation.paidAmount

      // Create payment
      await prisma.obligationPayment.create({
        data: {
          userId: obligation.userId,
          obligationId: obligation.id,
          amount: amountToPay,
          paymentDate: new Date(),
          method: 'mercadopago',
          reference: `MOCK_${paymentGroupId.substring(0, 8)}`,
          source: 'tenant_portal',
          paymentGroupId
        }
      })

      // Update obligation
      await prisma.obligation.update({
        where: { id: obligationId },
        data: {
          paidAmount: obligation.amount,
          status: 'paid'
        }
      })

      results.push({ obligationId, status: 'paid', amount: amountToPay })
    }

    logger.info(`[TENANT MOCK PAYMENT] Processed ${results.length} obligations`)

    return res.json({
      success: true,
      message: 'Mock payment processed',
      processed: true,
      results
    })
  } catch (error) {
    logger.error('[TENANT MOCK PAYMENT] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
