/**
 * Apartments Service
 * API calls for apartment management
 */

import { apiClient } from './api'
import { Apartment } from '@/types'

export interface CreateApartmentDto {
  // Campos para departamentos en edificios
  buildingId?: number
  floor?: number
  apartmentLetter?: string
  nomenclature: string
  // Campos para departamentos independientes
  fullAddress?: string
  city?: string
  province?: string
  // Propietario
  ownerId?: number
  // Tipo de propiedad
  propertyType?: string
  // Información general
  area: number
  rooms: number
  status: string
  saleStatus: string
  // Especificaciones
  specifications?: string
  // Unique ID
  uniqueId?: string
}

export interface UpdateApartmentDto {
  // Campos de edificio
  floor?: number
  apartmentLetter?: string
  nomenclature?: string
  // Campos independientes
  fullAddress?: string
  city?: string
  province?: string
  // Propietario
  ownerId?: number
  // Tipo de propiedad
  propertyType?: string
  // Información general
  area?: number
  rooms?: number
  status?: string
  saleStatus?: string
  // Especificaciones
  specifications?: string
}

// Generate unique ID for apartments
const generateUniqueId = (): string => {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `apt-${timestamp}-${randomPart}`
}

export const apartmentsService = {
  /**
   * Get all apartments
   */
  async getAll(): Promise<Apartment[]> {
    return apiClient.get<Apartment[]>('/api/apartments')
  },

  /**
   * Create apartment
   */
  async create(data: CreateApartmentDto): Promise<Apartment> {
    const dataWithUniqueId = {
      ...data,
      uniqueId: data.uniqueId || generateUniqueId(),
    }
    return apiClient.post<Apartment>('/api/apartments', dataWithUniqueId)
  },

  /**
   * Get apartment by ID
   */
  async getById(id: number): Promise<Apartment> {
    return apiClient.get<Apartment>(`/api/apartments/${id}`)
  },

  /**
   * Update apartment
   */
  async update(id: number, data: UpdateApartmentDto): Promise<Apartment> {
    return apiClient.put<Apartment>(`/api/apartments/${id}`, data)
  },

  /**
   * Delete apartment
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/apartments/${id}`)
  },
}
