import prisma from '../config/database'

// Get all rent adjustments for a contract
export const getByContractId = async (contractId: number, userId: number) => {
  return prisma.rentAdjustment.findMany({
    where: { contractId, userId },
    orderBy: { period: 'desc' },
    include: {
      recurringObligation: {
        select: {
          id: true,
          description: true,
          amount: true,
          updateIndexType: true,
          updateFrequencyMonths: true,
          initialIndexValue: true,
          initialIndexDate: true,
          currentAmount: true,
        }
      }
    }
  })
}

// Get a single rent adjustment by ID
export const getById = async (id: number, userId: number) => {
  return prisma.rentAdjustment.findFirst({
    where: { id, userId },
    include: {
      recurringObligation: {
        select: {
          id: true,
          description: true,
          amount: true,
          updateIndexType: true,
          updateFrequencyMonths: true,
          initialIndexValue: true,
          initialIndexDate: true,
          currentAmount: true,
        }
      }
    }
  })
}

// Get the recurring obligation config (index info) for a contract
export const getIndexConfig = async (contractId: number, userId: number) => {
  return prisma.recurringObligation.findFirst({
    where: {
      contractId,
      userId,
      type: 'rent',
      isActive: true,
      updateIndexType: { not: null },
    },
    select: {
      id: true,
      description: true,
      amount: true,
      currentAmount: true,
      updateIndexType: true,
      updateFrequencyMonths: true,
      initialIndexValue: true,
      initialIndexDate: true,
      fixedUpdateCoefficient: true,
      periodsSinceUpdate: true,
      lastUpdateApplied: true,
      startDate: true,
      endDate: true,
    }
  })
}

// Create a rent adjustment record (called from generateForMonth)
export const create = async (data: {
  userId: number
  contractId: number
  recurringObligationId: number
  period: Date
  indexType: string
  originalIndexValue: number
  appliedIndexValue: number
  baseIndexValue: number
  baseAmount: number
  previousAmount: number
  newAmount: number
  coefficient: number
  percentageIncrease: number
  notes?: string
}) => {
  return prisma.rentAdjustment.upsert({
    where: {
      recurringObligationId_period: {
        recurringObligationId: data.recurringObligationId,
        period: data.period,
      }
    },
    update: {
      originalIndexValue: data.originalIndexValue,
      appliedIndexValue: data.appliedIndexValue,
      baseIndexValue: data.baseIndexValue,
      baseAmount: data.baseAmount,
      previousAmount: data.previousAmount,
      newAmount: data.newAmount,
      coefficient: data.coefficient,
      percentageIncrease: data.percentageIncrease,
      notes: data.notes,
    },
    create: data,
  })
}

// Manually modify an adjustment's applied index value and recalculate
// Also updates the corresponding Obligation if it hasn't been paid yet
export const modifyAdjustment = async (
  id: number,
  userId: number,
  newAppliedIndexValue: number,
  modifiedByUserId: number,
  notes?: string
) => {
  const adjustment = await prisma.rentAdjustment.findFirst({
    where: { id, userId },
  })

  if (!adjustment) {
    throw new Error('Ajuste no encontrado')
  }

  // Recalculate amounts with new index value
  const newCoefficient = newAppliedIndexValue / adjustment.baseIndexValue
  const newAmount = Math.round(adjustment.baseAmount * newCoefficient)
  const previousAdjustment = await prisma.rentAdjustment.findFirst({
    where: {
      recurringObligationId: adjustment.recurringObligationId,
      userId,
      period: { lt: adjustment.period },
    },
    orderBy: { period: 'desc' },
  })

  const prevAmount = previousAdjustment?.newAmount || adjustment.baseAmount
  const percentageIncrease = prevAmount > 0 ? ((newAmount - prevAmount) / prevAmount) * 100 : 0

  // Update the adjustment
  const updated = await prisma.rentAdjustment.update({
    where: { id },
    data: {
      appliedIndexValue: newAppliedIndexValue,
      isManuallyModified: true,
      newAmount,
      coefficient: newCoefficient,
      percentageIncrease,
      modifiedByUserId,
      modifiedAt: new Date(),
      notes: notes || `Valor del índice modificado manualmente de ${adjustment.originalIndexValue} a ${newAppliedIndexValue}`,
    },
  })

  // Also update the recurring obligation's currentAmount if this is the latest adjustment
  const latestAdjustment = await prisma.rentAdjustment.findFirst({
    where: {
      recurringObligationId: adjustment.recurringObligationId,
      userId,
    },
    orderBy: { period: 'desc' },
  })

  if (latestAdjustment && latestAdjustment.id === id) {
    await prisma.recurringObligation.update({
      where: { id: adjustment.recurringObligationId },
      data: { currentAmount: newAmount },
    })
  }

  // Update the Obligation for this period if it hasn't been paid yet
  const obligation = await prisma.obligation.findFirst({
    where: {
      contractId: adjustment.contractId,
      recurringObligationId: adjustment.recurringObligationId,
      userId,
      type: 'rent',
      period: adjustment.period,
      status: { in: ['pending', 'overdue'] },
    },
  })

  if (obligation) {
    // Get commission config from recurring obligation
    const recurringObl = await prisma.recurringObligation.findFirst({
      where: { id: adjustment.recurringObligationId },
      select: { commissionType: true, commissionValue: true },
    })

    // Recalculate commission and impacts
    let commissionAmount = 0
    if (recurringObl?.commissionType === 'percentage' && recurringObl.commissionValue) {
      commissionAmount = newAmount * (recurringObl.commissionValue / 100)
    } else if (recurringObl?.commissionType === 'fixed' && recurringObl.commissionValue) {
      commissionAmount = recurringObl.commissionValue
    }
    const ownerAmount = newAmount - commissionAmount

    await prisma.obligation.update({
      where: { id: obligation.id },
      data: {
        amount: newAmount,
        commissionAmount,
        ownerAmount,
        ownerImpact: ownerAmount,
        agencyImpact: commissionAmount,
        description: obligation.description.includes('(Actualizado')
          ? obligation.description.replace(/\(Actualizado.*?\)/, `(Actualizado manualmente — índice: ${newAppliedIndexValue})`)
          : `${obligation.description} (Actualizado manualmente — índice: ${newAppliedIndexValue})`,
      },
    })
  }

  return { ...updated, obligationUpdated: !!obligation }
}

