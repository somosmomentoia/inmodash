const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Script para poblar la base de datos con datos realistas de obligaciones
 * CON LÓGICA CONTABLE CORRECTA para las dos cajas:
 * - Caja del Propietario (ownerImpact) -> Se ve en Liquidaciones
 * - Caja de la Inmobiliaria (agencyImpact) -> Se ve en Contabilidad
 * 
 * REGLAS:
 * - ownerImpact > 0: Ingreso para el propietario
 * - ownerImpact < 0: Egreso del propietario
 * - agencyImpact > 0: Ingreso para la inmobiliaria
 * - agencyImpact < 0: Egreso de la inmobiliaria
 */

// Configuración de comisión por defecto
const DEFAULT_COMMISSION_PERCENTAGE = 10 // 10%

/**
 * Calcula la distribución contable según tipo y quién paga
 */
function calculateDistribution(type, amount, paidBy, commissionPercentage = DEFAULT_COMMISSION_PERCENTAGE) {
  let ownerImpact = 0
  let agencyImpact = 0
  let commissionAmount = 0
  let ownerAmount = 0

  switch (type) {
    case 'rent':
      // Alquiler: Propietario recibe (monto - comisión), Inmobiliaria recibe comisión
      commissionAmount = Math.round(amount * (commissionPercentage / 100))
      ownerAmount = amount - commissionAmount
      ownerImpact = ownerAmount // Positivo: propietario recibe
      agencyImpact = commissionAmount // Positivo: inmobiliaria recibe comisión
      break

    case 'expenses':
      // Expensas: Solo tracking, inquilino paga directo al consorcio
      // No afecta ninguna caja
      ownerImpact = 0
      agencyImpact = 0
      break

    case 'service':
      // Servicios: Depende de quién paga
      if (paidBy === 'owner') {
        ownerImpact = -amount // Se descuenta de liquidación
      } else if (paidBy === 'agency') {
        agencyImpact = -amount // Gasto de la inmobiliaria
      }
      // Si paidBy === 'tenant', no afecta (solo tracking)
      break

    case 'tax':
      // Impuestos: Siempre a cargo del propietario
      ownerImpact = -amount // Se descuenta de liquidación
      break

    case 'insurance':
      // Seguros: Depende de quién paga
      if (paidBy === 'owner') {
        ownerImpact = -amount
      }
      // Si paidBy === 'tenant', solo tracking
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
      // Deudas/Ajustes: Lógica especial
      // Solo puede ser tenant o agency (no owner)
      if (paidBy === 'tenant') {
        // Ajuste a favor de la inmobiliaria
        // El inquilino paga, la inmobiliaria recibe
        agencyImpact = amount // Ingreso para inmobiliaria
        ownerImpact = 0
      } else if (paidBy === 'agency') {
        // Ajuste a favor del propietario
        // La inmobiliaria paga, el propietario recibe crédito
        ownerImpact = amount // Crédito para propietario
        agencyImpact = -amount // Egreso de inmobiliaria
      }
      break
  }

  return { ownerImpact, agencyImpact, commissionAmount, ownerAmount }
}

