import { Router } from 'express'
import {
  getTenantContracts,
  getTenantObligations,
  getAccountSummary,
  getTenantPayments,
  payObligations,
  getPaymentReceipt
} from '../controllers/tenant.portal.controller'
import { tenantAuthenticate } from '../middleware/tenantAuth'

const router = Router()

// All routes require tenant authentication
router.use(tenantAuthenticate)

/**
 * GET /api/tenant/contracts
 * Obtiene los contratos del tenant
 */
router.get('/contracts', getTenantContracts)

/**
 * GET /api/tenant/obligations
 * Obtiene las obligaciones del tenant
 */
router.get('/obligations', getTenantObligations)

/**
 * GET /api/tenant/account/summary
 * Obtiene el resumen del estado de cuenta
 */
router.get('/account/summary', getAccountSummary)

/**
 * GET /api/tenant/payments
 * Obtiene el historial de pagos
 */
router.get('/payments', getTenantPayments)

/**
 * POST /api/tenant/obligations/pay
 * Inicia el proceso de pago
 */
router.post('/obligations/pay', payObligations)

/**
 * GET /api/tenant/payments/:paymentId/receipt
 * Genera comprobante de pago
 */
router.get('/payments/:paymentId/receipt', getPaymentReceipt)

export default router
