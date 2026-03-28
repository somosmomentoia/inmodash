import { Router } from 'express'
import * as vendorsController from '../controllers/vendors.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

router.get('/', vendorsController.getAll)
router.get('/:id', vendorsController.getById)
router.post('/', vendorsController.create)
router.put('/:id', vendorsController.update)
router.delete('/:id', vendorsController.remove)

export default router
