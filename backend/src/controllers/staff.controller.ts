/**
 * Staff Controller
 * Endpoints para gestión de usuarios internos (staff)
 */

import { Request, Response } from 'express'
import * as staffService from '../services/staff.service'
import * as permissionsService from '../services/permissions.service'
import { staffLogin } from '../lib/auth/staff-auth'
import { logger } from '../utils/logger'

/**
 * POST /api/staff/login
 * Login para staff users
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      })
    }

    const result = await staffLogin(email, password)

    if (!result.success) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: result.error,
      })
    }

    // Get staff user permissions
    const permissionsData = await permissionsService.getStaffPermissions(
      result.staffUser!.id,
      result.staffUser!.agencyId
    )

    // Set token in cookie
    res.cookie('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    })

    return res.json({
      success: true,
      token: result.token,
      user: {
        ...result.staffUser,
        isStaff: true,
      },
      permissions: permissionsData.permissions,
    })
  } catch (error) {
    logger.error('Staff login error', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed',
    })
  }
}

/**
 * GET /api/staff
 * Lista todos los staff users de la agencia
 */
export async function list(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const staffUsers = await staffService.listStaffUsers(req.user.userId)
    return res.json(staffUsers)
  } catch (error) {
    logger.error('List staff users error', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list staff users',
    })
  }
}

/**
 * GET /api/staff/:id
 * Obtiene un staff user por ID
 */
export async function getById(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' })
    }

    const staffUser = await staffService.getStaffUser(id, req.user.userId)

    if (!staffUser) {
      return res.status(404).json({ error: 'Staff user not found' })
    }

    return res.json(staffUser)
  } catch (error) {
    logger.error('Get staff user error', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get staff user',
    })
  }
}

/**
 * POST /api/staff
 * Crea un nuevo staff user
 */
export async function create(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { email, password, name, role } = req.body

    if (!email || !password || !name || !role) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email, password, name, and role are required',
      })
    }

    const staffUser = await staffService.createStaffUser(req.user.userId, {
      email,
      password,
      name,
      role,
    })

    return res.status(201).json(staffUser)
  } catch (error: any) {
    logger.error('Create staff user error', error)

    if (error.message === 'Email already in use') {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message,
      })
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create staff user',
    })
  }
}

/**
 * PUT /api/staff/:id
 * Actualiza un staff user
 */
export async function update(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' })
    }

    const { email, name, role, isActive } = req.body

    const staffUser = await staffService.updateStaffUser(
      id,
      req.user.userId,
      {
        email,
        name,
        role,
        isActive,
      }
    )

    return res.json(staffUser)
  } catch (error: any) {
    logger.error('Update staff user error', error)

    if (error.message === 'Staff user not found') {
      return res.status(404).json({ error: error.message })
    }

    if (error.message === 'Email already in use') {
      return res.status(409).json({ error: error.message })
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update staff user',
    })
  }
}

/**
 * DELETE /api/staff/:id
 * Elimina (desactiva) un staff user
 */
export async function remove(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' })
    }

    const result = await staffService.deleteStaffUser(id, req.user.userId)
    return res.json(result)
  } catch (error: any) {
    logger.error('Delete staff user error', error)

    if (error.message === 'Staff user not found') {
      return res.status(404).json({ error: error.message })
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete staff user',
    })
  }
}

/**
 * PUT /api/staff/:id/password
 * Cambia la contraseña de un staff user
 */
export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' })
    }

    const { password } = req.body

    if (!password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password is required',
      })
    }

    const result = await staffService.changeStaffPassword(
      id,
      req.user.userId,
      password
    )

    return res.json(result)
  } catch (error: any) {
    logger.error('Change staff password error', error)

    if (error.message === 'Staff user not found') {
      return res.status(404).json({ error: error.message })
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to change password',
    })
  }
}

/**
 * POST /api/staff/regenerate-permissions
 * Regenera los permisos de todos los usuarios basándose en sus roles
 * TEMPORAL: Solo para migración
 */
export async function regeneratePermissions(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await staffService.regenerateAllPermissions(req.user.userId)
    
    return res.json(result)
  } catch (error: any) {
    logger.error('Regenerate permissions error', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to regenerate permissions',
    })
  }
}
