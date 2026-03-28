/**
 * Script para regenerar permisos de todos los staff users
 */

import { PrismaClient } from '@prisma/client'
import { assignRolePermissions } from '../src/lib/permissions'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Regenerando permisos de todos los staff users...\n')

  const staffUsers = await prisma.staffUser.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  })

  console.log(`📊 Total de usuarios encontrados: ${staffUsers.length}\n`)

  for (const user of staffUsers) {
    console.log(`👤 ${user.name} (${user.email})`)
    console.log(`   Rol: ${user.role}`)
    console.log(`   Estado: ${user.isActive ? 'Activo' : 'Inactivo'}`)

    try {
      // Contar permisos antes
      const permissionsBefore = await prisma.userPermission.count({
        where: { staffUserId: user.id },
      })
      console.log(`   Permisos antes: ${permissionsBefore}`)

      // Regenerar permisos
      await assignRolePermissions(user.id, user.role)

      // Contar permisos después
      const permissionsAfter = await prisma.userPermission.count({
        where: { staffUserId: user.id },
      })
      const allowedCount = await prisma.userPermission.count({
        where: { staffUserId: user.id, allowed: true },
      })
      const deniedCount = await prisma.userPermission.count({
        where: { staffUserId: user.id, allowed: false },
      })

      console.log(`   Permisos después: ${permissionsAfter} (✓ ${allowedCount} | ✗ ${deniedCount})`)
      console.log(`   ✅ Regenerado exitosamente\n`)
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
    }
  }

  console.log('✅ Proceso completado')
}

main()
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
