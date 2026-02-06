'use client'

import { useState, useEffect, useCallback } from 'react'
import { obligationsService } from '@/services/obligations.service'
import {
  Obligation,
  CreateObligationDto,
  UpdateObligationDto
} from '@/types'

export function useObligations(contractId?: number) {
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchObligations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await obligationsService.getAll(contractId)
      setObligations(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar obligaciones')
      console.error('Error fetching obligations:', err)
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    fetchObligations()
  }, [fetchObligations])

  const getById = useCallback(async (id: number) => {
    try {
      setError(null)
      return await obligationsService.getById(id)
    } catch (err: any) {
      setError(err.message || 'Error al cargar obligación')
      console.error('Error fetching obligation:', err)
      throw err
    }
  }, [])

  const getByContractId = useCallback(async (contractId: number) => {
    try {
      setError(null)
      return await obligationsService.getByContractId(contractId)
    } catch (err: any) {
      setError(err.message || 'Error al cargar obligaciones del contrato')
      console.error('Error fetching contract obligations:', err)
      throw err
    }
  }, [])

  const getByType = useCallback(async (type: string) => {
    try {
      setError(null)
      return await obligationsService.getByType(type)
    } catch (err: any) {
      setError(err.message || 'Error al cargar obligaciones por tipo')
      console.error('Error fetching obligations by type:', err)
      throw err
    }
  }, [])

  const getPending = useCallback(async () => {
    try {
      setError(null)
      return await obligationsService.getPending()
    } catch (err: any) {
      setError(err.message || 'Error al cargar obligaciones pendientes')
      console.error('Error fetching pending obligations:', err)
      throw err
    }
  }, [])

  const getOverdue = useCallback(async () => {
    try {
      setError(null)
      return await obligationsService.getOverdue()
    } catch (err: any) {
      setError(err.message || 'Error al cargar obligaciones vencidas')
      console.error('Error fetching overdue obligations:', err)
      throw err
    }
  }, [])

  const create = useCallback(async (data: CreateObligationDto) => {
    try {
      setError(null)
      const newObligation = await obligationsService.create(data)
      setObligations(prev => [newObligation, ...prev])
      return newObligation
    } catch (err: any) {
      setError(err.message || 'Error al crear obligación')
      console.error('Error creating obligation:', err)
      throw err
    }
  }, [])

  const update = useCallback(async (id: number, data: UpdateObligationDto) => {
    try {
      setError(null)
      const updatedObligation = await obligationsService.update(id, data)
      setObligations(prev =>
        prev.map(o => (o.id === id ? updatedObligation : o))
      )
      return updatedObligation
    } catch (err: any) {
      setError(err.message || 'Error al actualizar obligación')
      console.error('Error updating obligation:', err)
      throw err
    }
  }, [])

  const remove = useCallback(async (id: number) => {
    try {
      setError(null)
      await obligationsService.delete(id)
      setObligations(prev => prev.filter(o => o.id !== id))
    } catch (err: any) {
      setError(err.message || 'Error al eliminar obligación')
      console.error('Error deleting obligation:', err)
      throw err
    }
  }, [])

  const markOverdue = useCallback(async () => {
    try {
      setError(null)
      const result = await obligationsService.markOverdue()
      await fetchObligations() // Refresh list
      return result
    } catch (err: any) {
      setError(err.message || 'Error al marcar obligaciones vencidas')
      console.error('Error marking overdue obligations:', err)
      throw err
    }
  }, [fetchObligations])

  return {
    obligations,
    loading,
    error,
    fetchObligations,
    getById,
    getByContractId,
    getByType,
    getPending,
    getOverdue,
    create,
    update,
    remove,
    markOverdue
  }
}

export function useObligation(id: number) {
  const [obligation, setObligation] = useState<Obligation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchObligation = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await obligationsService.getById(id)
        setObligation(data)
      } catch (err: any) {
        setError(err.message || 'Error al cargar obligación')
        console.error('Error fetching obligation:', err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchObligation()
    }
  }, [id])

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const data = await obligationsService.getById(id)
      setObligation(data)
    } catch (err: any) {
      setError(err.message || 'Error al actualizar obligación')
      console.error('Error refreshing obligation:', err)
      throw err
    }
  }, [id])

  return {
    obligation,
    loading,
    error,
    refresh
  }
}
