import { Router } from 'express'
import * as contractsController from '../controllers/contracts.controller'
import * as contractGuarantorsController from '../controllers/contract-guarantors.controller'
import { rentAdjustmentsController } from '../controllers/rent-adjustments.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { upload, handleMulterError } from '../middleware/upload'

const router = Router()

// All routes require authentication
router.use(authenticate)

router.get('/', requirePermission('contracts', 'view'), contractsController.getAll)
router.get('/:id', requirePermission('contracts', 'view'), contractsController.getById)
router.get('/apartment/:apartmentId', requirePermission('contracts', 'view'), contractsController.getByApartmentId)
router.get('/tenant/:tenantId', requirePermission('contracts', 'view'), contractsController.getByTenantId)
router.post('/', requirePermission('contracts', 'create'), contractsController.create)
router.put('/:id', requirePermission('contracts', 'edit'), contractsController.update)
router.delete('/:id', requirePermission('contracts', 'delete'), contractsController.remove)

// Document upload/download routes
router.post('/:id/document', requirePermission('documents', 'upload'), upload.single('document'), handleMulterError, contractsController.uploadDocument)
router.get('/:id/document/download', requirePermission('documents', 'view'), contractsController.downloadDocument)

// Guarantors management routes
router.get('/:id/guarantors', requirePermission('contracts', 'view'), contractGuarantorsController.getContractGuarantors)
router.post('/:id/guarantors', requirePermission('contracts', 'create'), contractGuarantorsController.addGuarantorToContract)
router.delete('/:id/guarantors/:guarantorId', requirePermission('contracts', 'delete'), contractGuarantorsController.removeGuarantorFromContract)

// Rent adjustments (index history) routes
router.get('/:contractId/rent-adjustments', requirePermission('contracts', 'view'), rentAdjustmentsController.getByContract)
router.get('/:contractId/rent-adjustments/config', requirePermission('contracts', 'view'), rentAdjustmentsController.getIndexConfig)
router.get('/:contractId/rent-adjustments/timeline', requirePermission('contracts', 'view'), rentAdjustmentsController.getTimeline)
router.get('/:contractId/rent-adjustments/current-index', requirePermission('contracts', 'view'), rentAdjustmentsController.getCurrentIndex)
router.put('/:contractId/rent-adjustments/:id', requirePermission('contracts', 'edit'), rentAdjustmentsController.modifyAdjustment)

export default router
