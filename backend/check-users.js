const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyName: true
      }
    })

    console.log('\n📋 Usuarios en la base de datos:\n')
    users.forEach(user => {
      console.log(`ID: ${user.id}`)
      console.log(`Email: ${user.email}`)
      console.log(`Nombre: ${user.name}`)
      console.log(`Empresa: ${user.companyName || 'N/A'}`)
      console.log(`Rol: ${user.role}`)
      console.log('---')
    })

    console.log(`\nTotal: ${users.length} usuario(s)\n`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
