import { Request, Response } from 'express'
import arglyService from '../services/argly.service'

export const indicesController = {
  /**
   * GET /api/indices/icl
   * Obtener el valor actual del ICL
   */
  async getICL(req: Request, res: Response) {
    try {
      const icl = await arglyService.getICL()
      return res.json(icl)
    } catch (error) {
      console.error('Error al obtener ICL:', error)
      return res.status(500).json({ error: 'Error al obtener el índice ICL' })
    }
  },

  /**
   * GET /api/indices/ipc
   * Obtener el valor actual del IPC
   */
  async getIPC(req: Request, res: Response) {
    try {
      const ipc = await arglyService.getIPC()
      return res.json(ipc)
    } catch (error) {
      console.error('Error al obtener IPC:', error)
      return res.status(500).json({ error: 'Error al obtener el índice IPC' })
    }
  },

  /**
   * GET /api/indices/all
   * Obtener todos los índices disponibles
   */
  async getAll(req: Request, res: Response) {
    try {
      const [icl, ipc] = await Promise.all([
        arglyService.getICL(),
        arglyService.getIPC()
      ])
      return res.json({ icl, ipc })
    } catch (error) {
      console.error('Error al obtener índices:', error)
      return res.status(500).json({ error: 'Error al obtener los índices' })
    }
  },

  /**
   * POST /api/indices/calculate
   * Calcular actualización de monto
   */
  async calculateUpdate(req: Request, res: Response) {
    try {
      const { baseAmount, initialIndexValue, indexType } = req.body

      if (!baseAmount || !initialIndexValue || !indexType) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' })
      }

      const currentIndex = await arglyService.getIndex(indexType)
      const result = arglyService.calculateUpdatedAmount(
        parseFloat(baseAmount),
        parseFloat(initialIndexValue),
        currentIndex.value
      )

      return res.json({
        ...result,
        currentIndexValue: currentIndex.value,
        currentIndexDate: currentIndex.date,
        indexType
      })
    } catch (error) {
      console.error('Error al calcular actualización:', error)
      return res.status(500).json({ error: 'Error al calcular la actualización' })
    }
  }
}

export default indicesController
