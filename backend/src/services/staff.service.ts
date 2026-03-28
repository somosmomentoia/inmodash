/**
 * Staff Service
 * Gestión de usuarios internos (staff) de la agencia
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { assignRolePermissions } from '../lib/permissions'

const prisma = new PrismaClient()

export interface CreateStaffUserDto {
  email: string
  password: string
  name: string
  role: string
}

export interface UpdateStaffUserDto {
  email?: string
  name?: string
  role?: string
  isActive?: boolean
}

/**
 * Lista todos los staff users de una agencia
 */
export async function listStaffUsers(agencyId: number) {
  return prisma.staffUser.findMany({
    where: { agencyId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Obtiene un staff user por ID
 */
export async function getStaffUser(id: number, agencyId: number) {
  return prisma.staffUser.findFirst({
    where: { id, agencyId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

/**
 * Crea un nuevo staff user
 */
export async function createStaffUser(
  agencyId: number,
  data: CreateStaffUserDto
) {
  // Verificar que el email no exista
  const existing = await prisma.staffUser.findUnique({
    where: { email: data.email },
  })

  if (existing) {
    throw new Error('Email already in use')
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10)

  // Crear staff user
  const staffUser = await prisma.staffUser.create({
    data: {
      agencyId,
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role as any,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  })

  // Asignar permisos basados en el rol (template)
  await assignRolePermissions(staffUser.id, data.role)

  return staffUser
}

/**
 * Actualiza un staff user
 */
export async function updateStaffUser(
  id: number,
  agencyId: number,
  data: UpdateStaffUserDto
) {
  // Verificar que el staff user pertenezca a la agencia
  const existing = await prisma.staffUser.findFirst({
    where: { id, agencyId },
  })

  if (!existing) {
    throw new Error('Staff user not found')
  }

  // Si se cambia el email, verificar que no exista
  if (data.email && data.email !== existing.email) {
    const emailExists = await prisma.staffUser.findUnique({
      where: { email: data.email },
    })

    if (emailExists) {
      throw new Error('Email already in use')
    }
  }

  // Actualizar staff user
  const updated = await prisma.staffUser.update({
    where: { id },
    data: {
      email: data.email,
      name: data.name,
      role: data.role as any,
      isActive: data.isActive,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  })

  // Si se cambió el rol, actualizar permisos
  if (data.role && data.role !== existing.role) {
    await assignRolePermissions(id, data.role)
  }

  return updated
}

/**
 * Elimina (desactiva) un staff user
 */
export async function deleteStaffUser(id: number, agencyId: number) {
  // Verificar que el staff user pertenezca a la agencia
  const existing = await prisma.staffUser.findFirst({
    where: { id, agencyId },
  })

  if (!existing) {
    throw new Error('Staff user not found')
  }

  // Soft delete: marcar como inactivo
  return prisma.staffUser.update({
    where: { id },
    data: { isActive: false },
    select: {
      id: true,
      isActive: true,
    },
  })
}

/**
 * Cambia la contraseña de un staff user
 */
export async function changeStaffPassword(
  id: number,
  agencyId: number,
  newPassword: string
) {
  // Verificar que el staff user pertenezca a la agencia
  const existing = await prisma.staffUser.findFirst({
    where: { id, agencyId },
  })

  if (!existing) {
    throw new Error('Staff user not found')
  }

  // Hash password
  const passwordHash = await bcrypt.hash(newPassword, 10)

  // Actualizar contraseña
  return prisma.staffUser.update({
    where: { id },
    data: { passwordHash },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })
}

/**
 * Regenera los permisos de todos los staff users basándose en sus roles
 * TEMPORAL: Solo para migración después del fix de permisos
 */
export async function regenerateAllPermissions(agencyId: number) {
  // Obtener todos los staff users de la agencia
  const staffUsers = await prisma.staffUser.findMany({
    where: { agencyId },
    select: {
      id: true,
      role: true,
      name: true,
    },
  })

  const results = []

  for (const user of staffUsers) {
    try {
      await assignRolePermissions(user.id, user.role)
      results.push({
        id: user.id,
        name: user.name,
        role: user.role,
        success: true,
      })
    } catch (error) {
      results.push({
        id: user.id,
        name: user.name,
        role: user.role,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return {
    total: staffUsers.length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  }
}
