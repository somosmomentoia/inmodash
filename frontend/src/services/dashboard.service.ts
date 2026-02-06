/**
 * Dashboard Service
 * API calls for dashboard statistics
 */

import { apiClient } from './api'

export interface DashboardStats {
  totalBuildings: number
  totalApartments: number
  availableApartments: number
  rentedApartments: number
  apartmentsForSale: number
  totalArea: number
  totalTenants: number
  totalOwners: number
  activeContracts: number
  independentApartments: number
  totalPayments: number
  pendingPayments: number
  overduePayments: number
  paidThisMonth: number
  totalRevenue: number
  totalCommissions: number
  pendingAmount: number
}

export const dashboardService = {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>('/api/dashboard/stats')
  },
}
