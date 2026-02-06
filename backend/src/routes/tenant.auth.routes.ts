import { Router } from 'express'
import {
  tenantLogin,
  tenantLogout,
  tenantMe,
  tenantRefresh
} from '../controllers/tenant.auth.controller'
import { tenantAuthenticate } from '../middleware/tenantAuth'

const router = Router()

/**
 * POST /api/tenant/auth/login
 * Login para usuarios tenant
 */
router.post('/login', tenantLogin)

/**
 * POST /api/tenant/auth/logout
 * Logout para usuarios tenant
 */
router.post('/logout', tenantLogout)

/**
 * GET /api/tenant/auth/me
 * Obtener información del usuario tenant autenticado
 */
router.get('/me', tenantAuthenticate, tenantMe)

/**
 * POST /api/tenant/auth/refresh
 * Renovar token de acceso
 */
router.post('/refresh', tenantRefresh)

export default router
