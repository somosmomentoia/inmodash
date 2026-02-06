import { Request, Response, NextFunction } from 'express'
import * as recurringObligationsService from '../services/recurring-obligations.service'

// Crear una recurrencia
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔵 CREATE RECURRING - Request received')
    console.log('🔵 User:', req.user)
    console.log('🔵 Body:', req.body)
    
    const userId = req.user!.userId
    const recurring = await recurringObligationsService.create({
      userId,
      ...req.body
    })
    
    console.log('✅ Recurring created:', recurring.id)
    res.status(201).json(recurring)
  } catch (error) {
    console.error('❌ Error creating recurring:', error)
    next(error)
  }
}

// Obtener todas las recurrencias
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const recurrings = await recurringObligationsService.getAll(userId)
    res.json(recurrings)
  } catch (error) {
    next(error)
  }
}

// Obtener una recurrencia por ID
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const id = parseInt(req.params.id)
    const recurring = await recurringObligationsService.getById(id, userId)
    res.json(recurring)
  } catch (error) {
    next(error)
  }
}

// Actualizar una recurrencia
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const id = parseInt(req.params.id)
    const recurring = await recurringObligationsService.update(id, userId, req.body)
    res.json(recurring)
  } catch (error) {
    next(error)
  }
}

// Eliminar una recurrencia
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const id = parseInt(req.params.id)
    await recurringObligationsService.remove(id, userId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

// Pausar/Activar una recurrencia
export const toggleActive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const id = parseInt(req.params.id)
    const recurring = await recurringObligationsService.toggleActive(id, userId)
    res.json(recurring)
  } catch (error) {
    next(error)
  }
}

// Generar obligaciones para un mes
export const generateForMonth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const { month } = req.body

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Formato de mes inválido. Use YYYY-MM' })
    }

    const result = await recurringObligationsService.generateForMonth(month, userId)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
