import prisma from '../config/database'
import accountingService from './accounting.service'

export interface CreateSettlementDto {
  ownerId: number
  period: string | Date
  totalCollected: number
  ownerAmount: number
  commissionAmount: number
  deductions: number
  paymentMethod?: string
  reference?: string
  notes?: string
}

export type SettlementStatus = 'draft' | 'settled' | 'stale'

export interface UpdateSettlementDto {
  status?: SettlementStatus
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
 * Get pending settlements (draft or stale — anything not yet fully settled)
 */
export const getPending = async (userId: number) => {
  return await prisma.settlement.findMany({
    where: {
      userId,
      status: { in: ['draft', 'stale'] }
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

  // Check if there's an existing settled settlement — don't overwrite it
  const existing = await prisma.settlement.findUnique({
    where: {
      userId_ownerId_period: {
        userId,
        ownerId: data.ownerId,
        period: normalizedPeriod
      }
    }
  })

  if (existing && existing.status === 'settled') {
    // Don't overwrite a settled settlement — it's frozen
    return await prisma.settlement.findUnique({
      where: { id: existing.id },
      include: { owner: true }
    })
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
      deductions: data.deductions,
      notes: data.notes,
      // If it was stale and we're recalculating, go back to draft
      ...(existing?.status === 'stale' ? { status: 'draft', staleSince: null } : {})
    },
    create: {
      userId,
      ownerId: data.ownerId,
      period: normalizedPeriod,
      totalCollected: data.totalCollected,
      ownerAmount: data.ownerAmount,
      commissionAmount: data.commissionAmount,
      deductions: data.deductions,
      status: 'draft',
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
 * Mark a settlement as draft (undo settled / reopen)
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
      status: 'draft',
      settledAt: null,
      staleSince: null,
      paymentMethod: null,
      reference: null
    },
    include: {
      owner: true
    }
  })
}

/**
 * Mark a settled settlement as stale (new payments detected after close).
 * Called automatically from createPayment when a payment affects an owner
 * that already has a settled settlement for that period.
 */
export const markAsStale = async (ownerId: number, period: Date, userId: number) => {
  const normalizedPeriod = new Date(Date.UTC(period.getUTCFullYear(), period.getUTCMonth(), 1))

  const settlement = await prisma.settlement.findUnique({
    where: {
      userId_ownerId_period: {
        userId,
        ownerId,
        period: normalizedPeriod
      }
    }
  })

  if (!settlement || settlement.status !== 'settled') {
    return null // Nothing to mark as stale
  }

  return await prisma.settlement.update({
    where: { id: settlement.id },
    data: {
      status: 'stale',
      staleSince: new Date()
    },
    include: {
      owner: true
    }
  })
}

/**
 * Recalculate a stale settlement — reopens it as draft with updated amounts.
 * The frontend should then call calculateForPeriod to refresh the numbers.
 */
export const recalculate = async (id: number, userId: number) => {
  const settlement = await prisma.settlement.findFirst({
    where: { id, userId }
  })

  if (!settlement) {
    throw new Error('Settlement not found or access denied')
  }

  if (settlement.status !== 'stale') {
    throw new Error('Settlement is not stale — nothing to recalculate')
  }

  // Reopen as draft
  await prisma.settlement.update({
    where: { id },
    data: {
      status: 'draft',
      settledAt: null,
      staleSince: null,
      paymentMethod: null,
      reference: null
    }
  })

  // Recalculate with current obligations
  const results = await calculateForPeriod(settlement.period, userId)
  
  // Return the recalculated settlement for this owner
  return results.find(s => s?.ownerId === settlement.ownerId) || null
}

/**
 * Dismiss stale — keep the settlement as settled (frozen) and move
 * the new obligations to the next period so they appear in the next settlement.
 */
export const dismissStale = async (id: number, userId: number) => {
  const settlement = await prisma.settlement.findFirst({
    where: { id, userId },
    include: { owner: true }
  })

  if (!settlement) {
    throw new Error('Settlement not found or access denied')
  }

  if (settlement.status !== 'stale') {
    throw new Error('Settlement is not stale')
  }

  const normalizedPeriod = new Date(Date.UTC(
    settlement.period.getUTCFullYear(),
    settlement.period.getUTCMonth(),
    1
  ))
  const nextMonth = new Date(Date.UTC(
    normalizedPeriod.getUTCFullYear(),
    normalizedPeriod.getUTCMonth() + 1,
    1
  ))

  // Find obligations that were paid AFTER the settlement was settled
  // These are the "new" obligations that caused the stale state
  const newObligations = await prisma.obligation.findMany({
    where: {
      userId,
      period: {
        gte: normalizedPeriod,
        lt: nextMonth
      },
      status: 'paid',
      NOT: { ownerImpact: 0 },
      // Only obligations whose last payment was after the settlement was settled
      obligationPayments: {
        some: {
          paymentDate: { gt: settlement.settledAt! }
        }
      }
    },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              owner: true,
              building: { include: { ownerRelation: true } }
            }
          }
        }
      },
      apartment: {
        include: {
          owner: true,
          building: { include: { ownerRelation: true } }
        }
      }
    }
  })

  // Filter only obligations belonging to this owner
  const ownerObligations = newObligations.filter(ob => {
    const owner = ob.contract?.apartment?.owner ||
                  ob.contract?.apartment?.building?.ownerRelation ||
                  ob.apartment?.owner ||
                  ob.apartment?.building?.ownerRelation
    return owner?.id === settlement.ownerId
  })

  // Move these obligations to the next period
  if (ownerObligations.length > 0) {
    await prisma.obligation.updateMany({
      where: {
        id: { in: ownerObligations.map(o => o.id) }
      },
      data: {
        period: nextMonth
      }
    })
  }

  // Mark settlement as settled again (remove stale)
  const updated = await prisma.settlement.update({
    where: { id: settlement.id },
    data: {
      status: 'settled',
      staleSince: null
    },
    include: {
      owner: true
    }
  })

  return {
    settlement: updated,
    movedObligations: ownerObligations.length,
    nextPeriod: nextMonth
  }
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
 * Queries ALL paid obligations with ownerImpact != 0 for the period.
 * - ownerImpact > 0 → income for owner (rent, income_other, debt credits)
 * - ownerImpact < 0 → deduction from owner (tax, maintenance, expense_other, etc.)
 * Also tracks agencyImpact for commission calculation.
 */
