import prisma from '../config/database'
import { 
  CreateObligationDto, 
  UpdateObligationDto,
  CreateObligationPaymentDto,
  UpdateObligationPaymentDto,
  ObligationStatus,
  ObligationType,
  PaidBy,
  ChargeTo,
  ObligationOrigin,
  CommissionType,
  ObligationDistribution
} from '../types'
import * as recurringObligationsService from './recurring-obligations.service'
import * as settlementsService from './settlements.service'
import accountingService from './accounting.service'


/**
 * Calculate obligation status based on amounts and dates
 */
function calculateStatus(amount: number, paidAmount: number, dueDate: Date): ObligationStatus {
  const today = new Date()
  
  if (paidAmount >= amount) {
    return 'paid'
  }
  
  if (paidAmount > 0) {
    return 'partial'
  }
  
  if (new Date(dueDate) < today) {
    return 'overdue'
  }
  
  return 'pending'
}

/**
 * Normalize period to first day of month
 */
function normalizePeriod(date: Date | string): Date {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/**
 * Calculate distribution of money for an obligation
 * Based on type and configuration, determines:
 * - ownerImpact: How much affects owner's settlement (+ = receives, - = deducted)
 * - agencyImpact: How much affects agency's accounting (+ = income, - = expense)
 * 
 * RULES BY TYPE:
 * - rent: Owner receives (amount - commission), Agency receives commission
 * - expenses: No impact (tracking only)
 * - service: Depends on paidBy
 * - tax: Deducted from owner settlement
 * - insurance: Depends on paidBy
 * - maintenance: Depends on paidBy (owner or agency expense)
 * - debt: Flexible, manual distribution
 */
export function calculateDistribution(
  type: ObligationType,
  amount: number,
  paidBy: PaidBy = 'tenant',
  commissionType?: CommissionType | null,
  commissionValue?: number | null
): ObligationDistribution {
  let ownerImpact = 0
  let agencyImpact = 0
  let commissionAmount = 0
  let ownerAmount = 0
  let chargeTo: ChargeTo = 'tenant'

  switch (type) {
    case 'rent':
      // Alquiler: Owner recibe monto - comisión, Agency recibe comisión
      if (commissionType && commissionValue && commissionValue > 0) {
        if (commissionType === 'percentage') {
          commissionAmount = amount * (commissionValue / 100)
        } else {
          commissionAmount = commissionValue
        }
      }
      ownerAmount = amount - commissionAmount
      // IMPORTANTE: El owner siempre recibe el monto del alquiler (menos comisión si aplica)
      ownerImpact = ownerAmount // Positivo: owner recibe dinero
      agencyImpact = commissionAmount // Positivo: agency recibe comisión
      chargeTo = 'tenant' // El inquilino paga el alquiler
      break

    case 'expenses':
      // Expensas: Solo tracking, no afecta liquidaciones ni contabilidad
      ownerImpact = 0
      agencyImpact = 0
      chargeTo = 'tenant' // Solo tracking del inquilino
      break

    case 'service':
      // Servicios: Depende de quién paga
      if (paidBy === 'owner') {
        ownerImpact = -amount // Negativo: se descuenta de liquidación
        chargeTo = 'owner'
      } else if (paidBy === 'agency') {
        agencyImpact = -amount // Negativo: gasto de la inmobiliaria
        chargeTo = 'agency'
      } else {
        chargeTo = 'tenant' // Solo tracking
      }
      break

    case 'tax':
      // Impuestos: Por defecto a cargo del propietario
      ownerImpact = -amount // Negativo: se descuenta de liquidación
      chargeTo = 'owner'
      break

    case 'insurance':
      // Seguros: Depende de quién paga
      if (paidBy === 'owner') {
        ownerImpact = -amount
        chargeTo = 'owner'
      } else {
        chargeTo = 'tenant' // Solo tracking
      }
      break

    case 'maintenance':
      // Mantenimiento: Depende de quién paga
      if (paidBy === 'owner') {
        ownerImpact = -amount // Se descuenta de liquidación
        chargeTo = 'owner'
      } else if (paidBy === 'agency') {
        agencyImpact = -amount // Gasto de la inmobiliaria
        chargeTo = 'agency'
      }
      break

    case 'debt':
      // Deudas/Ajustes: Distribución flexible
      if (paidBy === 'owner') {
        ownerImpact = -amount // El propietario nos debe este monto
        chargeTo = 'owner'
      } else if (paidBy === 'agency') {
        agencyImpact = -amount // Es un gasto de la inmobiliaria
        chargeTo = 'agency'
      } else {
        chargeTo = 'tenant' // Deuda del inquilino
      }
      break

    case 'income_other':
      // Ingreso genérico (tasación, venta, administración puntual, etc.)
      // paidBy determina a quién se imputa el ingreso
      if (paidBy === 'owner') {
        ownerImpact = amount // Ingreso para el propietario
        chargeTo = 'owner'
      } else if (paidBy === 'agency') {
        agencyImpact = amount // Ingreso para la inmobiliaria
        chargeTo = 'agency'
      } else {
        // tenant paga → depende del contexto, default agency
        agencyImpact = amount
        chargeTo = 'agency'
      }
      break

    case 'expense_other':
      // Egreso genérico (gasto operativo, proveedor, etc.)
      if (paidBy === 'owner') {
        ownerImpact = -amount // Se descuenta de liquidación del propietario
        chargeTo = 'owner'
      } else if (paidBy === 'agency') {
        agencyImpact = -amount // Gasto de la inmobiliaria
        chargeTo = 'agency'
      } else {
        chargeTo = 'tenant' // Solo tracking
      }
      break
  }

  return {
    ownerImpact,
    agencyImpact,
    commissionAmount,
    ownerAmount,
    chargeTo
  }
}

// ============================================================================
// OBLIGATIONS CRUD
// ============================================================================

export const getAll = async (userId: number) => {
  // Optimizado para el nuevo orden de prioridad:
  // 1. overdue (vencidas)
  // 2. pending (pendientes)
  // 3. partial (parciales)
  // 4. paid (pagadas)
  // Dentro de cada grupo: ordenado por dueDate ASC (más antiguo primero)
  return await prisma.obligation.findMany({
    where: { userId },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              building: {
                include: {
                  ownerRelation: true
                }
              },
              owner: true
            }
          },
          tenant: true
        }
      },
      apartment: {
        include: {
          building: {
            include: {
              ownerRelation: true
            }
          },
          owner: true
        }
      },
      obligationPayments: {
        orderBy: {
          paymentDate: 'desc'
        }
      }
    },
    orderBy: [
      { status: 'asc' }, // El orden alfabético no es ideal, pero el frontend reordena
      { dueDate: 'asc' } // Más antiguo primero
    ]
  })
}

