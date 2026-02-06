import prisma from '../config/database'
import accountingService from './accounting.service'

export interface CreateSettlementDto {
  ownerId: number
  period: string | Date
  totalCollected: number
  ownerAmount: number
  commissionAmount: number
  paymentMethod?: string
  reference?: string
  notes?: string
}

export interface UpdateSettlementDto {
  status?: 'pending' | 'settled'
  settledAt?: Date
  paymentMethod?: string
  reference?: string
  notes?: string
}

/**
 * Get all settlements for a user
 */
export const getAll = async (userId: number) => {
  return await prisma.settlement.findMany({
    where: { userId },
    include: {
      owner: true
    },
    orderBy: [
      { period: 'desc' },
      { createdAt: 'desc' }
    ]
  })
}

/**
 * Get settlements by owner
 */
export const getByOwner = async (ownerId: number, userId: number) => {
  return await prisma.settlement.findMany({
    where: { ownerId, userId },
    include: {
      owner: true
    },
    orderBy: {
      period: 'desc'
    }
  })
}

/**
 * Get settlement by period and owner
 */
export const getByPeriodAndOwner = async (period: Date, ownerId: number, userId: number) => {
  return await prisma.settlement.findUnique({
    where: {
      userId_ownerId_period: {
        userId,
        ownerId,
        period
      }
    },
    include: {
      owner: true
    }
  })
}

/**
 * Get pending settlements
 */
export const getPending = async (userId: number) => {
  return await prisma.settlement.findMany({
    where: {
      userId,
      status: 'pending'
    },
    include: {
      owner: true
    },
    orderBy: {
      period: 'desc'
    }
  })
}

/**
 * Create or update a settlement
 */
export const upsert = async (data: CreateSettlementDto, userId: number) => {
  // Parsear período como YYYY-MM o Date
  let normalizedPeriod: Date
  const periodStr = String(data.period)
  
  if (periodStr.match(/^\d{4}-\d{2}$/)) {
    // Formato YYYY-MM - parsear directamente sin problemas de timezone
    const [year, month] = periodStr.split('-').map(Number)
    normalizedPeriod = new Date(Date.UTC(year, month - 1, 1))
  } else {
    // Es una fecha completa
    const period = new Date(data.period)
    normalizedPeriod = new Date(Date.UTC(period.getUTCFullYear(), period.getUTCMonth(), 1))
  }

  return await prisma.settlement.upsert({
    where: {
      userId_ownerId_period: {
        userId,
        ownerId: data.ownerId,
        period: normalizedPeriod
      }
    },
    update: {
      totalCollected: data.totalCollected,
      ownerAmount: data.ownerAmount,
      commissionAmount: data.commissionAmount,
      notes: data.notes
    },
    create: {
      userId,
      ownerId: data.ownerId,
      period: normalizedPeriod,
      totalCollected: data.totalCollected,
      ownerAmount: data.ownerAmount,
      commissionAmount: data.commissionAmount,
      status: 'pending',
      notes: data.notes
    },
    include: {
      owner: true
    }
  })
}

/**
 * Mark a settlement as settled (paid to owner)
 * Also registers the commission as an accounting entry
 */
export const markAsSettled = async (
  id: number, 
  userId: number, 
  data: { paymentMethod?: string; reference?: string; notes?: string }
) => {
  // Verify ownership and get settlement with owner
  const settlement = await prisma.settlement.findFirst({
    where: { id, userId },
    include: { owner: true }
  })

  if (!settlement) {
    throw new Error('Settlement not found or access denied')
  }

  // Update settlement status
  const updatedSettlement = await prisma.settlement.update({
    where: { id },
    data: {
      status: 'settled',
      settledAt: new Date(),
      paymentMethod: data.paymentMethod,
      reference: data.reference,
      notes: data.notes
    },
    include: {
      owner: true
    }
  })

  // Register commission as accounting entry (if there's commission)
  if (settlement.commissionAmount > 0) {
    await accountingService.registerCommissionFromSettlement(
      userId,
      settlement.id,
      settlement.ownerId,
      settlement.commissionAmount,
      settlement.period,
      settlement.owner.name
    )
  }

  return updatedSettlement
}

/**
 * Mark a settlement as pending (undo settled)
 */
export const markAsPending = async (id: number, userId: number) => {
  // Verify ownership
  const settlement = await prisma.settlement.findFirst({
    where: { id, userId }
  })

  if (!settlement) {
    throw new Error('Settlement not found or access denied')
  }

  return await prisma.settlement.update({
    where: { id },
    data: {
      status: 'pending',
      settledAt: null,
      paymentMethod: null,
      reference: null
    },
    include: {
      owner: true
    }
  })
}

