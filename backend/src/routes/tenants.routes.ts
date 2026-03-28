import { Router } from 'express'
import * as tenantsController from '../controllers/tenants.controller'
import { generateInviteLink, getInviteStatus } from '../controllers/tenant.invite.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Tenant Portal - Invitaciones (rutas específicas primero)
router.post('/:tenantId/invite', requirePermission('contracts', 'edit'), generateInviteLink)
router.get('/:tenantId/invite/status', requirePermission('contracts', 'view'), getInviteStatus)

// CRUD básico
router.get('/', requirePermission('contracts', 'view'), tenantsController.getAll)
router.get('/:id', requirePermission('contracts', 'view'), tenantsController.getById)
router.post('/', requirePermission('contracts', 'create'), tenantsController.create)
router.put('/:id', requirePermission('contracts', 'edit'), tenantsController.update)
router.delete('/:id', requirePermission('contracts', 'delete'), tenantsController.remove)

export default router
