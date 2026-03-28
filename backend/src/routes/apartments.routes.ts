import { Router } from 'express'
import * as apartmentsController from '../controllers/apartments.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

// All routes require authentication
router.use(authenticate)

router.get('/', requirePermission('properties', 'view'), apartmentsController.getAll)
router.get('/:id', requirePermission('properties', 'view'), apartmentsController.getById)
router.get('/building/:buildingId', requirePermission('properties', 'view'), apartmentsController.getByBuildingId)
router.post('/', requirePermission('properties', 'create'), apartmentsController.create)
router.put('/:id', requirePermission('properties', 'edit'), apartmentsController.update)
router.delete('/:id', requirePermission('properties', 'delete'), apartmentsController.remove)

export default router