export const getById = async (id: number, userId: number) => {
  return await prisma.obligation.findFirst({
    where: { id, userId },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              building: true,
              owner: true
            }
          },
          tenant: true
        }
      },
      apartment: {
        include: {
          building: true,
          owner: true
        }
      },
      obligationPayments: {
        orderBy: {
          paymentDate: 'desc'
        }
      }
    }
  })
}

export const getByContractId = async (contractId: number, userId: number) => {
  return await prisma.obligation.findMany({
    where: { contractId, userId },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              building: true,
              owner: true
            }
          },
          tenant: true
        }
      },
      apartment: {
        include: {
          building: true,
          owner: true
        }
      },
      obligationPayments: {
        orderBy: {
          paymentDate: 'desc'
        }
      }
    },
    orderBy: [
      { dueDate: 'asc' },
      { status: 'asc' }
    ]
  })
}

export const getByType = async (type: string, userId: number) => {
  return await prisma.obligation.findMany({
    where: { type, userId },
    include: {
      contract: {
        include: {
          apartment: true,
          tenant: true
        }
      },
      apartment: true,
      obligationPayments: true
    },
    orderBy: {
      dueDate: 'desc'
    }
  })
}

export const getPending = async (userId: number) => {
  return await prisma.obligation.findMany({
    where: {
      userId,
      status: {
        in: ['pending', 'partial', 'overdue']
      }
    },
    include: {
      contract: {
        include: {
          apartment: true,
          tenant: true
        }
      },
      apartment: true,
      obligationPayments: true
    },
    orderBy: {
      dueDate: 'asc'
    }
  })
}

