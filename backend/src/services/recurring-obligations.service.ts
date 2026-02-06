import prisma from '../config/database'
import arglyService from './argly.service'

// Crear una recurrencia
export const create = async (data: {
  userId: number
  contractId?: number
  apartmentId?: number
  type: string
  category?: string
  description: string
  amount: number
  dayOfMonth: number
  startDate: string
  endDate?: string
  notes?: string
}) => {
  // Validar que tenga al menos contractId o apartmentId
  if (!data.contractId && !data.apartmentId) {
    throw new Error('Debe especificar un contrato o una unidad')
  }

  // Validar que el tipo no sea 'rent' (los alquileres se generan automáticamente)
  if (data.type === 'rent') {
    throw new Error('Los alquileres se generan automáticamente, no pueden ser recurrentes manuales')
  }

  // Validar día del mes
  if (data.dayOfMonth < 1 || data.dayOfMonth > 31) {
    throw new Error('El día del mes debe estar entre 1 y 31')
  }

  return await prisma.recurringObligation.create({
    data: {
      userId: data.userId,
      contractId: data.contractId,
      apartmentId: data.apartmentId,
      type: data.type,
      category: data.category,
      description: data.description,
      amount: data.amount,
      dayOfMonth: data.dayOfMonth,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      notes: data.notes,
      isActive: true
    },
    include: {
      contract: {
        include: {
          apartment: true,
          tenant: true
        }
      },
      apartment: {
        include: {
          building: true,
          owner: true
        }
      }
    }
  })
}

