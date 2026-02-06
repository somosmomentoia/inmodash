/**
 * Guarantors Service
 * API calls for guarantor management
 * Los garantes pertenecen a la inmobiliaria (userId) y pueden asociarse a cualquier contrato
 */

import { apiClient } from './api'

export interface Guarantor {
  id: number
  userId: number
  name: string
  dni: string
  address: string
  email: string
  phone: string
  contractPdfUrl?: string | null
  salaryReceiptPdfUrl?: string | null
  isActive: boolean
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
  contracts?: Array<{
    contract: {
      id: number
      startDate: string
      endDate: string
      tenant?: {
        id: number
        nameOrBusiness: string
      }
      apartment: {
        id: number
        floor?: string | null
        nomenclature?: string | null
        fullAddress?: string | null
      }
    }
  }>
}

export interface CreateGuarantorDto {
  name: string
  dni: string
  address: string
  email: string
  phone: string
}

export interface UpdateGuarantorDto {
  name?: string
  dni?: string
  address?: string
  email?: string
  phone?: string
  contractPdfUrl?: string | null
  salaryReceiptPdfUrl?: string | null
}

export const guarantorsService = {
  /**
   * Get all guarantors
   */
  async getAll(): Promise<Guarantor[]> {
    return apiClient.get<Guarantor[]>('/api/guarantors')
  },

  /**
   * Get guarantor by ID
   */
  async getById(id: number): Promise<Guarantor> {
    return apiClient.get<Guarantor>(`/api/guarantors/${id}`)
  },

  /**
   * Create new guarantor
   */
  async create(data: CreateGuarantorDto): Promise<Guarantor> {
    return apiClient.post<Guarantor>('/api/guarantors', data)
  },

  /**
   * Update guarantor
   */
  async update(id: number, data: UpdateGuarantorDto): Promise<Guarantor> {
    return apiClient.put<Guarantor>(`/api/guarantors/${id}`, data)
  },

  /**
   * Delete guarantor (soft delete)
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/guarantors/${id}`)
  },
}
