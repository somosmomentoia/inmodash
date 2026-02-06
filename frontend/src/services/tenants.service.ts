/**
 * Tenants Service
 * API calls for tenant management
 */

import { apiClient } from './api'

export interface Tenant {
  id: number
  nameOrBusiness: string
  dniOrCuit: string
  address: string
  contactName: string
  contactPhone: string
  contactEmail: string
  contactAddress: string
  createdAt: string
  updatedAt: string
}

export interface CreateTenantDto {
  nameOrBusiness: string
  dniOrCuit: string
  address: string
  contactName: string
  contactPhone: string
  contactEmail: string
  contactAddress: string
}

export interface UpdateTenantDto {
  nameOrBusiness?: string
  dniOrCuit?: string
  address?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  contactAddress?: string
}

export const tenantsService = {
  /**
   * Get all tenants
   */
  async getAll(): Promise<Tenant[]> {
    return apiClient.get<Tenant[]>('/api/tenants')
  },

  /**
   * Get tenant by ID
   */
  async getById(id: number): Promise<Tenant> {
    return apiClient.get<Tenant>(`/api/tenants/${id}`)
  },

  /**
   * Create new tenant
   */
  async create(data: CreateTenantDto): Promise<Tenant> {
    return apiClient.post<Tenant>('/api/tenants', data)
  },

  /**
   * Update tenant
   */
  async update(id: number, data: UpdateTenantDto): Promise<Tenant> {
    return apiClient.put<Tenant>(`/api/tenants/${id}`, data)
  },

  /**
   * Delete tenant
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/tenants/${id}`)
  },
}
