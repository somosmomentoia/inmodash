/**
 * Script para verificar que el Owner puede autenticarse
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const email = 'pradoignacio.utn@icloud.com'
  
  console.log(`🔍 Verificando autenticación del Owner: ${email}\n`)

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.log('❌ Usuario no encontrado')
    return
  }

  console.log(`✅ Usuario encontrado:`)
  console.log(`   ID: ${user.id}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Nombre: ${user.name}`)
  console.log(`   Tiene password hash: ${user.passwordHash ? 'Sí' : 'No'}`)
  console.log(`   Longitud del hash: ${user.passwordHash?.length || 0}`)
  console.log()

  if (!user.passwordHash) {
    console.log('⚠️  PROBLEMA: El usuario no tiene contraseña configurada')
    console.log('   Esto puede pasar si el usuario se creó sin contraseña')
    console.log()
    console.log('💡 SOLUCIÓN: Necesitás resetear la contraseña')
    console.log('   Opción 1: Usar el endpoint /api/auth/forgot-password')
    console.log('   Opción 2: Actualizar manualmente en la DB')
    return
  }

  // Verificar que el hash es válido
  console.log('🔐 Verificando formato del hash...')
  const isBcryptHash = user.passwordHash.startsWith('$2b$') || user.passwordHash.startsWith('$2a$')
  
  if (isBcryptHash) {
    console.log('✅ El hash tiene formato bcrypt válido')
  } else {
    console.log('❌ El hash NO tiene formato bcrypt válido')
    console.log('   Esto puede causar problemas en el login')
  }

  console.log()
  console.log('📝 Para probar el login:')
  console.log('   POST http://localhost:3001/api/auth/login')
  console.log('   Body: { "email": "pradoignacio.utn@icloud.com", "password": "tu_contraseña" }')
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
