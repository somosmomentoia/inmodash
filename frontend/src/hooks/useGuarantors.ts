/**
 * useGuarantors Hook
 * React hook for guarantor management with API integration
 * Los garantes pertenecen a la inmobiliaria (userId) y pueden asociarse a cualquier contrato
 */

import { useState, useEffect, useCallback } from 'react'
import { guarantorsService, Guarantor, UpdateGuarantorDto, CreateGuarantorDto } from '@/services/guarantors.service'

// Type for guarantor creation
export type CreateGuarantorData = CreateGuarantorDto

export function useGuarantor(id: number) {
  const [guarantor, setGuarantor] = useState<Guarantor | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGuarantor = useCallback(async () => {
    if (!id) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await guarantorsService.getById(id)
      setGuarantor(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar garante'
      setError(message)
      console.error('Error fetching guarantor:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  const updateGuarantor = useCallback(async (data: UpdateGuarantorDto) => {
    if (!id) return
    
    setLoading(true)
    setError(null)
    try {
      const updated = await guarantorsService.update(id, data)
      setGuarantor(updated)
      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar garante'
      setError(message)
      console.error('Error updating guarantor:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchGuarantor()
  }, [fetchGuarantor])

  return {
    guarantor,
    loading,
    error,
    refresh: fetchGuarantor,
    updateGuarantor,
  }
}

export function useGuarantors() {
  const [guarantors, setGuarantors] = useState<Guarantor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGuarantors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await guarantorsService.getAll()
      setGuarantors(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar garantes'
      setError(message)
      console.error('Error fetching guarantors:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createGuarantor = useCallback(async (data: CreateGuarantorData) => {
    setLoading(true)
    setError(null)
    try {
      const newGuarantor = await guarantorsService.create(data)
      setGuarantors(prev => [...prev, newGuarantor])
      return newGuarantor
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear garante'
      setError(message)
      console.error('Error creating guarantor:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteGuarantor = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await guarantorsService.delete(id)
      setGuarantors(prev => prev.filter(g => g.id !== id))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar garante'
      setError(message)
      console.error('Error deleting guarantor:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGuarantors()
  }, [fetchGuarantors])

  return {
    guarantors,
    loading,
    error,
    refresh: fetchGuarantors,
    createGuarantor,
    deleteGuarantor,
  }
}
