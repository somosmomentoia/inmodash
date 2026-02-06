import { Request, Response, NextFunction } from 'express'
import * as documentsService from '../services/documents.service'
import path from 'path'
import config from '../config/env'

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const documents = await documentsService.getAll(userId)
    res.json(documents)
  } catch (error) {
    next(error)
  }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const document = await documentsService.getById(parseInt(id), userId)
    
    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' })
    }
    
    res.json(document)
  } catch (error) {
    next(error)
  }
}

export const getByTenantId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params
    const userId = req.user!.userId
    const documents = await documentsService.getByTenantId(parseInt(tenantId), userId)
    res.json(documents)
  } catch (error) {
    next(error)
  }
}

export const getByOwnerId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ownerId } = req.params
    const userId = req.user!.userId
    const documents = await documentsService.getByOwnerId(parseInt(ownerId), userId)
    res.json(documents)
  } catch (error) {
    next(error)
  }
}

export const getByContractId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId } = req.params
    const userId = req.user!.userId
    const documents = await documentsService.getByContractId(parseInt(contractId), userId)
    res.json(documents)
  } catch (error) {
    next(error)
  }
}

export const getByApartmentId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apartmentId } = req.params
    const userId = req.user!.userId
    const documents = await documentsService.getByApartmentId(parseInt(apartmentId), userId)
    res.json(documents)
  } catch (error) {
    next(error)
  }
}

export const getByType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params
    const userId = req.user!.userId
    const documents = await documentsService.getByType(type, userId)
    res.json(documents)
  } catch (error) {
    next(error)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const document = await documentsService.create(req.body, userId)
    res.status(201).json(document)
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const document = await documentsService.update(parseInt(id), req.body, userId)
    res.json(document)
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    await documentsService.remove(parseInt(id), userId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

// Upload file and create document record
export const upload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const file = req.file

    if (!file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' })
    }

    // Get metadata from body
    const { type, description, contractId, tenantId, ownerId, apartmentId } = req.body

    console.log('Upload request received:', {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      type,
      contractId,
    })

    // Build the file URL (full URL including backend domain)
    const fileUrl = `${config.backendUrl}/uploads/${file.filename}`
    console.log('File URL generated:', fileUrl)
    console.log('Backend URL from config:', config.backendUrl)

    // Create document record in database
    const document = await documentsService.create({
      type: type || 'otro',
      fileName: file.originalname,
      fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
      description: description || undefined,
      contractId: contractId ? parseInt(contractId) : undefined,
      tenantId: tenantId ? parseInt(tenantId) : undefined,
      ownerId: ownerId ? parseInt(ownerId) : undefined,
      apartmentId: apartmentId ? parseInt(apartmentId) : undefined,
    }, userId)

    console.log('Document created:', document.id)
    res.status(201).json(document)
  } catch (error) {
    console.error('Error in upload controller:', error)
    next(error)
  }
}
