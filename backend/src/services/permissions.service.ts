/**
 * Permissions Service
 * Gestión de permisos de usuarios internos (staff)
 */

import { PrismaClient } from '@prisma/client'
import { getPermissionsForRole } from '../lib/permissions/templates'
import { assignRolePermissions } from '../lib/permissions'

const prisma = new PrismaClient()

/**
 * Obtiene los templates de permisos por rol
 */
export async function getPermissionTemplates() {
  const roles = [
    'ADMIN',
    'MANAGER',
    'ACCOUNTING',
    'COLLECTIONS',
    'LEASING',
    'MAINTENANCE',
    'READ_ONLY',
  ]

  return roles.map((role) => ({
    role,
    permissions: getPermissionsForRole(role),
  }))
}

/**
 * Obtiene el template de permisos para un rol específico
 */
export async function getPermissionTemplateByRole(role: string) {
  return getPermissionsForRole(role)
}

/**
 * Obtiene los permisos de un staff user
 */
export async function getStaffPermissions(staffUserId: number, agencyId: number) {
  // Verificar que el staff user pertenezca a la agencia
  const staffUser = await prisma.staffUser.findFirst({
    where: { id: staffUserId, agencyId },
  })

  if (!staffUser) {
    throw new Error('Staff user not found')
  }

  // Obtener permisos personalizados
  const permissions = await prisma.userPermission.findMany({
    where: { staffUserId },
    select: {
      module: true,
      action: true,
      allowed: true,
    },
  })

  return {
    staffUser: {
      id: staffUser.id,
      email: staffUser.email,
      name: staffUser.name,
      role: staffUser.role,
    },
    permissions,
  }
}

/**
 * Asigna permisos personalizados a un staff user
 */
export async function assignCustomPermissions(
  staffUserId: number,
  agencyId: number,
  permissions: Array<{ module: string; action: string; allowed: boolean }>
) {
  // Verificar que el staff user pertenezca a la agencia
  const staffUser = await prisma.staffUser.findFirst({
    where: { id: staffUserId, agencyId },
  })

  if (!staffUser) {
    throw new Error('Staff user not found')
  }

  // Eliminar permisos existentes
  await prisma.userPermission.deleteMany({
    where: { staffUserId },
  })

  // Crear nuevos permisos
  await prisma.userPermission.createMany({
    data: permissions.map((p) => ({
      staffUserId,
      module: p.module,
      action: p.action,
      allowed: p.allowed,
    })),
  })

  return {
    success: true,
    message: 'Permissions updated successfully',
  }
}

/**
 * Resetea los permisos de un staff user a los del template de su rol
 */
export async function resetToRolePermissions(
  staffUserId: number,
  agencyId: number
) {
  // Verificar que el staff user pertenezca a la agencia
  const staffUser = await prisma.staffUser.findFirst({
    where: { id: staffUserId, agencyId },
  })

  if (!staffUser) {
    throw new Error('Staff user not found')
  }

  // Asignar permisos del rol
  await assignRolePermissions(staffUserId, staffUser.role)

  return {
    success: true,
    message: 'Permissions reset to role template',
  }
}
