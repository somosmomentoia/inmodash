import { apiClient } from './api'
import { Contact, CreateContactDto, UpdateContactDto, ContactCategory } from '@/types'

export const contactsService = {
  async getAll(category?: ContactCategory): Promise<Contact[]> {
    const params = category ? `?category=${category}` : ''
    return apiClient.get<Contact[]>(`/api/contacts${params}`)
  },

  async getById(id: number): Promise<Contact> {
    return apiClient.get<Contact>(`/api/contacts/${id}`)
  },

  async create(data: CreateContactDto): Promise<Contact> {
    return apiClient.post<Contact>('/api/contacts', data)
  },

  async update(id: number, data: UpdateContactDto): Promise<Contact> {
    return apiClient.put<Contact>(`/api/contacts/${id}`, data)
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/contacts/${id}`)
  },

  async search(query: string): Promise<Contact[]> {
    return apiClient.get<Contact[]>(`/api/contacts/search?q=${encodeURIComponent(query)}`)
  }
}
