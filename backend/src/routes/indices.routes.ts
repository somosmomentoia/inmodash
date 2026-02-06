import { Router } from 'express'
import indicesController from '../controllers/indices.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// Rutas públicas (no requieren autenticación para consultar índices)
router.get('/icl', indicesController.getICL)
router.get('/ipc', indicesController.getIPC)
router.get('/all', indicesController.getAll)

// Ruta protegida para cálculos
router.post('/calculate', authenticate, indicesController.calculateUpdate)

export default router
