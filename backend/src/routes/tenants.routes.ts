import { Router } from 'express'
import * as tenantsController from '../controllers/tenants.controller'
import { generateInviteLink, getInviteStatus } from '../controllers/tenant.invite.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Tenant Portal - Invitaciones (rutas específicas primero)
router.post('/:tenantId/invite', generateInviteLink)
router.get('/:tenantId/invite/status', getInviteStatus)

// CRUD básico
router.get('/', tenantsController.getAll)
router.get('/:id', tenantsController.getById)
router.post('/', tenantsController.create)
router.put('/:id', tenantsController.update)
router.delete('/:id', tenantsController.remove)

export default router
