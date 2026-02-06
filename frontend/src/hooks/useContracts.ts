/**
 * useContracts Hook
 * React hook for contract management with API integration
 */

import { useState, useEffect, useCallback } from 'react'
import { contractsService, ApiError } from '@/services'
import { logger } from '@/lib/logger'

export interface Contract {
  id: number
  apartmentId: number
  tenantId: number
  startDate: string
  endDate: string
  initialAmount: number
  createdAt: string
  updatedAt: string
  apartment?: any
  tenant?: any
  updateRule?: any
  guarantors?: any[]
}

export interface CreateContractDto {
  apartmentId: number
  tenantId: number
  startDate: string
  endDate: string
  initialAmount: number
  guarantorIds: number[]
  updateRule: {
    updateFrequency: string
    monthlyCoefficient?: number
    lateInterest?: {
      percent: number
      frequency: string
    }
    updatePeriods: Array<{
      date: string
      type: string
      value?: number
      indexName?: string
    }>
  }
}

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchContracts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await contractsService.getAll()
      setContracts(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar contratos'
      setError(message)
      logger.error('Error fetching contracts', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createContract = useCallback(async (data: CreateContractDto) => {
    setLoading(true)
    setError(null)
    try {
      const newContract = await contractsService.create(data)
      setContracts(prev => [...prev, newContract])
      return newContract
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al crear contrato'
      setError(message)
      logger.error('Error creating contract', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateContract = useCallback(async (id: number, data: Partial<CreateContractDto>) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await contractsService.update(id, data)
      setContracts(prev => prev.map(c => c.id === id ? updated : c))
      return updated
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al actualizar contrato'
      setError(message)
      logger.error('Error updating contract', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteContract = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await contractsService.delete(id)
      setContracts(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al eliminar contrato'
      setError(message)
      logger.error('Error deleting contract', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  return {
    contracts,
    loading,
    error,
    refresh: fetchContracts,
    createContract,
    updateContract,
    deleteContract,
  }
}

export function useContract(id: number) {
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchContract = useCallback(async () => {
    if (!id) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await contractsService.getById(id)
      setContract(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar contrato'
      setError(message)
      logger.error('Error fetching contract', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchContract()
  }, [fetchContract])

  return {
    contract,
    loading,
    error,
    refresh: fetchContract,
  }
}

export function useContractsByApartment(apartmentId: number) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchContracts = useCallback(async () => {
    if (!apartmentId) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await contractsService.getByApartmentId(apartmentId)
      setContracts(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar contratos'
      setError(message)
      logger.error('Error fetching contracts by apartment', err)
    } finally {
      setLoading(false)
    }
  }, [apartmentId])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  return {
    contracts,
    loading,
    error,
    refresh: fetchContracts,
  }
}
