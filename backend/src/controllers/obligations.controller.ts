import { Request, Response, NextFunction } from 'express'
import * as obligationsService from '../services/obligations.service'

// ============================================================================
// OBLIGATIONS CONTROLLERS
// ============================================================================

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const { contractId } = req.query
    
    // Si se proporciona contractId, filtrar por contrato
    if (contractId) {
      const obligations = await obligationsService.getByContractId(parseInt(contractId as string), userId)
      return res.json(obligations)
    }
    
    // Si no, devolver todas las obligaciones
    const obligations = await obligationsService.getAll(userId)
    res.json(obligations)
  } catch (error) {
    next(error)
  }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const obligation = await obligationsService.getById(parseInt(id), userId)

    if (!obligation) {
      return res.status(404).json({ error: 'Obligación no encontrada' })
    }

    res.json(obligation)
  } catch (error) {
    next(error)
  }
}

export const getByContractId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId } = req.params
    const userId = req.user!.userId
    const obligations = await obligationsService.getByContractId(parseInt(contractId), userId)
    res.json(obligations)
  } catch (error) {
    next(error)
  }
}

export const getByType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params
    const userId = req.user!.userId
    const obligations = await obligationsService.getByType(type, userId)
    res.json(obligations)
  } catch (error) {
    next(error)
  }
}

export const getPending = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const obligations = await obligationsService.getPending(userId)
    res.json(obligations)
  } catch (error) {
    next(error)
  }
}

export const getOverdue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const obligations = await obligationsService.getOverdue(userId)
    res.json(obligations)
  } catch (error) {
    next(error)
  }
}

// Función markOverdue comentada - no existe en el servicio
// export const markOverdue = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user!.userId
//     const result = await obligationsService.markOverdue(userId)
//     res.json(result)
//   } catch (error) {
//     next(error)
//   }
// }

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const obligation = await obligationsService.create(req.body, userId)
    res.status(201).json(obligation)
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const obligation = await obligationsService.update(parseInt(id), req.body, userId)
    res.json(obligation)
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    await obligationsService.remove(parseInt(id), userId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

// ============================================================================
// OBLIGATION PAYMENTS CONTROLLERS
// ============================================================================

export const getAllPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const { contractId } = req.query
    
    // Si se proporciona contractId, filtrar pagos por contrato
    if (contractId) {
      const payments = await obligationsService.getPaymentsByContractId(parseInt(contractId as string), userId)
      return res.json(payments)
    }
    
    // Si no, devolver todos los pagos
    const payments = await obligationsService.getAllPayments(userId)
    res.json(payments)
  } catch (error) {
    next(error)
  }
}

export const getPaymentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const payment = await obligationsService.getPaymentById(parseInt(id), userId)

    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' })
    }

    res.json(payment)
  } catch (error) {
    next(error)
  }
}

export const getPaymentsByObligationId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { obligationId } = req.params
    const userId = req.user!.userId
    const payments = await obligationsService.getPaymentsByObligationId(parseInt(obligationId), userId)
    res.json(payments)
  } catch (error) {
    next(error)
  }
}

export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const payment = await obligationsService.createPayment(req.body, userId)
    res.status(201).json(payment)
  } catch (error) {
    next(error)
  }
}

export const updatePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const payment = await obligationsService.updatePayment(parseInt(id), req.body, userId)
    res.json(payment)
  } catch (error) {
    next(error)
  }
}

export const removePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    await obligationsService.removePayment(parseInt(id), userId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

// ============================================================================
// AUTO-GENERATION CONTROLLER
// ============================================================================

export const generateObligations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const { month } = req.body
    
    if (!month) {
      return res.status(400).json({ error: 'Month is required (format: YYYY-MM)' })
    }
    
    const results = await obligationsService.generateObligations(month, userId)
    res.json(results)
  } catch (error) {
    next(error)
  }
}

// ============================================================================
// OWNER BALANCE RECALCULATION
// ============================================================================

export const recalculateOwnerBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const { ownerId } = req.params
    
    const result = await obligationsService.recalculateOwnerBalance(parseInt(ownerId), userId)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const recalculateAllOwnerBalances = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const results = await obligationsService.recalculateAllOwnerBalances(userId)
    res.json(results)
  } catch (error) {
    next(error)
  }
}
