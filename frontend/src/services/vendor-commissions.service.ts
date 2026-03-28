import { apiClient } from './api'
import { VendorCommission } from '@/types'

export interface VendorCommissionStats {
  pendingCount: number
  pendingAmount: number
  paidCount: number
  paidAmount: number
}

export interface MarkAsPaidDto {
  paymentMethod?: string
  reference?: string
  notes?: string
}

export const vendorCommissionsService = {
  async getAll(): Promise<VendorCommission[]> {
    return apiClient.get<VendorCommission[]>('/api/vendor-commissions')
  },

  async getByVendor(vendorId: number): Promise<VendorCommission[]> {
    return apiClient.get<VendorCommission[]>(`/api/vendor-commissions/vendor/${vendorId}`)
  },

  async getStats(): Promise<VendorCommissionStats> {
    return apiClient.get<VendorCommissionStats>('/api/vendor-commissions/stats')
  },

  async markAsPaid(id: number, data: MarkAsPaidDto): Promise<VendorCommission> {
    return apiClient.post<VendorCommission>(`/api/vendor-commissions/${id}/pay`, data)
  },
}
