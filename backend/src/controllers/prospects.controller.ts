import { Request, Response, NextFunction } from 'express'
import { prospectsService } from '../services/prospects.service'
import {
  CreateProspectDto,
  UpdateProspectDto,
  ChangeProspectStatusDto,
  AddProspectNoteDto,
  ConvertProspectDto,
  ProspectFilters,
} from '../types/prospect.types'

// Get all prospects
export async function getProspects(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const filters: ProspectFilters = {
      status: req.query.status as ProspectFilters['status'],
      source: req.query.source as ProspectFilters['source'],
      apartmentId: req.query.apartmentId ? parseInt(req.query.apartmentId as string) : undefined,
      search: req.query.search as string,
      fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
      toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
    }

    const prospects = await prospectsService.getAll(userId, filters)
    res.json({ success: true, data: prospects })
  } catch (error) {
    next(error)
  }
}

// Get single prospect
export async function getProspect(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const prospectId = parseInt(req.params.id)
    const prospect = await prospectsService.getById(userId, prospectId)
    res.json({ success: true, data: prospect })
  } catch (error) {
    next(error)
  }
}

// Create prospect
export async function createProspect(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const data: CreateProspectDto = req.body
    
    // Validation
    if (!data.fullName || !data.phone) {
      return res.status(400).json({ error: 'Nombre y teléfono son requeridos' })
    }

    const prospect = await prospectsService.create(userId, data)
    res.status(201).json({ success: true, data: prospect })
  } catch (error) {
    next(error)
  }
}

// Update prospect
export async function updateProspect(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const prospectId = parseInt(req.params.id)
    const data: UpdateProspectDto = req.body

    const prospect = await prospectsService.update(userId, prospectId, data)
    res.json({ success: true, data: prospect })
  } catch (error) {
    next(error)
  }
}

// Change prospect status
export async function changeProspectStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const prospectId = parseInt(req.params.id)
    const data: ChangeProspectStatusDto = req.body

    if (!data.status) {
      return res.status(400).json({ error: 'Estado es requerido' })
    }

    const prospect = await prospectsService.changeStatus(userId, prospectId, data)
    res.json({ success: true, data: prospect })
  } catch (error) {
    next(error)
  }
}

// Add note to prospect
export async function addProspectNote(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const prospectId = parseInt(req.params.id)
    const data: AddProspectNoteDto = req.body

    if (!data.note) {
      return res.status(400).json({ error: 'Nota es requerida' })
    }

    const result = await prospectsService.addNote(userId, prospectId, data)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

// Convert prospect to tenant/contract
export async function convertProspect(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const prospectId = parseInt(req.params.id)
    const data: ConvertProspectDto = req.body

    const result = await prospectsService.convert(userId, prospectId, data)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

// Delete prospect
export async function deleteProspect(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const prospectId = parseInt(req.params.id)
    const result = await prospectsService.delete(userId, prospectId)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

// Get prospect statistics
export async function getProspectStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const stats = await prospectsService.getStats(userId)
    res.json({ success: true, data: stats })
  } catch (error) {
    next(error)
  }
}

// Get stale prospects (alerts)
export async function getStaleProspects(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24
    const prospects = await prospectsService.getStaleProspects(userId, hours)
    res.json({ success: true, data: prospects })
  } catch (error) {
    next(error)
  }
}

// Get approved prospects pending conversion
export async function getApprovedPending(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const prospects = await prospectsService.getApprovedPendingConversion(userId)
    res.json({ success: true, data: prospects })
  } catch (error) {
    next(error)
  }
}
