/**
 * Payments Service
 * API calls for payment management
 */

import { apiClient } from './api'
import { Payment } from '@/types'

export interface CreatePaymentDto {
  contractId: number
  month: string
  amount: number
  commissionAmount?: number
  ownerAmount?: number
  paymentDate?: string
  status?: string
  notes?: string
}

export interface UpdatePaymentDto {
  amount?: number
  commissionAmount?: number
  ownerAmount?: number
  paymentDate?: string
  status?: string
  notes?: string
}

export const paymentsService = {
  /**
   * Get all payments
   */
  async getAll(): Promise<Payment[]> {
    return apiClient.get<Payment[]>('/api/payments')
  },

  /**
   * Get payment by ID
   */
  async getById(id: number): Promise<Payment> {
    return apiClient.get<Payment>(`/api/payments/${id}`)
  },

  /**
   * Get payments by contract ID
   */
  async getByContractId(contractId: number): Promise<Payment[]> {
    return apiClient.get<Payment[]>(`/api/payments/contract/${contractId}`)
  },

  /**
   * Get pending payments
   */
  async getPending(): Promise<Payment[]> {
    return apiClient.get<Payment[]>('/api/payments/pending')
  },

  /**
   * Get overdue payments
   */
  async getOverdue(): Promise<Payment[]> {
    return apiClient.get<Payment[]>('/api/payments/overdue')
  },

  /**
   * Create new payment
   */
  async create(data: CreatePaymentDto): Promise<Payment> {
    return apiClient.post<Payment>('/api/payments', data)
  },

  /**
   * Update payment
   */
  async update(id: number, data: UpdatePaymentDto): Promise<Payment> {
    return apiClient.put<Payment>(`/api/payments/${id}`, data)
  },

  /**
   * Mark payment as paid
   */
  async markAsPaid(id: number, paymentDate?: string): Promise<Payment> {
    return apiClient.post<Payment>(`/api/payments/${id}/mark-paid`, { paymentDate })
  },

  /**
   * Delete payment
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/payments/${id}`)
  },

  /**
   * Mark overdue payments
   */
  async markOverdue(): Promise<{ message: string; count: number }> {
    return apiClient.post<{ message: string; count: number }>('/api/payments/mark-overdue', {})
  },
}
