import { Router } from 'express'
import * as obligationsController from '../controllers/obligations.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

// ============================================================================
// OBLIGATIONS ROUTES
// ============================================================================

// GET /api/obligations - Get all obligations
router.get('/', obligationsController.getAll)

// GET /api/obligations/pending - Get pending obligations
router.get('/pending', obligationsController.getPending)

// GET /api/obligations/overdue - Get overdue obligations
router.get('/overdue', obligationsController.getOverdue)

// POST /api/obligations/mark-overdue - Mark overdue obligations
// router.post('/mark-overdue', obligationsController.markOverdue) // Comentado - función no existe

// GET /api/obligations/type/:type - Get obligations by type
router.get('/type/:type', obligationsController.getByType)

// GET /api/obligations/contract/:contractId - Get obligations by contract
router.get('/contract/:contractId', obligationsController.getByContractId)

// GET /api/obligations/:id - Get obligation by ID
router.get('/:id', obligationsController.getById)

// POST /api/obligations/generate - Generate obligations automatically
router.post('/generate', obligationsController.generateObligations)

// POST /api/obligations - Create obligation
router.post('/', obligationsController.create)

// PUT /api/obligations/:id - Update obligation
router.put('/:id', obligationsController.update)

// DELETE /api/obligations/:id - Delete obligation
router.delete('/:id', obligationsController.remove)

// ============================================================================
// OBLIGATION PAYMENTS ROUTES
// ============================================================================

// GET /api/obligations/payments/all - Get all payments
router.get('/payments/all', obligationsController.getAllPayments)

// GET /api/obligations/:obligationId/payments - Get payments by obligation
router.get('/:obligationId/payments', obligationsController.getPaymentsByObligationId)

// POST /api/obligations/payments - Create payment
router.post('/payments', obligationsController.createPayment)

// GET /api/obligations/payments/:id - Get payment by ID
router.get('/payments/:id', obligationsController.getPaymentById)

// PUT /api/obligations/payments/:id - Update payment
router.put('/payments/:id', obligationsController.updatePayment)

// DELETE /api/obligations/payments/:id - Delete payment
router.delete('/payments/:id', obligationsController.removePayment)

// ============================================================================
// OWNER BALANCE RECALCULATION ROUTES
// ============================================================================

// POST /api/obligations/recalculate-balances - Recalculate all owner balances
router.post('/recalculate-balances', obligationsController.recalculateAllOwnerBalances)

// POST /api/obligations/recalculate-balance/:ownerId - Recalculate specific owner balance
router.post('/recalculate-balance/:ownerId', obligationsController.recalculateOwnerBalance)

export default router
