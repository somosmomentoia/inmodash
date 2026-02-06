import prisma from '../config/database'
import { 
  CreateObligationDto, 
  UpdateObligationDto,
  CreateObligationPaymentDto,
  UpdateObligationPaymentDto,
  ObligationStatus,
  ObligationType,
  PaidBy,
  CommissionType,
  ObligationDistribution
} from '../types'
import * as recurringObligationsService from './recurring-obligations.service'


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
      break

    case 'expenses':
      // Expensas: Solo tracking, no afecta liquidaciones ni contabilidad
      ownerImpact = 0
      agencyImpact = 0
      break

    case 'service':
      // Servicios: Depende de quién paga
      if (paidBy === 'owner') {
        ownerImpact = -amount // Negativo: se descuenta de liquidación
      } else if (paidBy === 'agency') {
        agencyImpact = -amount // Negativo: gasto de la inmobiliaria
      }
      // Si paidBy === 'tenant', no afecta a nadie (solo tracking)
      break

    case 'tax':
      // Impuestos: Por defecto a cargo del propietario
      ownerImpact = -amount // Negativo: se descuenta de liquidación
      break

    case 'insurance':
      // Seguros: Depende de quién paga
      if (paidBy === 'owner') {
        ownerImpact = -amount
      } else if (paidBy === 'tenant') {
        // Solo tracking
      }
      break

    case 'maintenance':
      // Mantenimiento: Depende de quién paga
      if (paidBy === 'owner') {
        ownerImpact = -amount // Se descuenta de liquidación
      } else if (paidBy === 'agency') {
        agencyImpact = -amount // Gasto de la inmobiliaria
      }
      break

    case 'debt':
      // Deudas/Ajustes: Distribución flexible
      // Si no se especifica manualmente, usar paidBy para determinar el impacto
      // Por defecto: si paidBy es 'owner', el propietario debe el monto (ownerImpact negativo)
      if (paidBy === 'owner') {
        ownerImpact = -amount // El propietario nos debe este monto
      } else if (paidBy === 'agency') {
        agencyImpact = -amount // Es un gasto de la inmobiliaria
      }
      // Si paidBy es 'tenant', no afecta liquidaciones (solo tracking)
      break
  }

  return {
    ownerImpact,
    agencyImpact,
    commissionAmount,
    ownerAmount
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
    distribution = {
      ownerImpact: data.ownerImpact || 0,
      agencyImpact: data.agencyImpact || 0,
      commissionAmount: data.commissionAmount || 0,
      ownerAmount: data.ownerAmount || 0
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
          notes: 'Ajuste automático - creado como pagado',
          appliedToOwnerBalance: false
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
    orderBy: {
      paymentDate: 'desc'
    }
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
    orderBy: {
      paymentDate: 'desc'
    }
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

  // Si es un pago aplicado al saldo del propietario, verificar que el propietario existe
  // y tiene saldo suficiente
  if (data.appliedToOwnerBalance && data.ownerId) {
    const owner = await prisma.owner.findFirst({
      where: { id: data.ownerId, userId }
    })
    if (!owner) {
      throw new Error('Owner not found or access denied')
    }
    // El balance positivo significa que el propietario tiene saldo a favor
    // Para pagar una deuda del propietario, necesitamos descontar de su saldo
    if (owner.balance < data.amount) {
      throw new Error(`Saldo insuficiente del propietario. Saldo disponible: $${owner.balance.toLocaleString('es-AR')}`)
    }
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
        method: data.appliedToOwnerBalance ? 'owner_balance' : data.method,
        reference: data.reference,
        notes: data.notes,
        appliedToOwnerBalance: data.appliedToOwnerBalance || false,
        ownerId: data.appliedToOwnerBalance ? data.ownerId : null
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

    // Si es un pago aplicado al saldo del propietario, descontar del balance
    if (data.appliedToOwnerBalance && data.ownerId) {
      await tx.owner.update({
        where: { id: data.ownerId },
        data: {
          balance: {
            decrement: data.amount
          }
        }
      })
    }

    // Si es un pago de obligación a favor del propietario (paidBy = 'tenant'), 
    // incrementar el balance del propietario con el ownerAmount proporcional
    if (obligation.paidBy === 'tenant' && obligation.ownerAmount > 0) {
      // Calcular el ownerAmount proporcional al pago
      const paymentRatio = data.amount / obligation.amount
      const ownerAmountForPayment = obligation.ownerAmount * paymentRatio

      // Buscar el propietario de la propiedad
      // Primero intentar con el ID directo, luego con la relación incluida
      const apartment = obligation.contract?.apartment || obligation.apartment
      const ownerId = apartment?.ownerId || 
                      apartment?.owner?.id || 
                      apartment?.building?.ownerId ||
                      (apartment?.building as any)?.ownerRelation?.id
      
      if (ownerId && ownerAmountForPayment > 0) {
        await tx.owner.update({
          where: { id: ownerId },
          data: {
            balance: {
              increment: ownerAmountForPayment
            }
          }
        })
      }
    }

    return payment
  })

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

/**
 * Recalcular el saldo de un propietario basándose en los pagos históricos
 * Esto es útil para corregir saldos que no se actualizaron correctamente
 */
export const recalculateOwnerBalance = async (ownerId: number, userId: number) => {
  // Verificar que el propietario existe y pertenece al usuario
  const owner = await prisma.owner.findFirst({
    where: { id: ownerId, userId }
  })
  if (!owner) {
    throw new Error('Owner not found or access denied')
  }

  // Obtener todas las propiedades del propietario
  const apartments = await prisma.apartment.findMany({
    where: {
      OR: [
        { ownerId },
        { building: { ownerId } }
      ]
    },
    include: {
      building: true
    }
  })

  const apartmentIds = apartments.map(a => a.id)

  // Obtener todos los pagos de obligaciones de tipo alquiler (paidBy = tenant)
  // que corresponden a propiedades de este propietario
  const payments = await prisma.obligationPayment.findMany({
    where: {
      userId,
      obligation: {
        paidBy: 'tenant',
        OR: [
          { apartmentId: { in: apartmentIds } },
          { contract: { apartmentId: { in: apartmentIds } } }
        ]
      }
    },
    include: {
      obligation: true
    }
  })

  // Calcular el total de ownerAmount proporcional a los pagos
  let totalOwnerAmount = 0
  for (const payment of payments) {
    const obligation = payment.obligation
    if (obligation.ownerAmount && obligation.ownerAmount > 0) {
      const paymentRatio = payment.amount / obligation.amount
      totalOwnerAmount += obligation.ownerAmount * paymentRatio
    }
  }

  // Obtener todos los pagos aplicados al saldo del propietario (decrementos)
  const balancePayments = await prisma.obligationPayment.findMany({
    where: {
      userId,
      ownerId,
      appliedToOwnerBalance: true
    }
  })

  const totalDeducted = balancePayments.reduce((sum, p) => sum + p.amount, 0)

  // El saldo final es: ingresos - deducciones
  const newBalance = totalOwnerAmount - totalDeducted

  // Actualizar el saldo del propietario
  await prisma.owner.update({
    where: { id: ownerId },
    data: { balance: newBalance }
  })

  return {
    ownerId,
    ownerName: owner.name,
    previousBalance: owner.balance,
    newBalance,
    totalIncome: totalOwnerAmount,
    totalDeducted,
    paymentsProcessed: payments.length
  }
}

/**
 * Recalcular el saldo de todos los propietarios de un usuario
 */
export const recalculateAllOwnerBalances = async (userId: number) => {
  const owners = await prisma.owner.findMany({
    where: { userId }
  })

  const results = []
  for (const owner of owners) {
    try {
      const result = await recalculateOwnerBalance(owner.id, userId)
      results.push(result)
    } catch (error: any) {
      results.push({
        ownerId: owner.id,
        ownerName: owner.name,
        error: error.message
      })
    }
  }

  return results
}
