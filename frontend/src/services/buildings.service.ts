/**
 * Buildings Service
 * API calls for building management
 */

import { apiClient } from './api'
import { Building } from '@/types'

export interface CreateBuildingDto {
  name: string
  address: string
  city: string
  province: string
  owner: string
  ownerId?: number | null
  floors: number
  totalArea: number
  floorConfiguration: Array<{
    floor: number
    apartmentsCount: number
  }>
}

export interface UpdateBuildingDto {
  name?: string
  address?: string
  city?: string
  province?: string
  owner?: string
  ownerId?: number | null
  floors?: number
  totalArea?: number
  floorConfiguration?: Array<{
    floor: number
    apartmentsCount: number
  }>
}

export const buildingsService = {
  /**
   * Get all buildings
   */
  async getAll(): Promise<Building[]> {
    return apiClient.get<Building[]>('/api/buildings')
  },

  /**
   * Get building by ID
   */
  async getById(id: number): Promise<Building> {
    return apiClient.get<Building>(`/api/buildings/${id}`)
  },

  /**
   * Create new building
   */
  async create(data: CreateBuildingDto): Promise<Building> {
    return apiClient.post<Building>('/api/buildings', data)
  },

  /**
   * Update building
   */
  async update(id: number, data: UpdateBuildingDto): Promise<Building> {
    return apiClient.put<Building>(`/api/buildings/${id}`, data)
  },

  /**
   * Delete building
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/buildings/${id}`)
  },
}
