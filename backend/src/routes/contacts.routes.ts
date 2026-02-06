import { Router } from 'express'
import { contactsController } from '../controllers/contacts.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', contactsController.getAll)
router.get('/search', contactsController.search)
router.get('/:id', contactsController.getById)
router.post('/', contactsController.create)
router.put('/:id', contactsController.update)
router.delete('/:id', contactsController.delete)

export default router
