/**
 * Contracts Service
 * API calls for contract management
 */

import { apiClient } from './api'

export interface Contract {
  id: number
  apartmentId: number
  tenantId: number
  startDate: string
  endDate: string
  initialAmount: number
  createdAt: string
  updatedAt: string
}

export interface CreateContractDto {
  apartmentId: number
  tenantId: number
  startDate: string
  endDate: string
  initialAmount: number
  guarantorIds: number[]
  updateRule: {
    updateFrequency: string
    monthlyCoefficient?: number
    lateInterest?: {
      percent: number
      frequency: string
    }
    updatePeriods: Array<{
      date: string
      type: string
      value?: number
      indexName?: string
    }>
  }
}

export interface UpdateContractDto {
  startDate?: string
  endDate?: string
  initialAmount?: number
}

export const contractsService = {
  /**
   * Get all contracts
   */
  async getAll(): Promise<Contract[]> {
    return apiClient.get<Contract[]>('/api/contracts')
  },

  /**
   * Get contract by ID
   */
  async getById(id: number): Promise<Contract> {
    return apiClient.get<Contract>(`/api/contracts/${id}`)
  },

  /**
   * Get contracts by apartment ID
   */
  async getByApartmentId(apartmentId: number): Promise<Contract[]> {
    return apiClient.get<Contract[]>(`/api/contracts/apartment/${apartmentId}`)
  },

  /**
   * Get contracts by tenant ID
   */
  async getByTenantId(tenantId: number): Promise<Contract[]> {
    return apiClient.get<Contract[]>(`/api/contracts/tenant/${tenantId}`)
  },

  /**
   * Create new contract
   */
  async create(data: CreateContractDto): Promise<Contract> {
    return apiClient.post<Contract>('/api/contracts', data)
  },

  /**
   * Update contract
   */
  async update(id: number, data: UpdateContractDto): Promise<Contract> {
    return apiClient.put<Contract>(`/api/contracts/${id}`, data)
  },

  /**
   * Delete contract
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/contracts/${id}`)
  },

  /**
   * Get guarantors of a contract
   */
  async getGuarantors(contractId: number): Promise<any[]> {
    return apiClient.get<any[]>(`/api/contracts/${contractId}/guarantors`)
  },

  /**
   * Add guarantor to contract
   */
  async addGuarantor(contractId: number, guarantorId: number): Promise<void> {
    return apiClient.post<void>(`/api/contracts/${contractId}/guarantors`, { guarantorId })
  },

  /**
   * Remove guarantor from contract
   */
  async removeGuarantor(contractId: number, guarantorId: number): Promise<void> {
    return apiClient.delete<void>(`/api/contracts/${contractId}/guarantors/${guarantorId}`)
  },
}
