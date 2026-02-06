/**
 * useApartments Hook
 * React hook for apartment management with API integration
 */

import { useState, useEffect, useCallback } from 'react'
import { apartmentsService, CreateApartmentDto, UpdateApartmentDto, ApiError } from '@/services'
import { Apartment } from '@/types'
import { logger } from '@/lib/logger'

export function useApartments() {
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchApartments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apartmentsService.getAll()
      setApartments(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar departamentos'
      setError(message)
      logger.error('Error fetching apartments:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createApartment = useCallback(async (data: CreateApartmentDto) => {
    setLoading(true)
    setError(null)
    try {
      const newApartment = await apartmentsService.create(data)
      setApartments(prev => [...prev, newApartment])
      return newApartment
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al crear departamento'
      setError(message)
      logger.error('Error creating apartment:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateApartment = useCallback(async (id: number, data: UpdateApartmentDto) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await apartmentsService.update(id, data)
      setApartments(prev => prev.map(a => Number(a.id) === id ? updated : a))
      return updated
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al actualizar departamento'
      setError(message)
      logger.error('Error updating apartment:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteApartment = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await apartmentsService.delete(id)
      setApartments(prev => prev.filter(a => Number(a.id) !== id))
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al eliminar departamento'
      setError(message)
      logger.error('Error deleting apartment:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApartments()
  }, [fetchApartments])

  return {
    apartments,
    loading,
    error,
    refresh: fetchApartments,
    createApartment,
    updateApartment,
    deleteApartment,
  }
}

export function useApartment(id: number) {
  const [apartment, setApartment] = useState<Apartment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchApartment = useCallback(async () => {
    if (!id) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await apartmentsService.getById(id)
      setApartment(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar departamento'
      setError(message)
      logger.error('Error fetching apartment:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchApartment()
  }, [fetchApartment])

  return {
    apartment,
    loading,
    error,
    refresh: fetchApartment,
  }
}
