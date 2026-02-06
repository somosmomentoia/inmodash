/**
 * useBuildings Hook
 * React hook for building management with API integration
 */

import { useState, useEffect, useCallback } from 'react'
import { buildingsService, CreateBuildingDto, UpdateBuildingDto, ApiError } from '@/services'
import { Building } from '@/types'
import { logger } from '@/lib/logger'

export function useBuildings() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBuildings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await buildingsService.getAll()
      setBuildings(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar edificios'
      setError(message)
      logger.error('Error fetching buildings', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createBuilding = useCallback(async (data: CreateBuildingDto) => {
    setLoading(true)
    setError(null)
    try {
      const newBuilding = await buildingsService.create(data)
      setBuildings(prev => [...prev, newBuilding])
      return newBuilding
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al crear edificio'
      setError(message)
      logger.error('Error creating building', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateBuilding = useCallback(async (id: number, data: UpdateBuildingDto) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await buildingsService.update(id, data)
      setBuildings(prev => prev.map(b => Number(b.id) === id ? updated : b))
      return updated
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al actualizar edificio'
      setError(message)
      logger.error('Error updating building', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteBuilding = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await buildingsService.delete(id)
      setBuildings(prev => prev.filter(b => Number(b.id) !== id))
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al eliminar edificio'
      setError(message)
      logger.error('Error deleting building', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBuildings()
  }, [fetchBuildings])

  return {
    buildings,
    loading,
    error,
    refresh: fetchBuildings,
    createBuilding,
    updateBuilding,
    deleteBuilding,
  }
}

export function useBuilding(id: number) {
  const [building, setBuilding] = useState<Building | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBuilding = useCallback(async () => {
    if (!id) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await buildingsService.getById(id)
      setBuilding(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar edificio'
      setError(message)
      logger.error('Error fetching building', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBuilding()
  }, [fetchBuilding])

  return {
    building,
    loading,
    error,
    refresh: fetchBuilding,
  }
}
