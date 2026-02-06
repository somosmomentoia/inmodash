import { Request, Response } from 'express'
import { tasksService } from '../services/tasks.service'

export const tasksController = {
  // GET /api/tasks
  async getAll(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { status, priority, includeCompleted, contactId } = req.query

      const tasks = await tasksService.getAll(userId, {
        status: status as any,
        priority: priority as any,
        includeCompleted: includeCompleted === 'true',
        contactId: contactId ? parseInt(contactId as string) : undefined
      })

      res.json(tasks)
    } catch (error) {
      console.error('Error getting tasks:', error)
      res.status(500).json({ error: 'Failed to get tasks' })
    }
  },

  // GET /api/tasks/stats
  async getStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const stats = await tasksService.getStats(userId)
      res.json(stats)
    } catch (error) {
      console.error('Error getting task stats:', error)
      res.status(500).json({ error: 'Failed to get task stats' })
    }
  },

  // GET /api/tasks/upcoming
  async getUpcoming(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const limit = parseInt(req.query.limit as string) || 5
      const tasks = await tasksService.getUpcoming(userId, limit)
      res.json(tasks)
    } catch (error) {
      console.error('Error getting upcoming tasks:', error)
      res.status(500).json({ error: 'Failed to get upcoming tasks' })
    }
  },

  // GET /api/tasks/:id
  async getById(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const taskId = parseInt(req.params.id)
      const task = await tasksService.getById(userId, taskId)

      if (!task) {
        return res.status(404).json({ error: 'Task not found' })
      }

      res.json(task)
    } catch (error) {
      console.error('Error getting task:', error)
      res.status(500).json({ error: 'Failed to get task' })
    }
  },

  // POST /api/tasks
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { title, description, dueDate, priority, contractId, apartmentId, ownerId, tenantId, obligationId, contactId } = req.body

      if (!title) {
        return res.status(400).json({ error: 'Title is required' })
      }

      const task = await tasksService.create(userId, {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority,
        contractId,
        apartmentId,
        ownerId,
        tenantId,
        obligationId,
        contactId
      })

      res.status(201).json(task)
    } catch (error) {
      console.error('Error creating task:', error)
      res.status(500).json({ error: 'Failed to create task' })
    }
  },

  // PUT /api/tasks/:id
  async update(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const taskId = parseInt(req.params.id)
      const { title, description, dueDate, status, priority, contractId, apartmentId, ownerId, tenantId, obligationId, contactId } = req.body

      const task = await tasksService.update(userId, taskId, {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
        priority,
        contractId,
        apartmentId,
        ownerId,
        tenantId,
        obligationId,
        contactId
      })

      res.json(task)
    } catch (error: any) {
      console.error('Error updating task:', error)
      if (error.message === 'Task not found') {
        return res.status(404).json({ error: 'Task not found' })
      }
      res.status(500).json({ error: 'Failed to update task' })
    }
  },

  // PATCH /api/tasks/:id/toggle
  async toggleComplete(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const taskId = parseInt(req.params.id)
      const task = await tasksService.toggleComplete(userId, taskId)

      res.json(task)
    } catch (error: any) {
      console.error('Error toggling task:', error)
      if (error.message === 'Task not found') {
        return res.status(404).json({ error: 'Task not found' })
      }
      res.status(500).json({ error: 'Failed to toggle task' })
    }
  },

  // DELETE /api/tasks/:id
  async delete(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const taskId = parseInt(req.params.id)
      await tasksService.delete(userId, taskId)

      res.status(204).send()
    } catch (error: any) {
      console.error('Error deleting task:', error)
      if (error.message === 'Task not found') {
        return res.status(404).json({ error: 'Task not found' })
      }
      res.status(500).json({ error: 'Failed to delete task' })
    }
  }
}