/**
 * Delete a settlement
 */
export const remove = async (id: number, userId: number) => {
  // Verify ownership
  const settlement = await prisma.settlement.findFirst({
    where: { id, userId }
  })

  if (!settlement) {
    throw new Error('Settlement not found or access denied')
  }

  return await prisma.settlement.delete({
    where: { id }
  })
}

/**
 * Calculate settlements for a period based on obligations
 * This creates/updates settlement records for each owner with:
 * - Rent obligations (income for owner)
 * - Owner obligations with payments (deductions from owner)
 */
export const calculateForPeriod = async (period: Date, userId: number) => {
  const normalizedPeriod = new Date(period.getFullYear(), period.getMonth(), 1)
  const nextMonth = new Date(normalizedPeriod.getFullYear(), normalizedPeriod.getMonth() + 1, 1)

  // Get all rent obligations for the period that have payments (income)
  const rentObligations = await prisma.obligation.findMany({
    where: {
      userId,
      type: 'rent',
      period: {
        gte: normalizedPeriod,
        lt: nextMonth
      },
      paidAmount: {
        gt: 0
      }
    },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              owner: true,
              building: {
                include: {
                  ownerRelation: true
                }
              }
            }
          }
        }
      }
    }
  })

  // Get all owner obligations for the period that have payments (deductions)
  // These are obligations where paidBy = 'owner' and have been paid
  const ownerObligations = await prisma.obligation.findMany({
    where: {
      userId,
      paidBy: 'owner',
      period: {
        gte: normalizedPeriod,
        lt: nextMonth
      },
      paidAmount: {
        gt: 0
      }
    },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              owner: true,
              building: {
                include: {
                  ownerRelation: true
                }
              }
            }
          }
        }
      },
      apartment: {
        include: {
          owner: true,
          building: {
            include: {
              ownerRelation: true
            }
          }
        }
      },
      obligationPayments: true
    }
  })

  // Group by owner
  const ownerData: Record<number, {
    ownerId: number
    totalCollected: number
    ownerAmount: number
    commissionAmount: number
    deductions: number
  }> = {}

  // Process rent obligations (income)
  for (const obligation of rentObligations) {
    const owner = obligation.contract?.apartment?.owner || 
                  obligation.contract?.apartment?.building?.ownerRelation

    if (!owner) continue

    if (!ownerData[owner.id]) {
      ownerData[owner.id] = {
        ownerId: owner.id,
        totalCollected: 0,
        ownerAmount: 0,
        commissionAmount: 0,
        deductions: 0
      }
    }

    ownerData[owner.id].totalCollected += obligation.paidAmount
    ownerData[owner.id].ownerAmount += obligation.ownerImpact > 0 ? obligation.ownerImpact : obligation.ownerAmount
    ownerData[owner.id].commissionAmount += obligation.agencyImpact > 0 ? obligation.agencyImpact : obligation.commissionAmount
  }

  // Process owner obligations (deductions)
  for (const obligation of ownerObligations) {
    const owner = obligation.contract?.apartment?.owner || 
                  obligation.contract?.apartment?.building?.ownerRelation ||
                  obligation.apartment?.owner ||
                  obligation.apartment?.building?.ownerRelation

    if (!owner) continue

    if (!ownerData[owner.id]) {
      ownerData[owner.id] = {
        ownerId: owner.id,
        totalCollected: 0,
        ownerAmount: 0,
        commissionAmount: 0,
        deductions: 0
      }
    }

    // El paidAmount de obligaciones del propietario son deducciones
    // ownerImpact es negativo para estas obligaciones, así que sumamos el paidAmount como deducción
    ownerData[owner.id].deductions += obligation.paidAmount
    // Restamos del ownerAmount (el propietario recibe menos)
    ownerData[owner.id].ownerAmount -= obligation.paidAmount
  }

  // Create/update settlements for each owner
  const settlements = []
  for (const data of Object.values(ownerData)) {
    const settlement = await upsert({
      ownerId: data.ownerId,
      period: normalizedPeriod,
      totalCollected: data.totalCollected,
      ownerAmount: data.ownerAmount,
      commissionAmount: data.commissionAmount + data.deductions // Las deducciones se suman a comisiones para el cálculo
    }, userId)
    settlements.push(settlement)
  }

  return settlements
}
