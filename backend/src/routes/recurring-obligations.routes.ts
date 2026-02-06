import { Router } from 'express'
import * as recurringObligationsController from '../controllers/recurring-obligations.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// CRUD de recurrencias
router.get('/', recurringObligationsController.getAll)
router.get('/:id', recurringObligationsController.getById)
router.post('/', recurringObligationsController.create)
router.put('/:id', recurringObligationsController.update)
router.delete('/:id', recurringObligationsController.remove)

// Acciones especiales
router.post('/:id/toggle', recurringObligationsController.toggleActive)
router.post('/generate', recurringObligationsController.generateForMonth)

export default router
