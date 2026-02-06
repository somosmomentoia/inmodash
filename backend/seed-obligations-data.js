const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Script para poblar la base de datos con datos realistas de obligaciones
 * Simula una inmobiliaria con 3 meses de operación
 */

async function main() {
  console.log('🌱 Iniciando seed de datos de obligaciones...\n')

  // Obtener el primer usuario (inmobiliaria)
  const user = await prisma.user.findFirst()
  if (!user) {
    console.error('❌ No se encontró ningún usuario. Crea un usuario primero.')
    return
  }

  console.log(`✅ Usuario encontrado: ${user.email}`)

  // Obtener contratos activos
  const contracts = await prisma.contract.findMany({
    where: { userId: user.id },
    include: {
      tenant: true,
      apartment: true
    }
  })

  if (contracts.length === 0) {
    console.error('❌ No se encontraron contratos. Crea contratos primero.')
    return
  }

  console.log(`✅ ${contracts.length} contratos encontrados\n`)

  // Limpiar obligaciones y pagos existentes (opcional)
  console.log('🧹 Limpiando datos existentes...')
  await prisma.obligationPayment.deleteMany({ where: { userId: user.id } })
  await prisma.obligation.deleteMany({ where: { userId: user.id } })
  console.log('✅ Datos limpiados\n')

  // Generar obligaciones para los últimos 3 meses
  const today = new Date()
  const obligationsCreated = []
  const paymentsCreated = []

  for (const contract of contracts) {
    console.log(`\n📋 Procesando contrato: ${contract.tenant.nameOrBusiness}`)
    
    // Generar obligaciones de alquiler para los últimos 3 meses
    for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
      const period = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1)
      const dueDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 10)
      
      // Monto base del alquiler
      const rentAmount = contract.initialAmount
      
      // Calcular comisión (asumiendo 10% por defecto)
      const commissionAmount = rentAmount * 0.10
      const ownerAmount = rentAmount - commissionAmount

      // Crear obligación de alquiler
      const rentObligation = await prisma.obligation.create({
        data: {
          userId: user.id,
          contractId: contract.id,
          apartmentId: contract.apartmentId,
          type: 'rent',
          description: `Alquiler ${period.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`,
          amount: rentAmount,
          paidAmount: 0,
          period: period,
          dueDate: dueDate,
          status: 'pending',
          commissionAmount: commissionAmount,
          ownerAmount: ownerAmount
        }
      })

      obligationsCreated.push(rentObligation)
      console.log(`  ✅ Alquiler creado: $${rentAmount.toLocaleString('es-AR')} - Vence: ${dueDate.toLocaleDateString('es-AR')}`)

      // Determinar si se pagó (80% de probabilidad para meses anteriores, 40% para mes actual)
      const isPaid = monthsAgo > 0 ? Math.random() > 0.2 : Math.random() > 0.6
      
      if (isPaid) {
        // Determinar si fue pago completo o parcial
        const isPartial = Math.random() > 0.85 // 15% de pagos parciales
        
        if (isPartial) {
          // Pago parcial en 2 cuotas
          const firstPaymentAmount = rentAmount * 0.6
          const secondPaymentAmount = rentAmount * 0.4
          
          const firstPaymentDate = new Date(dueDate)
          firstPaymentDate.setDate(firstPaymentDate.getDate() + Math.floor(Math.random() * 5))
          
          const payment1 = await prisma.obligationPayment.create({
            data: {
              userId: user.id,
              obligationId: rentObligation.id,
              amount: firstPaymentAmount,
              paymentDate: firstPaymentDate,
              method: ['transfer', 'cash'][Math.floor(Math.random() * 2)],
              reference: `TRF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              notes: 'Pago parcial 1/2'
            }
          })
          paymentsCreated.push(payment1)

          const secondPaymentDate = new Date(firstPaymentDate)
          secondPaymentDate.setDate(secondPaymentDate.getDate() + Math.floor(Math.random() * 10) + 5)
          
          const payment2 = await prisma.obligationPayment.create({
            data: {
              userId: user.id,
              obligationId: rentObligation.id,
              amount: secondPaymentAmount,
              paymentDate: secondPaymentDate,
              method: ['transfer', 'cash'][Math.floor(Math.random() * 2)],
              reference: `TRF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              notes: 'Pago parcial 2/2 - Completado'
            }
          })
          paymentsCreated.push(payment2)

          // Actualizar obligación
          await prisma.obligation.update({
            where: { id: rentObligation.id },
            data: {
              paidAmount: rentAmount,
              status: 'paid'
            }
          })

          console.log(`    💰 Pagado en 2 cuotas: $${firstPaymentAmount.toLocaleString('es-AR')} + $${secondPaymentAmount.toLocaleString('es-AR')}`)
        } else {
          // Pago completo
          const paymentDate = new Date(dueDate)
          paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 15) - 5) // ±5 días del vencimiento
          
          const payment = await prisma.obligationPayment.create({
            data: {
              userId: user.id,
              obligationId: rentObligation.id,
              amount: rentAmount,
              paymentDate: paymentDate,
              method: ['transfer', 'cash', 'check'][Math.floor(Math.random() * 3)],
              reference: `TRF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              notes: 'Pago completo del alquiler'
            }
          })
          paymentsCreated.push(payment)

          // Actualizar obligación
          await prisma.obligation.update({
            where: { id: rentObligation.id },
            data: {
              paidAmount: rentAmount,
              status: 'paid'
            }
          })

          console.log(`    💰 Pagado completo: $${rentAmount.toLocaleString('es-AR')}`)
        }
      } else {
        console.log(`    ⏳ Pendiente de pago`)
      }

      // Agregar expensas (70% de probabilidad)
      if (Math.random() > 0.3) {
        const expensesAmount = Math.floor(Math.random() * 30000) + 15000 // Entre $15k y $45k
        const expensesDueDate = new Date(dueDate)
        expensesDueDate.setDate(expensesDueDate.getDate() + 5)

        const expensesObligation = await prisma.obligation.create({
          data: {
            userId: user.id,
            contractId: contract.id,
            apartmentId: contract.apartmentId,
            type: 'expenses',
            description: `Expensas ${period.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`,
            amount: expensesAmount,
            paidAmount: 0,
            period: period,
            dueDate: expensesDueDate,
            status: 'pending',
            commissionAmount: 0,
            ownerAmount: 0
          }
        })

        obligationsCreated.push(expensesObligation)
        console.log(`  ✅ Expensas creadas: $${expensesAmount.toLocaleString('es-AR')}`)

        // 75% de probabilidad de pago para meses anteriores
        if (monthsAgo > 0 && Math.random() > 0.25) {
          const paymentDate = new Date(expensesDueDate)
          paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 10))
          
          const payment = await prisma.obligationPayment.create({
            data: {
              userId: user.id,
              obligationId: expensesObligation.id,
              amount: expensesAmount,
              paymentDate: paymentDate,
              method: ['transfer', 'cash'][Math.floor(Math.random() * 2)],
              reference: `EXP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
            }
          })
          paymentsCreated.push(payment)

          await prisma.obligation.update({
            where: { id: expensesObligation.id },
            data: {
              paidAmount: expensesAmount,
              status: 'paid'
            }
          })

          console.log(`    💰 Expensas pagadas: $${expensesAmount.toLocaleString('es-AR')}`)
        }
      }
    }

    // Agregar algunas obligaciones especiales (servicios, mantenimiento, etc.)
    if (Math.random() > 0.6) {
      const serviceTypes = [
        { type: 'service', desc: 'Servicio de limpieza', amount: 25000 },
        { type: 'maintenance', desc: 'Reparación de plomería', amount: 45000 },
        { type: 'service', desc: 'Fumigación', amount: 18000 },
        { type: 'maintenance', desc: 'Pintura de paredes', amount: 120000 }
      ]

      const service = serviceTypes[Math.floor(Math.random() * serviceTypes.length)]
      const serviceDueDate = new Date(today)
      serviceDueDate.setDate(serviceDueDate.getDate() + Math.floor(Math.random() * 30))

      const serviceObligation = await prisma.obligation.create({
        data: {
          userId: user.id,
          contractId: contract.id,
          apartmentId: contract.apartmentId,
          type: service.type,
          description: service.desc,
          amount: service.amount,
          paidAmount: 0,
          period: today,
          dueDate: serviceDueDate,
          status: 'pending',
          commissionAmount: 0,
          ownerAmount: 0,
          notes: 'Servicio adicional solicitado'
        }
      })

      obligationsCreated.push(serviceObligation)
      console.log(`  ✅ ${service.desc}: $${service.amount.toLocaleString('es-AR')}`)

      // 50% pagado
      if (Math.random() > 0.5) {
        const paymentDate = new Date(serviceDueDate)
        paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 5))
        
        const payment = await prisma.obligationPayment.create({
          data: {
            userId: user.id,
            obligationId: serviceObligation.id,
            amount: service.amount,
            paymentDate: paymentDate,
            method: 'transfer',
            reference: `SRV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
          }
        })
        paymentsCreated.push(payment)

        await prisma.obligation.update({
          where: { id: serviceObligation.id },
          data: {
            paidAmount: service.amount,
            status: 'paid'
          }
        })

        console.log(`    💰 Servicio pagado`)
      }
    }
  }

  // Actualizar estados de obligaciones vencidas
  const overdueObligations = await prisma.obligation.updateMany({
    where: {
      userId: user.id,
      status: 'pending',
      dueDate: {
        lt: today
      }
    },
    data: {
      status: 'overdue'
    }
  })

  console.log(`\n✅ ${overdueObligations.count} obligaciones marcadas como vencidas`)

  // Resumen final
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN DEL SEED')
  console.log('='.repeat(60))
  console.log(`✅ Obligaciones creadas: ${obligationsCreated.length}`)
  console.log(`💰 Pagos registrados: ${paymentsCreated.length}`)
  
  const totalObligations = obligationsCreated.reduce((sum, o) => sum + o.amount, 0)
  const totalPayments = paymentsCreated.reduce((sum, p) => sum + p.amount, 0)
  
  console.log(`💵 Total en obligaciones: $${totalObligations.toLocaleString('es-AR')}`)
  console.log(`💵 Total pagado: $${totalPayments.toLocaleString('es-AR')}`)
  console.log(`💵 Pendiente de cobro: $${(totalObligations - totalPayments).toLocaleString('es-AR')}`)
  console.log('='.repeat(60))
  console.log('\n🎉 Seed completado exitosamente!\n')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
