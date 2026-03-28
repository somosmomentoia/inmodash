/**
 * Autenticación para Staff Users
 * Maneja login y tokens JWT para empleados de la agencia
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { createToken } from './jwt'

const prisma = new PrismaClient()

export interface StaffLoginResult {
  success: boolean
  token?: string
  staffUser?: {
    id: number
    agencyId: number
    email: string
    name: string
    role: string
  }
  error?: string
}

/**
 * Login para staff users
 * @param email - Email del staff user
 * @param password - Password
 * @returns StaffLoginResult
 */
export async function staffLogin(
  email: string,
  password: string
): Promise<StaffLoginResult> {
  try {
    // Buscar staff user
    const staffUser = await prisma.staffUser.findUnique({
      where: { email },
      include: {
        agency: true,
      },
    })

    if (!staffUser) {
      return { success: false, error: 'Invalid credentials' }
    }

    if (!staffUser.isActive) {
      return { success: false, error: 'Account is inactive' }
    }

    // Verificar password
    const passwordMatch = await bcrypt.compare(password, staffUser.passwordHash)
    if (!passwordMatch) {
      return { success: false, error: 'Invalid credentials' }
    }

    // Actualizar lastLoginAt
    await prisma.staffUser.update({
      where: { id: staffUser.id },
      data: { lastLoginAt: new Date() },
    })

    // Crear token JWT con información de staff
    const token = createToken({
      userId: staffUser.agencyId,      // ID de la agencia
      email: staffUser.email,
      role: staffUser.role,
      staffUserId: staffUser.id,       // ID del staff user
      isStaff: true,
    })

    return {
      success: true,
      token,
      staffUser: {
        id: staffUser.id,
        agencyId: staffUser.agencyId,
        email: staffUser.email,
        name: staffUser.name,
        role: staffUser.role,
      },
    }
  } catch (error) {
    console.error('Staff login error:', error)
    return { success: false, error: 'Login failed' }
  }
}

/**
 * Crea un nuevo staff user
 * @param agencyId - ID de la agencia (User)
 * @param email - Email
 * @param password - Password
 * @param name - Nombre
 * @param role - Rol (StaffRole)
 * @returns Staff user creado
 */
export async function createStaffUser(
  agencyId: number,
  email: string,
  password: string,
  name: string,
  role: string
) {
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10)

  // Crear staff user
  const staffUser = await prisma.staffUser.create({
    data: {
      agencyId,
      email,
      passwordHash,
      name,
      role: role as any,
      isActive: true,
    },
  })

  // Asignar permisos basados en el rol (template)
  const { assignRolePermissions } = await import('../permissions')
  await assignRolePermissions(staffUser.id, role)

  return staffUser
}
