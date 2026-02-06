'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/services/api'

export type NotificationType = 
  | 'contract_expiring'
  | 'contract_expired'
  | 'payment_due'
  | 'payment_overdue'
  | 'payment_received'
  | 'task_due'
  | 'task_overdue'
  | 'task_assigned'
  | 'whatsapp_message'
  | 'system'
  | 'reminder'

export interface Notification {
  id: number
  userId: number
  type: NotificationType
  title: string
  message: string
  read: boolean
  readAt: string | null
  entityType: string | null
  entityId: number | null
  actionUrl: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  expiresAt: string | null
}

interface NotificationsResponse {
  success: boolean
  notifications: Notification[]
}

interface UnreadCountResponse {
  success: boolean
  count: number
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<NotificationsResponse>('/api/notifications?limit=20')
      setNotifications(response.notifications)
      setError(null)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Error al cargar notificaciones')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await apiClient.get<UnreadCountResponse>('/api/notifications/unread-count')
      setUnreadCount(response.count)
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await apiClient.put(`/api/notifications/${notificationId}/read`, {})
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.put('/api/notifications/read-all', {})
      setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await apiClient.delete(`/api/notifications/${notificationId}`)
      const notification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }, [notifications])

  const refresh = useCallback(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [fetchNotifications, fetchUnreadCount])

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()

    // Poll for new notifications every 60 seconds
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 60000)

    return () => clearInterval(interval)
  }, [fetchNotifications, fetchUnreadCount])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  }
}