export const getOverdue = async (userId: number) => {
  return await prisma.obligation.findMany({
    where: {
      userId,
      status: 'overdue'
    },
    include: {
      contract: {
        include: {
          apartment: true,
          tenant: true
        }
      },
      apartment: true,
      obligationPayments: true
    },
    orderBy: {
      dueDate: 'asc'
    }
  })
}

export const create = async (data: CreateObligationDto, userId: number) => {
  // Calculate distribution based on type and configuration
  const paidBy = (data.paidBy || 'tenant') as PaidBy
  
  // Si se proporciona apartmentId pero no contractId, buscar contrato activo
  let contractId = data.contractId
  if (!contractId && data.apartmentId) {
    const now = new Date()
    const activeContract = await prisma.contract.findFirst({
      where: {
        apartmentId: data.apartmentId,
        userId,
        startDate: { lte: now },
        endDate: { gte: now }
      },
      orderBy: {
        startDate: 'desc'
      }
    })
    if (activeContract) {
      contractId = activeContract.id
    }
  }
  
  // If ownerImpact/agencyImpact are provided, use them directly (for debt/adjustments)
  // Otherwise calculate based on type
  let distribution: ObligationDistribution
  
  if (data.ownerImpact !== undefined || data.agencyImpact !== undefined) {
    // Manual distribution (for debt type)
    // Derive chargeTo from impacts if not provided
    let manualChargeTo: ChargeTo = data.chargeTo || 'tenant'
    if (!data.chargeTo) {
      if ((data.ownerImpact || 0) !== 0) manualChargeTo = 'owner'
      else if ((data.agencyImpact || 0) !== 0) manualChargeTo = 'agency'
    }
    distribution = {
      ownerImpact: data.ownerImpact || 0,
      agencyImpact: data.agencyImpact || 0,
      commissionAmount: data.commissionAmount || 0,
      ownerAmount: data.ownerAmount || 0,
      chargeTo: manualChargeTo
    }
  } else {
    // Auto-calculate based on type
    // Pass commission config if provided (for rent obligations)
    distribution = calculateDistribution(
      data.type as ObligationType,
      data.amount,
      paidBy,
      data.commissionType as CommissionType | undefined,
      data.commissionValue
    )
  }

  // Normalize period
  const period = normalizePeriod(data.period)
  const dueDate = new Date(data.dueDate)

  // Determine initial paidAmount and status
  // For adjustments/credits (debt type with positive ownerImpact), create as already paid
  const paidAmount = data.paidAmount ?? 0
  let status: string
  
  if (data.status) {
    // Use provided status
    status = data.status
  } else {
    // Calculate status based on amounts
    status = calculateStatus(data.amount, paidAmount, dueDate)
  }

  // Use transaction to create obligation and payment atomically if needed
  const result = await prisma.$transaction(async (tx) => {
    // Determine chargeTo: explicit > distribution > paidBy
    const chargeTo = data.chargeTo || distribution.chargeTo || paidBy
    // Determine origin: explicit or null (will be set by caller)
    const origin = data.origin || null

    const obligation = await tx.obligation.create({
      data: {
        userId,
        contractId: contractId,
        apartmentId: data.apartmentId,
        type: data.type,
        category: data.category,
        description: data.description,
        period,
        dueDate,
        amount: data.amount,
        paidAmount,
        paidBy,
        chargeTo,
        origin,
        ownerImpact: distribution.ownerImpact,
        agencyImpact: distribution.agencyImpact,
        commissionAmount: distribution.commissionAmount,
        ownerAmount: distribution.ownerAmount,
        status,
        notes: data.notes
      }
    })

    // If obligation is created as 'paid' (e.g., credit/adjustment to owner),
    // also create an ObligationPayment record for consistency and history
    if (status === 'paid' && paidAmount > 0) {
      await tx.obligationPayment.create({
        data: {
          userId,
          obligationId: obligation.id,
          amount: paidAmount,
          paymentDate: new Date(),
          method: 'other',
          notes: 'Ajuste automático - creado como pagado'
        }
      })
    }

    return obligation
  })

  // Return with all includes
  return await getById(result.id, userId)
}

