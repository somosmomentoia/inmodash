/**
 * Permissions Routes
 * Rutas para gestión de permisos de usuarios internos (staff)
 */

import { Router } from 'express'
import * as permissionsController from '../controllers/permissions.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// Obtiene templates de permisos por rol (requiere users.view)
router.get('/templates', requirePermission('users', 'view'), permissionsController.getTemplates)

// Obtiene permisos de un staff user (requiere users.view)
router.get('/staff/:id', requirePermission('users', 'view'), permissionsController.getStaffPermissions)

// Asigna permisos personalizados (requiere users.edit)
router.put('/staff/:id', requirePermission('users', 'edit'), permissionsController.assignPermissions)

// Resetea permisos a template del rol (requiere users.edit)
router.post('/staff/:id/reset', requirePermission('users', 'edit'), permissionsController.resetPermissions)

export default router
