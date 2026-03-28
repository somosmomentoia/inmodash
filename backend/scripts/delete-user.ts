/**
 * Script para eliminar usuario staff específico
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'crisacevedo78@hotmail.com'
  
  console.log(`🔍 Buscando usuario: ${email}\n`)

  const user = await prisma.staffUser.findUnique({
    where: { email },
    include: {
      permissions: true,
    },
  })

  if (!user) {
    console.log('❌ Usuario no encontrado')
    return
  }

  console.log(`👤 Usuario encontrado:`)
  console.log(`   ID: ${user.id}`)
  console.log(`   Nombre: ${user.name}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Rol: ${user.role}`)
  console.log(`   Permisos: ${user.permissions.length}\n`)

  console.log('🗑️  Eliminando permisos...')
  await prisma.userPermission.deleteMany({
    where: { staffUserId: user.id },
  })

  console.log('🗑️  Eliminando usuario...')
  await prisma.staffUser.delete({
    where: { id: user.id },
  })

  console.log('✅ Usuario eliminado exitosamente')
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
