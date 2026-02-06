import { PrismaClient } from '@prisma/client'
import { notificationsService } from './notifications.service'

const prisma = new PrismaClient()

interface NotificationPreferences {
  contractExpiring?: boolean
  paymentOverdue?: boolean
  paymentDueSoon?: boolean
  taskDue?: boolean
  whatsappMessage?: boolean
  weeklySummary?: boolean
}

class NotificationGeneratorService {
  /**
   * Generate all notifications for all users
   * This should be called periodically (e.g., every hour or daily)
   */
  async generateAll(): Promise<{ generated: number; errors: number }> {
    let generated = 0
    let errors = 0

    try {
      // Get all active users
      const users = await prisma.user.findMany({
        where: {
          subscriptionStatus: { in: ['trial', 'active'] },
        },
        select: { id: true, preferences: true },
      })

      console.log(`[Notifications] Checking notifications for ${users.length} users...`)

      for (const user of users) {
        try {
          const prefs = (user.preferences as { notifications?: NotificationPreferences })?.notifications || {}
          const count = await this.generateForUser(user.id, prefs)
          generated += count
        } catch (err) {
          console.error(`Error generating notifications for user ${user.id}:`, err)
          errors++
        }
      }
    } catch (err) {
      console.error('Error in generateAll:', err)
      errors++
    }

    return { generated, errors }
  }

  /**
   * Generate notifications for a specific user
   */
  async generateForUser(userId: number, prefs: NotificationPreferences): Promise<number> {
    let count = 0

    // Check contracts expiring (if enabled, default true)
    if (prefs.contractExpiring !== false) {
      count += await this.checkContractsExpiring(userId)
    }

    // Check payments overdue (if enabled, default true)
    if (prefs.paymentOverdue !== false) {
      count += await this.checkPaymentsOverdue(userId)
    }

    // Check payments due soon (if enabled, default true)
    if (prefs.paymentDueSoon !== false) {
      count += await this.checkPaymentsDueSoon(userId)
    }

    // Check tasks due (if enabled, default true)
    if (prefs.taskDue !== false) {
      count += await this.checkTasksDue(userId)
    }

    return count
  }

  /**
   * Check for contracts expiring in the next 30 days
   */
  private async checkContractsExpiring(userId: number): Promise<number> {
    const today = new Date()
    const in30Days = new Date()
    in30Days.setDate(today.getDate() + 30)

    // Find contracts expiring soon that don't have a recent notification
    // Active contracts are those where endDate is in the future
    const contracts = await prisma.contract.findMany({
      where: {
        userId,
        endDate: {
          gte: today,
          lte: in30Days,
        },
      },
      include: {
        tenant: true,
        apartment: true,
      },
    })

    let created = 0

    for (const contract of contracts) {
      // Check if we already sent a notification for this contract recently (last 7 days)
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'contract_expiring',
          entityType: 'contract',
          entityId: contract.id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      })

      if (!existingNotification) {
        const daysUntilExpiry = Math.ceil((contract.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const tenantName = contract.tenant?.nameOrBusiness || 'Inquilino'
        const address = contract.apartment?.fullAddress || contract.apartment?.nomenclature || 'Propiedad'

        await notificationsService.notifyContractExpiring(
          userId,
          contract.id,
          tenantName,
          address,
          daysUntilExpiry
        )
        created++
      }
    }

    return created
  }

  /**
   * Check for overdue payments/obligations
   */
  private async checkPaymentsOverdue(userId: number): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find overdue obligations
    const overdueObligations = await prisma.obligation.findMany({
      where: {
        userId,
        status: 'pending',
        dueDate: {
          lt: today,
        },
      },
      include: {
        contract: {
          include: {
            tenant: true,
          },
        },
      },
    })

    let created = 0

    for (const obligation of overdueObligations) {
      // Check if we already sent a notification for this obligation recently (last 3 days)
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'payment_overdue',
          entityType: 'obligation',
          entityId: obligation.id,
          createdAt: {
            gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
        },
      })

      if (!existingNotification) {
        const daysOverdue = Math.ceil((today.getTime() - obligation.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        const tenantName = obligation.contract?.tenant?.nameOrBusiness || 'Inquilino'

        await notificationsService.notifyPaymentOverdue(
          userId,
          obligation.id,
          tenantName,
          Number(obligation.amount),
          daysOverdue
        )
        created++
      }
    }

    return created
  }

  /**
   * Check for payments/obligations due soon (next 5 days)
   */
  private async checkPaymentsDueSoon(userId: number): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const in5Days = new Date(today)
    in5Days.setDate(in5Days.getDate() + 5)

    // Find obligations due in the next 5 days that are still pending
    const upcomingObligations = await prisma.obligation.findMany({
      where: {
        userId,
        status: 'pending',
        dueDate: {
          gte: today,
          lte: in5Days,
        },
      },
      include: {
        contract: {
          include: {
            tenant: true,
          },
        },
      },
    })

    let created = 0

    for (const obligation of upcomingObligations) {
      // Check if we already sent a notification for this obligation recently (last 2 days)
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'payment_due',
          entityType: 'obligation',
          entityId: obligation.id,
          createdAt: {
            gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        },
      })

      if (!existingNotification) {
        const daysUntilDue = Math.ceil((obligation.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const tenantName = obligation.contract?.tenant?.nameOrBusiness || 'Inquilino'

        await notificationsService.notifyPaymentDue(
          userId,
          obligation.id,
          tenantName,
          Number(obligation.amount),
          daysUntilDue
        )
        created++
      }
    }

    return created
  }

  /**
   * Check for tasks due soon (next 5 days) or overdue
   */
  private async checkTasksDue(userId: number): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const in5Days = new Date(today)
    in5Days.setDate(in5Days.getDate() + 5)

    // Find tasks due in the next 5 days that are not completed
    const tasksDue = await prisma.task.findMany({
      where: {
        userId,
        status: { not: 'completed' },
        dueDate: {
          gte: today,
          lte: in5Days,
        },
      },
    })

    let created = 0

    for (const task of tasksDue) {
      // Check if we already sent a notification for this task recently (last 1 day)
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'task_due',
          entityType: 'task',
          entityId: task.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      })

      if (!existingNotification && task.dueDate) {
        await notificationsService.notifyTaskDue(
          userId,
          task.id,
          task.title,
          task.dueDate
        )
        created++
      }
    }

    return created
  }
}

export const notificationGeneratorService = new NotificationGeneratorService()
