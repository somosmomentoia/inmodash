const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Script para poblar la base de datos con datos completos para probar reportes
 * Agrega más obligaciones con diferentes tipos, estados y distribuciones
 */

async function main() {
  console.log('🌱 Iniciando seed de datos para reportes...\n')

  const user = await prisma.user.findFirst()
  if (!user) {
    console.error('❌ No se encontró ningún usuario.')
    return
  }

  console.log(`✅ Usuario: ${user.email}\n`)

  // Obtener datos existentes
  const owners = await prisma.owner.findMany({ where: { userId: user.id } })
  const apartments = await prisma.apartment.findMany({ where: { userId: user.id } })
  const contracts = await prisma.contract.findMany({ where: { userId: user.id } })

  if (contracts.length === 0) {
    console.log('❌ No hay contratos. Ejecuta seed-complete-data.js primero.')
    return
  }

  console.log(`📊 Datos existentes:`)
  console.log(`   - Propietarios: ${owners.length}`)
  console.log(`   - Propiedades: ${apartments.length}`)
  console.log(`   - Contratos: ${contracts.length}\n`)

  // Usar comisión fija del 8%
  const commissionRate = 8
  console.log(`📝 Usando comisión fija: ${commissionRate}%\n`)

  // Crear obligaciones históricas (últimos 12 meses)
  console.log('📝 Creando obligaciones históricas (12 meses)...\n')
  const today = new Date()
  let totalObligations = 0
  let totalPayments = 0

  for (const contract of contracts) {
    const apartment = apartments.find(a => a.id === contract.apartmentId)
    const owner = owners.find(o => o.id === apartment?.ownerId)
    
    if (!apartment || !owner) continue

    const ownerCommission = commissionRate
    console.log(`📋 Contrato #${contract.id} - ${apartment.nomenclature}`)

    // Generar 12 meses de obligaciones
    for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
      const period = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1)
      const dueDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 10)
      
      // Verificar si ya existe
      const existing = await prisma.obligation.findFirst({
        where: {
          contractId: contract.id,
          type: 'rent',
          period: period
        }
      })

      if (existing) continue

      const rentAmount = contract.initialAmount
      const commissionAmount = Math.round(rentAmount * (ownerCommission / 100))
      const ownerAmount = rentAmount - commissionAmount

      // Crear obligación de alquiler
      const rentObligation = await prisma.obligation.create({
        data: {
          userId: user.id,
          contractId: contract.id,
          apartmentId: contract.apartmentId,
          type: 'rent',
          category: 'income',
          description: `Alquiler ${period.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`,
          amount: rentAmount,
          paidAmount: 0,
          paidBy: 'tenant',
          ownerImpact: ownerAmount,
          agencyImpact: commissionAmount,
          period: period,
          dueDate: dueDate,
          status: 'pending',
          commissionAmount: commissionAmount,
          ownerAmount: ownerAmount
        }
      })

      totalObligations++

      // Pagar según antigüedad (más antiguo = más probable pagado)
      const payProbability = monthsAgo > 1 ? 0.95 : monthsAgo === 1 ? 0.7 : 0.4
      
      if (Math.random() < payProbability) {
        const paymentDate = new Date(dueDate)
        paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 8) - 2)
        
        const methods = ['transfer', 'cash', 'check']
        await prisma.obligationPayment.create({
          data: {
            userId: user.id,
            obligationId: rentObligation.id,
            amount: rentAmount,
            paymentDate: paymentDate,
            method: methods[Math.floor(Math.random() * methods.length)],
            reference: `ALQ${Math.random().toString(36).substr(2, 8).toUpperCase()}`
          }
        })

        await prisma.obligation.update({
          where: { id: rentObligation.id },
          data: { 
            paidAmount: rentAmount, 
            status: 'paid',
            updatedAt: paymentDate
          }
        })

        totalPayments++
      }

      // Expensas (90% de los meses)
      if (Math.random() > 0.1) {
        const expensesAmount = Math.floor(Math.random() * 30000) + 25000
        const expensesDue = new Date(dueDate)
        expensesDue.setDate(15)

        const expensesObligation = await prisma.obligation.create({
          data: {
            userId: user.id,
            contractId: contract.id,
            apartmentId: contract.apartmentId,
            type: 'expenses',
            category: 'expense',
            description: `Expensas ${period.toLocaleDateString('es-AR', { month: 'long' })}`,
            amount: expensesAmount,
            paidAmount: 0,
            paidBy: 'tenant',
            ownerImpact: 0,
            agencyImpact: 0,
            period: period,
            dueDate: expensesDue,
            status: 'pending'
          }
        })

        totalObligations++

        if (monthsAgo > 0 && Math.random() > 0.15) {
          const payDate = new Date(expensesDue)
          payDate.setDate(payDate.getDate() + Math.floor(Math.random() * 10))
          
          await prisma.obligationPayment.create({
            data: {
              userId: user.id,
              obligationId: expensesObligation.id,
              amount: expensesAmount,
              paymentDate: payDate,
              method: 'transfer',
              reference: `EXP${Math.random().toString(36).substr(2, 8).toUpperCase()}`
            }
          })

          await prisma.obligation.update({
            where: { id: expensesObligation.id },
            data: { paidAmount: expensesAmount, status: 'paid', updatedAt: payDate }
          })

          totalPayments++
        }
      }

      // Servicios ocasionales (20% de los meses)
      if (Math.random() > 0.8) {
        const services = [
          { desc: 'Agua', amount: 8000 + Math.floor(Math.random() * 5000) },
          { desc: 'Gas', amount: 12000 + Math.floor(Math.random() * 8000) },
          { desc: 'Electricidad', amount: 15000 + Math.floor(Math.random() * 10000) },
        ]
        const service = services[Math.floor(Math.random() * services.length)]

        await prisma.obligation.create({
          data: {
            userId: user.id,
            contractId: contract.id,
            apartmentId: contract.apartmentId,
            type: 'service',
            category: 'expense',
            description: `${service.desc} ${period.toLocaleDateString('es-AR', { month: 'long' })}`,
            amount: service.amount,
            paidAmount: Math.random() > 0.3 ? service.amount : 0,
            paidBy: 'tenant',
            ownerImpact: 0,
            agencyImpact: 0,
            period: period,
            dueDate: new Date(period.getFullYear(), period.getMonth(), 20),
            status: Math.random() > 0.3 ? 'paid' : 'pending'
          }
        })

        totalObligations++
      }
    }

    // Impuestos anuales (1-2 por propiedad)
    const taxes = [
      { desc: 'ABL Anual', amount: 45000 + Math.floor(Math.random() * 20000) },
      { desc: 'Impuesto Inmobiliario', amount: 35000 + Math.floor(Math.random() * 15000) },
    ]

    for (const tax of taxes) {
      if (Math.random() > 0.4) {
        const taxPeriod = new Date(today.getFullYear(), Math.floor(Math.random() * 12), 1)
        const isPaid = Math.random() > 0.3

        await prisma.obligation.create({
          data: {
            userId: user.id,
            apartmentId: contract.apartmentId,
            type: 'tax',
            category: 'expense',
            description: tax.desc,
            amount: tax.amount,
            paidAmount: isPaid ? tax.amount : 0,
            paidBy: 'owner',
            ownerImpact: isPaid ? -tax.amount : 0,
            agencyImpact: 0,
            period: taxPeriod,
            dueDate: new Date(taxPeriod.getFullYear(), taxPeriod.getMonth(), 28),
            status: isPaid ? 'paid' : 'pending'
          }
        })

        totalObligations++
        if (isPaid) totalPayments++
      }
    }

    // Mantenimientos (2-4 por contrato)
    const maintenanceItems = [
      { desc: 'Reparación de cañerías', amount: 35000 },
      { desc: 'Pintura general', amount: 120000 },
      { desc: 'Arreglo de cerraduras', amount: 15000 },
      { desc: 'Reparación de calefón', amount: 45000 },
      { desc: 'Limpieza de tanque', amount: 25000 },
      { desc: 'Fumigación', amount: 18000 },
    ]

    const numMaintenance = 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < numMaintenance; i++) {
      const item = maintenanceItems[Math.floor(Math.random() * maintenanceItems.length)]
      const maintPeriod = new Date(today.getFullYear(), today.getMonth() - Math.floor(Math.random() * 10), 1)
      const paidBy = Math.random() > 0.5 ? 'owner' : 'agency'
      const isPaid = Math.random() > 0.25

      await prisma.obligation.create({
        data: {
          userId: user.id,
          contractId: contract.id,
          apartmentId: contract.apartmentId,
          type: 'maintenance',
          category: 'expense',
          description: item.desc,
          amount: item.amount,
          paidAmount: isPaid ? item.amount : 0,
          paidBy: paidBy,
          ownerImpact: paidBy === 'owner' && isPaid ? -item.amount : 0,
          agencyImpact: paidBy === 'agency' && isPaid ? -item.amount : 0,
          period: maintPeriod,
          dueDate: new Date(maintPeriod.getFullYear(), maintPeriod.getMonth(), 25),
          status: isPaid ? 'paid' : 'pending',
          notes: `Mantenimiento ${paidBy === 'owner' ? 'a cargo del propietario' : 'a cargo de la inmobiliaria'}`
        }
      })

      totalObligations++
      if (isPaid) totalPayments++
    }

    console.log(`   ✅ Obligaciones creadas para ${apartment.nomenclature}`)
  }

  // Actualizar estados vencidos
  console.log('\n📝 Actualizando estados vencidos...')
  const updated = await prisma.obligation.updateMany({
    where: {
      userId: user.id,
      status: 'pending',
      dueDate: { lt: today }
    },
    data: { status: 'overdue' }
  })
  console.log(`   ✅ ${updated.count} obligaciones marcadas como vencidas`)

  // Resumen final
  const stats = await prisma.obligation.groupBy({
    by: ['status'],
    where: { userId: user.id },
    _count: true,
    _sum: { amount: true, paidAmount: true }
  })

  const typeStats = await prisma.obligation.groupBy({
    by: ['type'],
    where: { userId: user.id },
    _count: true,
    _sum: { amount: true }
  })

  console.log('\n' + '='.repeat(70))
  console.log('📊 RESUMEN FINAL')
  console.log('='.repeat(70))
  console.log(`\n📈 Por Estado:`)
  for (const s of stats) {
    console.log(`   ${s.status}: ${s._count} obligaciones - $${(s._sum.amount || 0).toLocaleString('es-AR')}`)
  }
  console.log(`\n📈 Por Tipo:`)
  for (const t of typeStats) {
    console.log(`   ${t.type}: ${t._count} obligaciones - $${(t._sum.amount || 0).toLocaleString('es-AR')}`)
  }
  console.log('\n' + '='.repeat(70))
  console.log('🎉 Seed de reportes completado!\n')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
