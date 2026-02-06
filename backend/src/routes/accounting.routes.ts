import { Router } from 'express'
import accountingController from '../controllers/accounting.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// GET /api/accounting/commissions/summary - Resumen de comisiones (debe ir antes de /:id)
router.get('/commissions/summary', accountingController.getCommissionsSummary)

// GET /api/accounting/totals - Totales por tipo
router.get('/totals', accountingController.getTotalsByType)

// GET /api/accounting - Obtener todos los asientos
router.get('/', accountingController.getAll)

// GET /api/accounting/:id - Obtener un asiento por ID
router.get('/:id', accountingController.getById)

// POST /api/accounting - Crear un asiento
router.post('/', accountingController.create)

// DELETE /api/accounting/:id - Eliminar un asiento
router.delete('/:id', accountingController.delete)

export default router
