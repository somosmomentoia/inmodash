import { Router } from 'express'
import * as documentsController from '../controllers/documents.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { memoryUpload, handleMulterError } from '../middleware/upload'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Get documents by type
router.get('/type/:type', requirePermission('documents', 'view'), documentsController.getByType)

// Get documents by tenant
router.get('/tenant/:tenantId', requirePermission('documents', 'view'), documentsController.getByTenantId)

// Get documents by owner
router.get('/owner/:ownerId', requirePermission('documents', 'view'), documentsController.getByOwnerId)

// Get documents by contract
router.get('/contract/:contractId', requirePermission('documents', 'view'), documentsController.getByContractId)

// Get documents by apartment
router.get('/apartment/:apartmentId', requirePermission('documents', 'view'), documentsController.getByApartmentId)

// GET /api/documents - Get all documents
router.get('/', requirePermission('documents', 'view'), documentsController.getAll)

// GET /api/documents/:id - Get document by ID
router.get('/:id', requirePermission('documents', 'view'), documentsController.getById)

// POST /api/documents - Upload document
router.post('/', requirePermission('documents', 'upload'), memoryUpload.single('file'), handleMulterError, documentsController.upload)

// PUT /api/documents/:id - Update document metadata
router.put('/:id', requirePermission('documents', 'upload'), documentsController.update)

// DELETE /api/documents/:id - Delete document
router.delete('/:id', requirePermission('documents', 'delete'), documentsController.remove)

export default router
