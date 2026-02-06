import { Request, Response } from 'express'
import * as settlementsService from '../services/settlements.service'

export const getAll = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const settlements = await settlementsService.getAll(userId)
    res.json(settlements)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const getByOwner = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const ownerId = parseInt(req.params.ownerId)
    const settlements = await settlementsService.getByOwner(ownerId, userId)
    res.json(settlements)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const getPending = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const settlements = await settlementsService.getPending(userId)
    res.json(settlements)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const create = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const settlement = await settlementsService.upsert(req.body, userId)
    res.status(201).json(settlement)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const markAsSettled = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const id = parseInt(req.params.id)
    const { paymentMethod, reference, notes } = req.body
    
    const settlement = await settlementsService.markAsSettled(id, userId, {
      paymentMethod,
      reference,
      notes
    })
    res.json(settlement)
  } catch (error: any) {
    if (error.message === 'Settlement not found or access denied') {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: error.message })
    }
  }
}

export const markAsPending = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const id = parseInt(req.params.id)
    
    const settlement = await settlementsService.markAsPending(id, userId)
    res.json(settlement)
  } catch (error: any) {
    if (error.message === 'Settlement not found or access denied') {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: error.message })
    }
  }
}

export const remove = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const id = parseInt(req.params.id)
    
    await settlementsService.remove(id, userId)
    res.status(204).send()
  } catch (error: any) {
    if (error.message === 'Settlement not found or access denied') {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: error.message })
    }
  }
}

export const calculateForPeriod = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const { period } = req.body
    
    if (!period) {
      return res.status(400).json({ error: 'Period is required' })
    }
    
    const settlements = await settlementsService.calculateForPeriod(new Date(period), userId)
    res.json(settlements)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
