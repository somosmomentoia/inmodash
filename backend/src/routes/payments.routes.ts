import { Router } from 'express'
import * as paymentsController from '../controllers/payments.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Get all payments
router.get('/', requirePermission('obligations', 'view'), paymentsController.getAll)

// Get pending payments
router.get('/pending', requirePermission('obligations', 'view'), paymentsController.getPending)

// Get overdue payments
router.get('/overdue', requirePermission('obligations', 'view'), paymentsController.getOverdue)

// Mark overdue payments (utility endpoint)
router.post('/mark-overdue', requirePermission('obligations', 'edit'), paymentsController.markOverdue)

// Get payments by contract
router.get('/contract/:contractId', requirePermission('obligations', 'view'), paymentsController.getByContractId)

// Get payment by ID
router.get('/:id', requirePermission('obligations', 'view'), paymentsController.getById)

// Create payment
router.post('/', requirePermission('obligations', 'register_payment'), paymentsController.create)

// Update payment
router.put('/:id', requirePermission('obligations', 'edit'), paymentsController.update)

// Mark payment as paid
router.post('/:id/mark-paid', requirePermission('obligations', 'register_payment'), paymentsController.markAsPaid)

// Delete payment
router.delete('/:id', requirePermission('obligations', 'delete'), paymentsController.remove)

export default router
