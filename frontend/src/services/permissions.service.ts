import { apiClient } from './api'
import { UserPermission, PermissionTemplate } from '@/types'

export const permissionsService = {
  // Get permission templates by role
  async getTemplates(role: string): Promise<PermissionTemplate[]> {
    return await apiClient.get(`/api/permissions/templates?role=${role}`)
  },

  // Get permissions for a staff user
  async getByStaffUser(staffUserId: number): Promise<{ staffUser: any; permissions: UserPermission[] }> {
    return await apiClient.get(`/api/permissions/staff/${staffUserId}`)
  },

  // Assign custom permissions to a staff user
  async assign(staffUserId: number, permissions: PermissionTemplate[]): Promise<void> {
    await apiClient.put(`/api/permissions/staff/${staffUserId}`, { permissions })
  },

  // Reset permissions to role template
  async reset(staffUserId: number): Promise<void> {
    await apiClient.post(`/api/permissions/staff/${staffUserId}/reset`)
  },
}
