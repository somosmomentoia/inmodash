import { apiClient } from './api'

export const recurringObligationsService = {
  // Crear recurrencia
  create: async (data: {
    contractId?: number
    apartmentId?: number
    type: string
    category?: string
    description: string
    amount: number
    dayOfMonth: number
    startDate: string
    endDate?: string
    notes?: string
  }) => {
    return await apiClient.post('/api/recurring-obligations', data)
  },

  // Obtener todas las recurrencias
  getAll: async () => {
    return await apiClient.get('/api/recurring-obligations')
  },

  // Obtener una recurrencia
  getById: async (id: number) => {
    return await apiClient.get(`/api/recurring-obligations/${id}`)
  },

  // Actualizar recurrencia
  update: async (id: number, data: {
    description?: string
    amount?: number
    dayOfMonth?: number
    endDate?: string | null
    notes?: string
    isActive?: boolean
  }) => {
    return await apiClient.put(`/api/recurring-obligations/${id}`, data)
  },

  // Eliminar recurrencia
  delete: async (id: number) => {
    await apiClient.delete(`/api/recurring-obligations/${id}`)
  },

  // Pausar/Activar recurrencia
  toggleActive: async (id: number) => {
    return await apiClient.post(`/api/recurring-obligations/${id}/toggle`)
  },

  // Generar obligaciones para un mes
  generateForMonth: async (month: string) => {
    return await apiClient.post('/api/recurring-obligations/generate', { month })
  }
}
