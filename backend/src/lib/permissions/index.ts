/**
 * Sistema de Permisos - Helpers y utilidades
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface PermissionCheck {
  hasPermission: boolean
  reason?: string
}

/**
 * Verifica si un staff user tiene un permiso específico
 * @param staffUserId - ID del staff user
 * @param module - Módulo (ej: 'contracts', 'finances')
 * @param action - Acción (ej: 'view', 'create', 'settle')
 * @returns Promise<PermissionCheck>
 */
export async function checkStaffPermission(
  staffUserId: number,
  module: string,
  action: string
): Promise<PermissionCheck> {
  try {
    // Buscar el staff user con su rol
    const staffUser = await prisma.staffUser.findUnique({
      where: { id: staffUserId },
      include: {
        permissions: {
          where: {
            module,
            action,
          },
        },
      },
    })

    if (!staffUser) {
      return { hasPermission: false, reason: 'Staff user not found' }
    }

    if (!staffUser.isActive) {
      return { hasPermission: false, reason: 'Staff user is inactive' }
    }

    // Si el rol es ADMIN, permitir todo (bypass)
    if (staffUser.role === 'ADMIN') {
      return { hasPermission: true }
    }

    // Verificar permiso específico en la tabla UserPermission
    const permission = staffUser.permissions.find(
      (p) => p.module === module && p.action === action
    )

    if (!permission) {
      return { hasPermission: false, reason: 'Permission not found' }
    }

    return { hasPermission: permission.allowed }
  } catch (error) {
    console.error('Error checking staff permission:', error)
    return { hasPermission: false, reason: 'Error checking permission' }
  }
}

/**
 * Verifica si un usuario (owner o staff) tiene permiso
 * @param userId - ID del User (agencia owner)
 * @param staffUserId - ID del StaffUser (null si es owner)
 * @param module - Módulo
 * @param action - Acción
 * @returns Promise<PermissionCheck>
 */
export async function checkPermission(
  userId: number,
  staffUserId: number | null,
  module: string,
  action: string
): Promise<PermissionCheck> {
  // Si no hay staffUserId, es el owner de la agencia (acceso total)
  if (!staffUserId) {
    return { hasPermission: true, reason: 'Agency owner has full access' }
  }

  // Si hay staffUserId, verificar permisos del staff
  return checkStaffPermission(staffUserId, module, action)
}

/**
 * Obtiene todos los permisos de un staff user agrupados por módulo
 */
export async function getStaffPermissions(staffUserId: number) {
  const permissions = await prisma.userPermission.findMany({
    where: {
      staffUserId,
      allowed: true,
    },
    select: {
      module: true,
      action: true,
    },
  })

  // Agrupar por módulo
  const grouped: Record<string, string[]> = {}
  permissions.forEach((p) => {
    if (!grouped[p.module]) {
      grouped[p.module] = []
    }
    grouped[p.module].push(p.action)
  })

  return grouped
}

/**
 * Asigna permisos a un staff user basado en su rol (template)
 */
export async function assignRolePermissions(
  staffUserId: number,
  role: string
): Promise<void> {
  // Importar templates dinámicamente para evitar circular deps
  const { getPermissionsForRole } = await import('./templates')

  const permissions = getPermissionsForRole(role)

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
}
