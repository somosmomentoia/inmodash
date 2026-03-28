import { Router } from 'express'
import { contactsController } from '../controllers/contacts.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

router.use(authenticate)

router.get('/', requirePermission('contacts', 'view'), contactsController.getAll)
router.get('/search', requirePermission('contacts', 'view'), contactsController.search)
router.get('/:id', requirePermission('contacts', 'view'), contactsController.getById)
router.post('/', requirePermission('contacts', 'create'), contactsController.create)
router.put('/:id', requirePermission('contacts', 'edit'), contactsController.update)
router.delete('/:id', requirePermission('contacts', 'delete'), contactsController.delete)

export default router