export const update = async (id: number, data: UpdateObligationDto, userId: number) => {
  // Verify ownership
  const existing = await getById(id, userId)
  if (!existing) {
    throw new Error('Obligation not found or access denied')
  }

  const updateData: any = {}

  if (data.description !== undefined) {
    updateData.description = data.description
  }

  if (data.dueDate !== undefined) {
    updateData.dueDate = new Date(data.dueDate)
  }

  if (data.amount !== undefined) {
    updateData.amount = data.amount
    // Commission will be calculated in the finance module
    updateData.ownerAmount = data.amount
  }

  if (data.notes !== undefined) {
    updateData.notes = data.notes
  }

  if (data.paidBy !== undefined) {
    updateData.paidBy = data.paidBy
    // Recalculate distribution based on new paidBy
    const amount = data.amount ?? existing.amount
    const distribution = calculateDistribution(
      existing.type as ObligationType,
      amount,
      data.paidBy as PaidBy
    )
    updateData.ownerImpact = distribution.ownerImpact
    updateData.agencyImpact = distribution.agencyImpact
  }

  if (data.ownerImpact !== undefined) {
    updateData.ownerImpact = data.ownerImpact
  }

  if (data.agencyImpact !== undefined) {
    updateData.agencyImpact = data.agencyImpact
  }

  // Recalculate status
  const amount = data.amount ?? existing.amount
  const dueDate = data.dueDate ? new Date(data.dueDate) : existing.dueDate
  updateData.status = calculateStatus(amount, existing.paidAmount, dueDate)

  return await prisma.obligation.update({
    where: { id },
    data: updateData,
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              building: true,
              owner: true
            }
          },
          tenant: true
        }
      },
      apartment: {
        include: {
          building: true,
          owner: true
        }
      },
      obligationPayments: {
        orderBy: {
          paymentDate: 'desc'
        }
      }
    }
  })
}

export const remove = async (id: number, userId: number) => {
  const obligation = await getById(id, userId)
  if (!obligation) {
    throw new Error('Obligation not found or access denied')
  }

  return await prisma.obligation.delete({
    where: { id }
  })
}

/**
 * Mark overdue obligations
 */
export const markOverdueObligations = async (userId: number) => {
  const today = new Date()

  const result = await prisma.obligation.updateMany({
    where: {
      userId,
      status: {
        in: ['pending', 'partial']
      },
      dueDate: {
        lt: today
      }
    },
    data: {
      status: 'overdue'
    }
  })

  return result
}

// ============================================================================
// OBLIGATION PAYMENTS CRUD
// ============================================================================

export const getAllPayments = async (userId: number) => {
  return await prisma.obligationPayment.findMany({
    where: { userId },
    include: {
      obligation: {
        include: {
          contract: {
            include: {
              apartment: {
                include: {
                  building: true
                }
              },
              tenant: true
            }
          },
          apartment: {
            include: {
              building: true
            }
          }
        }
      }
    },
    orderBy: [
      { paymentDate: 'desc' },
      { createdAt: 'desc' }
    ]
  })
}

export const getPaymentById = async (id: number, userId: number) => {
  return await prisma.obligationPayment.findFirst({
    where: { id, userId },
    include: {
      obligation: {
        include: {
          contract: {
            include: {
              apartment: true,
              tenant: true
            }
          },
          apartment: true
        }
      }
    }
  })
}

export const getPaymentsByObligationId = async (obligationId: number, userId: number) => {
  return await prisma.obligationPayment.findMany({
    where: { obligationId, userId },
    orderBy: {
      paymentDate: 'desc'
    }
  })
}

export const getPaymentsByContractId = async (contractId: number, userId: number) => {
  // Obtener pagos filtrando por contractId a través de la relación obligation
  return await prisma.obligationPayment.findMany({
    where: {
      userId,
      obligation: {
        contractId
      }
    },
    include: {
      obligation: {
        include: {
          contract: {
            include: {
              apartment: {
                include: {
                  building: true
                }
              },
              tenant: true
            }
          },
          apartment: {
            include: {
              building: true
            }
          }
        }
      }
    },
    orderBy: [
      { paymentDate: 'desc' },
      { createdAt: 'desc' }
    ]
  })
}

