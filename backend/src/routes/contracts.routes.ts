import { Router } from 'express'
import * as contractsController from '../controllers/contracts.controller'
import * as contractGuarantorsController from '../controllers/contract-guarantors.controller'
import { authenticate } from '../middleware/auth'
import { upload, handleMulterError } from '../middleware/upload'

const router = Router()

// All routes require authentication
router.use(authenticate)

router.get('/', contractsController.getAll)
router.get('/:id', contractsController.getById)
router.get('/apartment/:apartmentId', contractsController.getByApartmentId)
router.get('/tenant/:tenantId', contractsController.getByTenantId)
router.post('/', contractsController.create)
router.put('/:id', contractsController.update)
router.delete('/:id', contractsController.remove)

// Document upload/download routes
router.post('/:id/document', upload.single('document'), handleMulterError, contractsController.uploadDocument)
router.get('/:id/document/download', contractsController.downloadDocument)

// Guarantors management routes
router.get('/:id/guarantors', contractGuarantorsController.getContractGuarantors)
router.post('/:id/guarantors', contractGuarantorsController.addGuarantorToContract)
router.delete('/:id/guarantors/:guarantorId', contractGuarantorsController.removeGuarantorFromContract)

export default router
