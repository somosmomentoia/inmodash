import { Request, Response, NextFunction } from 'express'
import * as documentsService from '../services/documents.service'
import { storageService } from '../services/storage.service'
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

    // Build context path for storage organization
    let context = 'general'
    if (contractId) {
      context = `contracts/${contractId}`
    } else if (tenantId) {
      context = `tenants/${tenantId}`
    } else if (ownerId) {
      context = `owners/${ownerId}`
    } else if (apartmentId) {
      context = `apartments/${apartmentId}`
    }

    // Upload to R2 (or local fallback)
    // file.buffer exists when using memoryUpload, file.path when using diskUpload
    const buffer = file.buffer || (await import('fs')).readFileSync(file.path!)
    const { url: fileUrl, key: storageKey } = await storageService.uploadFile(
      buffer,
      file.originalname,
      file.mimetype,
      userId,
      context,
    )

    // Create document record in database
    const document = await documentsService.create({
      type: type || 'otro',
      fileName: file.originalname,
      fileUrl,
      storageKey,
      fileSize: file.size,
      mimeType: file.mimetype,
      description: description || undefined,
      contractId: contractId ? parseInt(contractId) : undefined,
      tenantId: tenantId ? parseInt(tenantId) : undefined,
      ownerId: ownerId ? parseInt(ownerId) : undefined,
      apartmentId: apartmentId ? parseInt(apartmentId) : undefined,
    }, userId)

    res.status(201).json(document)
  } catch (error) {
    console.error('Error in upload controller:', error)
    next(error)
  }
}
