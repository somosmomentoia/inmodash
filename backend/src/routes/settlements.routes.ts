import { Router } from 'express'
import * as settlementsController from '../controllers/settlements.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

// All routes require authentication
router.use(authenticate)

// GET /api/settlements - Get all settlements
router.get('/', requirePermission('finances', 'view_settlements'), settlementsController.getAll)

// GET /api/settlements/pending - Get pending settlements
router.get('/pending', requirePermission('finances', 'view_settlements'), settlementsController.getPending)

// GET /api/settlements/owner/:ownerId - Get settlements by owner
router.get('/owner/:ownerId', requirePermission('finances', 'view_settlements'), settlementsController.getByOwner)

// POST /api/settlements - Create/update settlement
router.post('/', requirePermission('finances', 'settle_owners'), settlementsController.create)

// POST /api/settlements/calculate - Calculate settlements for a period
router.post('/calculate', requirePermission('finances', 'view_settlements'), settlementsController.calculateForPeriod)

// PUT /api/settlements/:id/settle - Mark as settled (liquidar)
router.put('/:id/settle', requirePermission('finances', 'settle_owners'), settlementsController.markAsSettled)

// PUT /api/settlements/:id/pending - Mark as pending
router.put('/:id/pending', requirePermission('finances', 'settle_owners'), settlementsController.markAsPending)

// PUT /api/settlements/:id/recalculate - Recalculate a stale settlement
router.put('/:id/recalculate', requirePermission('finances', 'settle_owners'), settlementsController.recalculate)

// PUT /api/settlements/:id/dismiss - Dismiss stale
router.put('/:id/dismiss', requirePermission('finances', 'settle_owners'), settlementsController.dismissStale)

// DELETE /api/settlements/:id - Delete settlement
router.delete('/:id', requirePermission('finances', 'settle_owners'), settlementsController.remove)

export default router