export const createPayment = async (data: CreateObligationPaymentDto, userId: number) => {
  // Verify obligation exists and belongs to user
  const obligation = await getById(data.obligationId, userId)
  if (!obligation) {
    throw new Error('Obligation not found or access denied')
  }

  // Validate payment amount
  const remaining = obligation.amount - obligation.paidAmount
  if (data.amount > remaining) {
    throw new Error(`Payment amount (${data.amount}) exceeds remaining amount (${remaining})`)
  }

  // Create payment using transaction to ensure consistency
  const result = await prisma.$transaction(async (tx) => {
    // Create payment
    const payment = await tx.obligationPayment.create({
      data: {
        userId,
        obligationId: data.obligationId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        method: data.method,
        reference: data.reference,
        notes: data.notes
      }
    })

    // Update obligation paidAmount and status
    const newPaidAmount = obligation.paidAmount + data.amount
    const newStatus = calculateStatus(obligation.amount, newPaidAmount, obligation.dueDate)

    await tx.obligation.update({
      where: { id: data.obligationId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus
      }
    })

    return payment
  })

  // Crear AccountingEntry si la obligación impacta la caja de la inmobiliaria
  if (obligation.agencyImpact !== 0) {
    const paymentRatio = data.amount / obligation.amount
    const agencyAmountForPayment = Math.round(obligation.agencyImpact * paymentRatio * 100) / 100

    if (agencyAmountForPayment !== 0) {
      const isIncome = agencyAmountForPayment > 0
      const entryType = obligation.type === 'rent' ? 'commission' : 
                        isIncome ? 'income_other' : 'expense'

      await accountingService.create(userId, {
        type: entryType,
        description: `${isIncome ? 'Ingreso' : 'Egreso'}: ${obligation.description}`,
        amount: Math.abs(agencyAmountForPayment),
        entryDate: new Date(data.paymentDate),
        period: obligation.period,
        obligationId: obligation.id,
        contractId: obligation.contractId || undefined,
        metadata: {
          paymentId: result.id,
          obligationType: obligation.type,
          isIncome,
          origin: (obligation as any).origin || 'unknown'
        }
      })
    }
  }

  // Check if this payment affects a settled settlement → mark it stale
  if (obligation.ownerImpact !== 0) {
    try {
      // Find the owner of this obligation
      const fullObligation = await prisma.obligation.findUnique({
        where: { id: obligation.id },
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

      const owner = fullObligation?.contract?.apartment?.owner ||
                    fullObligation?.contract?.apartment?.building?.ownerRelation ||
                    fullObligation?.apartment?.owner ||
                    fullObligation?.apartment?.building?.ownerRelation

      if (owner) {
        await settlementsService.markAsStale(owner.id, obligation.period, userId)
      }
    } catch (err) {
      console.error('[Settlements] Error checking stale status:', err)
      // Don't block the payment if stale check fails
    }
  }

  // Return payment with obligation
  return await getPaymentById(result.id, userId)
}

export const updatePayment = async (id: number, data: UpdateObligationPaymentDto, userId: number) => {
  // Verify ownership
  const existing = await getPaymentById(id, userId)
  if (!existing) {
    throw new Error('Payment not found or access denied')
  }

  const updateData: any = {}

  if (data.amount !== undefined) {
    updateData.amount = data.amount
  }

  if (data.paymentDate !== undefined) {
    updateData.paymentDate = new Date(data.paymentDate)
  }

  if (data.method !== undefined) {
    updateData.method = data.method
  }

  if (data.reference !== undefined) {
    updateData.reference = data.reference
  }

  if (data.notes !== undefined) {
    updateData.notes = data.notes
  }

  const updated = await prisma.obligationPayment.update({
    where: { id },
    data: updateData
  })

  // Recalculate obligation paidAmount if amount changed
  if (data.amount !== undefined) {
    const allPayments = await getPaymentsByObligationId(existing.obligationId, userId)
    const totalPaid = allPayments.reduce((sum, p) => sum + (p.id === id ? (data.amount ?? 0) : p.amount), 0)

    const obligation = await getById(existing.obligationId, userId)
    if (obligation) {
      const newStatus = calculateStatus(obligation.amount, totalPaid, obligation.dueDate)
      await prisma.obligation.update({
        where: { id: existing.obligationId },
        data: {
          paidAmount: totalPaid,
          status: newStatus
        }
      })
    }
  }

  return await getPaymentById(updated.id, userId)
}

export const removePayment = async (id: number, userId: number) => {
  const payment = await getPaymentById(id, userId)
  if (!payment) {
    throw new Error('Payment not found or access denied')
  }

  // Delete payment
  await prisma.obligationPayment.delete({
    where: { id }
  })

  // Recalculate obligation paidAmount
  const allPayments = await getPaymentsByObligationId(payment.obligationId, userId)
  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0)

  const obligation = await getById(payment.obligationId, userId)
  if (obligation) {
    const newStatus = calculateStatus(obligation.amount, totalPaid, obligation.dueDate)
    await prisma.obligation.update({
      where: { id: payment.obligationId },
      data: {
        paidAmount: totalPaid,
        status: newStatus
      }
    })
  }
}

// ============================================================================
// AUTO-GENERATION OF OBLIGATIONS
// ============================================================================

/**
 * Generate rent obligations for all active contracts for a given month
 * AND generate recurring obligations
 * Idempotent: won't create duplicates if already exists
 */
export const generateObligations = async (month: string, userId: number) => {
  // Parse month (YYYY-MM)
  const [year, monthNum] = month.split('-').map(Number)
  if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
    throw new Error('Invalid month format. Use YYYY-MM')
  }

  // Period is the first day of the month
  const period = new Date(year, monthNum - 1, 1)
  const periodKey = `${year}-${String(monthNum).padStart(2, '0')}`

  const results = {
    generated: 0,
    skipped: 0,
    errors: [] as string[]
  }

  // ============================================================================
  // PART 1: Generate RENT obligations from contracts
  // ============================================================================
  
  // Get all active contracts for this user (active = endDate >= today)
  const today = new Date()
  const contracts = await prisma.contract.findMany({
    where: {
      userId,
      endDate: {
        gte: today
      }
    },
    include: {
      apartment: {
        include: {
          owner: true,
          building: true
        }
      },
      tenant: true,
      updateRule: {
        include: {
          updatePeriods: true
        }
      }
    }
  })

  for (const contract of contracts) {
    try {
      // Check if obligation already exists for this contract and period
      const existing = await prisma.obligation.findFirst({
        where: {
          userId,
          contractId: contract.id,
          type: 'rent',
          period
        }
      })

      if (existing) {
        results.skipped++
        continue
      }

      // Calculate rent amount based on UpdateRule
      let rentAmount = contract.initialAmount
      
      // Note: UpdateRule logic simplified - using initialAmount for now
      // TODO: Implement proper update period calculation when needed

      // Determine due date - default to 10th of the month
      const dueDay = 10
      const dueDate = new Date(year, monthNum - 1, dueDay)

      // Get apartment info for description
      const apartmentInfo = `Unidad ${contract.apartmentId}`

      // Calculate distribution using contract's commission settings
      const distribution = calculateDistribution(
        'rent',
        rentAmount,
        'tenant',
        contract.commissionType as CommissionType | undefined,
        contract.commissionValue || undefined
      )

      // Create the obligation with proper distribution
      await prisma.obligation.create({
        data: {
          userId,
          contractId: contract.id,
          apartmentId: contract.apartmentId,
          type: 'rent',
          description: `Alquiler ${apartmentInfo} - ${monthNum}/${year}`,
          period,
          dueDate,
          amount: rentAmount,
          paidAmount: 0,
          paidBy: 'tenant',
          chargeTo: 'tenant',
          origin: 'contract_auto',
          ownerImpact: distribution.ownerImpact,
          agencyImpact: distribution.agencyImpact,
          commissionAmount: distribution.commissionAmount,
          ownerAmount: distribution.ownerAmount,
          status: 'pending'
        }
      })

      results.generated++
    } catch (error: any) {
      results.errors.push(`Contract ${contract.id}: ${error.message}`)
    }
  }

  // ============================================================================
  // PART 2: Generate RECURRING obligations
  // ============================================================================
  
  try {
    // Generate recurring obligations for this month
    const recurringResults = await recurringObligationsService.generateForMonth(month, userId)
    
    // Merge results
    results.generated += recurringResults.generated
    results.skipped += recurringResults.skipped
    results.errors.push(...recurringResults.errors)
  } catch (error: any) {
    results.errors.push(`Recurring obligations: ${error.message}`)
  }

  return results
}