// Build a timeline of all expected adjustment slots from contract start to now/end
// Also backfills missing RentAdjustment records for obligations already generated
export const getTimeline = async (contractId: number, userId: number) => {
  const config = await prisma.recurringObligation.findFirst({
    where: {
      contractId,
      userId,
      type: 'rent',
      isActive: true,
      updateIndexType: { not: null },
    },
    select: {
      id: true,
      amount: true,
      currentAmount: true,
      updateIndexType: true,
      updateFrequencyMonths: true,
      initialIndexValue: true,
      initialIndexDate: true,
      fixedUpdateCoefficient: true,
      startDate: true,
      endDate: true,
    }
  })

  if (!config || !config.updateFrequencyMonths) {
    return { slots: [], config: null }
  }

  // Get all existing adjustment records
  let adjustments = await prisma.rentAdjustment.findMany({
    where: { contractId, userId },
    orderBy: { period: 'asc' },
  })

  // Get all rent obligations for this contract (to detect generated but untracked periods)
  const obligations = await prisma.obligation.findMany({
    where: {
      contractId,
      userId,
      recurringObligationId: config.id,
      type: 'rent',
    },
    orderBy: { period: 'asc' },
    select: { id: true, period: true, amount: true, createdAt: true },
  })

  // Build map of obligations by period key (YYYY-MM)
  const oblMap = new Map<string, typeof obligations[0]>()
  for (const obl of obligations) {
    const key = `${obl.period.getFullYear()}-${String(obl.period.getMonth() + 1).padStart(2, '0')}`
    oblMap.set(key, obl)
  }

  // Build map of existing adjustments by period key
  const adjMap = new Map<string, typeof adjustments[0]>()
  for (const adj of adjustments) {
    const key = `${adj.period.getFullYear()}-${String(adj.period.getMonth() + 1).padStart(2, '0')}`
    adjMap.set(key, adj)
  }

  // Calculate all expected adjustment periods
  const startDate = new Date(config.startDate)
  const endDate = config.endDate ? new Date(config.endDate) : null
  const now = new Date()

  // Collect period keys that need backfill
  const backfillPeriods: Array<{ periodKey: string; periodDate: Date; slotNumber: number }> = []

  const slots: Array<{
    period: string
    periodLabel: string
    slotNumber: number
    status: 'completed' | 'current' | 'pending' | 'future'
    adjustment: typeof adjustments[0] | null
    expectedDate: string
  }> = []

  // First obligation month (month 0 - no update yet)
  let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  let monthsSinceStart = 0
  let slotNumber = 0

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  // Advance through months to find update periods
  while (currentDate <= (endDate || new Date(now.getFullYear() + 1, now.getMonth(), 1))) {
    monthsSinceStart++
    currentDate.setMonth(currentDate.getMonth() + 1)

    // Check if this month is an update period
    if (monthsSinceStart % config.updateFrequencyMonths === 0) {
      slotNumber++
      const periodKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      let existingAdj = adjMap.get(periodKey) || null
      const existingObl = oblMap.get(periodKey) || null

      const periodDate = new Date(currentDate)
      const nowYear = now.getFullYear()
      const nowMonth = now.getMonth()
      const slotYear = periodDate.getFullYear()
      const slotMonth = periodDate.getMonth()
      const isCurrentMonth = slotYear === nowYear && slotMonth === nowMonth
      const isPast = slotYear < nowYear || (slotYear === nowYear && slotMonth < nowMonth)

      // Backfill: obligation exists but no RentAdjustment — queue for creation
      if (!existingAdj && existingObl && (isPast || isCurrentMonth)) {
        backfillPeriods.push({ periodKey, periodDate: new Date(periodDate), slotNumber })
      }

      let status: 'completed' | 'current' | 'pending' | 'future'
      if (existingAdj) {
        status = 'completed'
      } else if (existingObl && (isPast || isCurrentMonth)) {
        // Obligation exists, will be backfilled — treat as completed
        status = 'completed'
      } else if (isCurrentMonth) {
        status = 'current'
      } else if (isPast) {
        status = 'pending'
      } else {
        status = 'future'
      }

      slots.push({
        period: periodKey,
        periodLabel: `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`,
        slotNumber,
        status,
        adjustment: existingAdj, // Will be null for backfill, updated below
        expectedDate: periodDate.toISOString(),
      })
    }

    // Safety: don't generate more than 60 slots (5 years monthly)
    if (slotNumber >= 60) break
  }

  // Execute backfills: create RentAdjustment records for past obligations without tracking
  if (backfillPeriods.length > 0) {
    // Sort obligations by period to reconstruct previousAmount chain
    const sortedObls = [...obligations].sort((a, b) => a.period.getTime() - b.period.getTime())

    for (const bf of backfillPeriods) {
      const obl = oblMap.get(bf.periodKey)!
      
      // Find the previous obligation to get previousAmount
      const oblIdx = sortedObls.findIndex(o => o.id === obl.id)
      const prevObl = oblIdx > 0 ? sortedObls[oblIdx - 1] : null
      const previousAmount = prevObl ? prevObl.amount : config.amount
      const newAmount = obl.amount

      // Reconstruct coefficient from amounts
      const coefficient = config.amount > 0 ? newAmount / config.amount : 1
      const percentageIncrease = previousAmount > 0 ? ((newAmount - previousAmount) / previousAmount) * 100 : 0

      // Determine index value used
      const appliedIndexValue = config.initialIndexValue
        ? config.initialIndexValue * coefficient
        : coefficient

      try {
        const created = await prisma.rentAdjustment.upsert({
          where: {
            recurringObligationId_period: {
              recurringObligationId: config.id,
              period: obl.period,
            }
          },
          update: {},
          create: {
            userId,
            contractId,
            recurringObligationId: config.id,
            period: obl.period,
            indexType: config.updateIndexType || 'unknown',
            originalIndexValue: appliedIndexValue,
            appliedIndexValue: appliedIndexValue,
            baseIndexValue: config.initialIndexValue || 1,
            baseAmount: config.amount,
            previousAmount,
            newAmount,
            coefficient,
            percentageIncrease,
            notes: `Registro retroactivo — obligación generada el ${obl.createdAt.toLocaleDateString('es-AR')}`,
          },
        })

        // Update the slot with the backfilled adjustment
        const slotIdx = slots.findIndex(s => s.period === bf.periodKey)
        if (slotIdx >= 0) {
          slots[slotIdx].adjustment = created
        }
      } catch (err) {
        console.error(`Error backfilling RentAdjustment for period ${bf.periodKey}:`, err)
      }
    }
  }

  return { slots, config }
}

