import { Router } from 'express'
import * as obligationsController from '../controllers/obligations.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

// All routes require authentication
router.use(authenticate)

// ============================================================================
// OBLIGATIONS ROUTES
// ============================================================================

// GET /api/obligations - Get all obligations
router.get('/', requirePermission('obligations', 'view'), obligationsController.getAll)

// GET /api/obligations/pending - Get pending obligations
router.get('/pending', requirePermission('obligations', 'view'), obligationsController.getPending)

// GET /api/obligations/overdue - Get overdue obligations
router.get('/overdue', requirePermission('obligations', 'view'), obligationsController.getOverdue)

// POST /api/obligations/mark-overdue - Mark overdue obligations
// router.post('/mark-overdue', obligationsController.markOverdue) // Comentado - función no existe

// GET /api/obligations/type/:type - Get obligations by type
router.get('/type/:type', requirePermission('obligations', 'view'), obligationsController.getByType)

// GET /api/obligations/contract/:contractId - Get obligations by contract
router.get('/contract/:contractId', requirePermission('obligations', 'view'), obligationsController.getByContractId)

// GET /api/obligations/:id - Get obligation by ID
router.get('/:id', requirePermission('obligations', 'view'), obligationsController.getById)

// POST /api/obligations/generate - Generate obligations automatically
router.post('/generate', requirePermission('obligations', 'create'), obligationsController.generateObligations)

// POST /api/obligations - Create obligation
router.post('/', requirePermission('obligations', 'create'), obligationsController.create)

// PUT /api/obligations/:id - Update obligation
router.put('/:id', requirePermission('obligations', 'edit'), obligationsController.update)

// DELETE /api/obligations/:id - Delete obligation
router.delete('/:id', requirePermission('obligations', 'delete'), obligationsController.remove)

// ============================================================================
// OBLIGATION PAYMENTS ROUTES
// ============================================================================

// GET /api/obligations/payments/all - Get all payments
router.get('/payments/all', requirePermission('obligations', 'view'), obligationsController.getAllPayments)

// GET /api/obligations/:obligationId/payments - Get payments by obligation
router.get('/:obligationId/payments', requirePermission('obligations', 'view'), obligationsController.getPaymentsByObligationId)

// POST /api/obligations/payments - Create payment
router.post('/payments', requirePermission('obligations', 'register_payment'), obligationsController.createPayment)

// GET /api/obligations/payments/:id - Get payment by ID
router.get('/payments/:id', requirePermission('obligations', 'view'), obligationsController.getPaymentById)

// PUT /api/obligations/payments/:id - Update payment
router.put('/payments/:id', requirePermission('obligations', 'edit'), obligationsController.updatePayment)

// DELETE /api/obligations/payments/:id - Delete payment
router.delete('/payments/:id', requirePermission('obligations', 'delete'), obligationsController.removePayment)

export default router
