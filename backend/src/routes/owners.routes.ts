import { Router } from 'express'
import * as ownersController from '../controllers/owners.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

// All routes require authentication
router.use(authenticate)

router.get('/', requirePermission('properties', 'view'), ownersController.getAll)
router.get('/:id', requirePermission('properties', 'view'), ownersController.getById)
router.post('/', requirePermission('properties', 'create'), ownersController.create)
router.put('/:id', requirePermission('properties', 'edit'), ownersController.update)
router.delete('/:id', requirePermission('properties', 'delete'), ownersController.remove)

export default router
