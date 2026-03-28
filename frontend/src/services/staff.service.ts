import { apiClient } from './api'
import { StaffUser, CreateStaffUserDto, UpdateStaffUserDto } from '@/types'

export const staffService = {
  // Get all staff users
  async getAll(): Promise<StaffUser[]> {
    return await apiClient.get('/api/staff')
  },

  // Get staff user by ID
  async getById(id: number): Promise<StaffUser> {
    return await apiClient.get(`/api/staff/${id}`)
  },

  // Create new staff user
  async create(data: CreateStaffUserDto): Promise<StaffUser> {
    return await apiClient.post('/api/staff', data)
  },

  // Update staff user
  async update(id: number, data: UpdateStaffUserDto): Promise<StaffUser> {
    return await apiClient.put(`/api/staff/${id}`, data)
  },

  // Delete (deactivate) staff user
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/staff/${id}`)
  },

  // Change password
  async changePassword(id: number, newPassword: string): Promise<void> {
    await apiClient.put(`/api/staff/${id}/password`, { newPassword })
  },
}