export const calculateForPeriod = async (period: Date, userId: number) => {
  const normalizedPeriod = new Date(period.getFullYear(), period.getMonth(), 1)
  const nextMonth = new Date(normalizedPeriod.getFullYear(), normalizedPeriod.getMonth() + 1, 1)

  // Single query: all paid obligations that impact the owner for this period
  const impactingObligations = await prisma.obligation.findMany({
    where: {
      userId,
      period: {
        gte: normalizedPeriod,
        lt: nextMonth
      },
      status: 'paid',
      NOT: {
        ownerImpact: 0
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
      }
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

  for (const obligation of impactingObligations) {
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

    if (obligation.ownerImpact > 0) {
      // Income for owner (rent, income_other, debt credits, etc.)
      // totalCollected = gross amount (ownerImpact + agencyImpact if commission applies)
      const grossAmount = obligation.agencyImpact > 0 
        ? obligation.ownerImpact + obligation.agencyImpact 
        : obligation.ownerImpact
      ownerData[owner.id].totalCollected += grossAmount
      // ownerAmount = net after commission and deductions (what the owner actually receives)
      ownerData[owner.id].ownerAmount += obligation.ownerImpact
      // Commission: use agencyImpact if positive (rent commissions, etc.)
      if (obligation.agencyImpact > 0) {
        ownerData[owner.id].commissionAmount += obligation.agencyImpact
      }
    } else {
      // Deduction from owner (tax, maintenance, expense_other, etc.)
      ownerData[owner.id].deductions += Math.abs(obligation.ownerImpact)
      ownerData[owner.id].ownerAmount += obligation.ownerImpact // ownerImpact is already negative
    }
  }

  // Create/update settlements for each owner
  const settlements = []
  for (const data of Object.values(ownerData)) {
    const settlement = await upsert({
      ownerId: data.ownerId,
      period: normalizedPeriod,
      totalCollected: data.totalCollected,
      ownerAmount: data.ownerAmount,
      commissionAmount: data.commissionAmount,
      deductions: data.deductions
    }, userId)
    settlements.push(settlement)
  }

  return settlements
}
