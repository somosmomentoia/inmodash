import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import {
  getProspects,
  getProspect,
  createProspect,
  updateProspect,
  changeProspectStatus,
  addProspectNote,
  convertProspect,
  deleteProspect,
  getProspectStats,
  getStaleProspects,
  getApprovedPending,
} from '../controllers/prospects.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Statistics and alerts (before :id routes to avoid conflicts)
router.get('/stats', requirePermission('prospects', 'view'), getProspectStats)
router.get('/alerts/stale', requirePermission('prospects', 'view'), getStaleProspects)
router.get('/alerts/approved-pending', requirePermission('prospects', 'view'), getApprovedPending)

// CRUD operations
router.get('/', requirePermission('prospects', 'view'), getProspects)
router.get('/:id', requirePermission('prospects', 'view'), getProspect)
router.post('/', requirePermission('prospects', 'create'), createProspect)
router.put('/:id', requirePermission('prospects', 'edit'), updateProspect)
router.delete('/:id', requirePermission('prospects', 'delete'), deleteProspect)

// Status and actions
router.put('/:id/status', requirePermission('prospects', 'edit'), changeProspectStatus)
router.post('/:id/notes', requirePermission('prospects', 'edit'), addProspectNote)
router.post('/:id/convert', requirePermission('prospects', 'edit'), convertProspect)

export default router
