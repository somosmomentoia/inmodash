import { Request, Response } from 'express'
import { rentAdjustmentsService } from '../services/rent-adjustments.service'
import { arglyService } from '../services/argly.service'

// GET /api/contracts/:contractId/rent-adjustments
export const getByContract = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.contractId)
    const userId = (req as any).user.id

    const adjustments = await rentAdjustmentsService.getByContractId(contractId, userId)
    res.json(adjustments)
  } catch (error: any) {
    console.error('Error getting rent adjustments:', error)
    res.status(500).json({ error: error.message || 'Error al obtener historial de ajustes' })
  }
}

// GET /api/contracts/:contractId/rent-adjustments/config
export const getIndexConfig = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.contractId)
    const userId = (req as any).user.id

    const config = await rentAdjustmentsService.getIndexConfig(contractId, userId)
    
    if (!config) {
      return res.json({ hasIndex: false, config: null, currentIndex: null, indexMetadata: null })
    }

    // Fetch current index value if applicable
    let currentIndex = null
    if (config.updateIndexType === 'icl' || config.updateIndexType === 'ipc') {
      try {
        currentIndex = await arglyService.getIndex(config.updateIndexType as 'icl' | 'ipc')
      } catch (err) {
        console.error('Error fetching current index:', err)
      }
    }

    // Get index metadata (publication info, delays)
    const indexMetadata = rentAdjustmentsService.getIndexMetadata(config.updateIndexType || '')

    res.json({
      hasIndex: true,
      config,
      currentIndex,
      indexMetadata,
    })
  } catch (error: any) {
    console.error('Error getting index config:', error)
    res.status(500).json({ error: error.message || 'Error al obtener configuración de índice' })
  }
}

// GET /api/contracts/:contractId/rent-adjustments/timeline
export const getTimeline = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.contractId)
    const userId = (req as any).user.id

    const timeline = await rentAdjustmentsService.getTimeline(contractId, userId)
    res.json(timeline)
  } catch (error: any) {
    console.error('Error getting timeline:', error)
    res.status(500).json({ error: error.message || 'Error al obtener timeline de ajustes' })
  }
}

// PUT /api/contracts/:contractId/rent-adjustments/:id
export const modifyAdjustment = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const userId = (req as any).user.id
    const { appliedIndexValue, notes } = req.body

    if (!appliedIndexValue || typeof appliedIndexValue !== 'number') {
      return res.status(400).json({ error: 'appliedIndexValue es requerido y debe ser un número' })
    }

    const updated = await rentAdjustmentsService.modifyAdjustment(
      id,
      userId,
      appliedIndexValue,
      userId, // modifiedByUserId
      notes
    )

    res.json(updated)
  } catch (error: any) {
    console.error('Error modifying rent adjustment:', error)
    res.status(500).json({ error: error.message || 'Error al modificar ajuste' })
  }
}

// GET /api/contracts/:contractId/rent-adjustments/current-index
export const getCurrentIndex = async (req: Request, res: Response) => {
  try {
    const indexType = req.query.type as string
    
    if (indexType !== 'icl' && indexType !== 'ipc') {
      return res.status(400).json({ error: 'Tipo de índice inválido. Use "icl" o "ipc"' })
    }

    const index = await arglyService.getIndex(indexType)
    res.json(index)
  } catch (error: any) {
    console.error('Error fetching current index:', error)
    res.status(500).json({ error: error.message || 'Error al obtener índice actual' })
  }
}

export const rentAdjustmentsController = {
  getByContract,
  getIndexConfig,
  getTimeline,
  modifyAdjustment,
  getCurrentIndex,
}
