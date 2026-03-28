/**
 * Obligation Types
 * DTOs y tipos para el sistema de obligaciones
 * 
 * Principio: El operador registra qué pasó, la app calcula quién gana/quién paga
 */

export type ObligationStatus = 'pending' | 'partial' | 'paid' | 'overdue'
export type ObligationType = 'rent' | 'expenses' | 'service' | 'tax' | 'insurance' | 'maintenance' | 'debt' | 'income_other' | 'expense_other'
export type PaymentMethod = 'cash' | 'transfer' | 'check' | 'card' | 'other'
export type PaidBy = 'tenant' | 'owner' | 'agency'
export type ChargeTo = 'tenant' | 'owner' | 'agency'
export type ObligationOrigin = 'tenant_ledger' | 'cashflow' | 'liquidation_manual' | 'contract_auto'
export type CommissionType = 'percentage' | 'fixed'

export interface CreateObligationDto {
  contractId?: number
  apartmentId?: number
  type: ObligationType
  category?: string
  description: string
  period: string | Date
  dueDate: string | Date
  amount: number
  
  // Distribución de dinero
  paidBy?: PaidBy
  chargeTo?: ChargeTo
  ownerImpact?: number
  agencyImpact?: number
  
  // Trazabilidad
  origin?: ObligationOrigin
  
  // Configuración de comisión (para alquileres)
  commissionType?: CommissionType
  commissionValue?: number
  
  // Legacy (calculados automáticamente para rent)
  commissionAmount?: number
  ownerAmount?: number
  
  // Para crear obligaciones ya pagadas (ajustes/créditos)
  status?: ObligationStatus
  paidAmount?: number
  
  notes?: string
}

export interface UpdateObligationDto {
  description?: string
  dueDate?: string | Date
  amount?: number
  paidBy?: PaidBy
  ownerImpact?: number
  agencyImpact?: number
  notes?: string
}

export interface CreateObligationPaymentDto {
  obligationId: number
  amount: number
  paymentDate: string | Date
  method?: PaymentMethod
  reference?: string
  notes?: string
}

export interface UpdateObligationPaymentDto {
  amount?: number
  paymentDate?: string | Date
  method?: string
  reference?: string
  notes?: string
}

// DTO para crear obligación recurrente con configuración de comisión
export interface CreateRecurringObligationDto {
  contractId?: number
  apartmentId?: number
  type: ObligationType
  category?: string
  description: string
  amount: number
  dayOfMonth: number
  startDate: string | Date
  endDate?: string | Date
  notes?: string
  
  // Distribución
  paidBy?: PaidBy
  commissionType?: CommissionType
  commissionValue?: number
}

export interface UpdateRecurringObligationDto {
  description?: string
  amount?: number
  dayOfMonth?: number
  endDate?: string | Date
  isActive?: boolean
  notes?: string
  paidBy?: PaidBy
  commissionType?: CommissionType
  commissionValue?: number
}

// Interfaz para calcular distribución de una obligación
export interface ObligationDistribution {
  ownerImpact: number
  agencyImpact: number
  commissionAmount: number
  ownerAmount: number
  chargeTo: ChargeTo
}
