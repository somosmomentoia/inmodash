/**
 * Middleware de Permisos
 * Verifica que el usuario tenga permisos para realizar una acción en un módulo
 */

import { Request, Response, NextFunction } from 'express'
import { checkPermission } from '../lib/permissions'
import { logger } from '../utils/logger'

/**
 * Middleware para verificar permisos
 * @param module - Módulo (ej: 'contracts', 'finances')
 * @param action - Acción (ej: 'view', 'create', 'settle')
 */
export const requirePermission = (module: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        })
      }

      const { userId, staffUserId } = req.user

      // Verificar permiso
      const permissionCheck = await checkPermission(
        userId,
        staffUserId || null,
        module,
        action
      )

      if (!permissionCheck.hasPermission) {
        logger.warn(
          `Permission denied for user ${userId} (staff: ${staffUserId}) on ${module}.${action}: ${permissionCheck.reason}`
        )
        return res.status(403).json({
          error: 'Forbidden',
          message: `You don't have permission to ${action} ${module}`,
          reason: permissionCheck.reason,
        })
      }

      // Permiso concedido
      next()
    } catch (error) {
      logger.error('Permission check error', error)
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error checking permissions',
      })
    }
  }
}

/**
 * Middleware para verificar múltiples permisos (OR logic)
 * El usuario debe tener AL MENOS UNO de los permisos especificados
 */
export const requireAnyPermission = (
  permissions: Array<{ module: string; action: string }>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        })
      }

      const { userId, staffUserId } = req.user

      // Verificar cada permiso
      const checks = await Promise.all(
        permissions.map((p) =>
          checkPermission(userId, staffUserId || null, p.module, p.action)
        )
      )

      // Si al menos uno tiene permiso, permitir
      const hasAnyPermission = checks.some((c) => c.hasPermission)

      if (!hasAnyPermission) {
        logger.warn(
          `Permission denied for user ${userId} (staff: ${staffUserId}) - none of the required permissions found`
        )
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You don\'t have the required permissions',
        })
      }

      next()
    } catch (error) {
      logger.error('Permission check error', error)
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error checking permissions',
      })
    }
  }
}
