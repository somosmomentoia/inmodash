'use client'

import { useState, useEffect, useCallback } from 'react'
import { ObligationPayment } from '@/types'
import { cashFlowService, CreateCashFlowMovementDto } from '@/services/cashflow.service'

export function useCashFlow() {
  const [payments, setPayments] = useState<ObligationPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await cashFlowService.getAll()
      setPayments(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar flujo de caja')
      console.error('Error fetching cash flow:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const createMovement = useCallback(async (data: CreateCashFlowMovementDto) => {
    try {
      setError(null)
      const result = await cashFlowService.createMovement(data)
      // Refetch para tener la lista actualizada con includes
      await fetchPayments()
      return result
    } catch (err: any) {
      setError(err.message || 'Error al crear movimiento')
      console.error('Error creating cash flow movement:', err)
      throw err
    }
  }, [fetchPayments])

  return {
    payments,
    loading,
    error,
    fetchPayments,
    createMovement,
  }
}
