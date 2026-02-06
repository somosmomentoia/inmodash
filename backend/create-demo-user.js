const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Creando cuenta demo...\n')

  // Verificar si ya existe el usuario demo
  const existingUser = await prisma.user.findUnique({
    where: { email: 'demo@inmodash.com' }
  })

  if (existingUser) {
    console.log('✅ Usuario demo ya existe:', existingUser.email)
    console.log('   ID:', existingUser.id)
    return existingUser
  }

  // Crear hash de la contraseña
  const passwordHash = await argon2.hash('demo1234')

  // Crear usuario demo
  const user = await prisma.user.create({
    data: {
      email: 'demo@inmodash.com',
      passwordHash: passwordHash,
      name: 'Inmobiliaria Demo',
      companyName: 'Inmobiliaria Demo',
      phone: '+54 11 1234-5678',
      companyAddress: 'Av. Corrientes 1234, CABA',
      subscriptionStatus: 'active',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    }
  })

  console.log('✅ Usuario demo creado exitosamente!')
  console.log('   Email:', user.email)
  console.log('   Password: demo1234')
  console.log('   ID:', user.id)

  return user
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
