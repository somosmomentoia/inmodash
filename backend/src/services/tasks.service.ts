import prisma from '../config/database'
import { TaskStatus, TaskPriority } from '@prisma/client'

export interface CreateTaskDto {
  title: string
  description?: string
  dueDate?: Date
  priority?: TaskPriority
  contractId?: number
  apartmentId?: number
  ownerId?: number
  tenantId?: number
  obligationId?: number
  contactId?: number
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  dueDate?: Date
  status?: TaskStatus
  priority?: TaskPriority
  contractId?: number
  apartmentId?: number
  ownerId?: number
  tenantId?: number
  obligationId?: number
  contactId?: number
}

export const tasksService = {
  // Get all tasks for a user
  async getAll(userId: number, filters?: {
    status?: TaskStatus
    priority?: TaskPriority
    includeCompleted?: boolean
    contactId?: number
  }) {
    const where: any = { userId }

    if (filters?.status) {
      where.status = filters.status
    } else if (!filters?.includeCompleted) {
      where.status = { not: 'completed' }
    }

    if (filters?.priority) {
      where.priority = filters.priority
    }

    if (filters?.contactId) {
      where.contactId = filters.contactId
    }

    return prisma.task.findMany({
      where,
      include: {
        contract: {
          select: { id: true, apartment: { select: { nomenclature: true } } }
        },
        apartment: { select: { id: true, nomenclature: true } },
        owner: { select: { id: true, name: true } },
        tenant: { select: { id: true, nameOrBusiness: true } },
        obligation: { select: { id: true, description: true, type: true, amount: true } },
        contact: { select: { id: true, name: true, category: true } }
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })
  },

  // Get a single task by ID
  async getById(userId: number, taskId: number) {
    return prisma.task.findFirst({
      where: { id: taskId, userId },
      include: {
        contract: {
          select: { 
            id: true, 
            apartment: { select: { nomenclature: true } },
            tenant: { select: { nameOrBusiness: true } }
          }
        },
        apartment: { select: { id: true, nomenclature: true, fullAddress: true } },
        owner: { select: { id: true, name: true, email: true, phone: true } },
        tenant: { select: { id: true, nameOrBusiness: true, contactEmail: true, contactPhone: true } },
        obligation: { 
          select: { 
            id: true, 
            description: true, 
            type: true, 
            amount: true, 
            status: true,
            dueDate: true 
          } 
        },
        contact: { select: { id: true, name: true, category: true, email: true, phone: true } }
      }
    })
  },

  // Create a new task
  async create(userId: number, data: CreateTaskDto) {
    return prisma.task.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        priority: data.priority || 'medium',
        status: 'pending',
        contractId: data.contractId,
        apartmentId: data.apartmentId,
        ownerId: data.ownerId,
        tenantId: data.tenantId,
        obligationId: data.obligationId,
        contactId: data.contactId
      },
      include: {
        contract: { select: { id: true, apartment: { select: { nomenclature: true } } } },
        apartment: { select: { id: true, nomenclature: true } },
        owner: { select: { id: true, name: true } },
        tenant: { select: { id: true, nameOrBusiness: true } },
        obligation: { select: { id: true, description: true, type: true } },
        contact: { select: { id: true, name: true, category: true } }
      }
    })
  },

  // Update a task
  async update(userId: number, taskId: number, data: UpdateTaskDto) {
    // Verify ownership
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId }
    })

    if (!existing) {
      throw new Error('Task not found')
    }

    const updateData: any = { ...data }

    // If marking as completed, set completedAt
    if (data.status === 'completed' && existing.status !== 'completed') {
      updateData.completedAt = new Date()
    }

    // If unmarking as completed, clear completedAt
    if (data.status && data.status !== 'completed' && existing.status === 'completed') {
      updateData.completedAt = null
    }

    return prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        contract: { select: { id: true, apartment: { select: { nomenclature: true } } } },
        apartment: { select: { id: true, nomenclature: true } },
        owner: { select: { id: true, name: true } },
        tenant: { select: { id: true, nameOrBusiness: true } },
        obligation: { select: { id: true, description: true, type: true } },
        contact: { select: { id: true, name: true, category: true } }
      }
    })
  },

  // Toggle task completion
  async toggleComplete(userId: number, taskId: number) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId }
    })

    if (!task) {
      throw new Error('Task not found')
    }

    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const completedAt = newStatus === 'completed' ? new Date() : null

    return prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus, completedAt },
      include: {
        contract: { select: { id: true, apartment: { select: { nomenclature: true } } } },
        apartment: { select: { id: true, nomenclature: true } },
        owner: { select: { id: true, name: true } },
        tenant: { select: { id: true, nameOrBusiness: true } },
        obligation: { select: { id: true, description: true, type: true } }
      }
    })
  },

  // Delete a task
  async delete(userId: number, taskId: number) {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId }
    })

    if (!existing) {
      throw new Error('Task not found')
    }

    return prisma.task.delete({
      where: { id: taskId }
    })
  },

  // Get task statistics for dashboard
  async getStats(userId: number) {
    const [total, pending, overdue, completedThisWeek] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'pending' } }),
      prisma.task.count({
        where: {
          userId,
          status: { in: ['pending', 'in_progress'] },
          dueDate: { lt: new Date() }
        }
      }),
      prisma.task.count({
        where: {
          userId,
          status: 'completed',
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    return { total, pending, overdue, completedThisWeek }
  },

  // Get recent/upcoming tasks for widget
  async getUpcoming(userId: number, limit: number = 5) {
    return prisma.task.findMany({
      where: {
        userId,
        status: { in: ['pending', 'in_progress'] }
      },
      include: {
        apartment: { select: { nomenclature: true } },
        owner: { select: { name: true } },
        tenant: { select: { nameOrBusiness: true } }
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' }
      ],
      take: limit
    })
  }
}
