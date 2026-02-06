import { Router, Request, Response } from 'express'
import { notificationsService } from '../services/notifications.service'
import { notificationGeneratorService } from '../services/notification-generator.service'
import { verifyToken } from '../lib/auth/jwt'

const router = Router()

/**
 * GET /api/notifications
 * Get all notifications for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const payload = await verifyToken(authToken)
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const { read, type, limit, offset } = req.query

    const notifications = await notificationsService.getAll(payload.userId, {
      read: read !== undefined ? read === 'true' : undefined,
      type: type as any,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    })

    res.json({ success: true, notifications })
  } catch (error) {
    console.error('Error getting notifications:', error)
    res.status(500).json({ error: 'Failed to get notifications' })
  }
})

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const payload = await verifyToken(authToken)
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const count = await notificationsService.getUnreadCount(payload.userId)

    res.json({ success: true, count })
  } catch (error) {
    console.error('Error getting unread count:', error)
    res.status(500).json({ error: 'Failed to get unread count' })
  }
})

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const payload = await verifyToken(authToken)
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const notificationId = parseInt(req.params.id)
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' })
    }

    const notification = await notificationsService.markAsRead(payload.userId, notificationId)

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ success: true, notification })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req: Request, res: Response) => {
  try {
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const payload = await verifyToken(authToken)
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const count = await notificationsService.markAllAsRead(payload.userId)

    res.json({ success: true, markedCount: count })
  } catch (error) {
    console.error('Error marking all as read:', error)
    res.status(500).json({ error: 'Failed to mark all as read' })
  }
})

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const payload = await verifyToken(authToken)
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const notificationId = parseInt(req.params.id)
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' })
    }

    const deleted = await notificationsService.delete(payload.userId, notificationId)

    if (!deleted) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting notification:', error)
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

/**
 * POST /api/notifications/generate
 * Manually trigger notification generation for the authenticated user
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const payload = await verifyToken(authToken)
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const result = await notificationGeneratorService.generateForUser(payload.userId, {})

    res.json({ success: true, generated: result })
  } catch (error) {
    console.error('Error generating notifications:', error)
    res.status(500).json({ error: 'Failed to generate notifications' })
  }
})

export default router
