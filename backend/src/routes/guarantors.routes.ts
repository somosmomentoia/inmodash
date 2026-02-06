import { Router } from 'express'
import * as guarantorsController from '../controllers/guarantors.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Obtener todos los garantes del usuario
router.get('/', guarantorsController.getAll)

// Obtener garante por ID
router.get('/:id', guarantorsController.getById)

// Crear garante (ya no requiere tenantId)
router.post('/', guarantorsController.create)

// Actualizar garante
router.put('/:id', guarantorsController.update)

// Eliminar garante (soft delete)
router.delete('/:id', guarantorsController.remove)

export default router
