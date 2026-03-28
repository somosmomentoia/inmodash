import { Router } from 'express'
import * as recurringObligationsController from '../controllers/recurring-obligations.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// CRUD de recurrencias
router.get('/', requirePermission('obligations', 'view'), recurringObligationsController.getAll)
router.get('/:id', requirePermission('obligations', 'view'), recurringObligationsController.getById)
router.post('/', requirePermission('obligations', 'create'), recurringObligationsController.create)
router.put('/:id', requirePermission('obligations', 'edit'), recurringObligationsController.update)
router.delete('/:id', requirePermission('obligations', 'delete'), recurringObligationsController.remove)

// Acciones especiales
router.post('/:id/toggle', requirePermission('obligations', 'edit'), recurringObligationsController.toggleActive)
router.post('/generate', requirePermission('obligations', 'create'), recurringObligationsController.generateForMonth)

export default router
