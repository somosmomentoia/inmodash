const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test user
  const passwordHash = await argon2.hash('password123')
  const user = await prisma.user.upsert({
    where: { email: 'test@inmodash.com' },
    update: {},
    create: {
      email: 'test@inmodash.com',
      passwordHash,
      name: 'Usuario Test',
      role: 'user',
      isEmailVerified: true,
      companyName: 'Inmobiliaria Test',
      companyTaxId: '30-12345678-9',
      companyAddress: 'Av. Corrientes 1234',
      companyCity: 'Buenos Aires',
      companyState: 'CABA',
      companyCountry: 'Argentina',
      subscriptionStatus: 'active',
      subscriptionPlan: 'professional',
    },
  })
  console.log('✅ User created:', user.email)

  // Create owners
  const owners = await Promise.all([
    prisma.owner.create({
      data: {
        userId: user.id,
        name: 'Juan Carlos Pérez',
        dniOrCuit: '20-12345678-9',
        phone: '+54 9 11 1234-5678',
        email: 'jcperez@email.com',
        address: 'Av. Santa Fe 1500, CABA',
        bankAccount: 'CBU: 0000000000000000000001',
        balance: 0,
      },
    }),
    prisma.owner.create({
      data: {
        userId: user.id,
        name: 'María Elena González',
        dniOrCuit: '27-23456789-2',
        phone: '+54 9 11 2345-6789',
        email: 'megonzalez@email.com',
        address: 'Callao 800, CABA',
        bankAccount: 'Alias: maria.gonzalez',
        balance: 0,
      },
    }),
    prisma.owner.create({
      data: {
        userId: user.id,
        name: 'Roberto Fernández',
        dniOrCuit: '20-34567890-1',
        phone: '+54 9 11 3456-7890',
        email: 'rfernandez@email.com',
        address: 'Belgrano 2000, CABA',
        bankAccount: 'CBU: 0000000000000000000003',
        balance: 0,
      },
    }),
    prisma.owner.create({
      data: {
        userId: user.id,
        name: 'Facundo Esquivel',
        dniOrCuit: '78978589',
        phone: '+543794787878',
        email: 'facu@esqui.com',
        address: 'Corrientes 500, CABA',
        bankAccount: 'Alias: facu.esquivel',
        balance: 0,
      },
    }),
    prisma.owner.create({
      data: {
        userId: user.id,
        name: 'Candelaria Ganora',
        dniOrCuit: '27429945645',
        phone: '3795597886',
        email: 'pradoignacio.utn@icloud.com',
        address: 'Lavalle 1200, CABA',
        bankAccount: 'CBU: 0000000000000000000005',
        balance: 0,
      },
    }),
  ])
  console.log('✅ Owners created:', owners.length)

  // Create buildings
  const buildings = await Promise.all([
    prisma.building.create({
      data: {
        userId: user.id,
        name: 'Edificio Palermo',
        address: 'Av. Santa Fe 3500, Palermo',
        city: 'Buenos Aires',
        province: 'CABA',
        owner: 'Consorcio Palermo',
        ownerId: owners[0].id,
        floors: 10,
        totalArea: 2500,
      },
    }),
    prisma.building.create({
      data: {
        userId: user.id,
        name: 'Torre Belgrano',
        address: 'Cabildo 2000, Belgrano',
        city: 'Buenos Aires',
        province: 'CABA',
        owner: 'Consorcio Belgrano',
        ownerId: owners[1].id,
        floors: 15,
        totalArea: 3000,
      },
    }),
    prisma.building.create({
      data: {
        userId: user.id,
        name: 'Complejo Recoleta',
        address: 'Av. Alvear 1800, Recoleta',
        city: 'Buenos Aires',
        province: 'CABA',
        owner: 'Consorcio Recoleta',
        ownerId: owners[2].id,
        floors: 8,
        totalArea: 2000,
      },
    }),
  ])
  console.log('✅ Buildings created:', buildings.length)

  // Create apartments
  const apartments = await Promise.all([
    // Edificio Palermo - some available, some rented
    prisma.apartment.create({
      data: {
        userId: user.id,
        buildingId: buildings[0].id,
        ownerId: owners[0].id,
        uniqueId: 'PAL-1A',
        floor: 1,
        apartmentLetter: 'A',
        nomenclature: '1°A - Palermo',
        propertyType: 'departamento',
        area: 65,
        rooms: 2,
        areaPercentage: 2.6,
        roomPercentage: 2.5,
        status: 'disponible',
        saleStatus: 'no_en_venta',
      },
    }),
    prisma.apartment.create({
      data: {
        userId: user.id,
        buildingId: buildings[0].id,
        ownerId: owners[0].id,
        uniqueId: 'PAL-1B',
        floor: 1,
        apartmentLetter: 'B',
        nomenclature: '1°B - Palermo',
        propertyType: 'departamento',
        area: 55,
        rooms: 1,
        areaPercentage: 2.2,
        roomPercentage: 2.0,
        status: 'alquilado',
        saleStatus: 'no_en_venta',
      },
    }),
    prisma.apartment.create({
      data: {
        userId: user.id,
        buildingId: buildings[0].id,
        ownerId: owners[1].id,
        uniqueId: 'PAL-2A',
        floor: 2,
        apartmentLetter: 'A',
        nomenclature: '2°A - Palermo',
        propertyType: 'departamento',
        area: 80,
        rooms: 3,
        areaPercentage: 3.2,
        roomPercentage: 3.0,
        status: 'disponible',
        saleStatus: 'no_en_venta',
      },
    }),
    // Torre Belgrano
    prisma.apartment.create({
      data: {
        userId: user.id,
        buildingId: buildings[1].id,
        ownerId: owners[1].id,
        uniqueId: 'BEL-5A',
        floor: 5,
        apartmentLetter: 'A',
        nomenclature: '5°A - Belgrano',
        propertyType: 'departamento',
        area: 120,
        rooms: 4,
        areaPercentage: 4.0,
        roomPercentage: 4.0,
        status: 'disponible',
        saleStatus: 'no_en_venta',
      },
    }),
    prisma.apartment.create({
      data: {
        userId: user.id,
        buildingId: buildings[1].id,
        ownerId: owners[2].id,
        uniqueId: 'BEL-10B',
        floor: 10,
        apartmentLetter: 'B',
        nomenclature: '10°B - Belgrano',
        propertyType: 'departamento',
        area: 95,
        rooms: 3,
        areaPercentage: 3.2,
        roomPercentage: 3.0,
        status: 'alquilado',
        saleStatus: 'no_en_venta',
      },
    }),
    // Complejo Recoleta
    prisma.apartment.create({
      data: {
        userId: user.id,
        buildingId: buildings[2].id,
        ownerId: owners[2].id,
        uniqueId: 'REC-3C',
        floor: 3,
        apartmentLetter: 'C',
        nomenclature: '3°C - Recoleta',
        propertyType: 'departamento',
        area: 150,
        rooms: 5,
        areaPercentage: 7.5,
        roomPercentage: 5.0,
        status: 'disponible',
        saleStatus: 'no_en_venta',
      },
    }),
    // Propiedades independientes
    prisma.apartment.create({
      data: {
        userId: user.id,
        ownerId: owners[3].id,
        uniqueId: 'CASA-001',
        nomenclature: 'Casa en Núñez',
        fullAddress: 'Av. del Libertador 7500, Núñez',
        city: 'Buenos Aires',
        province: 'CABA',
        propertyType: 'casa',
        area: 200,
        rooms: 4,
        areaPercentage: 100,
        roomPercentage: 100,
        status: 'disponible',
        saleStatus: 'no_en_venta',
      },
    }),
    prisma.apartment.create({
      data: {
        userId: user.id,
        ownerId: owners[4].id,
        uniqueId: 'LOCAL-001',
        nomenclature: 'Local Comercial Centro',
        fullAddress: 'Florida 500, Microcentro',
        city: 'Buenos Aires',
        province: 'CABA',
        propertyType: 'local',
        area: 80,
        rooms: 1,
        areaPercentage: 100,
        roomPercentage: 100,
        status: 'disponible',
        saleStatus: 'no_en_venta',
      },
    }),
  ])
  console.log('✅ Apartments created:', apartments.length)

  // Create tenants
  const tenants = await Promise.all([
    prisma.tenant.create({
      data: {
        userId: user.id,
        nameOrBusiness: 'Carlos Alberto Rodríguez',
        dniOrCuit: '25-98765432-1',
        address: 'Av. Rivadavia 5000, CABA',
        contactName: 'Carlos Rodríguez',
        contactPhone: '+54 9 11 5555-1234',
        contactEmail: 'carodriguez@email.com',
        contactAddress: 'Av. Rivadavia 5000, CABA',
      },
    }),
    prisma.tenant.create({
      data: {
        userId: user.id,
        nameOrBusiness: 'Empresa Tech SA',
        dniOrCuit: '30-71234567-8',
        address: 'Puerto Madero, CABA',
        contactName: 'Juan Director',
        contactPhone: '+54 11 4444-5678',
        contactEmail: 'contacto@empresatech.com',
        contactAddress: 'Puerto Madero, CABA',
      },
    }),
    prisma.tenant.create({
      data: {
        userId: user.id,
        nameOrBusiness: 'Laura Martínez',
        dniOrCuit: '28-87654321-0',
        address: 'Caballito, CABA',
        contactName: 'Laura Martínez',
        contactPhone: '+54 9 11 6666-7890',
        contactEmail: 'lmartinez@email.com',
        contactAddress: 'Caballito, CABA',
      },
    }),
  ])
  console.log('✅ Tenants created:', tenants.length)

  // Create guarantors
  const guarantors = await Promise.all([
    prisma.guarantor.create({
      data: {
        userId: user.id,
        name: 'Pedro Sánchez',
        dni: '22112233',
        phone: '+54 9 11 7777-1111',
        email: 'psanchez@email.com',
        address: 'San Isidro, Buenos Aires',
      },
    }),
    prisma.guarantor.create({
      data: {
        userId: user.id,
        name: 'Ana García',
        dni: '24556677',
        phone: '+54 9 11 8888-2222',
        email: 'agarcia@email.com',
        address: 'Vicente López, Buenos Aires',
      },
    }),
  ])
  console.log('✅ Guarantors created:', guarantors.length)

  // Skip contracts and obligations for now - basic data is enough to test UI

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📝 Login credentials:')
  console.log('   Email: test@inmodash.com')
  console.log('   Password: password123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
