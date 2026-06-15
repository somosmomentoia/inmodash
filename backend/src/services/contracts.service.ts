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

export const create = async (data: CreateContractDto, userId: number) => {
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
  
  return await prisma.contract.update({
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