async function main() {
  console.log('🌱 Iniciando seed de obligaciones con lógica contable correcta...\n')

  // Obtener el primer usuario (inmobiliaria)
  const user = await prisma.user.findFirst()
  if (!user) {
    console.error('❌ No se encontró ningún usuario. Crea un usuario primero.')
    return
  }

  console.log(`✅ Usuario encontrado: ${user.email}`)

  // Obtener contratos activos con sus relaciones
  const contracts = await prisma.contract.findMany({
    where: { userId: user.id },
    include: {
      tenant: true,
      apartment: {
        include: {
          owner: true
        }
      }
    }
  })

  if (contracts.length === 0) {
    console.error('❌ No se encontraron contratos. Crea contratos primero.')
    return
  }

  console.log(`✅ ${contracts.length} contratos encontrados\n`)

  // Limpiar obligaciones y pagos existentes
  console.log('🧹 Limpiando datos existentes...')
  await prisma.obligationPayment.deleteMany({ where: { userId: user.id } })
  await prisma.obligation.deleteMany({ where: { userId: user.id } })
  console.log('✅ Datos limpiados\n')

  const today = new Date()
  const obligationsCreated = []
  const paymentsCreated = []

  // Estadísticas contables
  let totalOwnerIncome = 0
  let totalOwnerExpenses = 0
  let totalAgencyIncome = 0
  let totalAgencyExpenses = 0

  for (const contract of contracts) {
    const ownerCommission = contract.apartment?.owner?.commissionPercentage || DEFAULT_COMMISSION_PERCENTAGE
    
    console.log(`\n📋 Contrato: ${contract.tenant.nameOrBusiness}`)
    console.log(`   Propiedad: ${contract.apartment?.nomenclature || 'N/A'}`)
    console.log(`   Propietario: ${contract.apartment?.owner?.name || 'N/A'} (Comisión: ${ownerCommission}%)`)
    
    // Generar obligaciones para los últimos 3 meses
    for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
      const period = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1)
      const dueDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 10)
      const monthName = period.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
      
      // ============================================
      // 1. ALQUILER (rent)
      // ============================================
      const rentAmount = contract.initialAmount
      const rentDist = calculateDistribution('rent', rentAmount, 'tenant', ownerCommission)
      
      const rentObligation = await prisma.obligation.create({
        data: {
          userId: user.id,
          contractId: contract.id,
          apartmentId: contract.apartmentId,
          type: 'rent',
          description: `Alquiler ${monthName}`,
          amount: rentAmount,
          paidAmount: 0,
          period: period,
          dueDate: dueDate,
          status: 'pending',
          paidBy: 'tenant',
          ownerImpact: rentDist.ownerImpact,
          agencyImpact: rentDist.agencyImpact,
          commissionAmount: rentDist.commissionAmount,
          ownerAmount: rentDist.ownerAmount
        }
      })
      obligationsCreated.push(rentObligation)
      
      console.log(`\n  📅 ${monthName}`)
      console.log(`  ✅ Alquiler: $${rentAmount.toLocaleString('es-AR')}`)
      console.log(`     → Propietario recibe: $${rentDist.ownerImpact.toLocaleString('es-AR')}`)
      console.log(`     → Comisión inmobiliaria: $${rentDist.agencyImpact.toLocaleString('es-AR')}`)

      // Simular pago (80% para meses anteriores, 40% para mes actual)
      const isPaid = monthsAgo > 0 ? Math.random() > 0.2 : Math.random() > 0.6
      
      if (isPaid) {
        const paymentDate = new Date(dueDate)
        paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 10))
        
        const payment = await prisma.obligationPayment.create({
          data: {
            userId: user.id,
            obligationId: rentObligation.id,
            amount: rentAmount,
            paymentDate: paymentDate,
            method: ['transfer', 'cash'][Math.floor(Math.random() * 2)],
            reference: `ALQ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
          }
        })
        paymentsCreated.push(payment)

        await prisma.obligation.update({
          where: { id: rentObligation.id },
          data: { paidAmount: rentAmount, status: 'paid' }
        })

        // Contabilizar
        totalOwnerIncome += rentDist.ownerImpact
        totalAgencyIncome += rentDist.agencyImpact
        
        console.log(`     💰 PAGADO`)
      } else {
        console.log(`     ⏳ Pendiente`)
      }

      // ============================================
      // 2. EXPENSAS (expenses) - 70% probabilidad
      // ============================================
      if (Math.random() > 0.3) {
        const expensesAmount = Math.floor(Math.random() * 30000) + 15000
        const expensesDueDate = new Date(dueDate)
        expensesDueDate.setDate(expensesDueDate.getDate() + 5)
        
        const expensesDist = calculateDistribution('expenses', expensesAmount, 'tenant')

        const expensesObligation = await prisma.obligation.create({
          data: {
            userId: user.id,
            contractId: contract.id,
            apartmentId: contract.apartmentId,
            type: 'expenses',
            description: `Expensas ${monthName}`,
            amount: expensesAmount,
            paidAmount: 0,
            period: period,
            dueDate: expensesDueDate,
            status: 'pending',
            paidBy: 'tenant',
            ownerImpact: expensesDist.ownerImpact,
            agencyImpact: expensesDist.agencyImpact,
            commissionAmount: 0,
            ownerAmount: 0
          }
        })
        obligationsCreated.push(expensesObligation)
        
        console.log(`  ✅ Expensas: $${expensesAmount.toLocaleString('es-AR')} (solo tracking, no afecta cajas)`)

        // 75% pagado para meses anteriores
        if (monthsAgo > 0 && Math.random() > 0.25) {
          const paymentDate = new Date(expensesDueDate)
          paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 10))
          
          const payment = await prisma.obligationPayment.create({
            data: {
              userId: user.id,
              obligationId: expensesObligation.id,
              amount: expensesAmount,
              paymentDate: paymentDate,
              method: 'transfer',
              reference: `EXP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
            }
          })
          paymentsCreated.push(payment)

          await prisma.obligation.update({
            where: { id: expensesObligation.id },
            data: { paidAmount: expensesAmount, status: 'paid' }
          })
          
          console.log(`     💰 PAGADO`)
        }
      }

      // ============================================
      // 3. IMPUESTOS (tax) - 40% probabilidad
      // ============================================
      if (Math.random() > 0.6) {
        const taxTypes = [
          { desc: 'ABL', amount: Math.floor(Math.random() * 15000) + 8000 },
          { desc: 'ARBA', amount: Math.floor(Math.random() * 20000) + 10000 },
          { desc: 'Inmobiliario', amount: Math.floor(Math.random() * 25000) + 15000 }
        ]
        const tax = taxTypes[Math.floor(Math.random() * taxTypes.length)]
        const taxDueDate = new Date(dueDate)
        taxDueDate.setDate(taxDueDate.getDate() + 15)
        
        const taxDist = calculateDistribution('tax', tax.amount, 'owner')

        const taxObligation = await prisma.obligation.create({
          data: {
            userId: user.id,
            contractId: contract.id,
            apartmentId: contract.apartmentId,
            type: 'tax',
            category: tax.desc,
            description: `${tax.desc} ${monthName}`,
            amount: tax.amount,
            paidAmount: 0,
            period: period,
            dueDate: taxDueDate,
            status: 'pending',
            paidBy: 'owner',
            ownerImpact: taxDist.ownerImpact,
            agencyImpact: taxDist.agencyImpact,
            commissionAmount: 0,
            ownerAmount: 0
          }
        })
        obligationsCreated.push(taxObligation)
        
        console.log(`  ✅ ${tax.desc}: $${tax.amount.toLocaleString('es-AR')}`)
        console.log(`     → Se descuenta de liquidación: $${Math.abs(taxDist.ownerImpact).toLocaleString('es-AR')}`)

        // 60% pagado
        if (Math.random() > 0.4) {
          const paymentDate = new Date(taxDueDate)
          paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 5))
          
          const payment = await prisma.obligationPayment.create({
            data: {
              userId: user.id,
              obligationId: taxObligation.id,
              amount: tax.amount,
              paymentDate: paymentDate,
              method: 'transfer',
              reference: `TAX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
            }
          })
          paymentsCreated.push(payment)

          await prisma.obligation.update({
            where: { id: taxObligation.id },
            data: { paidAmount: tax.amount, status: 'paid' }
          })

          totalOwnerExpenses += Math.abs(taxDist.ownerImpact)
          console.log(`     💰 PAGADO`)
        }
      }
    }

    // ============================================
    // 4. MANTENIMIENTO (maintenance) - 30% probabilidad
    // ============================================
    if (Math.random() > 0.7) {
      const maintenanceTypes = [
        { desc: 'Reparación de plomería', amount: 45000, paidBy: 'owner' },
        { desc: 'Pintura de paredes', amount: 120000, paidBy: 'owner' },
        { desc: 'Arreglo de cerradura', amount: 15000, paidBy: 'agency' },
        { desc: 'Reparación de calefón', amount: 35000, paidBy: 'owner' }
      ]
      const maint = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)]
      const maintDueDate = new Date(today)
      maintDueDate.setDate(maintDueDate.getDate() + Math.floor(Math.random() * 30))
      
      const maintDist = calculateDistribution('maintenance', maint.amount, maint.paidBy)

      const maintObligation = await prisma.obligation.create({
        data: {
          userId: user.id,
          contractId: contract.id,
          apartmentId: contract.apartmentId,
          type: 'maintenance',
          description: maint.desc,
          amount: maint.amount,
          paidAmount: 0,
          period: today,
          dueDate: maintDueDate,
          status: 'pending',
          paidBy: maint.paidBy,
          ownerImpact: maintDist.ownerImpact,
          agencyImpact: maintDist.agencyImpact,
          commissionAmount: 0,
          ownerAmount: 0,
          notes: `Mantenimiento - Paga: ${maint.paidBy === 'owner' ? 'Propietario' : 'Inmobiliaria'}`
        }
      })
      obligationsCreated.push(maintObligation)
      
      console.log(`\n  ✅ ${maint.desc}: $${maint.amount.toLocaleString('es-AR')} (paga: ${maint.paidBy})`)
      if (maintDist.ownerImpact !== 0) {
        console.log(`     → Impacto propietario: $${maintDist.ownerImpact.toLocaleString('es-AR')}`)
      }
      if (maintDist.agencyImpact !== 0) {
        console.log(`     → Impacto inmobiliaria: $${maintDist.agencyImpact.toLocaleString('es-AR')}`)
      }

      // 50% pagado
      if (Math.random() > 0.5) {
        const paymentDate = new Date()
        
        const payment = await prisma.obligationPayment.create({
          data: {
            userId: user.id,
            obligationId: maintObligation.id,
            amount: maint.amount,
            paymentDate: paymentDate,
            method: 'transfer',
            reference: `MNT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
          }
        })
        paymentsCreated.push(payment)

        await prisma.obligation.update({
          where: { id: maintObligation.id },
          data: { paidAmount: maint.amount, status: 'paid' }
        })

        if (maintDist.ownerImpact < 0) totalOwnerExpenses += Math.abs(maintDist.ownerImpact)
        if (maintDist.agencyImpact < 0) totalAgencyExpenses += Math.abs(maintDist.agencyImpact)
        
        console.log(`     💰 PAGADO`)
      }
    }

    // ============================================
    // 5. AJUSTE/DEUDA (debt) - 20% probabilidad
    // ============================================
    if (Math.random() > 0.8) {
      const debtTypes = [
        { desc: 'Ajuste por diferencia de alquiler', amount: 25000, paidBy: 'tenant' },
        { desc: 'Crédito por reparación adelantada', amount: 30000, paidBy: 'agency' },
        { desc: 'Ajuste por expensas no cobradas', amount: 15000, paidBy: 'tenant' }
      ]
      const debt = debtTypes[Math.floor(Math.random() * debtTypes.length)]
      const debtDueDate = new Date(today)
      debtDueDate.setDate(debtDueDate.getDate() + 15)
      
      const debtDist = calculateDistribution('debt', debt.amount, debt.paidBy)

      const debtObligation = await prisma.obligation.create({
        data: {
          userId: user.id,
          contractId: contract.id,
          apartmentId: contract.apartmentId,
          type: 'debt',
          description: debt.desc,
          amount: debt.amount,
          paidAmount: 0,
          period: today,
          dueDate: debtDueDate,
          status: 'pending',
          paidBy: debt.paidBy,
          ownerImpact: debtDist.ownerImpact,
          agencyImpact: debtDist.agencyImpact,
          commissionAmount: 0,
          ownerAmount: 0,
          notes: debt.paidBy === 'tenant' 
            ? 'Ajuste a favor de la inmobiliaria' 
            : 'Ajuste a favor del propietario'
        }
      })
      obligationsCreated.push(debtObligation)
      
      console.log(`\n  ✅ ${debt.desc}: $${debt.amount.toLocaleString('es-AR')} (paga: ${debt.paidBy})`)
      if (debtDist.ownerImpact !== 0) {
        console.log(`     → Crédito propietario: $${debtDist.ownerImpact.toLocaleString('es-AR')}`)
      }
      if (debtDist.agencyImpact !== 0) {
        const sign = debtDist.agencyImpact > 0 ? '+' : ''
        console.log(`     → Impacto inmobiliaria: ${sign}$${debtDist.agencyImpact.toLocaleString('es-AR')}`)
      }

      // 40% pagado
      if (Math.random() > 0.6) {
        const paymentDate = new Date()
        
        const payment = await prisma.obligationPayment.create({
          data: {
            userId: user.id,
            obligationId: debtObligation.id,
            amount: debt.amount,
            paymentDate: paymentDate,
            method: 'transfer',
            reference: `ADJ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
          }
        })
        paymentsCreated.push(payment)

        await prisma.obligation.update({
          where: { id: debtObligation.id },
          data: { paidAmount: debt.amount, status: 'paid' }
        })

        if (debtDist.ownerImpact > 0) totalOwnerIncome += debtDist.ownerImpact
        if (debtDist.agencyImpact > 0) totalAgencyIncome += debtDist.agencyImpact
        if (debtDist.agencyImpact < 0) totalAgencyExpenses += Math.abs(debtDist.agencyImpact)
        
        console.log(`     💰 PAGADO`)
      }
    }
  }

  // Actualizar estados de obligaciones vencidas
  const overdueObligations = await prisma.obligation.updateMany({
    where: {
      userId: user.id,
      status: 'pending',
      dueDate: { lt: today }
    },
    data: { status: 'overdue' }
  })

  console.log(`\n✅ ${overdueObligations.count} obligaciones marcadas como vencidas`)

  // Resumen final
  console.log('\n' + '='.repeat(70))
  console.log('📊 RESUMEN DEL SEED - LÓGICA CONTABLE')
  console.log('='.repeat(70))
  console.log(`\n📋 Obligaciones creadas: ${obligationsCreated.length}`)
  console.log(`💰 Pagos registrados: ${paymentsCreated.length}`)
  
  console.log('\n📦 CAJA DEL PROPIETARIO (Liquidaciones):')
  console.log(`   ✅ Ingresos (alquileres): $${totalOwnerIncome.toLocaleString('es-AR')}`)
  console.log(`   ❌ Egresos (impuestos, mant.): $${totalOwnerExpenses.toLocaleString('es-AR')}`)
  console.log(`   📊 Neto: $${(totalOwnerIncome - totalOwnerExpenses).toLocaleString('es-AR')}`)
  
  console.log('\n🏢 CAJA DE LA INMOBILIARIA (Contabilidad):')
  console.log(`   ✅ Ingresos (comisiones, ajustes): $${totalAgencyIncome.toLocaleString('es-AR')}`)
  console.log(`   ❌ Egresos (gastos asumidos): $${totalAgencyExpenses.toLocaleString('es-AR')}`)
  console.log(`   📊 Neto: $${(totalAgencyIncome - totalAgencyExpenses).toLocaleString('es-AR')}`)
  
  console.log('\n' + '='.repeat(70))
  console.log('🎉 Seed completado exitosamente!')
  console.log('='.repeat(70) + '\n')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
