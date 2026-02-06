import { Router } from 'express'
import {
  validateInviteToken,
  activateTenantAccount
} from '../controllers/tenant.invite.controller'

const router = Router()

// ============================================
// RUTAS PÚBLICAS (para activación de cuenta)
// Las rutas de invitación admin están en tenants.routes.ts
// ============================================

/**
 * GET /api/tenant/activate/validate
 * Valida un token de invitación
 */
router.get('/activate/validate', validateInviteToken)

/**
 * POST /api/tenant/activate
 * Activa una cuenta de tenant
 */
router.post('/activate', activateTenantAccount)

export default router
