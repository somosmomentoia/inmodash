import { apiClient } from './api'
import {
  Obligation,
  ObligationPayment,
  CreateObligationDto,
  UpdateObligationDto,
  CreateObligationPaymentDto,
  UpdateObligationPaymentDto
} from '@/types'

// ============================================================================
// OBLIGATIONS API
// ============================================================================

export const obligationsService = {
  // Get all obligations (con filtro opcional por contractId)
  async getAll(contractId?: number): Promise<Obligation[]> {
    const url = contractId && !isNaN(contractId)
      ? `/api/obligations?contractId=${contractId}`
      : '/api/obligations'
    return apiClient.get<Obligation[]>(url)
  },

  // Get obligation by ID
  async getById(id: number): Promise<Obligation> {
    return apiClient.get<Obligation>(`/api/obligations/${id}`)
  },

  // Get obligations by contract
  async getByContractId(contractId: number): Promise<Obligation[]> {
    return apiClient.get<Obligation[]>(`/api/obligations/contract/${contractId}`)
  },

  // Get obligations by type
  async getByType(type: string): Promise<Obligation[]> {
    return apiClient.get<Obligation[]>(`/api/obligations/type/${type}`)
  },

  // Get pending obligations
  async getPending(): Promise<Obligation[]> {
    return apiClient.get<Obligation[]>('/api/obligations/pending')
  },

  // Get overdue obligations
  async getOverdue(): Promise<Obligation[]> {
    return apiClient.get<Obligation[]>('/api/obligations/overdue')
  },

  // Create obligation
  async create(data: CreateObligationDto): Promise<Obligation> {
    return apiClient.post<Obligation>('/api/obligations', data)
  },

  // Update obligation
  async update(id: number, data: UpdateObligationDto): Promise<Obligation> {
    return apiClient.put<Obligation>(`/api/obligations/${id}`, data)
  },

  // Delete obligation
  async delete(id: number): Promise<void> {
    return apiClient.delete(`/api/obligations/${id}`)
  },

  // Generate obligations automatically
  async generate(month: string): Promise<{ generated: number; skipped: number; errors: string[] }> {
    return apiClient.post('/api/obligations/generate', { month })
  },

  // Mark overdue obligations
  async markOverdue(): Promise<{ message: string; count: number }> {
    return apiClient.post<{ message: string; count: number }>('/api/obligations/mark-overdue', {})
  },

  // Recalculate all owner balances
  async recalculateAllOwnerBalances(): Promise<any[]> {
    return apiClient.post<any[]>('/api/obligations/recalculate-balances', {})
  },

  // Recalculate specific owner balance
  async recalculateOwnerBalance(ownerId: number): Promise<any> {
    return apiClient.post<any>(`/api/obligations/recalculate-balance/${ownerId}`, {})
  }
}

// ============================================================================
// OBLIGATION PAYMENTS API
// ============================================================================

export const obligationPaymentsService = {
  // Get all payments (con filtro opcional por contractId)
  async getAll(contractId?: number): Promise<ObligationPayment[]> {
    const url = contractId && !isNaN(contractId)
      ? `/api/obligations/payments/all?contractId=${contractId}`
      : '/api/obligations/payments/all'
    console.log('[obligationPaymentsService.getAll] URL:', url, 'contractId:', contractId)
    return apiClient.get<ObligationPayment[]>(url)
  },

  // Get payment by ID
  async getById(id: number): Promise<ObligationPayment> {
    return apiClient.get<ObligationPayment>(`/api/obligations/payments/${id}`)
  },

  // Get payments by obligation ID
  async getByObligationId(obligationId: number): Promise<ObligationPayment[]> {
    return apiClient.get<ObligationPayment[]>(`/api/obligations/${obligationId}/payments`)
  },

  // Create payment
  async create(data: CreateObligationPaymentDto): Promise<ObligationPayment> {
    return apiClient.post<ObligationPayment>('/api/obligations/payments', data)
  },

  // Update payment
  async update(id: number, data: UpdateObligationPaymentDto): Promise<ObligationPayment> {
    return apiClient.put<ObligationPayment>(`/api/obligations/payments/${id}`, data)
  },

  // Delete payment
  async delete(id: number): Promise<void> {
    return apiClient.delete(`/api/obligations/payments/${id}`)
  }
}
