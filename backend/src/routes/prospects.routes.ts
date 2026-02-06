import { Router } from 'express'
import { authenticate } from '../middleware/auth'
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
router.get('/stats', getProspectStats)
router.get('/alerts/stale', getStaleProspects)
router.get('/alerts/approved-pending', getApprovedPending)

// CRUD operations
router.get('/', getProspects)
router.get('/:id', getProspect)
router.post('/', createProspect)
router.put('/:id', updateProspect)
router.delete('/:id', deleteProspect)

// Status and actions
router.put('/:id/status', changeProspectStatus)
router.post('/:id/notes', addProspectNote)
router.post('/:id/convert', convertProspect)

export default router
