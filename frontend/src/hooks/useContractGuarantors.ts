/**
 * useContractGuarantors Hook
 * Hook para gestionar garantes de un contrato específico
 */

import { useState, useEffect, useCallback } from 'react'
import { contractsService, ApiError } from '@/services'
import { logger } from '@/lib/logger'
import type { Guarantor } from '@/services/guarantors.service'

export function useContractGuarantors(contractId: number | null) {
  const [guarantors, setGuarantors] = useState<Guarantor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGuarantors = useCallback(async () => {
    if (!contractId) {
      setGuarantors([])
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const data = await contractsService.getGuarantors(contractId)
      setGuarantors(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar garantes del contrato'
      setError(message)
      logger.error('Error fetching contract guarantors:', err)
    } finally {
      setLoading(false)
    }
  }, [contractId])

  const addGuarantor = useCallback(async (guarantorId: number) => {
    if (!contractId) return
    
    setLoading(true)
    setError(null)
    try {
      await contractsService.addGuarantor(contractId, guarantorId)
      await fetchGuarantors() // Refrescar lista
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al agregar garante al contrato'
      setError(message)
      logger.error('Error adding guarantor to contract:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [contractId, fetchGuarantors])

  const removeGuarantor = useCallback(async (guarantorId: number) => {
    if (!contractId) return
    
    setLoading(true)
    setError(null)
    try {
      await contractsService.removeGuarantor(contractId, guarantorId)
      setGuarantors(prev => prev.filter(g => g.id !== guarantorId))
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al quitar garante del contrato'
      setError(message)
      logger.error('Error removing guarantor from contract:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    fetchGuarantors()
  }, [fetchGuarantors])

  return {
    guarantors,
    loading,
    error,
    refresh: fetchGuarantors,
    addGuarantor,
    removeGuarantor,
  }
}
