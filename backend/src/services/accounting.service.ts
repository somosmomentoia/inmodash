import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

type AccountingEntryType = 'commission' | 'commission_service' | 'expense' | 'income_other' | 'adjustment'

export interface CreateAccountingEntryDto {
  type: AccountingEntryType
  description: string
  amount: number
  entryDate: Date
  period: Date
  settlementId?: number
  ownerId?: number
  contractId?: number
  obligationId?: number
  metadata?: Record<string, unknown>
}

export interface AccountingEntryFilters {
  type?: AccountingEntryType
  startDate?: Date
  endDate?: Date
  ownerId?: number
  settlementId?: number
}

export const accountingService = {
  /**
   * Crear un nuevo asiento contable
   */
  async create(userId: number, data: CreateAccountingEntryDto) {
    return prisma.accountingEntry.create({
      data: {
        userId,
        type: data.type,
        description: data.description,
        amount: data.amount,
        entryDate: data.entryDate,
        period: data.period,
        settlementId: data.settlementId,
        ownerId: data.ownerId,
        contractId: data.contractId,
        obligationId: data.obligationId,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
      include: {
        owner: true,
        settlement: true,
        contract: {
          include: {
            apartment: true,
          },
        },
      },
    })
  },

  /**
   * Obtener todos los asientos contables del usuario
   */
  async getAll(userId: number, filters?: AccountingEntryFilters) {
    const where: Record<string, unknown> = { userId }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.startDate || filters?.endDate) {
      where.entryDate = {}
      if (filters.startDate) {
        (where.entryDate as Record<string, Date>).gte = filters.startDate
      }
      if (filters.endDate) {
        (where.entryDate as Record<string, Date>).lte = filters.endDate
      }
    }

    if (filters?.ownerId) {
      where.ownerId = filters.ownerId
    }

    if (filters?.settlementId) {
      where.settlementId = filters.settlementId
    }

    return prisma.accountingEntry.findMany({
      where,
      include: {
        owner: true,
        settlement: true,
        contract: {
          include: {
            apartment: true,
          },
        },
      },
      orderBy: { entryDate: 'desc' },
    })
  },

  /**
   * Obtener un asiento contable por ID
   */
  async getById(userId: number, id: number) {
    return prisma.accountingEntry.findFirst({
      where: { id, userId },
      include: {
        owner: true,
        settlement: true,
        contract: {
          include: {
            apartment: true,
            tenant: true,
          },
        },
        obligation: true,
      },
    })
  },

  /**
   * Obtener resumen de comisiones por período
   */
  async getCommissionsSummary(userId: number, startDate: Date, endDate: Date) {
    const entries = await prisma.accountingEntry.findMany({
      where: {
        userId,
        type: 'commission',
        entryDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        owner: true,
        settlement: true,
      },
    })

    const totalCommissions = entries.reduce(
      (sum, entry) => sum + Number(entry.amount),
      0
    )

    return {
      entries,
      totalCommissions,
      count: entries.length,
    }
  },

  /**
   * Registrar comisión por liquidación
   * Se llama cuando se marca una liquidación como "settled"
   */
  async registerCommissionFromSettlement(
    userId: number,
    settlementId: number,
    ownerId: number,
    commissionAmount: number,
    period: Date,
    ownerName: string
  ) {
    const periodStr = period.toLocaleDateString('es-AR', {
      month: 'long',
      year: 'numeric',
    })

    return this.create(userId, {
      type: 'commission',
      description: `Comisión por liquidación de ${ownerName} - ${periodStr}`,
      amount: commissionAmount,
      entryDate: new Date(),
      period,
      settlementId,
      ownerId,
      metadata: {
        ownerName,
        periodStr,
      },
    })
  },

  /**
   * Eliminar un asiento contable
   */
  async delete(userId: number, id: number) {
    const entry = await prisma.accountingEntry.findFirst({
      where: { id, userId },
    })

    if (!entry) {
      throw new Error('Asiento contable no encontrado')
    }

    return prisma.accountingEntry.delete({
      where: { id },
    })
  },

  /**
   * Obtener totales por tipo en un período
   */
  async getTotalsByType(userId: number, startDate: Date, endDate: Date) {
    const entries = await prisma.accountingEntry.groupBy({
      by: ['type'],
      where: {
        userId,
        entryDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    })

    return entries.map((entry) => ({
      type: entry.type,
      total: Number(entry._sum.amount) || 0,
      count: entry._count,
    }))
  },
}

export default accountingService
