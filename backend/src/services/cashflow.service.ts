/**
 * Cash Flow Service
 * Endpoint atómico: crea obligation + payment en una sola operación.
 * Reutiliza el motor existente de obligations y payments.
 */

import * as obligationsService from './obligations.service'
import { 
  CreateObligationDto, 
  CreateObligationPaymentDto,
  ObligationType,
  PaidBy,
  ChargeTo,
  PaymentMethod
} from '../types'

// DTO para crear un movimiento de caja (obligation + payment atómico)
export interface CreateCashFlowMovementDto {
  // Tipo de movimiento
  type: ObligationType
  description: string
  amount: number
  
  // Fecha y período
  date: string | Date
  period?: string | Date
  
  // Distribución
  paidBy?: PaidBy
  chargeTo?: ChargeTo
  
  // Contexto opcional
  contractId?: number
  apartmentId?: number
  category?: string
  
  // Pago
  method?: PaymentMethod
  reference?: string
  notes?: string
  
  // Comisión (para alquileres)
  commissionType?: 'percentage' | 'fixed'
  commissionValue?: number
}

/**
 * Crear un movimiento de caja atómico:
 * 1. Crea la obligación (con calculateDistribution)
 * 2. Crea el pago vía createPayment() (actualiza balances, crea AccountingEntry)
 * 
 * La obligación se crea como 'pending' y createPayment() la marca como 'paid'.
 */
export const createMovement = async (data: CreateCashFlowMovementDto, userId: number) => {
  const movementDate = new Date(data.date)
  
  // Período: si no se especifica, usar el mes de la fecha
  const period = data.period 
    ? new Date(data.period) 
    : new Date(movementDate.getFullYear(), movementDate.getMonth(), 1)

  // 1. Crear la obligación
  const obligationData: CreateObligationDto = {
    type: data.type,
    description: data.description,
    amount: data.amount,
    period,
    dueDate: movementDate,
    paidBy: data.paidBy || 'agency',
    chargeTo: data.chargeTo,
    origin: 'cashflow',
    contractId: data.contractId,
    apartmentId: data.apartmentId,
    category: data.category,
    commissionType: data.commissionType,
    commissionValue: data.commissionValue,
    notes: data.notes,
  }

  const obligation = await obligationsService.create(obligationData, userId)

  if (!obligation) {
    throw new Error('Failed to create obligation for cash flow movement')
  }

  // 2. Crear el pago (pasa por createPayment que maneja balances + AccountingEntry)
  const paymentData: CreateObligationPaymentDto = {
    obligationId: obligation.id,
    amount: data.amount,
    paymentDate: movementDate,
    method: data.method || 'transfer',
    reference: data.reference,
    notes: data.notes,
  }

  const payment = await obligationsService.createPayment(paymentData, userId)

  return {
    obligation,
    payment,
  }
}
