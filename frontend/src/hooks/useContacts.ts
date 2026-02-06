'use client'

import { useState, useEffect, useCallback } from 'react'
import { Contact, CreateContactDto, UpdateContactDto, ContactCategory } from '@/types'
import { contactsService } from '@/services/contacts.service'

export function useContacts(category?: ContactCategory) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await contactsService.getAll(category)
      setContacts(data)
    } catch (err) {
      console.error('Error fetching contacts:', err)
      setError('Error al cargar contactos')
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const createContact = async (data: CreateContactDto): Promise<Contact | null> => {
    try {
      const newContact = await contactsService.create(data)
      setContacts(prev => [...prev, newContact].sort((a, b) => a.name.localeCompare(b.name)))
      return newContact
    } catch (err) {
      console.error('Error creating contact:', err)
      throw err
    }
  }

  const updateContact = async (id: number, data: UpdateContactDto): Promise<Contact | null> => {
    try {
      const updated = await contactsService.update(id, data)
      setContacts(prev => prev.map(c => c.id === id ? updated : c).sort((a, b) => a.name.localeCompare(b.name)))
      return updated
    } catch (err) {
      console.error('Error updating contact:', err)
      throw err
    }
  }

  const deleteContact = async (id: number): Promise<boolean> => {
    try {
      await contactsService.delete(id)
      setContacts(prev => prev.filter(c => c.id !== id))
      return true
    } catch (err) {
      console.error('Error deleting contact:', err)
      throw err
    }
  }

  const searchContacts = async (query: string): Promise<Contact[]> => {
    try {
      return await contactsService.search(query)
    } catch (err) {
      console.error('Error searching contacts:', err)
      return []
    }
  }

  return {
    contacts,
    loading,
    error,
    refetch: fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    searchContacts
  }
}
