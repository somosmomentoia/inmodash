/**
 * useDashboard Hook
 * React hook for dashboard statistics with API integration
 */

import { useState, useEffect, useCallback } from 'react'
import { dashboardService, ApiError } from '@/services'
import { logger } from '@/lib/logger'
import { DashboardStats } from '@/types'

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBuildings: 0,
    totalApartments: 0,
    availableApartments: 0,
    rentedApartments: 0,
    apartmentsForSale: 0,
    totalArea: 0,
    totalTenants: 0,
    totalOwners: 0,
    activeContracts: 0,
    independentApartments: 0,
    totalPayments: 0,
    pendingPayments: 0,
    overduePayments: 0,
    paidThisMonth: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    pendingAmount: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await dashboardService.getStats()
      setStats(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al cargar estadísticas'
      setError(message)
      logger.error('Error fetching dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  }
}
