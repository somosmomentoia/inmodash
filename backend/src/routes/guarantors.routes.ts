import { Router } from 'express'
import * as guarantorsController from '../controllers/guarantors.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Obtener todos los garantes del usuario
router.get('/', requirePermission('contracts', 'view'), guarantorsController.getAll)

// Obtener garante por ID
router.get('/:id', requirePermission('contracts', 'view'), guarantorsController.getById)

// Crear garante (ya no requiere tenantId)
router.post('/', requirePermission('contracts', 'create'), guarantorsController.create)

// Actualizar garante
router.put('/:id', requirePermission('contracts', 'edit'), guarantorsController.update)

// Eliminar garante (soft delete)
router.delete('/:id', requirePermission('contracts', 'delete'), guarantorsController.remove)

export default router
