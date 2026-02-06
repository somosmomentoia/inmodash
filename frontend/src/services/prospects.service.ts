import { apiClient } from '@/services/api'
import {
  Prospect,
  CreateProspectDto,
  UpdateProspectDto,
  ChangeProspectStatusDto,
  ConvertProspectDto,
  ProspectStats,
  ProspectSource,
  ProspectStatus,
} from '@/types'

interface ProspectFilters {
  status?: ProspectStatus
  source?: ProspectSource
  apartmentId?: number
  search?: string
  fromDate?: string
  toDate?: string
}

interface ConvertResult {
  success: boolean
  tenantId: number
  apartmentId?: number
  prospectData: {
    fullName: string
    phone: string
    email?: string
    dniOrCuit?: string
  }
  redirectUrl?: string
}

class ProspectsService {
  private basePath = '/api/prospects'

  async getAll(filters?: ProspectFilters): Promise<Prospect[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.source) params.append('source', filters.source)
    if (filters?.apartmentId) params.append('apartmentId', filters.apartmentId.toString())
    if (filters?.search) params.append('search', filters.search)
    if (filters?.fromDate) params.append('fromDate', filters.fromDate)
    if (filters?.toDate) params.append('toDate', filters.toDate)

    const queryString = params.toString()
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath
    
    const response = await apiClient.get<{ success: boolean; data: Prospect[] }>(url)
    return response.data
  }

  async getById(id: number): Promise<Prospect> {
    const response = await apiClient.get<{ success: boolean; data: Prospect }>(
      `${this.basePath}/${id}`
    )
    return response.data
  }

  async create(data: CreateProspectDto): Promise<Prospect> {
    const response = await apiClient.post<{ success: boolean; data: Prospect }>(
      this.basePath,
      data
    )
    return response.data
  }

  async update(id: number, data: UpdateProspectDto): Promise<Prospect> {
    const response = await apiClient.put<{ success: boolean; data: Prospect }>(
      `${this.basePath}/${id}`,
      data
    )
    return response.data
  }

  async changeStatus(id: number, data: ChangeProspectStatusDto): Promise<Prospect> {
    const response = await apiClient.put<{ success: boolean; data: Prospect }>(
      `${this.basePath}/${id}/status`,
      data
    )
    return response.data
  }

  async addNote(id: number, note: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean; data: { success: boolean } }>(
      `${this.basePath}/${id}/notes`,
      { note }
    )
    return response.data
  }

  async convert(id: number, data: ConvertProspectDto): Promise<ConvertResult> {
    const response = await apiClient.post<{ success: boolean; data: ConvertResult }>(
      `${this.basePath}/${id}/convert`,
      data
    )
    return response.data
  }

  async delete(id: number): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean; data: { success: boolean } }>(
      `${this.basePath}/${id}`
    )
    return response.data
  }

  async getStats(): Promise<ProspectStats> {
    const response = await apiClient.get<{ success: boolean; data: ProspectStats }>(
      `${this.basePath}/stats`
    )
    return response.data
  }

  async getStaleProspects(hours: number = 24): Promise<Prospect[]> {
    const response = await apiClient.get<{ success: boolean; data: Prospect[] }>(
      `${this.basePath}/alerts/stale?hours=${hours}`
    )
    return response.data
  }

  async getApprovedPending(): Promise<Prospect[]> {
    const response = await apiClient.get<{ success: boolean; data: Prospect[] }>(
      `${this.basePath}/alerts/approved-pending`
    )
    return response.data
  }
}

export const prospectsService = new ProspectsService()
