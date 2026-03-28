import { Request, Response, NextFunction } from 'express'
import * as cashflowService from '../services/cashflow.service'
import * as obligationsService from '../services/obligations.service'

/**
 * GET /api/cash-flow
 * Lista todos los pagos (ObligationPayment) — fuente de verdad de Flujo de Caja.
 * Opcionalmente filtra por período.
 */
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const payments = await obligationsService.getAllPayments(userId)
    res.json(payments)
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/cash-flow
 * Crea un movimiento atómico: obligation + payment.
 */
export const createMovement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const { type, description, amount, date, period, paidBy, chargeTo, contractId, apartmentId, category, method, reference, notes, commissionType, commissionValue } = req.body

    if (!type || !description || !amount || !date) {
      return res.status(400).json({ error: 'type, description, amount y date son requeridos' })
    }

    const result = await cashflowService.createMovement({
      type,
      description,
      amount,
      date,
      period,
      paidBy,
      chargeTo,
      contractId,
      apartmentId,
      category,
      method,
      reference,
      notes,
      commissionType,
      commissionValue,
    }, userId)

    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}
