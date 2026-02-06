/**
 * Documents Service
 * API calls for document management
 */

import { apiClient } from './api'
import { Document } from '@/types'

export interface CreateDocumentDto {
  type: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  description?: string
  tenantId?: number
  ownerId?: number
  contractId?: number
  apartmentId?: number
}

export interface UploadDocumentDto {
  file: File
  type: string
  description?: string
  tenantId?: number
  ownerId?: number
  contractId?: number
  apartmentId?: number
}

export interface UpdateDocumentDto {
  description?: string
}

export const documentsService = {
  /**
   * Get all documents
   */
  async getAll(): Promise<Document[]> {
    return apiClient.get<Document[]>('/api/documents')
  },

  /**
   * Get document by ID
   */
  async getById(id: number): Promise<Document> {
    return apiClient.get<Document>(`/api/documents/${id}`)
  },

  /**
   * Get documents by tenant ID
   */
  async getByTenantId(tenantId: number): Promise<Document[]> {
    return apiClient.get<Document[]>(`/api/documents/tenant/${tenantId}`)
  },

  /**
   * Get documents by owner ID
   */
  async getByOwnerId(ownerId: number): Promise<Document[]> {
    return apiClient.get<Document[]>(`/api/documents/owner/${ownerId}`)
  },

  /**
   * Get documents by contract ID
   */
  async getByContractId(contractId: number): Promise<Document[]> {
    return apiClient.get<Document[]>(`/api/documents/contract/${contractId}`)
  },

  /**
   * Get documents by apartment ID
   */
  async getByApartmentId(apartmentId: number): Promise<Document[]> {
    return apiClient.get<Document[]>(`/api/documents/apartment/${apartmentId}`)
  },

  /**
   * Get documents by type
   */
  async getByType(type: string): Promise<Document[]> {
    return apiClient.get<Document[]>(`/api/documents/type/${type}`)
  },

  /**
   * Create new document
   */
  async create(data: CreateDocumentDto): Promise<Document> {
    return apiClient.post<Document>('/api/documents', data)
  },

  /**
   * Update document
   */
  async update(id: number, data: UpdateDocumentDto): Promise<Document> {
    return apiClient.put<Document>(`/api/documents/${id}`, data)
  },

  /**
   * Delete document
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/documents/${id}`)
  },

  /**
   * Upload file and create document
   */
  async upload(data: UploadDocumentDto): Promise<Document> {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('type', data.type)
    if (data.description) formData.append('description', data.description)
    if (data.contractId) formData.append('contractId', data.contractId.toString())
    if (data.tenantId) formData.append('tenantId', data.tenantId.toString())
    if (data.ownerId) formData.append('ownerId', data.ownerId.toString())
    if (data.apartmentId) formData.append('apartmentId', data.apartmentId.toString())

    return apiClient.upload<Document>('/api/documents/upload', formData)
  },
}
