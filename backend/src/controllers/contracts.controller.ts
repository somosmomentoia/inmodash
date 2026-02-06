import { Request, Response, NextFunction } from 'express'
import * as contractsService from '../services/contracts.service'
import path from 'path'

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const contracts = await contractsService.getAll(userId)
    res.json(contracts)
  } catch (error) {
    next(error)
  }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const contract = await contractsService.getById(parseInt(id), userId)
    
    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' })
    }
    
    res.json(contract)
  } catch (error) {
    next(error)
  }
}

export const getByApartmentId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apartmentId } = req.params
    const userId = req.user!.userId
    const contracts = await contractsService.getByApartmentId(parseInt(apartmentId), userId)
    res.json(contracts)
  } catch (error) {
    next(error)
  }
}

export const getByTenantId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params
    const userId = req.user!.userId
    const contracts = await contractsService.getByTenantId(parseInt(tenantId), userId)
    res.json(contracts)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const contract = await contractsService.create(req.body, userId)
    res.status(201).json(contract)
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const contract = await contractsService.update(parseInt(id), req.body, userId)
    res.json(contract)
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    await contractsService.remove(parseInt(id), userId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' })
    }
    
    // Actualizar el contrato con la ruta del documento
    const contract = await contractsService.updateDocument(
      parseInt(id),
      req.file.filename,
      userId
    )
    
    res.json({
      message: 'Documento subido exitosamente',
      contract,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    })
  } catch (error) {
    next(error)
  }
}

export const downloadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    
    const contract = await contractsService.getById(parseInt(id), userId)
    
    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' })
    }
    
    if (!contract.contractDocumentPath) {
      return res.status(404).json({ error: 'El contrato no tiene documento adjunto' })
    }
    
    const filePath = path.join(__dirname, '../../uploads', contract.contractDocumentPath)
    res.download(filePath, contract.contractDocumentPath)
  } catch (error) {
    next(error)
  }
}
