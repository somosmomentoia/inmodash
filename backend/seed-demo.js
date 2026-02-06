const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')

const prisma = new PrismaClient()

/**
 * Script completo para poblar la base de datos con datos demo
 * SIN OBLIGACIONES - El usuario las creará manualmente
 * Orden: Usuario → Propietarios → Garantes → Inquilinos → Edificios → Departamentos → Contratos
 */

async function main() {
  console.log('🌱 Iniciando seed completo de datos demo...\n')

  // ============================================================================
  // 1. CREAR USUARIO DEMO
  // ============================================================================
  console.log('👤 Creando usuario demo...')
  
  const hashedPassword = await argon2.hash('demo123')
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@inmodash.com' },
    update: {},
    create: {
      email: 'demo@inmodash.com',
      passwordHash: hashedPassword,
      name: 'Usuario Demo',
      role: 'user',
      companyName: 'Inmobiliaria Demo S.A.',
      companyAddress: 'Av. Corrientes 1234, CABA',
      companyCity: 'Buenos Aires',
      companyCountry: 'Argentina',
      companyPhone: '+54 11 4567-8900',
      subscriptionStatus: 'active',
      subscriptionPlan: 'professional'
    }
  })
  
  console.log(`✅ Usuario demo creado: ${user.email}\n`)
  console.log('   📧 Email: demo@inmodash.com')
  console.log('   🔑 Password: demo123\n')

  // ============================================================================
  // 2. CREAR PROPIETARIOS
  // ============================================================================
  console.log('🏠 Creando propietarios...')
  
  const owners = await Promise.all([
    prisma.owner.upsert({
      where: { dniOrCuit: '20-12345678-9' },
      update: { balance: 450000 },
      create: {
        userId: user.id,
        name: 'Juan Carlos Pérez',
        dniOrCuit: '20-12345678-9',
        email: 'jcperez@email.com',
        phone: '+54 9 11 1234-5678',
        address: 'Av. Libertador 1500, CABA',
        bankAccount: 'CBU: 0110012330001234567890',
        balance: 450000 // Saldo a favor del propietario
      }
    }),
    prisma.owner.upsert({
      where: { dniOrCuit: '27-23456789-0' },
      update: { balance: 280000 },
      create: {
        userId: user.id,
        name: 'María Elena González',
        dniOrCuit: '27-23456789-0',
        email: 'megonzalez@email.com',
        phone: '+54 9 11 2345-6789',
        address: 'Av. Santa Fe 2500, CABA',
        bankAccount: 'CBU: 0140012330002345678901',
        balance: 280000 // Saldo a favor del propietario
      }
    }),
    prisma.owner.upsert({
      where: { dniOrCuit: '20-34567890-1' },
      update: { balance: 0 },
      create: {
        userId: user.id,
        name: 'Roberto Fernández',
        dniOrCuit: '20-34567890-1',
        email: 'rfernandez@email.com',
        phone: '+54 9 11 3456-7890',
        address: 'Av. Callao 800, CABA',
        bankAccount: 'CBU: 0170012330003456789012',
        balance: 0 // Sin saldo
      }
    })
  ])
  
  console.log(`✅ ${owners.length} propietarios creados\n`)

  // ============================================================================
  // 3. CREAR GARANTES
  // ============================================================================
  console.log('🛡️ Creando garantes...')
  
  const guarantors = await Promise.all([
    prisma.guarantor.create({
      data: {
        userId: user.id,
        name: 'Pedro Gómez',
        dni: '18765432',
        address: 'Av. Belgrano 1200, CABA',
        email: 'pgomez@email.com',
        phone: '+54 9 11 5678-1234'
      }
    }),
    prisma.guarantor.create({
      data: {
        userId: user.id,
        name: 'Ana Martínez',
        dni: '22345678',
        address: 'Av. Rivadavia 3000, CABA',
        email: 'amartinez@email.com',
        phone: '+54 9 11 6789-2345'
      }
    }),
    prisma.guarantor.create({
      data: {
        userId: user.id,
        name: 'Luis Sánchez',
        dni: '25678901',
        address: 'Av. Córdoba 4500, CABA',
        email: 'lsanchez@email.com',
        phone: '+54 9 11 7890-3456'
      }
    })
  ])
  
  console.log(`✅ ${guarantors.length} garantes creados\n`)

  // ============================================================================
  // 4. CREAR INQUILINOS
  // ============================================================================
  console.log('👥 Creando inquilinos...')
  
  const tenants = await Promise.all([
    prisma.tenant.create({
      data: {
        userId: user.id,
        nameOrBusiness: 'Sofía Martínez',
        dniOrCuit: '35678901',
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
        nameOrBusiness: 'Tech Solutions S.R.L.',
        dniOrCuit: '30-71234567-8',
        address: 'Av. Corrientes 3000, CABA',
        contactName: 'Martín López',
        contactEmail: 'mlopez@techsolutions.com',
        contactPhone: '+54 9 11 5678-9012',
        contactAddress: 'Av. Corrientes 3000, CABA'
      }
    }),
    prisma.tenant.create({
      data: {
        userId: user.id,
        nameOrBusiness: 'Diego Ramírez',
        dniOrCuit: '28901234',
        address: 'Av. Las Heras 2000, CABA',
        contactName: 'Diego Ramírez',
        contactEmail: 'diego.ramirez@email.com',
        contactPhone: '+54 9 11 6789-0123',
        contactAddress: 'Av. Las Heras 2000, CABA'
      }
    }),
    prisma.tenant.create({
      data: {
        userId: user.id,
        nameOrBusiness: 'Laura Fernández',
        dniOrCuit: '32456789',
        address: 'Av. Pueyrredón 1500, CABA',
        contactName: 'Laura Fernández',
        contactEmail: 'laura.fernandez@email.com',
        contactPhone: '+54 9 11 7890-1234',
        contactAddress: 'Av. Pueyrredón 1500, CABA'
      }
    }),
    prisma.tenant.create({
      data: {
        userId: user.id,
        nameOrBusiness: 'Consultora ABC S.A.',
        dniOrCuit: '30-72345678-9',
        address: 'Av. 9 de Julio 1000, CABA',
        contactName: 'Carolina Ruiz',
        contactEmail: 'cruiz@consultoraabc.com',
        contactPhone: '+54 9 11 8901-2345',
        contactAddress: 'Av. 9 de Julio 1000, CABA'
      }
    })
  ])
  
  console.log(`✅ ${tenants.length} inquilinos creados\n`)

  // ============================================================================
  // 5. CREAR EDIFICIO 1 - TORRE NORTE (Propietario: Juan Carlos Pérez)
  // ============================================================================
  console.log('🏢 Creando edificios...')
  
  const building1 = await prisma.building.create({
    data: {
      userId: user.id,
      name: 'Edificio Torre Norte',
      address: 'Av. del Libertador 4500',
      city: 'Buenos Aires',
      province: 'CABA',
      owner: owners[0].name,
      ownerId: owners[0].id,
      floors: 5,
      totalArea: 1200
    }
  })
  
  // Crear configuración de pisos
  await prisma.floorConfiguration.createMany({
    data: [
      { buildingId: building1.id, floor: 1, apartmentsCount: 2 },
      { buildingId: building1.id, floor: 2, apartmentsCount: 2 },
      { buildingId: building1.id, floor: 3, apartmentsCount: 2 },
      { buildingId: building1.id, floor: 4, apartmentsCount: 2 },
      { buildingId: building1.id, floor: 5, apartmentsCount: 2 }
    ]
  })
  
  // Crear departamentos del edificio 1
  const building1Apartments = []
  for (let floor = 1; floor <= 5; floor++) {
    for (const letter of ['A', 'B']) {
      const apt = await prisma.apartment.create({
        data: {
          userId: user.id,
          buildingId: building1.id,
          ownerId: owners[0].id,
          uniqueId: `torre-norte-${floor}${letter}`,
          floor: floor,
          apartmentLetter: letter,
          nomenclature: `${floor}${letter}`,
          propertyType: 'departamento',
          area: 60 + Math.floor(Math.random() * 30),
          rooms: 2 + Math.floor(Math.random() * 2),
          status: 'disponible',
          rentalPrice: 150000 + Math.floor(Math.random() * 50000)
        }
      })
      building1Apartments.push(apt)
    }
  }
  
  console.log(`   ✅ "${building1.name}" creado con ${building1Apartments.length} departamentos`)

  // ============================================================================
  // 6. CREAR EDIFICIO 2 - RESIDENCIAL BELGRANO (Propietario: María Elena González)
  // ============================================================================
  const building2 = await prisma.building.create({
    data: {
      userId: user.id,
      name: 'Residencial Belgrano',
      address: 'Av. Cabildo 3200',
      city: 'Buenos Aires',
      province: 'CABA',
      owner: owners[1].name,
      ownerId: owners[1].id,
      floors: 3,
      totalArea: 600
    }
  })
  
  await prisma.floorConfiguration.createMany({
    data: [
      { buildingId: building2.id, floor: 1, apartmentsCount: 2 },
      { buildingId: building2.id, floor: 2, apartmentsCount: 2 },
      { buildingId: building2.id, floor: 3, apartmentsCount: 2 }
    ]
  })
  
  const building2Apartments = []
  for (let floor = 1; floor <= 3; floor++) {
    for (const letter of ['A', 'B']) {
      const apt = await prisma.apartment.create({
        data: {
          userId: user.id,
          buildingId: building2.id,
          ownerId: owners[1].id,
          uniqueId: `belgrano-${floor}${letter}`,
          floor: floor,
          apartmentLetter: letter,
          nomenclature: `${floor}${letter}`,
          propertyType: 'departamento',
          area: 70 + Math.floor(Math.random() * 20),
          rooms: 2 + Math.floor(Math.random() * 2),
          status: 'disponible',
          rentalPrice: 180000 + Math.floor(Math.random() * 40000)
        }
      })
      building2Apartments.push(apt)
    }
  }
  
  console.log(`   ✅ "${building2.name}" creado con ${building2Apartments.length} departamentos\n`)

  // ============================================================================
  // 7. CREAR PROPIEDADES INDEPENDIENTES
  // ============================================================================
  console.log('🏡 Creando propiedades independientes...')
  
  const independentProperties = await Promise.all([
    // Casa en Palermo - Propietario: Roberto Fernández
    prisma.apartment.create({
      data: {
        userId: user.id,
        ownerId: owners[2].id,
        uniqueId: 'casa-palermo-1',
        nomenclature: 'Casa Palermo',
        fullAddress: 'Honduras 4500, Palermo',
        city: 'Buenos Aires',
        province: 'CABA',
        propertyType: 'casa',
        area: 150,
        rooms: 4,
        status: 'disponible',
        rentalPrice: 350000
      }
    }),
    // PH en Belgrano - Propietario: Roberto Fernández
    prisma.apartment.create({
      data: {
        userId: user.id,
        ownerId: owners[2].id,
        uniqueId: 'ph-belgrano-1',
        nomenclature: 'PH Belgrano',
        fullAddress: 'Av. Cabildo 2800, Belgrano',
        city: 'Buenos Aires',
        province: 'CABA',
        propertyType: 'ph',
        area: 90,
        rooms: 3,
        status: 'disponible',
        rentalPrice: 220000
      }
    }),
    // Local en Microcentro - Propietario: Juan Carlos Pérez
    prisma.apartment.create({
      data: {
        userId: user.id,
        ownerId: owners[0].id,
        uniqueId: 'local-microcentro-1',
        nomenclature: 'Local Microcentro',
        fullAddress: 'Florida 500, Microcentro',
        city: 'Buenos Aires',
        province: 'CABA',
        propertyType: 'local',
        area: 80,
        rooms: 1,
        status: 'disponible',
        rentalPrice: 280000
      }
    }),
    // Depto en Recoleta - Propietario: María Elena González
    prisma.apartment.create({
      data: {
        userId: user.id,
        ownerId: owners[1].id,
        uniqueId: 'depto-recoleta-1',
        nomenclature: 'Depto Recoleta',
        fullAddress: 'Av. Alvear 1800, Recoleta',
        city: 'Buenos Aires',
        province: 'CABA',
        propertyType: 'departamento',
        area: 120,
        rooms: 3,
        status: 'disponible',
        rentalPrice: 400000
      }
    }),
    // Cochera en Palermo - Propietario: Roberto Fernández
    prisma.apartment.create({
      data: {
        userId: user.id,
        ownerId: owners[2].id,
        uniqueId: 'cochera-palermo-1',
        nomenclature: 'Cochera Palermo',
        fullAddress: 'Thames 2000, Palermo',
        city: 'Buenos Aires',
        province: 'CABA',
        propertyType: 'cochera',
        area: 15,
        rooms: 0,
        status: 'disponible',
        rentalPrice: 35000
      }
    })
  ])
  
  console.log(`✅ ${independentProperties.length} propiedades independientes creadas\n`)

  // ============================================================================
  // 8. CREAR CONTRATOS
  // ============================================================================
  console.log('📄 Creando contratos...')
  
  const today = new Date()
  const contracts = []
  
  // Contrato 1: Sofía en depto 1A del edificio Torre Norte
  const contract1 = await prisma.contract.create({
    data: {
      userId: user.id,
      apartmentId: building1Apartments[0].id,
      tenantId: tenants[0].id,
      startDate: new Date(today.getFullYear(), today.getMonth() - 6, 1),
      endDate: new Date(today.getFullYear() + 2, today.getMonth() - 6, 1),
      initialAmount: 150000
    }
  })
  contracts.push(contract1)
  await prisma.apartment.update({
    where: { id: building1Apartments[0].id },
    data: { status: 'ocupado' }
  })
  
  // Contrato 2: Tech Solutions en depto 2A del edificio Torre Norte
  const contract2 = await prisma.contract.create({
    data: {
      userId: user.id,
      apartmentId: building1Apartments[2].id,
      tenantId: tenants[1].id,
      startDate: new Date(today.getFullYear(), today.getMonth() - 3, 1),
      endDate: new Date(today.getFullYear() + 2, today.getMonth() - 3, 1),
      initialAmount: 180000
    }
  })
  contracts.push(contract2)
  await prisma.apartment.update({
    where: { id: building1Apartments[2].id },
    data: { status: 'ocupado' }
  })
  
  // Contrato 3: Diego en depto 1A del Residencial Belgrano
  const contract3 = await prisma.contract.create({
    data: {
      userId: user.id,
      apartmentId: building2Apartments[0].id,
      tenantId: tenants[2].id,
      startDate: new Date(today.getFullYear(), today.getMonth() - 4, 1),
      endDate: new Date(today.getFullYear() + 2, today.getMonth() - 4, 1),
      initialAmount: 190000
    }
  })
  contracts.push(contract3)
  await prisma.apartment.update({
    where: { id: building2Apartments[0].id },
    data: { status: 'ocupado' }
  })
  
  // Contrato 4: Laura en Casa Palermo
  const contract4 = await prisma.contract.create({
    data: {
      userId: user.id,
      apartmentId: independentProperties[0].id,
      tenantId: tenants[3].id,
      startDate: new Date(today.getFullYear(), today.getMonth() - 2, 1),
      endDate: new Date(today.getFullYear() + 2, today.getMonth() - 2, 1),
      initialAmount: 350000
    }
  })
  contracts.push(contract4)
  await prisma.apartment.update({
    where: { id: independentProperties[0].id },
    data: { status: 'ocupado' }
  })
  
  // Contrato 5: Consultora ABC en Local Microcentro
  const contract5 = await prisma.contract.create({
    data: {
      userId: user.id,
      apartmentId: independentProperties[2].id,
      tenantId: tenants[4].id,
      startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      endDate: new Date(today.getFullYear() + 3, today.getMonth() - 1, 1),
      initialAmount: 280000
    }
  })
  contracts.push(contract5)
  await prisma.apartment.update({
    where: { id: independentProperties[2].id },
    data: { status: 'ocupado' }
  })
  
  // Asociar garantes a contratos
  await prisma.contractGuarantor.createMany({
    data: [
      { contractId: contract1.id, guarantorId: guarantors[0].id },
      { contractId: contract2.id, guarantorId: guarantors[1].id },
      { contractId: contract3.id, guarantorId: guarantors[0].id },
      { contractId: contract3.id, guarantorId: guarantors[2].id },
      { contractId: contract4.id, guarantorId: guarantors[1].id }
    ]
  })
  
  console.log(`✅ ${contracts.length} contratos creados\n`)

  // ============================================================================
  // RESUMEN FINAL
  // ============================================================================
  console.log('=' .repeat(60))
  console.log('🎉 SEED COMPLETADO EXITOSAMENTE')
  console.log('=' .repeat(60))
  console.log('')
  console.log('📊 RESUMEN:')
  console.log(`   👤 Usuario demo: demo@inmodash.com / demo123`)
  console.log(`   🏠 Propietarios: ${owners.length}`)
  console.log(`   🛡️ Garantes: ${guarantors.length}`)
  console.log(`   👥 Inquilinos: ${tenants.length}`)
  console.log(`   🏢 Edificios: 2`)
  console.log(`      - Torre Norte: ${building1Apartments.length} departamentos (Juan Carlos Pérez)`)
  console.log(`      - Residencial Belgrano: ${building2Apartments.length} departamentos (María Elena González)`)
  console.log(`   🏡 Propiedades independientes: ${independentProperties.length}`)
  console.log(`   📄 Contratos activos: ${contracts.length}`)
  console.log('')
  console.log('⚠️  NOTA: No se crearon obligaciones. El usuario las creará manualmente.')
  console.log('')
  console.log('🔐 CREDENCIALES DE ACCESO:')
  console.log('   Email: demo@inmodash.com')
  console.log('   Password: demo123')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
