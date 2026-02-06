import cron from 'node-cron'
import * as recurringObligationsService from '../services/recurring-obligations.service'
import * as obligationsService from '../services/obligations.service'
import { logger } from './logger'

// Ejecutar el primer día de cada mes a las 00:01
export const startRecurringObligationsCron = () => {
  // Formato: minuto hora día mes día-semana
  // '1 0 1 * *' = 00:01 del día 1 de cada mes
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
        logger.error('⚠️ Errores durante la generación:', result.userResults.filter(r => r.error))
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
      
      // Obtener todos los usuarios con contratos activos
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      const users = await prisma.user.findMany({
        where: {
          contracts: {
            some: {
              endDate: {
                gte: new Date()
              }
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

      await prisma.$disconnect()
    } catch (error: any) {
      logger.error('❌ Error en cron de alquileres:', error)
    }
  })

  logger.info('✅ Cron job de alquileres iniciado (ejecuta el día 1 de cada mes a las 00:05)')
}

// Iniciar todos los cron jobs
export const startAllCronJobs = () => {
  startRecurringObligationsCron()
  startRentGenerationCron()
  logger.info('🚀 Todos los cron jobs iniciados')
}
