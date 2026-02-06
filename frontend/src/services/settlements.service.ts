import { apiClient } from './api'

export interface Settlement {
  id: number
  userId: number
  ownerId: number
  period: Date
  totalCollected: number
  ownerAmount: number
  commissionAmount: number
  status: 'pending' | 'settled'
  settledAt?: Date
  paymentMethod?: string
  reference?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  owner?: {
    id: number
    name: string
    dniOrCuit: string
    phone: string
    email: string
  }
}

export interface CreateSettlementDto {
  ownerId: number
  period: string
  totalCollected: number
  ownerAmount: number
  commissionAmount: number
  notes?: string
}

export interface MarkAsSettledDto {
  paymentMethod?: string
  reference?: string
  notes?: string
}

export const settlementsService = {
  async getAll(): Promise<Settlement[]> {
    return apiClient.get<Settlement[]>('/api/settlements')
  },

  async getPending(): Promise<Settlement[]> {
    return apiClient.get<Settlement[]>('/api/settlements/pending')
  },

  async getByOwner(ownerId: number): Promise<Settlement[]> {
    return apiClient.get<Settlement[]>(`/api/settlements/owner/${ownerId}`)
  },

  async create(data: CreateSettlementDto): Promise<Settlement> {
    return apiClient.post<Settlement>('/api/settlements', data)
  },

  async calculateForPeriod(period: string): Promise<Settlement[]> {
    return apiClient.post<Settlement[]>('/api/settlements/calculate', { period })
  },

  async markAsSettled(id: number, data: MarkAsSettledDto): Promise<Settlement> {
    return apiClient.put<Settlement>(`/api/settlements/${id}/settle`, data)
  },

  async markAsPending(id: number): Promise<Settlement> {
    return apiClient.put<Settlement>(`/api/settlements/${id}/pending`)
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/settlements/${id}`)
  }
}
