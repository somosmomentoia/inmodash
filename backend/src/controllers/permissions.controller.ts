/**
 * Permissions Controller
 * Endpoints para gestión de permisos de usuarios internos (staff)
 */

import { Request, Response } from 'express'
import * as permissionsService from '../services/permissions.service'
import { logger } from '../utils/logger'

/**
 * GET /api/permissions/templates
 * Obtiene los templates de permisos por rol
 * Si se pasa ?role=ROLE_NAME, devuelve solo los permisos de ese rol
 */
export async function getTemplates(req: Request, res: Response) {
  try {
    const { role } = req.query
    
    if (role && typeof role === 'string') {
      const rolePermissions = await permissionsService.getPermissionTemplateByRole(role)
      return res.json(rolePermissions)
    }
    
    const templates = await permissionsService.getPermissionTemplates()
    return res.json(templates)
  } catch (error) {
    logger.error('Get permission templates error', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get permission templates',
    })
  }
}

/**
 * GET /api/permissions/staff/:id
 * Obtiene los permisos de un staff user
 */
export async function getStaffPermissions(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const staffUserId = parseInt(req.params.id)
    if (isNaN(staffUserId)) {
      return res.status(400).json({ error: 'Invalid staff user ID' })
    }

    const result = await permissionsService.getStaffPermissions(
      staffUserId,
      req.user.userId
    )

    return res.json(result)
  } catch (error: any) {
    logger.error('Get staff permissions error', error)

    if (error.message === 'Staff user not found') {
      return res.status(404).json({ error: error.message })
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get staff permissions',
    })
  }
}

/**
 * PUT /api/permissions/staff/:id
 * Asigna permisos personalizados a un staff user
 */
export async function assignPermissions(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const staffUserId = parseInt(req.params.id)
    if (isNaN(staffUserId)) {
      return res.status(400).json({ error: 'Invalid staff user ID' })
    }

    const { permissions } = req.body

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Permissions array is required',
      })
    }

    const result = await permissionsService.assignCustomPermissions(
      staffUserId,
      req.user.userId,
      permissions
    )

    return res.json(result)
  } catch (error: any) {
    logger.error('Assign permissions error', error)

    if (error.message === 'Staff user not found') {
      return res.status(404).json({ error: error.message })
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to assign permissions',
    })
  }
}

/**
 * POST /api/permissions/staff/:id/reset
 * Resetea los permisos de un staff user a los del template de su rol
 */
export async function resetPermissions(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const staffUserId = parseInt(req.params.id)
    if (isNaN(staffUserId)) {
      return res.status(400).json({ error: 'Invalid staff user ID' })
    }

    const result = await permissionsService.resetToRolePermissions(
      staffUserId,
      req.user.userId
    )

    return res.json(result)
  } catch (error: any) {
    logger.error('Reset permissions error', error)

    if (error.message === 'Staff user not found') {
      return res.status(404).json({ error: error.message })
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reset permissions',
    })
  }
}
