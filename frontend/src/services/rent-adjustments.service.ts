import { apiClient } from './api'

export interface RentAdjustment {
  id: number
  contractId: number
  recurringObligationId: number
  period: string
  indexType: string
  originalIndexValue: number
  appliedIndexValue: number
  baseIndexValue: number
  isManuallyModified: boolean
  baseAmount: number
  previousAmount: number
  newAmount: number
  coefficient: number
  percentageIncrease: number
  modifiedByUserId: number | null
  modifiedAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface IndexMetadata {
  provider: string
  frequency: string
  delay: string
  delayDays: number
  description: string
  source: string
}

export interface IndexConfig {
  hasIndex: boolean
  config: {
    id: number
    description: string
    amount: number
    currentAmount: number | null
    updateIndexType: string | null
    updateFrequencyMonths: number | null
    initialIndexValue: number | null
    initialIndexDate: string | null
    fixedUpdateCoefficient: number | null
    periodsSinceUpdate: number
    lastUpdateApplied: string | null
    startDate: string
    endDate: string | null
  } | null
  currentIndex: {
    type: string
    value: number
    date: string
    rawData?: Record<string, unknown>
  } | null
  indexMetadata: IndexMetadata | null
}

export interface TimelineSlot {
  period: string
  periodLabel: string
  slotNumber: number
  status: 'completed' | 'current' | 'pending' | 'future'
  adjustment: RentAdjustment | null
  expectedDate: string
}

export interface Timeline {
  slots: TimelineSlot[]
  config: {
    id: number
    amount: number
    currentAmount: number | null
    updateIndexType: string | null
    updateFrequencyMonths: number | null
    initialIndexValue: number | null
    initialIndexDate: string | null
    fixedUpdateCoefficient: number | null
    startDate: string
    endDate: string | null
  } | null
}

export const rentAdjustmentsService = {
  async getByContractId(contractId: number): Promise<RentAdjustment[]> {
    return apiClient.get<RentAdjustment[]>(`/api/contracts/${contractId}/rent-adjustments`)
  },

  async getIndexConfig(contractId: number): Promise<IndexConfig> {
    return apiClient.get<IndexConfig>(`/api/contracts/${contractId}/rent-adjustments/config`)
  },

  async getTimeline(contractId: number): Promise<Timeline> {
    return apiClient.get<Timeline>(`/api/contracts/${contractId}/rent-adjustments/timeline`)
  },

  async getCurrentIndex(contractId: number, type: 'icl' | 'ipc'): Promise<{ type: string; value: number; date: string }> {
    return apiClient.get(`/api/contracts/${contractId}/rent-adjustments/current-index?type=${type}`)
  },

  async modifyAdjustment(contractId: number, adjustmentId: number, appliedIndexValue: number, notes?: string): Promise<RentAdjustment> {
    return apiClient.put<RentAdjustment>(`/api/contracts/${contractId}/rent-adjustments/${adjustmentId}`, {
      appliedIndexValue,
      notes,
    })
  },
}
