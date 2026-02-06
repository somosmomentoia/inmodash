const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Script completo para poblar la base de datos con datos realistas
 * Crea propietarios, inquilinos, propiedades, contratos y obligaciones
 */

async function main() {
  console.log('🌱 Iniciando seed completo de datos...\n')

  // Obtener el primer usuario (inmobiliaria)
  const user = await prisma.user.findFirst()
  if (!user) {
    console.error('❌ No se encontró ningún usuario. Crea un usuario primero.')
    return
  }

  console.log(`✅ Usuario encontrado: ${user.email}\n`)

  // Verificar si ya hay datos
  const existingContracts = await prisma.contract.count({ where: { userId: user.id } })
  
  if (existingContracts > 0) {
    console.log(`ℹ️  Ya existen ${existingContracts} contratos.`)
    const answer = 'y' // Auto-confirmar para script
    if (answer !== 'y') {
      console.log('❌ Operación cancelada')
      return
    }
  }

  // Limpiar datos existentes
  console.log('🧹 Limpiando datos existentes...')
  await prisma.obligationPayment.deleteMany({ where: { userId: user.id } })
  await prisma.obligation.deleteMany({ where: { userId: user.id } })
  await prisma.payment.deleteMany({ where: { userId: user.id } })
  await prisma.contractGuarantor.deleteMany({ where: { contract: { userId: user.id } } })
  await prisma.contract.deleteMany({ where: { userId: user.id } })
  console.log('✅ Datos limpiados\n')

  // Obtener o crear propietarios
  let owners = await prisma.owner.findMany({ where: { userId: user.id }, take: 3 })
  
  if (owners.length === 0) {
    console.log('📝 Creando propietarios...')
    owners = await Promise.all([
      prisma.owner.create({
        data: {
          userId: user.id,
          name: 'Juan Pérez',
          dniOrCuit: '12345678',
          email: 'juan.perez@email.com',
          phone: '+54 9 11 1234-5678',
          address: 'Av. Corrientes 1000, CABA'
        }
      }),
      prisma.owner.create({
        data: {
          userId: user.id,
          name: 'María González',
          dniOrCuit: '23456789',
          email: 'maria.gonzalez@email.com',
          phone: '+54 9 11 2345-6789',
          address: 'Av. Santa Fe 2000, CABA'
        }
      }),
      prisma.owner.create({
        data: {
          userId: user.id,
          name: 'Carlos Rodríguez',
          dniOrCuit: '34567890',
          email: 'carlos.rodriguez@email.com',
          phone: '+54 9 11 3456-7890',
          address: 'Av. Callao 3000, CABA'
        }
      })
    ])
    console.log(`✅ ${owners.length} propietarios creados\n`)
  }

  // Obtener o crear inquilinos
  let tenants = await prisma.tenant.findMany({ where: { userId: user.id }, take: 5 })
  
  if (tenants.length === 0) {
    console.log('📝 Creando inquilinos...')
    tenants = await Promise.all([
      prisma.tenant.create({
        data: {
          userId: user.id,
          nameOrBusiness: 'Sofía Martínez',
          dniOrCuit: '45678901',
          address: 'Av. Rivadavia 5000, CABA',
          contactName: 'Sofía Martínez',
          contactEmail: 'sofia.martinez@email.com',
          contactPhone: '+54 9 11 4567-8901',
          contactAddress: 'Av. Rivadavia 5000, CABA'
        }
      }),
      prisma.tenant.create({
        data: {
          userId: user.id,
          nameOrBusiness: 'Tech Solutions SRL',
          dniOrCuit: '30-12345678-9',
          address: 'Av. Córdoba 6000, CABA',
          contactName: 'Juan Pérez',
          contactEmail: 'contacto@techsolutions.com',
          contactPhone: '+54 9 11 5678-9012',
          contactAddress: 'Av. Córdoba 6000, CABA'
        }
      }),
      prisma.tenant.create({
        data: {
          userId: user.id,
          nameOrBusiness: 'Roberto Fernández',
          dniOrCuit: '56789012',
          address: 'Av. Belgrano 7000, CABA',
          contactName: 'Roberto Fernández',
          contactEmail: 'roberto.fernandez@email.com',
          contactPhone: '+54 9 11 6789-0123',
          contactAddress: 'Av. Belgrano 7000, CABA'
        }
      }),
      prisma.tenant.create({
        data: {
          userId: user.id,
          nameOrBusiness: 'Laura Sánchez',
          dniOrCuit: '67890123',
          address: 'Av. Pueyrredón 8000, CABA',
          contactName: 'Laura Sánchez',
          contactEmail: 'laura.sanchez@email.com',
          contactPhone: '+54 9 11 7890-1234',
          contactAddress: 'Av. Pueyrredón 8000, CABA'
        }
      }),
      prisma.tenant.create({
        data: {
          userId: user.id,
          nameOrBusiness: 'Consultora ABC SA',
          dniOrCuit: '30-23456789-0',
          address: 'Av. Cabildo 9000, CABA',
          contactName: 'María González',
          contactEmail: 'info@consultorabc.com',
          contactPhone: '+54 9 11 8901-2345',
          contactAddress: 'Av. Cabildo 9000, CABA'
        }
      })
    ])
    console.log(`✅ ${tenants.length} inquilinos creados\n`)
  }

  // Obtener o crear apartamentos
  let apartments = await prisma.apartment.findMany({ where: { userId: user.id }, take: 5 })
  
  if (apartments.length === 0) {
    console.log('📝 Creando departamentos...')
    apartments = await Promise.all([
      prisma.apartment.create({
        data: {
          uniqueId: `APT-${Date.now()}-1`,
          user: { connect: { id: user.id } },
          owner: { connect: { id: owners[0].id } },
          nomenclature: 'Depto 101',
          floor: 1,
          apartmentLetter: 'A',
          fullAddress: 'Av. Corrientes 1234, Piso 1 A, CABA',
          city: 'CABA',
          province: 'Buenos Aires',
          area: 45,
          rooms: 2,
          status: 'ocupado',
          propertyType: 'departamento',
          rentalPrice: 250000,
          specifications: JSON.stringify({ bathrooms: 1, balcony: false })
        }
      }),
      prisma.apartment.create({
        data: {
          uniqueId: `APT-${Date.now()}-2`,
          user: { connect: { id: user.id } },
          owner: { connect: { id: owners[0].id } },
          nomenclature: 'Depto 205',
          floor: 2,
          apartmentLetter: 'B',
          fullAddress: 'Av. Santa Fe 2345, Piso 2 B, CABA',
          city: 'CABA',
          province: 'Buenos Aires',
          area: 65,
          rooms: 3,
          status: 'ocupado',
          propertyType: 'departamento',
          rentalPrice: 320000,
          specifications: JSON.stringify({ bathrooms: 2, balcony: true })
        }
      }),
      prisma.apartment.create({
        data: {
          uniqueId: `APT-${Date.now()}-3`,
          user: { connect: { id: user.id } },
          owner: { connect: { id: owners[1].id } },
          nomenclature: 'Oficina 302',
          floor: 3,
          apartmentLetter: 'C',
          fullAddress: 'Av. Callao 3456, Piso 3 C, CABA',
          city: 'CABA',
          province: 'Buenos Aires',
          area: 80,
          rooms: 4,
          status: 'ocupado',
          propertyType: 'local',
          rentalPrice: 400000,
          specifications: JSON.stringify({ bathrooms: 2, parking: true })
        }
      }),
      prisma.apartment.create({
        data: {
          uniqueId: `APT-${Date.now()}-4`,
          user: { connect: { id: user.id } },
          owner: { connect: { id: owners[1].id } },
          nomenclature: 'PH Palermo',
          fullAddress: 'Gorriti 4567, CABA',
          city: 'CABA',
          province: 'Buenos Aires',
          area: 120,
          rooms: 4,
          status: 'ocupado',
          propertyType: 'ph',
          rentalPrice: 480000,
          specifications: JSON.stringify({ bathrooms: 3, balcony: true, terrace: true, garden: true })
        }
      }),
      prisma.apartment.create({
        data: {
          uniqueId: `APT-${Date.now()}-5`,
          user: { connect: { id: user.id } },
          owner: { connect: { id: owners[2].id } },
          nomenclature: 'Depto 801',
          floor: 8,
          apartmentLetter: 'A',
          fullAddress: 'Av. del Libertador 5678, Piso 8 A, CABA',
          city: 'CABA',
          province: 'Buenos Aires',
          area: 55,
          rooms: 2,
          status: 'ocupado',
          propertyType: 'departamento',
          rentalPrice: 280000,
          specifications: JSON.stringify({ bathrooms: 1, balcony: true, amenities: true })
        }
      })
    ])
    console.log(`✅ ${apartments.length} departamentos creados\n`)
  }

  // Crear contratos
  console.log('📝 Creando contratos...')
  const today = new Date()
  const contracts = []

  for (let i = 0; i < Math.min(apartments.length, tenants.length); i++) {
    const startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1) // Hace 6 meses
    const endDate = new Date(today.getFullYear() + 2, today.getMonth() - 6, 1) // 2 años desde inicio
    
    const baseRent = 200000 + (i * 50000) // Entre $200k y $400k
    
    const contract = await prisma.contract.create({
      data: {
        userId: user.id,
        apartmentId: apartments[i].id,
        tenantId: tenants[i].id,
        startDate: startDate,
        endDate: endDate,
        initialAmount: baseRent
      }
    })
    
    contracts.push(contract)
    console.log(`  ✅ Contrato creado: ${tenants[i].nameOrBusiness} - $${baseRent.toLocaleString('es-AR')}/mes`)
  }

  console.log(`\n✅ ${contracts.length} contratos creados\n`)

  // Crear obligaciones y pagos
  console.log('📝 Creando obligaciones y pagos...\n')
  const obligationsCreated = []
  const paymentsCreated = []

  for (const contract of contracts) {
    const tenant = tenants.find(t => t.id === contract.tenantId)
    const apartment = apartments.find(a => a.id === contract.apartmentId)
    const owner = owners.find(o => o.id === apartment.ownerId)
    
    console.log(`📋 ${tenant.nameOrBusiness}`)
    
    // Generar obligaciones para los últimos 3 meses
    for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
      const period = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1)
      const dueDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 10)
      
      const rentAmount = contract.initialAmount
      // Comisiones se calcularán en el módulo de finanzas
      const commissionAmount = 0
      const ownerAmount = rentAmount

      // Obligación de alquiler
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

      // Determinar pago (90% pagado para meses anteriores, 50% para mes actual)
      const shouldPay = monthsAgo > 0 ? Math.random() > 0.1 : Math.random() > 0.5
      
      if (shouldPay) {
        const isPartial = Math.random() > 0.9 // 10% pagos parciales
        
        if (isPartial && monthsAgo > 0) {
          // Pago parcial
          const firstAmount = rentAmount * 0.65
          const secondAmount = rentAmount * 0.35
          
          const date1 = new Date(dueDate)
          date1.setDate(date1.getDate() + Math.floor(Math.random() * 3))
          
          await prisma.obligationPayment.create({
            data: {
              userId: user.id,
              obligationId: rentObligation.id,
              amount: firstAmount,
              paymentDate: date1,
              method: 'transfer',
              reference: `TRF${Math.random().toString(36).substr(2, 8).toUpperCase()}`
            }
          })
          
          const date2 = new Date(date1)
          date2.setDate(date2.getDate() + Math.floor(Math.random() * 7) + 3)
          
          await prisma.obligationPayment.create({
            data: {
              userId: user.id,
              obligationId: rentObligation.id,
              amount: secondAmount,
              paymentDate: date2,
              method: 'transfer',
              reference: `TRF${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
              notes: 'Completado'
            }
          })

          await prisma.obligation.update({
            where: { id: rentObligation.id },
            data: { paidAmount: rentAmount, status: 'paid' }
          })

          paymentsCreated.push({}, {})
          console.log(`  💰 Alquiler pagado (parcial): $${rentAmount.toLocaleString('es-AR')}`)
        } else {
          // Pago completo
          const paymentDate = new Date(dueDate)
          paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 10) - 2)
          
          const methods = ['transfer', 'cash', 'check']
          await prisma.obligationPayment.create({
            data: {
              userId: user.id,
              obligationId: rentObligation.id,
              amount: rentAmount,
              paymentDate: paymentDate,
              method: methods[Math.floor(Math.random() * methods.length)],
              reference: `PAY${Math.random().toString(36).substr(2, 8).toUpperCase()}`
            }
          })

          await prisma.obligation.update({
            where: { id: rentObligation.id },
            data: { paidAmount: rentAmount, status: 'paid' }
          })

          paymentsCreated.push({})
          console.log(`  💰 Alquiler pagado: $${rentAmount.toLocaleString('es-AR')}`)
        }
      } else {
        console.log(`  ⏳ Alquiler pendiente: $${rentAmount.toLocaleString('es-AR')}`)
      }

      // Expensas (80% de los casos)
      if (Math.random() > 0.2) {
        const expensesAmount = Math.floor(Math.random() * 25000) + 20000
        const expensesDue = new Date(dueDate)
        expensesDue.setDate(expensesDue.getDate() + 5)

        const expensesObligation = await prisma.obligation.create({
          data: {
            userId: user.id,
            contractId: contract.id,
            apartmentId: contract.apartmentId,
            type: 'expenses',
            description: `Expensas ${period.toLocaleDateString('es-AR', { month: 'long' })}`,
            amount: expensesAmount,
            paidAmount: 0,
            period: period,
            dueDate: expensesDue,
            status: 'pending'
          }
        })

        obligationsCreated.push(expensesObligation)

        if (monthsAgo > 0 && Math.random() > 0.2) {
          const payDate = new Date(expensesDue)
          payDate.setDate(payDate.getDate() + Math.floor(Math.random() * 8))
          
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
            data: { paidAmount: expensesAmount, status: 'paid' }
          })

          paymentsCreated.push({})
          console.log(`  💰 Expensas pagadas: $${expensesAmount.toLocaleString('es-AR')}`)
        } else {
          console.log(`  ⏳ Expensas pendientes: $${expensesAmount.toLocaleString('es-AR')}`)
        }
      }
    }
    console.log('')
  }

  // Agregar algunas obligaciones especiales
  console.log('📝 Creando obligaciones especiales...\n')
  
  const specialObligations = [
    { type: 'service', desc: 'Fumigación integral', amount: 22000, contract: contracts[0] },
    { type: 'maintenance', desc: 'Reparación aire acondicionado', amount: 45000, contract: contracts[1] },
    { type: 'service', desc: 'Limpieza profunda', amount: 18000, contract: contracts[2] },
    { type: 'maintenance', desc: 'Pintura de living', amount: 85000, contract: contracts[0] },
    { type: 'insurance', desc: 'Seguro de incendio anual', amount: 35000, contract: contracts[3] }
  ]

  for (const special of specialObligations) {
    if (!special.contract) continue
    
    const dueDate = new Date(today)
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 45) - 15)
    
    const obligation = await prisma.obligation.create({
      data: {
        userId: user.id,
        contractId: special.contract.id,
        apartmentId: special.contract.apartmentId,
        type: special.type,
        description: special.desc,
        amount: special.amount,
        paidAmount: 0,
        period: today,
        dueDate: dueDate,
        status: 'pending',
        notes: 'Servicio adicional'
      }
    })

    obligationsCreated.push(obligation)
    console.log(`  ✅ ${special.desc}: $${special.amount.toLocaleString('es-AR')}`)

    // 60% pagado
    if (Math.random() > 0.4) {
      const payDate = new Date(dueDate)
      payDate.setDate(payDate.getDate() - Math.floor(Math.random() * 5))
      
      await prisma.obligationPayment.create({
        data: {
          userId: user.id,
          obligationId: obligation.id,
          amount: special.amount,
          paymentDate: payDate,
          method: 'transfer',
          reference: `SRV${Math.random().toString(36).substr(2, 8).toUpperCase()}`
        }
      })

      await prisma.obligation.update({
        where: { id: obligation.id },
        data: { paidAmount: special.amount, status: 'paid' }
      })

      paymentsCreated.push({})
      console.log(`    💰 Pagado`)
    }
  }

  // Actualizar vencidos
  await prisma.obligation.updateMany({
    where: {
      userId: user.id,
      status: 'pending',
      dueDate: { lt: today }
    },
    data: { status: 'overdue' }
  })

  // Resumen
  const totalObligations = await prisma.obligation.aggregate({
    where: { userId: user.id },
    _sum: { amount: true }
  })

  const totalPaid = await prisma.obligation.aggregate({
    where: { userId: user.id },
    _sum: { paidAmount: true }
  })

  console.log('\n' + '='.repeat(70))
  console.log('📊 RESUMEN FINAL')
  console.log('='.repeat(70))
  console.log(`✅ Propietarios: ${owners.length}`)
  console.log(`✅ Inquilinos: ${tenants.length}`)
  console.log(`✅ Propiedades: ${apartments.length}`)
  console.log(`✅ Contratos: ${contracts.length}`)
  console.log(`✅ Obligaciones: ${obligationsCreated.length}`)
  console.log(`💰 Pagos registrados: ${paymentsCreated.length}`)
  console.log(`💵 Total obligaciones: $${(totalObligations._sum.amount || 0).toLocaleString('es-AR')}`)
  console.log(`💵 Total pagado: $${(totalPaid._sum.paidAmount || 0).toLocaleString('es-AR')}`)
  console.log(`💵 Pendiente: $${((totalObligations._sum.amount || 0) - (totalPaid._sum.paidAmount || 0)).toLocaleString('es-AR')}`)
  console.log('='.repeat(70))
  console.log('\n🎉 Seed completado exitosamente!\n')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
