const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')

const prisma = new PrismaClient()

/**
 * Seed completo para cuenta demo de Inmodash
 * Compatible con schema actual (sin owner.balance)
 * Incluye: Usuario, Propietarios, Inquilinos, Garantes, Edificios,
 *          Departamentos, Contratos, Obligaciones, Pagos y Liquidaciones
 */

// Helper: fecha UTC normalizada al 1er día del mes
function monthDate(year, month, day = 1) {
  return new Date(Date.UTC(year, month - 1, day))
}

async function main() {
  console.log('🌱 Iniciando seed completo de datos demo...\n')

  const today = new Date()
  const Y = today.getFullYear()
  const M = today.getMonth() + 1 // 1-indexed

  // ============================================================================
  // 1. USUARIO DEMO
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
  console.log(`   ✅ ${user.email} / demo123\n`)

  // ============================================================================
  // 2. PROPIETARIOS (sin balance)
  // ============================================================================
  console.log('🏠 Creando propietarios...')
  const owners = await Promise.all([
    prisma.owner.upsert({
      where: { dniOrCuit: '20-12345678-9' },
      update: {},
      create: {
        userId: user.id,
        name: 'Juan Carlos Pérez',
        dniOrCuit: '20-12345678-9',
        email: 'jcperez@email.com',
        phone: '+54 9 11 1234-5678',
        address: 'Av. Libertador 1500, CABA',
        bankAccount: 'CBU: 0110012330001234567890'
      }
    }),
    prisma.owner.upsert({
      where: { dniOrCuit: '27-23456789-0' },
      update: {},
      create: {
        userId: user.id,
        name: 'María Elena González',
        dniOrCuit: '27-23456789-0',
        email: 'megonzalez@email.com',
        phone: '+54 9 11 2345-6789',
        address: 'Av. Santa Fe 2500, CABA',
        bankAccount: 'CBU: 0140012330002345678901'
      }
    }),
    prisma.owner.upsert({
      where: { dniOrCuit: '20-34567890-1' },
      update: {},
      create: {
        userId: user.id,
        name: 'Roberto Fernández',
        dniOrCuit: '20-34567890-1',
        email: 'rfernandez@email.com',
        phone: '+54 9 11 3456-7890',
        address: 'Av. Callao 800, CABA',
        bankAccount: 'CBU: 0170012330003456789012'
      }
    })
  ])
  console.log(`   ✅ ${owners.length} propietarios\n`)

  // ============================================================================
  // 3. GARANTES
  // ============================================================================
  console.log('🛡️ Creando garantes...')
  const guarantors = await Promise.all([
    prisma.guarantor.create({ data: { userId: user.id, name: 'Pedro Gómez', dni: '18765432', address: 'Av. Belgrano 1200, CABA', email: 'pgomez@email.com', phone: '+54 9 11 5678-1234' } }),
    prisma.guarantor.create({ data: { userId: user.id, name: 'Ana Martínez', dni: '22345678', address: 'Av. Rivadavia 3000, CABA', email: 'amartinez@email.com', phone: '+54 9 11 6789-2345' } }),
    prisma.guarantor.create({ data: { userId: user.id, name: 'Luis Sánchez', dni: '25678901', address: 'Av. Córdoba 4500, CABA', email: 'lsanchez@email.com', phone: '+54 9 11 7890-3456' } })
  ])
  console.log(`   ✅ ${guarantors.length} garantes\n`)

  // ============================================================================
  // 4. INQUILINOS
  // ============================================================================
  console.log('👥 Creando inquilinos...')
  const tenants = await Promise.all([
    prisma.tenant.create({ data: { userId: user.id, nameOrBusiness: 'Sofía Martínez', dniOrCuit: '35678901', address: 'Av. Rivadavia 5000, CABA', contactName: 'Sofía Martínez', contactEmail: 'sofia.martinez@email.com', contactPhone: '+54 9 11 4567-8901', contactAddress: 'Av. Rivadavia 5000, CABA' } }),
    prisma.tenant.create({ data: { userId: user.id, nameOrBusiness: 'Tech Solutions S.R.L.', dniOrCuit: '30-71234567-8', address: 'Av. Corrientes 3000, CABA', contactName: 'Martín López', contactEmail: 'mlopez@techsolutions.com', contactPhone: '+54 9 11 5678-9012', contactAddress: 'Av. Corrientes 3000, CABA' } }),
    prisma.tenant.create({ data: { userId: user.id, nameOrBusiness: 'Diego Ramírez', dniOrCuit: '28901234', address: 'Av. Las Heras 2000, CABA', contactName: 'Diego Ramírez', contactEmail: 'diego.ramirez@email.com', contactPhone: '+54 9 11 6789-0123', contactAddress: 'Av. Las Heras 2000, CABA' } }),
    prisma.tenant.create({ data: { userId: user.id, nameOrBusiness: 'Laura Fernández', dniOrCuit: '32456789', address: 'Av. Pueyrredón 1500, CABA', contactName: 'Laura Fernández', contactEmail: 'laura.fernandez@email.com', contactPhone: '+54 9 11 7890-1234', contactAddress: 'Av. Pueyrredón 1500, CABA' } }),
    prisma.tenant.create({ data: { userId: user.id, nameOrBusiness: 'Consultora ABC S.A.', dniOrCuit: '30-72345678-9', address: 'Av. 9 de Julio 1000, CABA', contactName: 'Carolina Ruiz', contactEmail: 'cruiz@consultoraabc.com', contactPhone: '+54 9 11 8901-2345', contactAddress: 'Av. 9 de Julio 1000, CABA' } })
  ])
  console.log(`   ✅ ${tenants.length} inquilinos\n`)

  // ============================================================================
  // 5. EDIFICIOS + DEPARTAMENTOS
  // ============================================================================
  console.log('🏢 Creando edificios...')

  // Edificio 1 - Torre Norte (Owner: Pérez)
  const building1 = await prisma.building.create({
    data: { userId: user.id, name: 'Edificio Torre Norte', address: 'Av. del Libertador 4500', city: 'Buenos Aires', province: 'CABA', owner: owners[0].name, ownerId: owners[0].id, floors: 5, totalArea: 1200 }
  })
  await prisma.floorConfiguration.createMany({
    data: Array.from({ length: 5 }, (_, i) => ({ buildingId: building1.id, floor: i + 1, apartmentsCount: 2 }))
  })
  const b1Apts = []
  for (let floor = 1; floor <= 5; floor++) {
    for (const letter of ['A', 'B']) {
      const apt = await prisma.apartment.create({
        data: { userId: user.id, buildingId: building1.id, ownerId: owners[0].id, uniqueId: `torre-norte-${floor}${letter}`, floor, apartmentLetter: letter, nomenclature: `${floor}${letter}`, propertyType: 'departamento', area: 60 + Math.floor(Math.random() * 30), rooms: 2 + Math.floor(Math.random() * 2), status: 'disponible', rentalPrice: 150000 + Math.floor(Math.random() * 50000) }
      })
      b1Apts.push(apt)
    }
  }
  console.log(`   ✅ Torre Norte: ${b1Apts.length} deptos`)

  // Edificio 2 - Residencial Belgrano (Owner: González)
  const building2 = await prisma.building.create({
    data: { userId: user.id, name: 'Residencial Belgrano', address: 'Av. Cabildo 3200', city: 'Buenos Aires', province: 'CABA', owner: owners[1].name, ownerId: owners[1].id, floors: 3, totalArea: 600 }
  })
  await prisma.floorConfiguration.createMany({
    data: Array.from({ length: 3 }, (_, i) => ({ buildingId: building2.id, floor: i + 1, apartmentsCount: 2 }))
  })
  const b2Apts = []
  for (let floor = 1; floor <= 3; floor++) {
    for (const letter of ['A', 'B']) {
      const apt = await prisma.apartment.create({
        data: { userId: user.id, buildingId: building2.id, ownerId: owners[1].id, uniqueId: `belgrano-${floor}${letter}`, floor, apartmentLetter: letter, nomenclature: `${floor}${letter}`, propertyType: 'departamento', area: 70 + Math.floor(Math.random() * 20), rooms: 2 + Math.floor(Math.random() * 2), status: 'disponible', rentalPrice: 180000 + Math.floor(Math.random() * 40000) }
      })
      b2Apts.push(apt)
    }
  }
  console.log(`   ✅ Residencial Belgrano: ${b2Apts.length} deptos`)

  // ============================================================================
  // 6. PROPIEDADES INDEPENDIENTES
  // ============================================================================
  console.log('\n🏡 Creando propiedades independientes...')
  const indProps = await Promise.all([
    prisma.apartment.create({ data: { userId: user.id, ownerId: owners[2].id, uniqueId: 'casa-palermo-1', nomenclature: 'Casa Palermo', fullAddress: 'Honduras 4500, Palermo', city: 'Buenos Aires', province: 'CABA', propertyType: 'casa', area: 150, rooms: 4, status: 'disponible', rentalPrice: 350000 } }),
    prisma.apartment.create({ data: { userId: user.id, ownerId: owners[2].id, uniqueId: 'ph-belgrano-1', nomenclature: 'PH Belgrano', fullAddress: 'Av. Cabildo 2800, Belgrano', city: 'Buenos Aires', province: 'CABA', propertyType: 'ph', area: 90, rooms: 3, status: 'disponible', rentalPrice: 220000 } }),
    prisma.apartment.create({ data: { userId: user.id, ownerId: owners[0].id, uniqueId: 'local-microcentro-1', nomenclature: 'Local Microcentro', fullAddress: 'Florida 500, Microcentro', city: 'Buenos Aires', province: 'CABA', propertyType: 'local', area: 80, rooms: 1, status: 'disponible', rentalPrice: 280000 } }),
    prisma.apartment.create({ data: { userId: user.id, ownerId: owners[1].id, uniqueId: 'depto-recoleta-1', nomenclature: 'Depto Recoleta', fullAddress: 'Av. Alvear 1800, Recoleta', city: 'Buenos Aires', province: 'CABA', propertyType: 'departamento', area: 120, rooms: 3, status: 'disponible', rentalPrice: 400000 } }),
    prisma.apartment.create({ data: { userId: user.id, ownerId: owners[2].id, uniqueId: 'cochera-palermo-1', nomenclature: 'Cochera Palermo', fullAddress: 'Thames 2000, Palermo', city: 'Buenos Aires', province: 'CABA', propertyType: 'cochera', area: 15, rooms: 0, status: 'disponible', rentalPrice: 35000 } })
  ])
  console.log(`   ✅ ${indProps.length} propiedades independientes\n`)

  // ============================================================================
  // 7. CONTRATOS (con comisión del 10%)
  // ============================================================================
  console.log('📄 Creando contratos...')

  const contractDefs = [
    { apt: b1Apts[0], tenant: tenants[0], amount: 150000, monthsAgo: 6 },
    { apt: b1Apts[2], tenant: tenants[1], amount: 180000, monthsAgo: 3 },
    { apt: b2Apts[0], tenant: tenants[2], amount: 190000, monthsAgo: 4 },
    { apt: indProps[0], tenant: tenants[3], amount: 350000, monthsAgo: 2 },
    { apt: indProps[2], tenant: tenants[4], amount: 280000, monthsAgo: 1 },
  ]

  const contracts = []
  for (const def of contractDefs) {
    const startM = M - def.monthsAgo
    const c = await prisma.contract.create({
      data: {
        userId: user.id,
        apartmentId: def.apt.id,
        tenantId: def.tenant.id,
        startDate: monthDate(Y, startM, 1),
        endDate: monthDate(Y + 2, startM, 1),
        initialAmount: def.amount,
        commissionType: 'percentage',
        commissionValue: 10
      }
    })
    contracts.push({ ...c, aptId: def.apt.id, amount: def.amount, monthsAgo: def.monthsAgo })
    await prisma.apartment.update({ where: { id: def.apt.id }, data: { status: 'ocupado' } })
  }

  // Garantes
  await prisma.contractGuarantor.createMany({
    data: [
      { contractId: contracts[0].id, guarantorId: guarantors[0].id },
      { contractId: contracts[1].id, guarantorId: guarantors[1].id },
      { contractId: contracts[2].id, guarantorId: guarantors[0].id },
      { contractId: contracts[2].id, guarantorId: guarantors[2].id },
      { contractId: contracts[3].id, guarantorId: guarantors[1].id }
    ]
  })
  console.log(`   ✅ ${contracts.length} contratos\n`)

  // ============================================================================
  // 8. OBLIGACIONES + PAGOS (poblar Cuenta Corriente, Flujo de Caja, Liquidaciones)
  // ============================================================================
  console.log('💰 Creando obligaciones y pagos...')

  let totalObligations = 0
  let totalPayments = 0

  // Helper: crear obligación + pago atomicamente
  async function createPaidObligation(data) {
    const commission = data.amount * 0.10
    const ownerAmt = data.amount - commission

    const ob = await prisma.obligation.create({
      data: {
        userId: user.id,
        contractId: data.contractId || null,
        apartmentId: data.apartmentId || null,
        type: data.type,
        category: data.category || null,
        description: data.description,
        period: data.period,
        dueDate: data.dueDate || data.period,
        amount: data.amount,
        paidAmount: data.paid ? data.amount : 0,
        paidBy: data.paidBy || 'tenant',
        chargeTo: data.chargeTo || data.paidBy || 'tenant',
        origin: data.origin || 'contract_auto',
        ownerImpact: data.ownerImpact != null ? data.ownerImpact : ownerAmt,
        agencyImpact: data.agencyImpact != null ? data.agencyImpact : commission,
        commissionAmount: data.type === 'rent' ? commission : 0,
        ownerAmount: data.type === 'rent' ? ownerAmt : 0,
        status: data.paid ? 'paid' : (data.status || 'pending'),
        isAutoGenerated: data.isAutoGenerated || false,
        notes: data.notes || null
      }
    })
    totalObligations++

    if (data.paid) {
      await prisma.obligationPayment.create({
        data: {
          userId: user.id,
          obligationId: ob.id,
          amount: data.amount,
          paymentDate: data.paymentDate || data.period,
          method: data.method || 'transfer',
          reference: data.reference || null
        }
      })
      totalPayments++
    }

    return ob
  }

  // --- 8a. ALQUILERES (rent) - meses pasados pagados, mes actual pendiente ---
  for (const c of contracts) {
    for (let i = c.monthsAgo; i >= 0; i--) {
      const mOffset = M - i
      const period = monthDate(Y, mOffset, 1)
      const dueDate = monthDate(Y, mOffset, 10)
      const isPaid = i > 0 // Meses pasados pagados, mes actual pendiente

      await createPaidObligation({
        contractId: c.id,
        apartmentId: c.aptId,
        type: 'rent',
        description: `Alquiler ${String(mOffset > 0 ? mOffset : mOffset + 12).padStart(2, '0')}/${mOffset > 0 ? Y : Y - 1}`,
        period,
        dueDate,
        amount: c.amount,
        paid: isPaid,
        paymentDate: isPaid ? monthDate(Y, mOffset, 5) : null,
        method: isPaid ? 'transfer' : null,
        isAutoGenerated: true,
        origin: 'contract_auto'
      })
    }
  }
  console.log('   ✅ Alquileres creados')

  // --- 8b. EXPENSAS (expenses) - solo tracking, paga inquilino ---
  for (const c of [contracts[0], contracts[2]]) {
    for (let i = 2; i >= 0; i--) {
      const mOffset = M - i
      const period = monthDate(Y, mOffset, 1)
      await createPaidObligation({
        contractId: c.id,
        apartmentId: c.aptId,
        type: 'expenses',
        description: `Expensas ${String(mOffset).padStart(2, '0')}/${Y}`,
        period,
        dueDate: monthDate(Y, mOffset, 15),
        amount: 25000 + Math.floor(Math.random() * 5000),
        paid: i > 0,
        paymentDate: i > 0 ? monthDate(Y, mOffset, 12) : null,
        paidBy: 'tenant',
        ownerImpact: 0,
        agencyImpact: 0,
        origin: 'tenant_ledger'
      })
    }
  }
  console.log('   ✅ Expensas creadas')

  // --- 8c. IMPUESTOS (tax) - paga propietario, se descuenta de liquidación ---
  // ABL para propiedades de Pérez
  for (let i = 2; i >= 0; i--) {
    const mOffset = M - i
    const period = monthDate(Y, mOffset, 1)
    const amount = 15000
    await createPaidObligation({
      apartmentId: b1Apts[0].id,
      type: 'tax',
      category: 'ABL',
      description: `ABL Torre Norte 1A - ${String(mOffset).padStart(2, '0')}/${Y}`,
      period,
      dueDate: monthDate(Y, mOffset, 20),
      amount,
      paid: i > 0,
      paymentDate: i > 0 ? monthDate(Y, mOffset, 18) : null,
      paidBy: 'owner',
      chargeTo: 'owner',
      ownerImpact: -amount,
      agencyImpact: 0,
      origin: 'cashflow'
    })
  }
  // ARBA para González
  for (let i = 2; i >= 0; i--) {
    const mOffset = M - i
    const period = monthDate(Y, mOffset, 1)
    const amount = 12000
    await createPaidObligation({
      apartmentId: b2Apts[0].id,
      type: 'tax',
      category: 'ARBA',
      description: `ARBA Belgrano 1A - ${String(mOffset).padStart(2, '0')}/${Y}`,
      period,
      dueDate: monthDate(Y, mOffset, 25),
      amount,
      paid: i > 0,
      paymentDate: i > 0 ? monthDate(Y, mOffset, 22) : null,
      paidBy: 'owner',
      chargeTo: 'owner',
      ownerImpact: -amount,
      agencyImpact: 0,
      origin: 'cashflow'
    })
  }
  console.log('   ✅ Impuestos creados')

  // --- 8d. SERVICIOS (service) - algunos paga inquilino, otros propietario ---
  for (let i = 2; i >= 1; i--) {
    const mOffset = M - i
    const period = monthDate(Y, mOffset, 1)
    // Luz - paga inquilino (no impacta liquidación)
    await createPaidObligation({
      contractId: contracts[0].id,
      apartmentId: b1Apts[0].id,
      type: 'service',
      category: 'Luz',
      description: `Edenor Torre Norte 1A - ${String(mOffset).padStart(2, '0')}/${Y}`,
      period,
      dueDate: monthDate(Y, mOffset, 20),
      amount: 8000 + Math.floor(Math.random() * 3000),
      paid: true,
      paymentDate: monthDate(Y, mOffset, 18),
      paidBy: 'tenant',
      ownerImpact: 0,
      agencyImpact: 0,
      origin: 'tenant_ledger'
    })
    // Gas - paga propietario (se descuenta de liquidación)
    const gasAmount = 6000 + Math.floor(Math.random() * 2000)
    await createPaidObligation({
      apartmentId: b1Apts[0].id,
      type: 'service',
      category: 'Gas',
      description: `Metrogas Torre Norte 1A - ${String(mOffset).padStart(2, '0')}/${Y}`,
      period,
      dueDate: monthDate(Y, mOffset, 22),
      amount: gasAmount,
      paid: true,
      paymentDate: monthDate(Y, mOffset, 20),
      paidBy: 'owner',
      chargeTo: 'owner',
      ownerImpact: -gasAmount,
      agencyImpact: 0,
      origin: 'cashflow'
    })
  }
  console.log('   ✅ Servicios creados')

  // --- 8e. MANTENIMIENTO (maintenance) - paga propietario ---
  const maintAmount = 45000
  await createPaidObligation({
    apartmentId: indProps[0].id,
    type: 'maintenance',
    category: 'Plomería',
    description: 'Reparación cañería Casa Palermo',
    period: monthDate(Y, M - 1, 1),
    dueDate: monthDate(Y, M - 1, 15),
    amount: maintAmount,
    paid: true,
    paymentDate: monthDate(Y, M - 1, 14),
    paidBy: 'owner',
    chargeTo: 'owner',
    ownerImpact: -maintAmount,
    agencyImpact: 0,
    origin: 'cashflow',
    method: 'cash'
  })
  console.log('   ✅ Mantenimiento creado')

  // --- 8f. INGRESOS/EGRESOS GENÉRICOS (cashflow) ---
  // Ingreso genérico: tasación
  await createPaidObligation({
    type: 'income_other',
    description: 'Tasación inmueble Av. Corrientes 2500',
    period: monthDate(Y, M - 1, 1),
    dueDate: monthDate(Y, M - 1, 10),
    amount: 50000,
    paid: true,
    paymentDate: monthDate(Y, M - 1, 8),
    paidBy: 'agency',
    chargeTo: 'agency',
    ownerImpact: 0,
    agencyImpact: 50000,
    origin: 'cashflow',
    method: 'transfer'
  })
  // Egreso genérico: gasto operativo
  await createPaidObligation({
    type: 'expense_other',
    description: 'Publicidad portales inmobiliarios - Febrero',
    period: monthDate(Y, M - 1, 1),
    dueDate: monthDate(Y, M - 1, 5),
    amount: 35000,
    paid: true,
    paymentDate: monthDate(Y, M - 1, 4),
    paidBy: 'agency',
    chargeTo: 'agency',
    ownerImpact: 0,
    agencyImpact: -35000,
    origin: 'cashflow',
    method: 'transfer'
  })
  console.log('   ✅ Movimientos de caja creados')

  // --- 8g. DEUDA pendiente (debt) ---
  await createPaidObligation({
    contractId: contracts[0].id,
    apartmentId: b1Apts[0].id,
    type: 'debt',
    description: 'Diferencia alquiler mes anterior - Sofía Martínez',
    period: monthDate(Y, M, 1),
    dueDate: monthDate(Y, M, 15),
    amount: 12000,
    paid: false,
    paidBy: 'tenant',
    chargeTo: 'tenant',
    ownerImpact: 0,
    agencyImpact: 12000,
    status: 'pending',
    origin: 'tenant_ledger'
  })
  console.log('   ✅ Deudas creadas')

  console.log(`\n   📊 Total: ${totalObligations} obligaciones, ${totalPayments} pagos\n`)

  // ============================================================================
  // 9. LIQUIDACIONES (mes anterior - settled, mes actual - pending)
  // ============================================================================
  console.log('📋 Creando liquidaciones...')

  const prevMonth = monthDate(Y, M - 1, 1)
  const curMonth = monthDate(Y, M, 1)

  // Liquidación mes anterior para Pérez (settled)
  await prisma.settlement.upsert({
    where: { userId_ownerId_period: { userId: user.id, ownerId: owners[0].id, period: prevMonth } },
    update: {},
    create: {
      userId: user.id,
      ownerId: owners[0].id,
      period: prevMonth,
      totalCollected: 150000 + 180000 + 280000, // 3 contratos de Pérez
      commissionAmount: 61000,
      deductions: 15000 + 7000, // ABL + Gas
      ownerAmount: 150000 + 180000 + 280000 - 61000 - 22000,
      status: 'settled',
      settledAt: monthDate(Y, M - 1, 28),
      paymentMethod: 'transfer',
      reference: 'TRF-2025-001'
    }
  })

  // Liquidación mes anterior para González (settled)
  await prisma.settlement.upsert({
    where: { userId_ownerId_period: { userId: user.id, ownerId: owners[1].id, period: prevMonth } },
    update: {},
    create: {
      userId: user.id,
      ownerId: owners[1].id,
      period: prevMonth,
      totalCollected: 190000,
      commissionAmount: 19000,
      deductions: 12000, // ARBA
      ownerAmount: 190000 - 19000 - 12000,
      status: 'settled',
      settledAt: monthDate(Y, M - 1, 28),
      paymentMethod: 'transfer',
      reference: 'TRF-2025-002'
    }
  })

  // Liquidación mes anterior para Fernández (settled)
  await prisma.settlement.upsert({
    where: { userId_ownerId_period: { userId: user.id, ownerId: owners[2].id, period: prevMonth } },
    update: {},
    create: {
      userId: user.id,
      ownerId: owners[2].id,
      period: prevMonth,
      totalCollected: 350000,
      commissionAmount: 35000,
      deductions: 45000, // Mantenimiento
      ownerAmount: 350000 - 35000 - 45000,
      status: 'settled',
      settledAt: monthDate(Y, M - 1, 29),
      paymentMethod: 'transfer',
      reference: 'TRF-2025-003'
    }
  })

  console.log('   ✅ 3 liquidaciones del mes anterior (settled)')
  console.log('   ℹ️  Las del mes actual se calculan automáticamente\n')

  // ============================================================================
  // RESUMEN FINAL
  // ============================================================================
  console.log('='.repeat(60))
  console.log('🎉 SEED COMPLETADO EXITOSAMENTE')
  console.log('='.repeat(60))
  console.log('')
  console.log('📊 RESUMEN:')
  console.log(`   👤 Usuario: demo@inmodash.com / demo123`)
  console.log(`   🏠 Propietarios: ${owners.length}`)
  console.log(`   🛡️ Garantes: ${guarantors.length}`)
  console.log(`   👥 Inquilinos: ${tenants.length}`)
  console.log(`   🏢 Edificios: 2 (${b1Apts.length} + ${b2Apts.length} deptos)`)
  console.log(`   🏡 Propiedades independientes: ${indProps.length}`)
  console.log(`   📄 Contratos: ${contracts.length}`)
  console.log(`   💰 Obligaciones: ${totalObligations}`)
  console.log(`   💳 Pagos: ${totalPayments}`)
  console.log(`   📋 Liquidaciones: 3 (settled)`)
  console.log('')
  console.log('🔐 CREDENCIALES:')
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
