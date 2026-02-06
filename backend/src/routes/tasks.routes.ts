import { Router } from 'express'
import { tasksController } from '../controllers/tasks.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// All task routes require authentication
router.use(authenticate)

// GET /api/tasks - Get all tasks
router.get('/', tasksController.getAll)

// GET /api/tasks/stats - Get task statistics
router.get('/stats', tasksController.getStats)

// GET /api/tasks/upcoming - Get upcoming tasks for widget
router.get('/upcoming', tasksController.getUpcoming)

// GET /api/tasks/:id - Get a single task
router.get('/:id', tasksController.getById)

// POST /api/tasks - Create a new task
router.post('/', tasksController.create)

// PUT /api/tasks/:id - Update a task
router.put('/:id', tasksController.update)

// PATCH /api/tasks/:id/toggle - Toggle task completion
router.patch('/:id/toggle', tasksController.toggleComplete)

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', tasksController.delete)

export default router
