import { Request, Response } from 'express'
import accountingService from '../services/accounting.service'

type AccountingEntryType = 'commission' | 'commission_service' | 'expense' | 'income_other' | 'adjustment'

export const accountingController = {
  /**
   * GET /api/accounting
   * Obtener todos los asientos contables
   */
  async getAll(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'No autorizado' })
      }

      const { type, startDate, endDate, ownerId, settlementId } = req.query

      const filters = {
        type: type as AccountingEntryType | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        ownerId: ownerId ? parseInt(ownerId as string) : undefined,
        settlementId: settlementId ? parseInt(settlementId as string) : undefined,
      }

      const entries = await accountingService.getAll(userId, filters)
      return res.json(entries)
    } catch (error) {
      console.error('Error al obtener asientos contables:', error)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  },

  /**
   * GET /api/accounting/:id
   * Obtener un asiento contable por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'No autorizado' })
      }

      const id = parseInt(req.params.id)
      const entry = await accountingService.getById(userId, id)

      if (!entry) {
        return res.status(404).json({ error: 'Asiento contable no encontrado' })
      }

      return res.json(entry)
    } catch (error) {
      console.error('Error al obtener asiento contable:', error)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  },

  /**
   * POST /api/accounting
   * Crear un nuevo asiento contable
   */
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'No autorizado' })
      }

      const { type, description, amount, entryDate, period, settlementId, ownerId, contractId, obligationId, metadata } = req.body

      if (!type || !description || amount === undefined || !entryDate || !period) {
        return res.status(400).json({ error: 'Faltan campos requeridos' })
      }

      const entry = await accountingService.create(userId, {
        type,
        description,
        amount: parseFloat(amount),
        entryDate: new Date(entryDate),
        period: new Date(period),
        settlementId: settlementId ? parseInt(settlementId) : undefined,
        ownerId: ownerId ? parseInt(ownerId) : undefined,
        contractId: contractId ? parseInt(contractId) : undefined,
        obligationId: obligationId ? parseInt(obligationId) : undefined,
        metadata,
      })

      return res.status(201).json(entry)
    } catch (error) {
      console.error('Error al crear asiento contable:', error)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  },

  /**
   * DELETE /api/accounting/:id
   * Eliminar un asiento contable
   */
  async delete(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'No autorizado' })
      }

      const id = parseInt(req.params.id)
      await accountingService.delete(userId, id)

      return res.json({ message: 'Asiento contable eliminado' })
    } catch (error) {
      console.error('Error al eliminar asiento contable:', error)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  },

  /**
   * GET /api/accounting/commissions/summary
   * Obtener resumen de comisiones
   */
  async getCommissionsSummary(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'No autorizado' })
      }

      const { startDate, endDate } = req.query

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Se requieren startDate y endDate' })
      }

      const summary = await accountingService.getCommissionsSummary(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      )

      return res.json(summary)
    } catch (error) {
      console.error('Error al obtener resumen de comisiones:', error)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  },

  /**
   * GET /api/accounting/totals
   * Obtener totales por tipo
   */
  async getTotalsByType(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'No autorizado' })
      }

      const { startDate, endDate } = req.query

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Se requieren startDate y endDate' })
      }

      const totals = await accountingService.getTotalsByType(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      )

      return res.json(totals)
    } catch (error) {
      console.error('Error al obtener totales:', error)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  },
}

export default accountingController
