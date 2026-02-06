import { PrismaClient, NotificationType, Notification } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateNotificationDto {
  type: NotificationType
  title: string
  message: string
  entityType?: string
  entityId?: number
  actionUrl?: string
  metadata?: object
  expiresAt?: Date
}

export interface NotificationFilters {
  read?: boolean
  type?: NotificationType
  limit?: number
  offset?: number
}

class NotificationsService {
  /**
   * Create a new notification for a user
   */
  async create(userId: number, data: CreateNotificationDto): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        entityType: data.entityType,
        entityId: data.entityId,
        actionUrl: data.actionUrl,
        metadata: data.metadata,
        expiresAt: data.expiresAt,
      },
    })
  }

  /**
   * Create multiple notifications (batch)
   */
  async createMany(notifications: Array<{ userId: number } & CreateNotificationDto>): Promise<number> {
    const result = await prisma.notification.createMany({
      data: notifications.map(n => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        entityType: n.entityType,
        entityId: n.entityId,
        actionUrl: n.actionUrl,
        metadata: n.metadata,
        expiresAt: n.expiresAt,
      })),
    })
    return result.count
  }

  /**
   * Get all notifications for a user
   */
  async getAll(userId: number, filters: NotificationFilters = {}): Promise<Notification[]> {
    const { read, type, limit = 50, offset = 0 } = filters

    return prisma.notification.findMany({
      where: {
        userId,
        ...(read !== undefined && { read }),
        ...(type && { type }),
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: number): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(userId: number, notificationId: number): Promise<Notification | null> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    })

    if (!notification) return null

    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    })
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: number): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    })
    return result.count
  }

  /**
   * Delete a notification
   */
  async delete(userId: number, notificationId: number): Promise<boolean> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    })

    if (!notification) return false

    await prisma.notification.delete({
      where: { id: notificationId },
    })
    return true
  }

  /**
   * Delete all read notifications older than X days
   */
  async cleanupOld(userId: number, daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        read: true,
        createdAt: { lt: cutoffDate },
      },
    })
    return result.count
  }

  // ============================================
  // Helper methods to create specific notifications
  // ============================================

  /**
   * Notify about contract expiring soon
   */
  async notifyContractExpiring(
    userId: number,
    contractId: number,
    tenantName: string,
    apartmentAddress: string,
    daysUntilExpiry: number
  ): Promise<Notification> {
    return this.create(userId, {
      type: 'contract_expiring',
      title: 'Contrato próximo a vencer',
      message: `El contrato de ${tenantName} en ${apartmentAddress} vence en ${daysUntilExpiry} días.`,
      entityType: 'contract',
      entityId: contractId,
      actionUrl: `/contracts/${contractId}`,
      metadata: { tenantName, apartmentAddress, daysUntilExpiry },
    })
  }

  /**
   * Notify about payment due soon
   */
  async notifyPaymentDue(
    userId: number,
    obligationId: number,
    tenantName: string,
    amount: number,
    daysUntilDue: number
  ): Promise<Notification> {
    const dueText = daysUntilDue === 0 ? 'hoy' : daysUntilDue === 1 ? 'mañana' : `en ${daysUntilDue} días`
    return this.create(userId, {
      type: 'payment_due',
      title: 'Pago próximo a vencer',
      message: `${tenantName} tiene un pago de $${amount.toLocaleString('es-AR')} que vence ${dueText}.`,
      entityType: 'obligation',
      entityId: obligationId,
      actionUrl: `/obligations/${obligationId}`,
      metadata: { tenantName, amount, daysUntilDue },
    })
  }

  /**
   * Notify about payment overdue
   */
  async notifyPaymentOverdue(
    userId: number,
    obligationId: number,
    tenantName: string,
    amount: number,
    daysOverdue: number
  ): Promise<Notification> {
    return this.create(userId, {
      type: 'payment_overdue',
      title: 'Pago vencido',
      message: `${tenantName} tiene un pago de $${amount.toLocaleString('es-AR')} vencido hace ${daysOverdue} días.`,
      entityType: 'obligation',
      entityId: obligationId,
      actionUrl: `/obligations/${obligationId}`,
      metadata: { tenantName, amount, daysOverdue },
    })
  }

  /**
   * Notify about payment received
   */
  async notifyPaymentReceived(
    userId: number,
    obligationId: number,
    tenantName: string,
    amount: number
  ): Promise<Notification> {
    return this.create(userId, {
      type: 'payment_received',
      title: 'Pago recibido',
      message: `Se registró un pago de $${amount.toLocaleString('es-AR')} de ${tenantName}.`,
      entityType: 'obligation',
      entityId: obligationId,
      actionUrl: `/obligations/${obligationId}`,
      metadata: { tenantName, amount },
    })
  }

  /**
   * Notify about task due soon
   */
  async notifyTaskDue(
    userId: number,
    taskId: number,
    taskTitle: string,
    dueDate: Date
  ): Promise<Notification> {
    const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return this.create(userId, {
      type: 'task_due',
      title: 'Tarea próxima a vencer',
      message: `La tarea "${taskTitle}" vence ${daysUntilDue === 0 ? 'hoy' : daysUntilDue === 1 ? 'mañana' : `en ${daysUntilDue} días`}.`,
      entityType: 'task',
      entityId: taskId,
      actionUrl: `/tasks/${taskId}`,
      metadata: { taskTitle, dueDate: dueDate.toISOString() },
    })
  }

  /**
   * Create a system notification
   */
  async notifySystem(
    userId: number,
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<Notification> {
    return this.create(userId, {
      type: 'system',
      title,
      message,
      actionUrl,
    })
  }
}

export const notificationsService = new NotificationsService()
