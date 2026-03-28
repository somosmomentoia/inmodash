import { Request, Response } from 'express'
import * as vendorsService from '../services/vendors.service'

export const getAll = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const vendors = await vendorsService.getAll(userId)
    res.json(vendors)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const getById = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const vendor = await vendorsService.getById(Number(req.params.id), userId)
    res.json(vendor)
  } catch (error: any) {
    res.status(404).json({ error: error.message })
  }
}

export const create = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const vendor = await vendorsService.create(req.body, userId)
    res.status(201).json(vendor)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

export const update = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const vendor = await vendorsService.update(Number(req.params.id), req.body, userId)
    res.json(vendor)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

export const remove = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    await vendorsService.remove(Number(req.params.id), userId)
    res.json({ message: 'Vendor deleted' })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}
