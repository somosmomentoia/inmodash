/**
 * useDocuments Hook
 * React hook for document management with API integration
 */

import { useState, useEffect, useCallback } from 'react'
import { documentsService, CreateDocumentDto, UpdateDocumentDto, UploadDocumentDto, ApiError } from '@/services'
import { Document } from '@/types'
import { logger } from '@/lib/logger'

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await documentsService.getAll()
      setDocuments(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar documentos'
      setError(message)
      logger.error('Error fetching documents', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createDocument = useCallback(async (data: CreateDocumentDto) => {
    setLoading(true)
    setError(null)
    try {
      const newDocument = await documentsService.create(data)
      setDocuments(prev => [newDocument, ...prev])
      return newDocument
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al crear documento'
      setError(message)
      logger.error('Error creating document', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateDocument = useCallback(async (id: number, data: UpdateDocumentDto) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await documentsService.update(id, data)
      setDocuments(prev => prev.map(d => Number(d.id) === id ? updated : d))
      return updated
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al actualizar documento'
      setError(message)
      logger.error('Error updating document', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteDocument = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await documentsService.delete(id)
      setDocuments(prev => prev.filter(d => Number(d.id) !== id))
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al eliminar documento'
      setError(message)
      logger.error('Error deleting document', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadDocument = useCallback(async (data: UploadDocumentDto) => {
    setLoading(true)
    setError(null)
    try {
      const newDocument = await documentsService.upload(data)
      setDocuments(prev => [newDocument, ...prev])
      return newDocument
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al subir documento'
      setError(message)
      logger.error('Error uploading document', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return {
    documents,
    loading,
    error,
    refresh: fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    uploadDocument,
  }
}

export function useDocument(id: number) {
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocument = useCallback(async () => {
    if (!id) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await documentsService.getById(id)
      setDocument(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar documento'
      setError(message)
      logger.error('Error fetching document', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDocument()
  }, [fetchDocument])

  return {
    document,
    loading,
    error,
    refresh: fetchDocument,
  }
}

export function useTenantDocuments(tenantId: number) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    if (!tenantId) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await documentsService.getByTenantId(tenantId)
      setDocuments(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar documentos del inquilino'
      setError(message)
      logger.error('Error fetching tenant documents', err)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return {
    documents,
    loading,
    error,
    refresh: fetchDocuments,
  }
}

export function useOwnerDocuments(ownerId: number) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    if (!ownerId) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await documentsService.getByOwnerId(ownerId)
      setDocuments(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar documentos del propietario'
      setError(message)
      logger.error('Error fetching owner documents', err)
    } finally {
      setLoading(false)
    }
  }, [ownerId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return {
    documents,
    loading,
    error,
    refresh: fetchDocuments,
  }
}

export function useContractDocuments(contractId: number) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    if (!contractId) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await documentsService.getByContractId(contractId)
      setDocuments(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar documentos del contrato'
      setError(message)
      logger.error('Error fetching contract documents', err)
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return {
    documents,
    loading,
    error,
    refresh: fetchDocuments,
  }
}

export function useApartmentDocuments(apartmentId: number) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    if (!apartmentId) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await documentsService.getByApartmentId(apartmentId)
      setDocuments(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar documentos del departamento'
      setError(message)
      logger.error('Error fetching apartment documents', err)
    } finally {
      setLoading(false)
    }
  }, [apartmentId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return {
    documents,
    loading,
    error,
    refresh: fetchDocuments,
  }
}
