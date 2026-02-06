import { Router } from 'express'
import * as settlementsController from '../controllers/settlements.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

// GET /api/settlements - Get all settlements
router.get('/', settlementsController.getAll)

// GET /api/settlements/pending - Get pending settlements
router.get('/pending', settlementsController.getPending)

// GET /api/settlements/owner/:ownerId - Get settlements by owner
router.get('/owner/:ownerId', settlementsController.getByOwner)

// POST /api/settlements - Create/update settlement
router.post('/', settlementsController.create)

// POST /api/settlements/calculate - Calculate settlements for a period
router.post('/calculate', settlementsController.calculateForPeriod)

// PUT /api/settlements/:id/settle - Mark as settled
router.put('/:id/settle', settlementsController.markAsSettled)

// PUT /api/settlements/:id/pending - Mark as pending (undo)
router.put('/:id/pending', settlementsController.markAsPending)

// DELETE /api/settlements/:id - Delete settlement
router.delete('/:id', settlementsController.remove)

export default router
