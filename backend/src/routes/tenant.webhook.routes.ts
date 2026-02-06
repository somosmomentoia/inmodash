import { Router } from 'express'
import {
  handleTenantPaymentWebhook,
  simulateTenantPayment
} from '../controllers/tenant.webhook.controller'

const router = Router()

/**
 * POST /api/webhooks/mercadopago/tenant
 * Webhook de MercadoPago para pagos del portal tenant
 * NO requiere autenticación (viene de MercadoPago)
 */
router.post('/mercadopago/tenant', handleTenantPaymentWebhook)

/**
 * POST /api/webhooks/mercadopago/tenant/mock
 * Endpoint para simular pagos en desarrollo
 * Solo disponible en desarrollo
 */
if (process.env.NODE_ENV !== 'production') {
  router.post('/mercadopago/tenant/mock', simulateTenantPayment)
}

export default router
