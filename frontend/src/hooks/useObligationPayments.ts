'use client'

import { useState, useEffect, useCallback } from 'react'
import { obligationPaymentsService } from '@/services/obligations.service'
import {
  ObligationPayment,
  CreateObligationPaymentDto,
  UpdateObligationPaymentDto
} from '@/types'

export function useObligationPayments(contractId?: number) {
  const [payments, setPayments] = useState<ObligationPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await obligationPaymentsService.getAll(contractId)
      setPayments(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar pagos')
      console.error('Error fetching payments:', err)
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const getById = useCallback(async (id: number) => {
    try {
      setError(null)
      return await obligationPaymentsService.getById(id)
    } catch (err: any) {
      setError(err.message || 'Error al cargar pago')
      console.error('Error fetching payment:', err)
      throw err
    }
  }, [])

  const getByObligationId = useCallback(async (obligationId: number) => {
    try {
      setError(null)
      return await obligationPaymentsService.getByObligationId(obligationId)
    } catch (err: any) {
      setError(err.message || 'Error al cargar pagos de la obligación')
      console.error('Error fetching obligation payments:', err)
      throw err
    }
  }, [])

  const create = useCallback(async (data: CreateObligationPaymentDto) => {
    try {
      setError(null)
      const newPayment = await obligationPaymentsService.create(data)
      setPayments(prev => [newPayment, ...prev])
      return newPayment
    } catch (err: any) {
      setError(err.message || 'Error al registrar pago')
      console.error('Error creating payment:', err)
      throw err
    }
  }, [])

  const update = useCallback(async (id: number, data: UpdateObligationPaymentDto) => {
    try {
      setError(null)
      const updatedPayment = await obligationPaymentsService.update(id, data)
      setPayments(prev =>
        prev.map(p => (p.id === id ? updatedPayment : p))
      )
      return updatedPayment
    } catch (err: any) {
      setError(err.message || 'Error al actualizar pago')
      console.error('Error updating payment:', err)
      throw err
    }
  }, [])

  const remove = useCallback(async (id: number) => {
    try {
      setError(null)
      await obligationPaymentsService.delete(id)
      setPayments(prev => prev.filter(p => p.id !== id))
    } catch (err: any) {
      setError(err.message || 'Error al eliminar pago')
      console.error('Error deleting payment:', err)
      throw err
    }
  }, [])

  return {
    payments,
    loading,
    error,
    fetchPayments,
    getById,
    getByObligationId,
    create,
    update,
    remove
  }
}
