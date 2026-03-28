import cron from 'node-cron'
import prisma from '../config/database'
import * as recurringObligationsService from '../services/recurring-obligations.service'
import * as obligationsService from '../services/obligations.service'
import { logger } from './logger'

// Helper: get array of months between two dates (inclusive) as "YYYY-MM" strings
const getMonthRange = (from: Date, to: Date): string[] => {
  const months: string[] = []
  const current = new Date(from.getFullYear(), from.getMonth(), 1)
  const end = new Date(to.getFullYear(), to.getMonth(), 1)
  while (current <= end) {
    months.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`)
    current.setMonth(current.getMonth() + 1)
  }
  return months
}

// Catch-up: generate all missing months from the earliest active recurrence up to now
const runCatchUp = async () => {
  logger.info('🔄 [Catch-up] Verificando meses pendientes de generación...')

  try {
    // Find all users with active recurring obligations
    const users = await prisma.user.findMany({
      where: {
        recurringObligations: {
          some: { isActive: true }
        }
      },
      select: {
        id: true,
        recurringObligations: {
          where: { isActive: true },
          select: { startDate: true, lastGenerated: true }
        }
      }
    })

    const now = new Date()
    let totalGenerated = 0
    let totalSkipped = 0

    for (const user of users) {
      // Find the earliest month that might need generation
      let earliest: Date | null = null
      for (const ro of user.recurringObligations) {
        const start = ro.lastGenerated
          ? new Date(new Date(ro.lastGenerated).getFullYear(), new Date(ro.lastGenerated).getMonth() + 1, 1)
          : new Date(ro.startDate)
        if (!earliest || start < earliest) {
          earliest = start
        }
      }

      if (!earliest) continue

      const months = getMonthRange(earliest, now)
      for (const month of months) {
        try {
          const result = await recurringObligationsService.generateForMonth(month, user.id)
          totalGenerated += result.generated
          totalSkipped += result.skipped
        } catch (error: any) {
          logger.error(`[Catch-up] Error generando mes ${month} para usuario ${user.id}:`, error.message)
        }
      }
    }

    // Also catch-up rent generation (obligations from contracts)
    const usersWithContracts = await prisma.user.findMany({
      where: {
        contracts: {
          some: {
            endDate: { gte: now }
          }
        }
      },
      select: { id: true }
    })

    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    for (const user of usersWithContracts) {
      try {
        const result = await obligationsService.generateObligations(currentMonth, user.id)
        totalGenerated += result.generated
        totalSkipped += result.skipped
      } catch (error: any) {
        logger.error(`[Catch-up] Error generando alquileres para usuario ${user.id}:`, error.message)
      }
    }

    logger.info(`✅ [Catch-up] Completado: ${totalGenerated} generadas, ${totalSkipped} omitidas`)
  } catch (error: any) {
    logger.error('❌ [Catch-up] Error:', error.message)
  }
}

// Ejecutar el primer día de cada mes a las 00:01
export const startRecurringObligationsCron = () => {
  cron.schedule('1 0 1 * *', async () => {
    logger.info('🔄 Iniciando generación automática de obligaciones recurrentes...')
    
    try {
      const result = await recurringObligationsService.generatePending()
      
      logger.info('✅ Generación automática completada:', {
        totalGenerated: result.totalGenerated,
        totalSkipped: result.totalSkipped,
        totalErrors: result.totalErrors
      })

      if (result.totalErrors > 0) {
        logger.error('⚠️ Errores durante la generación:', result.userResults.filter((r: any) => r.error))
      }
    } catch (error: any) {
      logger.error('❌ Error en cron de recurrencias:', error)
    }
  })

  logger.info('✅ Cron job de recurrencias iniciado (ejecuta el día 1 de cada mes a las 00:01)')
}

// Ejecutar generación de alquileres el primer día de cada mes a las 00:05
export const startRentGenerationCron = () => {
  cron.schedule('5 0 1 * *', async () => {
    logger.info('🔄 Iniciando generación automática de alquileres...')
    
    try {
      const now = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      
      const users = await prisma.user.findMany({
        where: {
          contracts: {
            some: {
              endDate: { gte: new Date() }
            }
          }
        },
        select: { id: true }
      })

      let totalGenerated = 0
      let totalSkipped = 0
      let totalErrors = 0

      for (const user of users) {
        try {
          const result = await obligationsService.generateObligations(month, user.id)
          totalGenerated += result.generated
          totalSkipped += result.skipped
          totalErrors += result.errors.length
        } catch (error: any) {
          totalErrors++
          logger.error(`Error generando alquileres para usuario ${user.id}:`, error)
        }
      }

      logger.info('✅ Generación automática de alquileres completada:', {
        totalGenerated,
        totalSkipped,
        totalErrors
      })
    } catch (error: any) {
      logger.error('❌ Error en cron de alquileres:', error)
    }
  })

  logger.info('✅ Cron job de alquileres iniciado (ejecuta el día 1 de cada mes a las 00:05)')
}

// Iniciar todos los cron jobs + catch-up de meses perdidos
export const startAllCronJobs = () => {
  startRecurringObligationsCron()
  startRentGenerationCron()
  logger.info('🚀 Todos los cron jobs iniciados')

  // Run catch-up after 10 seconds to ensure DB is ready
  setTimeout(() => {
    runCatchUp()
  }, 10000)
}
