import { Router } from 'express'
import { tasksController } from '../controllers/tasks.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

// All task routes require authentication
router.use(authenticate)

// GET /api/tasks - Get all tasks (requires tasks.view)
router.get('/', requirePermission('tasks', 'view'), tasksController.getAll)

// GET /api/tasks/stats - Get task statistics (requires tasks.view)
router.get('/stats', requirePermission('tasks', 'view'), tasksController.getStats)

// GET /api/tasks/upcoming - Get upcoming tasks for widget (requires tasks.view)
router.get('/upcoming', requirePermission('tasks', 'view'), tasksController.getUpcoming)

// GET /api/tasks/:id - Get a single task (requires tasks.view)
router.get('/:id', requirePermission('tasks', 'view'), tasksController.getById)

// POST /api/tasks - Create a new task (requires tasks.create)
router.post('/', requirePermission('tasks', 'create'), tasksController.create)

// PUT /api/tasks/:id - Update a task (requires tasks.edit)
router.put('/:id', requirePermission('tasks', 'edit'), tasksController.update)

// PATCH /api/tasks/:id/toggle - Toggle task completion (requires tasks.edit)
router.patch('/:id/toggle', requirePermission('tasks', 'edit'), tasksController.toggleComplete)

// DELETE /api/tasks/:id - Delete a task (requires tasks.delete)
router.delete('/:id', requirePermission('tasks', 'delete'), tasksController.delete)

export default router