// Obtener todas las recurrencias de un usuario
export const getAll = async (userId: number) => {
  return await prisma.recurringObligation.findMany({
    where: { userId },
    include: {
      contract: {
        include: {
          apartment: true,
          tenant: true
        }
      },
      apartment: {
        include: {
          building: true,
          owner: true
        }
      },
      obligations: {
        orderBy: {
          period: 'desc'
        },
        take: 3 // Últimas 3 obligaciones generadas
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

// Obtener una recurrencia por ID
export const getById = async (id: number, userId: number) => {
  const recurring = await prisma.recurringObligation.findFirst({
    where: { id, userId },
    include: {
      contract: {
        include: {
          apartment: true,
          tenant: true
        }
      },
      apartment: {
        include: {
          building: true,
          owner: true
        }
      },
      obligations: {
        orderBy: {
          period: 'desc'
        }
      }
    }
  })

  if (!recurring) {
    throw new Error('Recurrencia no encontrada')
  }

  return recurring
}

// Actualizar una recurrencia
export const update = async (id: number, userId: number, data: {
  description?: string
  amount?: number
  dayOfMonth?: number
  endDate?: string | null
  notes?: string
  isActive?: boolean
}) => {
  // Verificar que existe y pertenece al usuario
  const existing = await prisma.recurringObligation.findFirst({
    where: { id, userId }
  })

  if (!existing) {
    throw new Error('Recurrencia no encontrada')
  }

  // Construir objeto de actualización solo con campos definidos
  const updateData: any = {}
  if (data.description !== undefined) updateData.description = data.description
  if (data.amount !== undefined) updateData.amount = data.amount
  if (data.dayOfMonth !== undefined) updateData.dayOfMonth = data.dayOfMonth
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.isActive !== undefined) updateData.isActive = data.isActive

  return await prisma.recurringObligation.update({
    where: { id },
    data: updateData,
    include: {
      contract: {
        include: {
          apartment: true,
          tenant: true
        }
      },
      apartment: {
        include: {
          building: true,
          owner: true
        }
      }
    }
  })
}

// Eliminar una recurrencia
export const remove = async (id: number, userId: number) => {
  // Verificar que existe y pertenece al usuario
  const existing = await prisma.recurringObligation.findFirst({
    where: { id, userId }
  })

  if (!existing) {
    throw new Error('Recurrencia no encontrada')
  }

  return await prisma.recurringObligation.delete({
    where: { id }
  })
}

// Pausar/Activar una recurrencia
export const toggleActive = async (id: number, userId: number) => {
  const existing = await prisma.recurringObligation.findFirst({
    where: { id, userId }
  })

  if (!existing) {
    throw new Error('Recurrencia no encontrada')
  }

  return await prisma.recurringObligation.update({
    where: { id },
    data: {
      isActive: !existing.isActive
    }
  })
}

// Generar obligaciones desde recurrencias para un mes específico
export const generateForMonth = async (month: string, userId: number) => {
  // Formato esperado: "YYYY-MM"
  const [year, monthNum] = month.split('-').map(Number)
  const periodStart = new Date(year, monthNum - 1, 1)
  const periodEnd = new Date(year, monthNum, 0) // Último día del mes

  // Obtener todas las recurrencias activas del usuario
  const recurrings = await prisma.recurringObligation.findMany({
    where: {
      userId,
      isActive: true,
      startDate: { lte: periodEnd }, // Ya empezó
      OR: [
        { endDate: null }, // Sin fecha de fin
        { endDate: { gte: periodStart } } // No terminó todavía
      ]
    },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              owner: true
            }
          }
        }
      },
      apartment: {
        include: {
          owner: true
        }
      }
    }
  })

  const results = {
    generated: 0,
    skipped: 0,
    errors: [] as string[]
  }

  for (const recurring of recurrings) {
    try {
      // Verificar si ya se generó para este mes
      if (recurring.lastGenerated) {
        const lastGen = new Date(recurring.lastGenerated)
        if (lastGen.getFullYear() === year && lastGen.getMonth() === monthNum - 1) {
          results.skipped++
          continue
        }
      }

      // Calcular fecha de vencimiento
      let dueDay = recurring.dayOfMonth
      const lastDayOfMonth = new Date(year, monthNum, 0).getDate()
      if (dueDay > lastDayOfMonth) {
        dueDay = lastDayOfMonth // Ajustar si el mes tiene menos días
      }
      const dueDate = new Date(year, monthNum - 1, dueDay)

      // Verificar si ya existe una obligación para este período
      const existing = await prisma.obligation.findFirst({
        where: {
          userId,
          recurringObligationId: recurring.id,
          period: periodStart
        }
      })

      if (existing) {
        results.skipped++
        continue
      }

      // Determinar el monto a usar (puede estar actualizado por índice)
      let amountToUse = recurring.currentAmount || recurring.amount
      let updateApplied = false
      let updateDetails: { coefficient?: number; percentageIncrease?: number; newIndexValue?: number } = {}

      // Verificar si corresponde aplicar actualización por índice
      if (recurring.type === 'rent' && recurring.updateIndexType && recurring.updateIndexType !== 'none' && recurring.updateFrequencyMonths) {
        const periodsSinceUpdate = (recurring.periodsSinceUpdate || 0) + 1
        
        // Si llegamos al período de actualización
        if (periodsSinceUpdate >= recurring.updateFrequencyMonths) {
          try {
            if (recurring.updateIndexType === 'fixed' && recurring.fixedUpdateCoefficient) {
              // Actualización por coeficiente fijo
              amountToUse = Math.round(amountToUse * recurring.fixedUpdateCoefficient)
              updateApplied = true
              updateDetails = { coefficient: recurring.fixedUpdateCoefficient, percentageIncrease: (recurring.fixedUpdateCoefficient - 1) * 100 }
            } else if ((recurring.updateIndexType === 'icl' || recurring.updateIndexType === 'ipc') && recurring.initialIndexValue) {
              // Actualización por índice ICL o IPC
              const currentIndex = await arglyService.getIndex(recurring.updateIndexType as 'icl' | 'ipc')
              const result = arglyService.calculateUpdatedAmount(
                recurring.amount, // Siempre calcular desde el monto base
                recurring.initialIndexValue,
                currentIndex.value
              )
              amountToUse = result.newAmount
              updateApplied = true
              updateDetails = { 
                coefficient: result.coefficient, 
                percentageIncrease: result.percentageIncrease,
                newIndexValue: currentIndex.value
              }
            }
          } catch (error) {
            console.error(`Error al obtener índice para recurrencia ${recurring.id}:`, error)
            // Continuar sin actualizar si hay error
          }
        }
      }

      // Calcular comisiones e impactos para alquileres
      let commissionAmount = 0
      let ownerAmount = amountToUse
      let ownerImpact = 0
      let agencyImpact = 0

      if (recurring.type === 'rent') {
        // Calcular comisión
        if (recurring.commissionType === 'percentage' && recurring.commissionValue) {
          commissionAmount = amountToUse * (recurring.commissionValue / 100)
        } else if (recurring.commissionType === 'fixed' && recurring.commissionValue) {
          commissionAmount = recurring.commissionValue
        }
        ownerAmount = amountToUse - commissionAmount
        
        // Impactos: el propietario recibe ownerAmount, la inmobiliaria recibe commissionAmount
        ownerImpact = ownerAmount
        agencyImpact = commissionAmount
      }

      // Construir descripción con info de actualización si aplica
      let description = recurring.description
      if (updateApplied && updateDetails.percentageIncrease) {
        description = `${recurring.description} (Actualizado ${updateDetails.percentageIncrease.toFixed(1)}% por ${recurring.updateIndexType?.toUpperCase()})`
      }

      // Crear la obligación
      await prisma.obligation.create({
        data: {
          userId,
          contractId: recurring.contractId,
          apartmentId: recurring.apartmentId,
          recurringObligationId: recurring.id,
          type: recurring.type,
          category: recurring.category,
          description,
          period: periodStart,
          dueDate,
          amount: amountToUse,
          paidBy: recurring.paidBy || 'tenant',
          commissionAmount,
          ownerAmount,
          ownerImpact,
          agencyImpact,
          isAutoGenerated: true,
          notes: updateApplied 
            ? `${recurring.notes || ''}\nActualización aplicada: ${JSON.stringify(updateDetails)}`
            : recurring.notes
        }
      })

      // Actualizar lastGenerated y datos de actualización
      const updateData: Record<string, unknown> = { lastGenerated: periodStart }
      
      if (recurring.updateFrequencyMonths) {
        if (updateApplied) {
          // Resetear contador y guardar nuevo monto
          updateData.periodsSinceUpdate = 0
          updateData.currentAmount = amountToUse
          updateData.lastUpdateApplied = periodStart
        } else {
          // Incrementar contador
          updateData.periodsSinceUpdate = (recurring.periodsSinceUpdate || 0) + 1
        }
      }

      await prisma.recurringObligation.update({
        where: { id: recurring.id },
        data: updateData
      })

      results.generated++
    } catch (error: any) {
      results.errors.push(`Error en recurrencia ${recurring.id}: ${error.message}`)
    }
  }

  return results
}

// Generar obligaciones pendientes (para cron job)
// Genera para el mes actual si aún no se generó
export const generatePending = async () => {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Obtener todos los usuarios con recurrencias activas
  const users = await prisma.user.findMany({
    where: {
      recurringObligations: {
        some: {
          isActive: true
        }
      }
    },
    select: { id: true }
  })

  const allResults = {
    totalGenerated: 0,
    totalSkipped: 0,
    totalErrors: 0,
    userResults: [] as any[]
  }

  for (const user of users) {
    try {
      const result = await generateForMonth(currentMonth, user.id)
      allResults.totalGenerated += result.generated
      allResults.totalSkipped += result.skipped
      allResults.totalErrors += result.errors.length
      allResults.userResults.push({
        userId: user.id,
        ...result
      })
    } catch (error: any) {
      allResults.totalErrors++
      allResults.userResults.push({
        userId: user.id,
        error: error.message
      })
    }
  }

  return allResults
}
