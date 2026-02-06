import { Request, Response } from 'express'
import { contactsService, CreateContactDto, UpdateContactDto } from '../services/contacts.service'
import { ContactCategory } from '@prisma/client'

export const contactsController = {
  async getAll(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(401).json({ error: 'Unauthorized' })
      
      const { category } = req.query

      let contacts
      if (category && Object.values(ContactCategory).includes(category as ContactCategory)) {
        contacts = await contactsService.getByCategory(userId, category as ContactCategory)
      } else {
        contacts = await contactsService.getAll(userId)
      }

      res.json(contacts)
    } catch (error) {
      console.error('Error getting contacts:', error)
      res.status(500).json({ error: 'Error al obtener contactos' })
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(401).json({ error: 'Unauthorized' })
      
      const id = parseInt(req.params.id)

      const contact = await contactsService.getById(id, userId)
      if (!contact) {
        return res.status(404).json({ error: 'Contacto no encontrado' })
      }

      res.json(contact)
    } catch (error) {
      console.error('Error getting contact:', error)
      res.status(500).json({ error: 'Error al obtener contacto' })
    }
  },

  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(401).json({ error: 'Unauthorized' })
      
      const data: CreateContactDto = req.body

      if (!data.name) {
        return res.status(400).json({ error: 'El nombre es requerido' })
      }

      const contact = await contactsService.create(userId, data)
      res.status(201).json(contact)
    } catch (error) {
      console.error('Error creating contact:', error)
      res.status(500).json({ error: 'Error al crear contacto' })
    }
  },

  async update(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(401).json({ error: 'Unauthorized' })
      
      const id = parseInt(req.params.id)
      const data: UpdateContactDto = req.body

      const contact = await contactsService.update(id, userId, data)
      if (!contact) {
        return res.status(404).json({ error: 'Contacto no encontrado' })
      }

      res.json(contact)
    } catch (error) {
      console.error('Error updating contact:', error)
      res.status(500).json({ error: 'Error al actualizar contacto' })
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(401).json({ error: 'Unauthorized' })
      
      const id = parseInt(req.params.id)

      const deleted = await contactsService.delete(id, userId)
      if (!deleted) {
        return res.status(404).json({ error: 'Contacto no encontrado' })
      }

      res.json({ message: 'Contacto eliminado' })
    } catch (error) {
      console.error('Error deleting contact:', error)
      res.status(500).json({ error: 'Error al eliminar contacto' })
    }
  },

  async search(req: Request, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) return res.status(401).json({ error: 'Unauthorized' })
      
      const { q } = req.query

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Parámetro de búsqueda requerido' })
      }

      const contacts = await contactsService.search(userId, q)
      res.json(contacts)
    } catch (error) {
      console.error('Error searching contacts:', error)
      res.status(500).json({ error: 'Error al buscar contactos' })
    }
  }
}
