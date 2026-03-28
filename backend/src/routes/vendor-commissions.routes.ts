import { Router } from 'express'
import * as vendorCommissionsController from '../controllers/vendor-commissions.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

router.get('/', vendorCommissionsController.getAll)
router.get('/stats', vendorCommissionsController.getStats)
router.get('/vendor/:vendorId', vendorCommissionsController.getByVendor)
router.post('/:id/pay', vendorCommissionsController.markAsPaid)

export default router
