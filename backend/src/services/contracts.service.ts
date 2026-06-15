import prisma from '../config/database'
import { CreateContractDto, UpdateContractDto } from '../types'
import * as recurringObligationsService from './recurring-obligations.service'

export const getAll = async (userId: number) => {
  return await prisma.contract.findMany({
    where: { userId },
    include: {
      apartment: {
        include: {
          building: true
        }
      },
      tenant: true,
      updateRule: {
        include: {
          updatePeriods: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export const getById = async (id: number, userId: number) => {
  return await prisma.contract.findFirst({
    where: { id, userId },
    include: {
      apartment: {
        include: {
          building: true
        }
      },
      tenant: true,
      updateRule: {
        include: {
          updatePeriods: true
        }
      },
      guarantors: {
        include: {
          guarantor: true
        }
      },
      vendor: true,
    }
  })
}

export const getByApartmentId = async (apartmentId: number, userId: number) => {
  return await prisma.contract.findMany({
    where: { apartmentId, userId },
    include: {
      tenant: true,
      updateRule: {
        include: {
          updatePeriods: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export const getByTenantId = async (tenantId: number, userId: number) => {
  return await prisma.contract.findMany({
    where: { tenantId, userId },
    include: {
      apartment: {
        include: {
          building: true
        }
      },
      updateRule: {
        include: {
          updatePeriods: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const MIN_CONTRACT_MONTHS = 3

/**
 * Calculate the number of full months between two dates.
 */
function monthsBetween(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
}

/**
 * Map updateFrequency string to months.
 */
function frequencyToMonths(freq: string): number {
  const map: Record<string, number> = {
    mensual: 1,
    bimestral: 2,
    trimestral: 3,
    cuatrimestral: 4,
    semestral: 6,
    anual: 12,
  }
  return map[freq] || 1
}

/**
 * Validate contract duration and update frequency coherence.
 * Throws descriptive errors if validation fails.
 */
function validateContractDurationAndUpdates(
  startDate: Date,
  endDate: Date,
  updateFrequencyMonths?: number | null,
  updateFrequencyLegacy?: string | null
) {
  const durationMonths = monthsBetween(startDate, endDate)

  // V1: Minimum duration
  if (durationMonths < MIN_CONTRACT_MONTHS) {
    throw new Error(
      `La duración mínima de un contrato es de ${MIN_CONTRACT_MONTHS} meses. ` +
      `El contrato indicado dura ${durationMonths} mes(es).`
    )
  }

  // V2: Update frequency must not exceed contract duration
  const effectiveFreq = updateFrequencyMonths || (updateFrequencyLegacy ? frequencyToMonths(updateFrequencyLegacy) : null)
  if (effectiveFreq && effectiveFreq > durationMonths) {
    throw new Error(
      `La frecuencia de actualización (${effectiveFreq} meses) supera la duración del contrato (${durationMonths} meses). ` +
      `Ajuste la frecuencia de actualización o extienda la duración del contrato.`
    )
  }
}

// ============================================================================
// CONTRACT CRUD
// ============================================================================

export const create = async (data: CreateContractDto, userId: number) => {
  // Validate contract duration and update coherence
  const startDate = new Date(data.startDate)
  const endDate = new Date(data.endDate)
  validateContractDurationAndUpdates(
    startDate,
    endDate,
    data.updateFrequencyMonths,
    data.updateRule?.updateFrequency
  )

  // Crear contrato con update rule y períodos
  const contract = await prisma.contract.create({
    data: {
      userId,
      apartmentId: data.apartmentId,
      tenantId: data.tenantId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      initialAmount: data.initialAmount,
      // Comisión de la inmobiliaria
      commissionType: data.commissionType || null,
      commissionValue: data.commissionValue || null,
      // Vendedor y comisiones contractuales
      vendorId: data.vendorId || null,
      vendorCommissionPct: data.vendorCommissionPct || null,
      signupFeeAmount: data.signupFeeAmount || null,
      contractExpenses: data.contractExpenses || null,
      updateRule: {
        create: {
          updateFrequency: data.updateRule.updateFrequency,
          monthlyCoefficient: data.updateRule.monthlyCoefficient,
          lateInterestPercent: data.updateRule.lateInterest?.percent,
          lateInterestFrequency: data.updateRule.lateInterest?.frequency,
          updatePeriods: {
            create: data.updateRule.updatePeriods.map((period) => ({
              date: new Date(period.date),
              type: period.type,
              value: period.value,
              indexName: period.indexName
            }))
          }
        }
      },
      guarantors: {
        create: data.guarantorIds.map((guarantorId) => ({
          guarantorId
        }))
      }
    },
    include: {
      updateRule: {
        include: {
          updatePeriods: true
        }
      },
      guarantors: true
    }
  })

  // Actualizar estado del departamento a "alquilado"
  await prisma.apartment.update({
    where: { id: data.apartmentId },
    data: { status: 'alquilado' }
  })

  // Crear entrada en historial de alquileres
  const tenant = await prisma.tenant.findUnique({
    where: { id: data.tenantId }
  })

  await prisma.rentalHistory.create({
    data: {
      apartmentId: data.apartmentId,
      contractId: contract.id,
      tenantId: data.tenantId,
      tenantName: tenant?.nameOrBusiness || '',
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      initialAmount: data.initialAmount
    }
  })

  // Crear RecurringObligation de alquiler automáticamente
  const startDate = new Date(data.startDate)
  const endDate = new Date(data.endDate)
  
  // Obtener el apartamento para la descripción
  const apartment = await prisma.apartment.findUnique({
    where: { id: data.apartmentId },
    include: { building: true }
  })
  
  const propertyName = apartment?.building 
    ? `${apartment.building.name} - ${apartment.nomenclature}`
    : apartment?.nomenclature || 'Propiedad'

  await prisma.recurringObligation.create({
    data: {
      userId,
      contractId: contract.id,
      apartmentId: data.apartmentId,
      type: 'rent',
      description: `Alquiler ${propertyName}`,
      amount: data.initialAmount,
      dayOfMonth: startDate.getDate(), // Día de vencimiento = día de inicio del contrato
      startDate: startDate,
      endDate: endDate,
      isActive: true,
      paidBy: 'tenant',
      commissionType: data.commissionType || null,
      commissionValue: data.commissionValue || null,
      // Configuración de actualización por índice (ICL/IPC)
      updateIndexType: data.updateIndexType || null,
      updateFrequencyMonths: data.updateFrequencyMonths || null,
      initialIndexValue: data.initialIndexValue || null,
      initialIndexDate: data.initialIndexValue ? new Date() : null,
      fixedUpdateCoefficient: data.fixedUpdateCoefficient || null,
      currentAmount: data.initialAmount, // Monto actual = monto inicial
      periodsSinceUpdate: 0,
      notes: `Generado automáticamente al crear contrato`
    }
  })

  // Auto-generar la obligación del primer mes del contrato
  try {
    const firstMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`
    await recurringObligationsService.generateForMonth(firstMonth, userId)
  } catch (error) {
    console.error('Error auto-generating first month obligation:', error)
  }

  // Crear obligations contractuales automáticas (no se pagan acá, solo se definen)
  const contractPeriod = new Date(startDate.getFullYear(), startDate.getMonth(), 1)

  // Comisión de alta (income_other para la inmobiliaria, chargeTo=tenant)
  if (data.signupFeeAmount && data.signupFeeAmount > 0) {
    try {
      await prisma.obligation.create({
        data: {
          userId,
          contractId: contract.id,
          apartmentId: data.apartmentId,
          type: 'income_other',
          category: 'signup_fee',
          description: `Comisión de alta - ${propertyName}`,
          period: contractPeriod,
          dueDate: startDate,
          amount: data.signupFeeAmount,
          paidBy: 'tenant',
          chargeTo: 'tenant',
          origin: 'contract_auto',
          ownerImpact: 0,
          agencyImpact: data.signupFeeAmount,
          isAutoGenerated: true,
          notes: `Generado automáticamente al crear contrato #${contract.id}`
        }
      })
    } catch (error) {
      console.error('Error creating signup fee obligation:', error)
    }
  }

  // Gastos de contrato (income_other para la inmobiliaria, chargeTo=tenant)
  if (data.contractExpenses && data.contractExpenses > 0) {
    try {
      await prisma.obligation.create({
        data: {
          userId,
          contractId: contract.id,
          apartmentId: data.apartmentId,
          type: 'income_other',
          category: 'contract_expenses',
          description: `Gastos de contrato - ${propertyName}`,
          period: contractPeriod,
          dueDate: startDate,
          amount: data.contractExpenses,
          paidBy: 'tenant',
          chargeTo: 'tenant',
          origin: 'contract_auto',
          ownerImpact: 0,
          agencyImpact: data.contractExpenses,
          isAutoGenerated: true,
          notes: `Generado automáticamente al crear contrato #${contract.id}`
        }
      })
    } catch (error) {
      console.error('Error creating contract expenses obligation:', error)
    }
  }

  // Crear VendorCommission pendiente si hay vendedor y comisión
  if (data.vendorId) {
    // Calcular monto: usar vendorCommissionAmount (fijo) o vendorCommissionPct (% sobre comisión de alta)
    let vendorCommissionAmount = 0
    let commissionNotes = ''

    if (data.vendorCommissionAmount && data.vendorCommissionAmount > 0) {
      vendorCommissionAmount = data.vendorCommissionAmount
      commissionNotes = `Comisión fija: $${vendorCommissionAmount}`
    } else if (data.vendorCommissionPct && data.signupFeeAmount) {
      vendorCommissionAmount = data.signupFeeAmount * (data.vendorCommissionPct / 100)
      commissionNotes = `${data.vendorCommissionPct}% de comisión de alta ($${data.signupFeeAmount})`
    }

    if (vendorCommissionAmount > 0) {
      try {
        await prisma.vendorCommission.create({
          data: {
            userId,
            vendorId: data.vendorId,
            contractId: contract.id,
            amount: vendorCommissionAmount,
            status: 'pending',
            notes: commissionNotes
          }
        })
      } catch (error) {
        console.error('Error creating vendor commission:', error)
      }
    }
  }

  return await getById(contract.id, userId)
}

export const update = async (id: number, data: UpdateContractDto, userId: number) => {
  const contract = await getById(id, userId)
  if (!contract) {
    throw new Error('Contract not found or access denied')
  }

  // Resolve effective dates for validation
  const effectiveStart = data.startDate ? new Date(data.startDate) : new Date(contract.startDate)
  const effectiveEnd = data.endDate ? new Date(data.endDate) : new Date(contract.endDate)

  // Validate duration if dates are being changed
  if (data.startDate || data.endDate) {
    validateContractDurationAndUpdates(effectiveStart, effectiveEnd)
  }

  const updateData: Record<string, unknown> = {}

  // Campos básicos
  if (data.startDate) updateData.startDate = new Date(data.startDate)
  if (data.endDate) updateData.endDate = new Date(data.endDate)
  if (data.initialAmount !== undefined) updateData.initialAmount = data.initialAmount

  // Entidades asociadas
  if (data.tenantId !== undefined) updateData.tenantId = data.tenantId
  if (data.apartmentId !== undefined) updateData.apartmentId = data.apartmentId

  // Comisión de la inmobiliaria
  if (data.commissionType !== undefined) updateData.commissionType = data.commissionType
  if (data.commissionValue !== undefined) updateData.commissionValue = data.commissionValue

  // Vendedor y comisiones contractuales
  if (data.vendorId !== undefined) updateData.vendorId = data.vendorId
  if (data.vendorCommissionPct !== undefined) updateData.vendorCommissionPct = data.vendorCommissionPct
  if (data.signupFeeAmount !== undefined) updateData.signupFeeAmount = data.signupFeeAmount
  if (data.contractExpenses !== undefined) updateData.contractExpenses = data.contractExpenses

  // Update contract
  const updatedContract = await prisma.contract.update({
    where: { id },
    data: updateData,
    include: {
      apartment: true,
      tenant: true,
      vendor: true,
      updateRule: {
        include: {
          updatePeriods: true
        }
      }
    }
  })

  // Fix #6: Propagate relevant changes to the associated RecurringObligation (rent)
  const recurringUpdateData: Record<string, unknown> = {}
  let shouldUpdateRecurring = false

  if (data.initialAmount !== undefined) {
    recurringUpdateData.amount = data.initialAmount
    recurringUpdateData.currentAmount = data.initialAmount
    shouldUpdateRecurring = true
  }
  if (data.commissionType !== undefined) {
    recurringUpdateData.commissionType = data.commissionType
    shouldUpdateRecurring = true
  }
  if (data.commissionValue !== undefined) {
    recurringUpdateData.commissionValue = data.commissionValue
    shouldUpdateRecurring = true
  }
  if (data.apartmentId !== undefined) {
    recurringUpdateData.apartmentId = data.apartmentId
    shouldUpdateRecurring = true
  }
  if (data.endDate) {
    recurringUpdateData.endDate = new Date(data.endDate)
    shouldUpdateRecurring = true
  }
  if (data.startDate) {
    recurringUpdateData.startDate = new Date(data.startDate)
    recurringUpdateData.dayOfMonth = new Date(data.startDate).getDate()
    shouldUpdateRecurring = true
  }

  if (shouldUpdateRecurring) {
    try {
      await prisma.recurringObligation.updateMany({
        where: {
          contractId: id,
          type: 'rent',
          userId
        },
        data: recurringUpdateData
      })
    } catch (error) {
      console.error('Error syncing RecurringObligation after contract update:', error)
    }
  }

  return updatedContract
}

export const remove = async (id: number, userId: number) => {
  const contract = await getById(id, userId)

  if (!contract) {
    throw new Error('Contract not found or access denied')
  }

  // Eliminar del historial de alquileres
  await prisma.rentalHistory.deleteMany({
    where: { contractId: id }
  })

  // Eliminar recurrencias asociadas al contrato (esto también eliminará obligaciones por cascade)
  await prisma.recurringObligation.deleteMany({
    where: { contractId: id }
  })

  // Eliminar contrato (cascade eliminará updateRule y períodos)
  await prisma.contract.delete({
    where: { id }
  })

  // Actualizar estado del departamento a "disponible"
  await prisma.apartment.update({
    where: { id: contract.apartmentId },
    data: { status: 'disponible' }
  })
}

export const updateDocument = async (id: number, filename: string, userId: number) => {
  const contract = await getById(id, userId)

  if (!contract) {
    throw new Error('Contract not found or access denied')
  }

  return await prisma.contract.update({
    where: { id },
    data: {
      contractDocumentPath: filename
    },
    include: {
      apartment: {
        include: {
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
}
