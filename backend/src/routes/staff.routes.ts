/**
 * Staff Routes
 * Rutas para gestión de usuarios internos (staff)
 */

import { Router } from 'express'
import * as staffController from '../controllers/staff.controller'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

// Login público (no requiere autenticación)
router.post('/login', staffController.login)

// Rutas protegidas (requieren autenticación)
router.use(authenticate)

// Lista staff users (requiere permiso users.view)
router.get('/', requirePermission('users', 'view'), staffController.list)

// Obtiene un staff user (requiere permiso users.view)
router.get('/:id', requirePermission('users', 'view'), staffController.getById)

// Crea un staff user (requiere permiso users.create)
router.post('/', requirePermission('users', 'create'), staffController.create)

// Actualiza un staff user (requiere permiso users.edit)
router.put('/:id', requirePermission('users', 'edit'), staffController.update)

// Desactiva un staff user (requiere permiso users.deactivate)
router.delete('/:id', requirePermission('users', 'deactivate'), staffController.remove)

// Cambia contraseña (requiere permiso users.edit)
router.put('/:id/password', requirePermission('users', 'edit'), staffController.changePassword)

// TEMPORAL: Regenera permisos de todos los usuarios (requiere permiso users.edit)
router.post('/regenerate-permissions', requirePermission('users', 'edit'), staffController.regeneratePermissions)

export default router
