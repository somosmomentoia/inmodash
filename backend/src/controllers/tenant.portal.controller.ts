import { Request, Response } from 'express'
import prisma from '../config/database'
import { logger } from '../utils/logger'
import { TenantContext } from '../middleware/tenantAuth'

// Para generación de PDF en producción
// import PDFDocument from 'pdfkit'

/**
 * GET /api/tenant/contracts
 * Obtiene los contratos del tenant autenticado
 */
export const getTenantContracts = async (req: Request, res: Response) => {
  try {
    const ctx = req.tenantContext as TenantContext

    if (!ctx) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get all contracts from all tenant associations
    const contracts = ctx.tenantUsers.flatMap(tu => 
      tu.contracts.map(c => ({
        id: c.id,
        apartmentId: c.apartmentId,
        startDate: c.startDate,
        endDate: c.endDate,
        apartment: c.apartment
      }))
    )

    // Get full contract details with current amount
    const fullContracts = await prisma.contract.findMany({
      where: {
        id: { in: contracts.map(c => c.id) },
        userId: ctx.agencyUserId
      },
      include: {
        apartment: {
          select: {
            id: true,
            nomenclature: true,
            fullAddress: true,
            city: true,
            province: true,
            propertyType: true
          }
        }
      }
    })

    // Get next obligation for each contract
    const contractsWithNext = await Promise.all(
      fullContracts.map(async (contract) => {
        const nextObligation = await prisma.obligation.findFirst({
          where: {
            contractId: contract.id,
            userId: ctx.agencyUserId,
            paidBy: 'tenant',
            status: { in: ['pending', 'overdue'] }
          },
          orderBy: { dueDate: 'asc' },
          select: {
            description: true,
            dueDate: true,
            amount: true
          }
        })

        return {
          ...contract,
          nextObligation
        }
      })
    )

    return res.json({
      success: true,
      contracts: contractsWithNext
    })
  } catch (error) {
    logger.error('[TENANT CONTRACTS] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * GET /api/tenant/obligations
 * Obtiene las obligaciones del tenant autenticado
 */
export const getTenantObligations = async (req: Request, res: Response) => {
  try {
    const ctx = req.tenantContext as TenantContext
    const { contractId, status, period } = req.query

    if (!ctx) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get all contract IDs for this tenant
    const contractIds = ctx.tenantUsers.flatMap(tu => tu.contracts.map(c => c.id))

    // Build where clause
    const where: any = {
      userId: ctx.agencyUserId,
      contractId: { in: contractIds },
      paidBy: 'tenant'
    }

    if (contractId) {
      const cId = parseInt(contractId as string)
      if (!contractIds.includes(cId)) {
        return res.status(403).json({ error: 'Forbidden', message: 'Contract not accessible' })
      }
      where.contractId = cId
    }

    if (status && status !== 'all') {
      if (status === 'unpaid') {
        where.status = { in: ['pending', 'overdue', 'partial'] }
      } else {
        where.status = status
      }
    }

    if (period) {
      const [year, month] = (period as string).split('-').map(Number)
      const startOfMonth = new Date(year, month - 1, 1)
      const endOfMonth = new Date(year, month, 0, 23, 59, 59)
      where.period = {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }

    const obligations = await prisma.obligation.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' }
      ],
      select: {
        id: true,
        type: true,
        category: true,
        description: true,
        period: true,
        dueDate: true,
        amount: true,
        paidAmount: true,
        status: true
      }
    })

    return res.json({
      success: true,
      obligations
    })
  } catch (error) {
    logger.error('[TENANT OBLIGATIONS] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * GET /api/tenant/account/summary
 * Obtiene el resumen del estado de cuenta para un período
 */
export const getAccountSummary = async (req: Request, res: Response) => {
  try {
    const ctx = req.tenantContext as TenantContext
    const { period, contractId } = req.query

    if (!ctx) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Parse period (default to current month)
    const now = new Date()
    const [year, month] = period 
      ? (period as string).split('-').map(Number)
      : [now.getFullYear(), now.getMonth() + 1]

    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59)

    // Get contract IDs
    const contractIds = ctx.tenantUsers.flatMap(tu => tu.contracts.map(c => c.id))

    const where: any = {
      userId: ctx.agencyUserId,
      contractId: { in: contractIds },
      paidBy: 'tenant',
      period: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }

    if (contractId) {
      const cId = parseInt(contractId as string)
      if (!contractIds.includes(cId)) {
        return res.status(403).json({ error: 'Forbidden' })
      }
      where.contractId = cId
    }

    // Get obligations for the period
    const obligations = await prisma.obligation.findMany({
      where,
      select: {
        id: true,
        type: true,
        category: true,
        description: true,
        period: true,
        dueDate: true,
        amount: true,
        paidAmount: true,
        status: true
      }
    })

    // Calculate summary
    const totalObligations = obligations.reduce((sum, o) => sum + o.amount, 0)
    const totalPaid = obligations.reduce((sum, o) => sum + o.paidAmount, 0)
    const balance = totalObligations - totalPaid

    // Calculate accumulated balance (all unpaid from previous periods)
    const accumulatedObligations = await prisma.obligation.findMany({
      where: {
        userId: ctx.agencyUserId,
        contractId: { in: contractIds },
        paidBy: 'tenant',
        period: { lt: startOfMonth },
        status: { in: ['pending', 'overdue', 'partial'] }
      },
      select: {
        amount: true,
        paidAmount: true
      }
    })

    const previousBalance = accumulatedObligations.reduce(
      (sum, o) => sum + (o.amount - o.paidAmount), 0
    )
    const accumulatedBalance = balance + previousBalance

    return res.json({
      success: true,
      period: `${year}-${String(month).padStart(2, '0')}`,
      obligations,
      summary: {
        totalObligations,
        totalPaid,
        balance,
        accumulatedBalance
      }
    })
  } catch (error) {
    logger.error('[TENANT ACCOUNT SUMMARY] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * GET /api/tenant/payments
 * Obtiene el historial de pagos del tenant
 */
export const getTenantPayments = async (req: Request, res: Response) => {
  try {
    const ctx = req.tenantContext as TenantContext

    if (!ctx) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get contract IDs
    const contractIds = ctx.tenantUsers.flatMap(tu => tu.contracts.map(c => c.id))

    // Get payments for obligations of these contracts
    const payments = await prisma.obligationPayment.findMany({
      where: {
        userId: ctx.agencyUserId,
        obligation: {
          contractId: { in: contractIds },
          paidBy: 'tenant'
        }
      },
      orderBy: { paymentDate: 'desc' },
      include: {
        obligation: {
          select: {
            description: true,
            type: true
          }
        }
      }
    })

    return res.json({
      success: true,
      payments: payments.map(p => ({
        id: p.id,
        obligationId: p.obligationId,
        amount: p.amount,
        paymentDate: p.paymentDate,
        method: p.method,
        reference: p.reference,
        obligation: p.obligation
      }))
    })
  } catch (error) {
    logger.error('[TENANT PAYMENTS] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * POST /api/tenant/obligations/pay
 * Inicia el proceso de pago de obligaciones seleccionadas
 */
export const payObligations = async (req: Request, res: Response) => {
  try {
    const ctx = req.tenantContext as TenantContext
    const { obligationIds } = req.body

    if (!ctx) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!obligationIds || !Array.isArray(obligationIds) || obligationIds.length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'obligationIds is required' })
    }

    // Get contract IDs
    const contractIds = ctx.tenantUsers.flatMap(tu => tu.contracts.map(c => c.id))

    // Validate all obligations belong to tenant and are payable
    const obligations = await prisma.obligation.findMany({
      where: {
        id: { in: obligationIds },
        userId: ctx.agencyUserId,
        contractId: { in: contractIds },
        paidBy: 'tenant',
        status: { in: ['pending', 'overdue', 'partial'] }
      }
    })

    if (obligations.length !== obligationIds.length) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Some obligations are not valid for payment'
      })
    }

    // Calculate total
    const total = obligations.reduce((sum, o) => sum + (o.amount - o.paidAmount), 0)

    // Generate payment group ID
    const { v4: uuidv4 } = await import('uuid')
    const paymentGroupId = uuidv4()

    // Get payer email
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { email: true }
    })

    // Create MercadoPago preference
    const { tenantMercadoPagoService } = await import('../services/tenant-mercadopago.service')
    
    const preference = await tenantMercadoPagoService.createPaymentPreference(
      obligations.map(o => ({
        id: o.id,
        description: o.description,
        amount: o.amount - o.paidAmount
      })),
      user?.email || ctx.email,
      paymentGroupId
    )

    logger.info(`[TENANT PAY] Payment initiated: ${paymentGroupId}, ${obligationIds.length} obligations, total: ${total}`)

    return res.json({
      success: true,
      paymentGroupId,
      total,
      obligationCount: obligations.length,
      preferenceId: preference.id,
      checkoutUrl: preference.init_point
    })
  } catch (error) {
    logger.error('[TENANT PAY] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * GET /api/tenant/payments/:paymentId/receipt
 * Genera un comprobante de pago
 */
export const getPaymentReceipt = async (req: Request, res: Response) => {
  try {
    const ctx = req.tenantContext as TenantContext
    const { paymentId } = req.params

    if (!ctx) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get contract IDs
    const contractIds = ctx.tenantUsers.flatMap(tu => tu.contracts.map(c => c.id))

    // Get payment with obligation details
    const payment = await prisma.obligationPayment.findFirst({
      where: {
        id: parseInt(paymentId),
        userId: ctx.agencyUserId,
        obligation: {
          contractId: { in: contractIds },
          paidBy: 'tenant'
        }
      },
      include: {
        obligation: {
          include: {
            contract: {
              include: {
                apartment: {
                  select: {
                    nomenclature: true,
                    fullAddress: true
                  }
                },
                tenant: {
                  select: {
                    nameOrBusiness: true,
                    dniOrCuit: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!payment) {
      return res.status(404).json({ error: 'Not Found', message: 'Payment not found' })
    }

    // Get agency info
    const agency = await prisma.user.findUnique({
      where: { id: ctx.agencyUserId },
      select: { companyName: true, name: true, email: true }
    })

    // Format receipt data
    const receiptData = {
      receiptNumber: `REC-${payment.id.toString().padStart(6, '0')}`,
      paymentDate: payment.paymentDate,
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
      obligation: {
        description: payment.obligation.description,
        period: payment.obligation.period,
        type: payment.obligation.type
      },
      tenant: {
        name: payment.obligation.contract?.tenant?.nameOrBusiness || 'N/A',
        document: payment.obligation.contract?.tenant?.dniOrCuit || 'N/A'
      },
      property: {
        address: payment.obligation.contract?.apartment?.fullAddress || 
                 payment.obligation.contract?.apartment?.nomenclature || 'N/A'
      },
      agency: {
        name: agency?.companyName || agency?.name || 'InmoDash',
        email: agency?.email
      }
    }

    // TODO: En producción, generar PDF real con pdfkit
    // Por ahora, retornamos JSON que el frontend puede usar para mostrar/imprimir
    
    // Para generar PDF real:
    // const doc = new PDFDocument()
    // res.setHeader('Content-Type', 'application/pdf')
    // res.setHeader('Content-Disposition', `attachment; filename=comprobante-${payment.id}.pdf`)
    // doc.pipe(res)
    // ... generar contenido del PDF
    // doc.end()

    // Mock: Retornar datos del comprobante como JSON
    res.setHeader('Content-Type', 'application/json')
    return res.json({
      success: true,
      receipt: receiptData,
      // En desarrollo, indicamos que es mock
      _mock: true,
      _message: 'En producción, este endpoint retornará un PDF'
    })
  } catch (error) {
    logger.error('[TENANT RECEIPT] Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
