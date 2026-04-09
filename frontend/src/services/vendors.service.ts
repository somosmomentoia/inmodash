import { apiClient } from './api'
import { Vendor } from '@/types'

export interface CreateVendorDto {
  name: string
  email?: string
  phone?: string
  defaultCommissionType?: string
  defaultCommissionPct?: number
  defaultCommissionFixed?: number
}

export interface UpdateVendorDto {
  name?: string
  email?: string
  phone?: string
  isActive?: boolean
  defaultCommissionType?: string
  defaultCommissionPct?: number
  defaultCommissionFixed?: number
}

export const vendorsService = {
  async getAll(): Promise<Vendor[]> {
    return apiClient.get<Vendor[]>('/api/vendors')
  },

  async getById(id: number): Promise<Vendor> {
    return apiClient.get<Vendor>(`/api/vendors/${id}`)
  },

  async create(data: CreateVendorDto): Promise<Vendor> {
    return apiClient.post<Vendor>('/api/vendors', data)
  },

  async update(id: number, data: UpdateVendorDto): Promise<Vendor> {
    return apiClient.put<Vendor>(`/api/vendors/${id}`, data)
  },

  async remove(id: number): Promise<void> {
    return apiClient.delete(`/api/vendors/${id}`)
  },
}
