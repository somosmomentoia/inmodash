import { Router } from 'express'
import accountingController from '../controllers/accounting.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// GET /api/accounting/commissions/summary - Resumen de comisiones (debe ir antes de /:id)
router.get('/commissions/summary', requirePermission('finances', 'view_commissions'), accountingController.getCommissionsSummary)

// GET /api/accounting/totals - Totales por tipo
router.get('/totals', requirePermission('finances', 'view_accounting'), accountingController.getTotalsByType)

// GET /api/accounting - Obtener todos los asientos
router.get('/', requirePermission('finances', 'view_accounting'), accountingController.getAll)

// GET /api/accounting/:id - Obtener un asiento por ID
router.get('/:id', requirePermission('finances', 'view_accounting'), accountingController.getById)

// POST /api/accounting - Crear un asiento
router.post('/', requirePermission('finances', 'view_accounting'), accountingController.create)

// DELETE /api/accounting/:id - Eliminar un asiento
router.delete('/:id', requirePermission('finances', 'view_accounting'), accountingController.delete)

export default router
