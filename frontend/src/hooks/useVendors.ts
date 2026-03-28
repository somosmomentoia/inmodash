'use client'

import { useState, useEffect, useCallback } from 'react'
import { vendorsService, CreateVendorDto, UpdateVendorDto } from '@/services/vendors.service'
import { Vendor } from '@/types'

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await vendorsService.getAll()
      setVendors(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar vendedores')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const createVendor = useCallback(async (data: CreateVendorDto) => {
    const vendor = await vendorsService.create(data)
    setVendors(prev => [...prev, vendor])
    return vendor
  }, [])

  const updateVendor = useCallback(async (id: number, data: UpdateVendorDto) => {
    const vendor = await vendorsService.update(id, data)
    setVendors(prev => prev.map(v => v.id === id ? vendor : v))
    return vendor
  }, [])

  const deleteVendor = useCallback(async (id: number) => {
    await vendorsService.remove(id)
    setVendors(prev => prev.filter(v => v.id !== id))
  }, [])

  return {
    vendors,
    loading,
    error,
    fetchVendors,
    createVendor,
    updateVendor,
    deleteVendor,
  }
}
