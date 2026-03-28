import { Request, Response } from 'express'
import * as vendorCommissionsService from '../services/vendor-commissions.service'

export const getAll = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const commissions = await vendorCommissionsService.getAll(userId)
    res.json(commissions)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const getByVendor = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const commissions = await vendorCommissionsService.getByVendor(Number(req.params.vendorId), userId)
    res.json(commissions)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const getStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const stats = await vendorCommissionsService.getStats(userId)
    res.json(stats)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const markAsPaid = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const commission = await vendorCommissionsService.markAsPaid(
      Number(req.params.id),
      userId,
      req.body
    )
    res.json(commission)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}