// Get index metadata (publication info, delays)
export const getIndexMetadata = (indexType: string) => {
  const metadata: Record<string, {
    provider: string
    frequency: string
    delay: string
    delayDays: number
    description: string
    source: string
  }> = {
    ipc: {
      provider: 'INDEC (Instituto Nacional de Estadística y Censos)',
      frequency: 'Mensual',
      delay: '~12-15 días del mes siguiente',
      delayDays: 15,
      description: 'El IPC se publica mensualmente con un retraso inherente de ~2 semanas. INDEC necesita recopilar datos de precios de todo el país durante el mes completo antes de poder calcular el índice. No existe IPC en tiempo real.',
      source: 'https://www.indec.gob.ar',
    },
    icl: {
      provider: 'BCRA (Banco Central de la República Argentina)',
      frequency: 'Diario',
      delay: 'Mismo día / día hábil siguiente',
      delayDays: 1,
      description: 'El ICL se publica diariamente por el BCRA. Internamente usa IPC(j-2) y RIPTE(j-2) (datos de 2 meses atrás), pero el valor del índice está siempre disponible y actualizado.',
      source: 'https://www.bcra.gob.ar',
    },
    fixed: {
      provider: 'Configuración manual',
      frequency: 'Según frecuencia del contrato',
      delay: 'Sin retraso',
      delayDays: 0,
      description: 'El coeficiente fijo se aplica automáticamente según la frecuencia configurada en el contrato. No depende de datos externos.',
      source: '',
    },
  }

  return metadata[indexType] || null
}

export const rentAdjustmentsService = {
  getByContractId,
  getById,
  getIndexConfig,
  getTimeline,
  getIndexMetadata,
  create,
  modifyAdjustment,
}
