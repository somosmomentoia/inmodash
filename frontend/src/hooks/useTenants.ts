/**
 * useTenants Hook
 * React hook for tenant management with API integration
 */

import { useState, useEffect, useCallback } from 'react'
import { tenantsService, CreateTenantDto, UpdateTenantDto, ApiError } from '@/services'
import { logger } from '@/lib/logger'

// Using Tenant type from services
type Tenant = Awaited<ReturnType<typeof tenantsService.getAll>>[0]

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTenants = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await tenantsService.getAll()
      setTenants(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar clientes'
      setError(message)
      logger.error('Error fetching tenants:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createTenant = useCallback(async (data: CreateTenantDto) => {
    setLoading(true)
    setError(null)
    try {
      const newTenant = await tenantsService.create(data)
      setTenants(prev => [...prev, newTenant])
      return newTenant
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al crear cliente'
      setError(message)
      logger.error('Error creating tenant:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTenant = useCallback(async (id: number, data: UpdateTenantDto) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await tenantsService.update(id, data)
      setTenants(prev => prev.map(t => t.id === id ? updated : t))
      return updated
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al actualizar cliente'
      setError(message)
      logger.error('Error updating tenant:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteTenant = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await tenantsService.delete(id)
      setTenants(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al eliminar cliente'
      setError(message)
      logger.error('Error deleting tenant:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTenants()
  }, [fetchTenants])

  return {
    tenants,
    loading,
    error,
    refresh: fetchTenants,
    createTenant,
    updateTenant,
    deleteTenant,
  }
}

export function useTenant(id: number) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTenant = useCallback(async () => {
    if (!id) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await tenantsService.getById(id)
      setTenant(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar cliente'
      setError(message)
      logger.error('Error fetching tenant:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTenant()
  }, [fetchTenant])

  return {
    tenant,
    loading,
    error,
    refresh: fetchTenant,
  }
}
