/**
 * Owners Service
 * API calls for owner management
 */

import { apiClient } from './api'
import { Owner } from '@/types'

export interface CreateOwnerDto {
  name: string
  dniOrCuit: string
  phone: string
  email: string
  address: string
  bankAccount?: string
  commissionPercentage?: number
}

export interface UpdateOwnerDto {
  name?: string
  dniOrCuit?: string
  phone?: string
  email?: string
  address?: string
  bankAccount?: string
  commissionPercentage?: number
}

export const ownersService = {
  /**
   * Get all owners
   */
  async getAll(): Promise<Owner[]> {
    return apiClient.get<Owner[]>('/api/owners')
  },

  /**
   * Get owner by ID
   */
  async getById(id: number): Promise<Owner> {
    return apiClient.get<Owner>(`/api/owners/${id}`)
  },

  /**
   * Create new owner
   */
  async create(data: CreateOwnerDto): Promise<Owner> {
    return apiClient.post<Owner>('/api/owners', data)
  },

  /**
   * Update owner
   */
  async update(id: number, data: UpdateOwnerDto): Promise<Owner> {
    return apiClient.put<Owner>(`/api/owners/${id}`, data)
  },

  /**
   * Delete owner
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/owners/${id}`)
  },
}
