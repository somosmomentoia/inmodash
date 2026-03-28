import { Router } from 'express'
import * as buildingsController from '../controllers/buildings.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

// All routes require authentication
router.use(authenticate)

router.get('/', requirePermission('properties', 'view'), buildingsController.getAll)
router.get('/:id', requirePermission('properties', 'view'), buildingsController.getById)
router.post('/', requirePermission('properties', 'create'), buildingsController.create)
router.put('/:id', requirePermission('properties', 'edit'), buildingsController.update)
router.delete('/:id', requirePermission('properties', 'delete'), buildingsController.remove)

export default router
