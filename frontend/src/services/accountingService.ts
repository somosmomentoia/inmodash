import { apiClient } from './api'

export type AccountingEntryType = 'commission' | 'commission_service' | 'expense' | 'income_other' | 'adjustment'

export interface AccountingEntry {
  id: number
  userId: number
  type: AccountingEntryType
  description: string
  amount: number
  entryDate: string
  period: string
  settlementId?: number
  ownerId?: number
  contractId?: number
  obligationId?: number
  metadata?: Record<string, unknown>
  createdAt: string
  owner?: {
    id: number
    name: string
  }
  settlement?: {
    id: number
    period: string
    status: string
  }
  contract?: {
    id: number
    apartment?: {
      id: number
      nomenclature: string
    }
  }
}

export interface AccountingFilters {
  type?: AccountingEntryType
  startDate?: string
  endDate?: string
  ownerId?: number
  settlementId?: number
}

export interface CommissionsSummary {
  entries: AccountingEntry[]
  totalCommissions: number
  count: number
}

export interface TotalsByType {
  type: AccountingEntryType
  total: number
  count: number
}

const accountingService = {
  /**
   * Obtener todos los asientos contables
   */
  async getAll(filters?: AccountingFilters): Promise<AccountingEntry[]> {
    const params = new URLSearchParams()
    if (filters?.type) params.append('type', filters.type)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.ownerId) params.append('ownerId', filters.ownerId.toString())
    if (filters?.settlementId) params.append('settlementId', filters.settlementId.toString())

    const queryString = params.toString()
    const url = queryString ? `/api/accounting?${queryString}` : '/api/accounting'
    
    return apiClient.get<AccountingEntry[]>(url)
  },

  /**
   * Obtener un asiento contable por ID
   */
  async getById(id: number): Promise<AccountingEntry> {
    return apiClient.get<AccountingEntry>(`/api/accounting/${id}`)
  },

  /**
   * Crear un nuevo asiento contable
   */
  async create(data: {
    type: AccountingEntryType
    description: string
    amount: number
    entryDate: string
    period: string
    settlementId?: number
    ownerId?: number
    contractId?: number
    obligationId?: number
    metadata?: Record<string, unknown>
  }): Promise<AccountingEntry> {
    return apiClient.post<AccountingEntry>('/api/accounting', data)
  },

  /**
   * Eliminar un asiento contable
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/accounting/${id}`)
  },

  /**
   * Obtener resumen de comisiones
   */
  async getCommissionsSummary(startDate: string, endDate: string): Promise<CommissionsSummary> {
    return apiClient.get<CommissionsSummary>(`/api/accounting/commissions/summary?startDate=${startDate}&endDate=${endDate}`)
  },

  /**
   * Obtener totales por tipo
   */
  async getTotalsByType(startDate: string, endDate: string): Promise<TotalsByType[]> {
    return apiClient.get<TotalsByType[]>(`/api/accounting/totals?startDate=${startDate}&endDate=${endDate}`)
  },
}

export default accountingService
