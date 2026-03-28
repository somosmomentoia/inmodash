import { apiClient } from './api'
import { ObligationPayment, ObligationType, PaidBy, ChargeTo, PaymentMethod } from '@/types'

// DTO para crear movimiento atómico desde Flujo de Caja
export interface CreateCashFlowMovementDto {
  type: ObligationType
  description: string
  amount: number
  date: string | Date
  period?: string | Date
  paidBy?: PaidBy
  chargeTo?: ChargeTo
  contractId?: number
  apartmentId?: number
  category?: string
  method?: PaymentMethod
  reference?: string
  notes?: string
  commissionType?: 'percentage' | 'fixed'
  commissionValue?: number
}

export interface CashFlowMovementResult {
  obligation: any
  payment: ObligationPayment
}

export const cashFlowService = {
  // Listar todos los pagos (fuente de verdad de Flujo de Caja)
  async getAll(): Promise<ObligationPayment[]> {
    return apiClient.get<ObligationPayment[]>('/api/cash-flow')
  },

  // Crear movimiento atómico (obligation + payment)
  async createMovement(data: CreateCashFlowMovementDto): Promise<CashFlowMovementResult> {
    return apiClient.post<CashFlowMovementResult>('/api/cash-flow', data)
  },
}
