/**
 * Script para verificar permisos del rol MAINTENANCE
 */

import { PrismaClient } from '@prisma/client'
import { getPermissionsForRole } from '../src/lib/permissions/templates'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verificando template de permisos para MAINTENANCE\n')

  const template = getPermissionsForRole('MAINTENANCE')
  
  const allowed = template.filter(p => p.allowed)
  const denied = template.filter(p => !p.allowed)

  console.log(`📊 Total de permisos en template: ${template.length}`)
  console.log(`✓ Permitidos: ${allowed.length}`)
  console.log(`✗ Denegados: ${denied.length}\n`)

  console.log('✅ Permisos PERMITIDOS para MAINTENANCE:')
  console.log('─'.repeat(50))
  
  const allowedByModule: Record<string, string[]> = {}
  allowed.forEach(p => {
    if (!allowedByModule[p.module]) allowedByModule[p.module] = []
    allowedByModule[p.module].push(p.action)
  })

  Object.entries(allowedByModule).forEach(([module, actions]) => {
    console.log(`📦 ${module}: ${actions.join(', ')}`)
  })

  console.log('\n❌ Permisos DENEGADOS para MAINTENANCE:')
  console.log('─'.repeat(50))
  
  const deniedByModule: Record<string, string[]> = {}
  denied.forEach(p => {
    if (!deniedByModule[p.module]) deniedByModule[p.module] = []
    deniedByModule[p.module].push(p.action)
  })

  Object.entries(deniedByModule).forEach(([module, actions]) => {
    console.log(`📦 ${module}: ${actions.join(', ')}`)
  })
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
