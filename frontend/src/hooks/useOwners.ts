/**
 * useOwners Hook
 * React hook for owner management with API integration
 */

import { useState, useEffect, useCallback } from 'react'
import { ownersService, CreateOwnerDto, UpdateOwnerDto, ApiError } from '@/services'
import { Owner } from '@/types'
import { logger } from '@/lib/logger'

export function useOwners() {
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOwners = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await ownersService.getAll()
      setOwners(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar propietarios'
      setError(message)
      logger.error('Error fetching owners', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createOwner = useCallback(async (data: CreateOwnerDto) => {
    setLoading(true)
    setError(null)
    try {
      const newOwner = await ownersService.create(data)
      setOwners(prev => [...prev, newOwner])
      return newOwner
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al crear propietario'
      setError(message)
      logger.error('Error creating owner', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateOwner = useCallback(async (id: number, data: UpdateOwnerDto) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await ownersService.update(id, data)
      setOwners(prev => prev.map(o => Number(o.id) === id ? updated : o))
      return updated
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al actualizar propietario'
      setError(message)
      logger.error('Error updating owner', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteOwner = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await ownersService.delete(id)
      setOwners(prev => prev.filter(o => Number(o.id) !== id))
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al eliminar propietario'
      setError(message)
      logger.error('Error deleting owner', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOwners()
  }, [fetchOwners])

  return {
    owners,
    loading,
    error,
    refresh: fetchOwners,
    createOwner,
    updateOwner,
    deleteOwner,
  }
}

export function useOwner(id: number) {
  const [owner, setOwner] = useState<Owner | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOwner = useCallback(async () => {
    if (!id) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await ownersService.getById(id)
      setOwner(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar propietario'
      setError(message)
      logger.error('Error fetching owner', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchOwner()
  }, [fetchOwner])

  return {
    owner,
    loading,
    error,
    refresh: fetchOwner,
  }
}
