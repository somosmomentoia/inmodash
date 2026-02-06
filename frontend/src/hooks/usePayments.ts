/**
 * usePayments Hook
 * React hook for payment management with API integration
 */

import { useState, useEffect, useCallback } from 'react'
import { paymentsService, CreatePaymentDto, UpdatePaymentDto, ApiError } from '@/services'
import { Payment } from '@/types'
import { logger } from '@/lib/logger'

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await paymentsService.getAll()
      setPayments(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar pagos'
      setError(message)
      logger.error('Error fetching payments', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createPayment = useCallback(async (data: CreatePaymentDto) => {
    setLoading(true)
    setError(null)
    try {
      const newPayment = await paymentsService.create(data)
      setPayments(prev => [newPayment, ...prev])
      return newPayment
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al crear pago'
      setError(message)
      logger.error('Error creating payment', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePayment = useCallback(async (id: number, data: UpdatePaymentDto) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await paymentsService.update(id, data)
      setPayments(prev => prev.map(p => Number(p.id) === id ? updated : p))
      return updated
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al actualizar pago'
      setError(message)
      logger.error('Error updating payment', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsPaid = useCallback(async (id: number, paymentDate?: string) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await paymentsService.markAsPaid(id, paymentDate)
      setPayments(prev => prev.map(p => Number(p.id) === id ? updated : p))
      return updated
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al marcar como pagado'
      setError(message)
      logger.error('Error marking payment as paid', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deletePayment = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await paymentsService.delete(id)
      setPayments(prev => prev.filter(p => Number(p.id) !== id))
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al eliminar pago'
      setError(message)
      logger.error('Error deleting payment', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  return {
    payments,
    loading,
    error,
    refresh: fetchPayments,
    createPayment,
    updatePayment,
    markAsPaid,
    deletePayment,
  }
}

export function usePayment(id: number) {
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPayment = useCallback(async () => {
    if (!id) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await paymentsService.getById(id)
      setPayment(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar pago'
      setError(message)
      logger.error('Error fetching payment', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchPayment()
  }, [fetchPayment])

  return {
    payment,
    loading,
    error,
    refresh: fetchPayment,
  }
}

export function useContractPayments(contractId: number) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    if (!contractId) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await paymentsService.getByContractId(contractId)
      setPayments(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar pagos del contrato'
      setError(message)
      logger.error('Error fetching contract payments', err)
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  return {
    payments,
    loading,
    error,
    refresh: fetchPayments,
  }
}

export function usePendingPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await paymentsService.getPending()
      setPayments(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar pagos pendientes'
      setError(message)
      logger.error('Error fetching pending payments', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  return {
    payments,
    loading,
    error,
    refresh: fetchPayments,
  }
}

export function useOverduePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await paymentsService.getOverdue()
      setPayments(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar pagos vencidos'
      setError(message)
      logger.error('Error fetching overdue payments', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  return {
    payments,
    loading,
    error,
    refresh: fetchPayments,
  }
}
