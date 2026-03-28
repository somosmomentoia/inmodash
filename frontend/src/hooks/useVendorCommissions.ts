'use client'

import { useState, useEffect, useCallback } from 'react'
import { vendorCommissionsService, VendorCommissionStats, MarkAsPaidDto } from '@/services/vendor-commissions.service'
import { VendorCommission } from '@/types'

export function useVendorCommissions() {
  const [commissions, setCommissions] = useState<VendorCommission[]>([])
  const [stats, setStats] = useState<VendorCommissionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [data, statsData] = await Promise.all([
        vendorCommissionsService.getAll(),
        vendorCommissionsService.getStats(),
      ])
      setCommissions(data)
      setStats(statsData)
    } catch (err: any) {
      setError(err.message || 'Error al cargar comisiones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const markAsPaid = useCallback(async (id: number, data: MarkAsPaidDto) => {
    const updated = await vendorCommissionsService.markAsPaid(id, data)
    setCommissions(prev => prev.map(c => c.id === id ? updated : c))
    // Refresh stats
    const statsData = await vendorCommissionsService.getStats()
    setStats(statsData)
    return updated
  }, [])

  return {
    commissions,
    stats,
    loading,
    error,
    fetchAll,
    markAsPaid,
  }
}
