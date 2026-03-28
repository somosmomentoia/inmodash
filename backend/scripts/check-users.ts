/**
 * Script para verificar Users (owners) vs StaffUsers
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verificando estructura de usuarios\n')
  console.log('═'.repeat(60))

  // User (Owner/Agencia)
  console.log('\n👑 USERS (Owners/Agencias) - Acceso Total Automático')
  console.log('─'.repeat(60))
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      _count: {
        select: {
          staffUsers: true,
        },
      },
    },
  })

  users.forEach(user => {
    console.log(`📧 ${user.email}`)
    console.log(`   Nombre: ${user.name || 'N/A'}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Staff users: ${user._count.staffUsers}`)
    console.log(`   Tipo: OWNER (acceso total sin permisos granulares)`)
    console.log()
  })

  // StaffUser
  console.log('👥 STAFF USERS - Sistema de Permisos Granulares')
  console.log('─'.repeat(60))
  const staffUsers = await prisma.staffUser.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      agencyId: true,
      _count: {
        select: {
          permissions: true,
        },
      },
    },
  })

  if (staffUsers.length === 0) {
    console.log('   (No hay staff users creados)\n')
  } else {
    staffUsers.forEach(staff => {
      console.log(`📧 ${staff.email}`)
      console.log(`   Nombre: ${staff.name}`)
      console.log(`   ID: ${staff.id}`)
      console.log(`   Rol: ${staff.role}`)
      console.log(`   Estado: ${staff.isActive ? 'Activo' : 'Inactivo'}`)
      console.log(`   Agencia ID: ${staff.agencyId}`)
      console.log(`   Permisos: ${staff._count.permissions}`)
      console.log(`   Tipo: STAFF (permisos granulares según rol)`)
      console.log()
    })
  }

  console.log('═'.repeat(60))
  console.log('\n📋 RESUMEN DE ARQUITECTURA:')
  console.log('─'.repeat(60))
  console.log('1. USER (Owner/Agencia):')
  console.log('   - Es el dueño de la inmobiliaria')
  console.log('   - Acceso TOTAL automático a todo')
  console.log('   - NO usa sistema de permisos granulares')
  console.log('   - Se autentica con /api/auth/login')
  console.log('   - Puede crear staff users para su agencia')
  console.log()
  console.log('2. STAFF USER:')
  console.log('   - Empleado de una agencia específica')
  console.log('   - Acceso controlado por permisos granulares')
  console.log('   - Tiene un rol (ADMIN, MANAGER, ACCOUNTING, etc.)')
  console.log('   - Se autentica con /api/staff/login')
  console.log('   - Pertenece a una agencia (agencyId)')
  console.log()
  console.log('3. STAFF con rol ADMIN:')
  console.log('   - Es un empleado con permisos de administrador')
  console.log('   - Tiene acceso total PERO sigue siendo staff')
  console.log('   - NO es lo mismo que el Owner')
  console.log('   - Puede gestionar otros staff de su agencia')
  console.log()
  console.log('⚠️  NO HAY CONFLICTO:')
  console.log('   - Owner y Staff ADMIN son roles diferentes')
  console.log('   - Owner = Dueño de la inmobiliaria (acceso total)')
  console.log('   - Staff ADMIN = Empleado con permisos de admin')
  console.log('   - Usan endpoints de login diferentes')
  console.log('   - El middleware auth.ts los distingue correctamente')
  console.log()
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
