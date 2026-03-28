import { Router } from 'express'
import * as dashboardController from '../controllers/dashboard.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

// All routes require authentication
router.use(authenticate)

router.get('/stats', requirePermission('dashboard', 'view'), dashboardController.getStats)

export default router
