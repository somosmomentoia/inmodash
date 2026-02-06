import { PrismaClient, Contact, ContactCategory } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateContactDto {
  name: string
  email?: string
  phone?: string
  company?: string
  position?: string
  notes?: string
  category?: ContactCategory
}

export interface UpdateContactDto {
  name?: string
  email?: string
  phone?: string
  company?: string
  position?: string
  notes?: string
  category?: ContactCategory
}

class ContactsService {
  async getAll(userId: number): Promise<Contact[]> {
    return prisma.contact.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    })
  }

  async getById(id: number, userId: number): Promise<Contact | null> {
    return prisma.contact.findFirst({
      where: { id, userId }
    })
  }

  async getByCategory(userId: number, category: ContactCategory): Promise<Contact[]> {
    return prisma.contact.findMany({
      where: { userId, category },
      orderBy: { name: 'asc' }
    })
  }

  async create(userId: number, data: CreateContactDto): Promise<Contact> {
    return prisma.contact.create({
      data: {
        userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        position: data.position,
        notes: data.notes,
        category: data.category || 'other'
      }
    })
  }

  async update(id: number, userId: number, data: UpdateContactDto): Promise<Contact | null> {
    const contact = await this.getById(id, userId)
    if (!contact) return null

    return prisma.contact.update({
      where: { id },
      data
    })
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const contact = await this.getById(id, userId)
    if (!contact) return false

    await prisma.contact.delete({ where: { id } })
    return true
  }

  async search(userId: number, query: string): Promise<Contact[]> {
    return prisma.contact.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: { name: 'asc' }
    })
  }
}

export const contactsService = new ContactsService()
