import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import * as cashflowController from '../controllers/cashflow.controller'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// GET /api/cash-flow — Lista todos los pagos (fuente de verdad de FC)
router.get('/', requirePermission('finances', 'view_cashflow'), cashflowController.getAll)

// POST /api/cash-flow — Crear movimiento atómico (obligation + payment)
router.post('/', requirePermission('finances', 'create_movement'), cashflowController.createMovement)

export default router
