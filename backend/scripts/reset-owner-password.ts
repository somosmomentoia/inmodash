/**
 * Script para resetear la contraseña del Owner
 */

import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  const email = 'pradoignacio.utn@icloud.com'
  const newPassword = 'Admin123!' // Contraseña temporal
  
  console.log(`🔐 Reseteando contraseña para: ${email}\n`)

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.log('❌ Usuario no encontrado')
    return
  }

  console.log(`✅ Usuario encontrado: ${user.name}`)
  console.log(`   Hash actual (longitud): ${user.passwordHash?.length || 0}`)
  console.log()

  // Generar nuevo hash argon2
  console.log('🔨 Generando nuevo hash argon2...')
  const passwordHash = await argon2.hash(newPassword)
  console.log(`   Nuevo hash (longitud): ${passwordHash.length}`)
  console.log(`   Formato válido: ${passwordHash.startsWith('$argon2') ? 'Sí' : 'No'}`)
  console.log()

  // Actualizar en DB
  console.log('💾 Actualizando en base de datos...')
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  })

  console.log('✅ Contraseña actualizada exitosamente')
  console.log()
  console.log('📝 Credenciales de acceso:')
  console.log(`   Email: ${email}`)
  console.log(`   Contraseña: ${newPassword}`)
  console.log()
  console.log('⚠️  IMPORTANTE: Cambia esta contraseña después del primer login')
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
