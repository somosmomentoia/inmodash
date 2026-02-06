'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  X,
  Phone,
  Mail,
  Building2,
  Edit2,
  Trash2,
  User,
  Eye,
} from 'lucide-react'
import { Button, Badge, Card, CardContent, Input, Modal } from '@/components/ui'
import { useContacts } from '@/hooks/useContacts'
import { Contact, ContactCategory, CreateContactDto, UpdateContactDto } from '@/types'
import styles from './page.module.css'

const CATEGORY_OPTIONS: { value: ContactCategory; label: string }[] = [
  { value: 'client', label: 'Cliente' },
  { value: 'provider', label: 'Proveedor' },
  { value: 'agent', label: 'Agente' },
  { value: 'lawyer', label: 'Abogado' },
  { value: 'accountant', label: 'Contador' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'other', label: 'Otro' },
]

const getCategoryColor = (category: ContactCategory): 'warning' | 'info' | 'error' | 'success' | 'default' => {
  switch (category) {
    case 'client': return 'info'
    case 'provider': return 'warning'
    case 'agent': return 'info'
    case 'lawyer': return 'error'
    case 'accountant': return 'success'
    case 'maintenance': return 'default'
    default: return 'default'
  }
}

export function ContactsContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ContactCategory | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [formData, setFormData] = useState<CreateContactDto>({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    notes: '',
    category: 'other',
  })

  const { contacts, loading, createContact, updateContact, deleteContact } = useContacts()

  const filteredContacts = contacts.filter(contact => {
    if (categoryFilter !== 'all' && contact.category !== categoryFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        contact.name.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const handleOpenCreate = () => {
    setEditingContact(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      notes: '',
      category: 'other',
    })
    setShowModal(true)
  }

  const handleOpenEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      position: contact.position || '',
      notes: contact.notes || '',
      category: contact.category,
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) return
    try {
      if (editingContact) {
        await updateContact(editingContact.id, formData as UpdateContactDto)
      } else {
        await createContact(formData)
      }
      setShowModal(false)
      setEditingContact(null)
    } catch (error) {
      console.error('Error saving contact:', error)
    }
  }

  const handleDelete = async (contact: Contact) => {
    if (!confirm(`¿Eliminar el contacto "${contact.name}"?`)) return
    try {
      await deleteContact(contact.id)
    } catch (error) {
      console.error('Error deleting contact:', error)
    }
  }

  const getCategoryLabel = (category: ContactCategory) => {
    return CATEGORY_OPTIONS.find(c => c.value === category)?.label || category
  }

  return (
    <>
      <div className={styles.contactsLayout}>
        {/* Filters */}
        <div className={styles.contactsHeader}>
          <Input
            placeholder="Buscar contactos..."
            leftIcon={<Search size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <select
            className={styles.filterSelect}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ContactCategory | 'all')}
          >
            <option value="all">Todas las categorías</option>
            {CATEGORY_OPTIONS.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <Button leftIcon={<Plus size={16} />} onClick={handleOpenCreate}>
            Nuevo Contacto
          </Button>
        </div>

        {/* Contacts Grid */}
        <div className={styles.contactsGrid}>
          {loading ? (
            <div className={styles.loading}>Cargando contactos...</div>
          ) : filteredContacts.length === 0 ? (
            <div className={styles.emptyContacts}>
              <User size={48} />
              <p>No hay contactos</p>
              <Button onClick={handleOpenCreate}>Agregar primer contacto</Button>
            </div>
          ) : (
            filteredContacts.map(contact => (
              <Card key={contact.id} className={styles.contactCard}>
                <CardContent>
                  <div className={styles.contactCardHeader}>
                    <Link href={`/tasks/contacts/${contact.id}`} className={styles.contactAvatarLarge}>
                      {contact.name.charAt(0).toUpperCase()}
                    </Link>
                    <div className={styles.contactCardActions}>
                      <Link href={`/tasks/contacts/${contact.id}`} title="Ver detalle">
                        <Eye size={16} />
                      </Link>
                      <button onClick={() => handleOpenEdit(contact)} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(contact)} title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <Link href={`/tasks/contacts/${contact.id}`} className={styles.contactCardName}>
                    {contact.name}
                  </Link>
                  <Badge variant={getCategoryColor(contact.category)}>
                    {getCategoryLabel(contact.category)}
                  </Badge>
                  
                  {contact.company && (
                    <div className={styles.contactCardDetail}>
                      <Building2 size={14} />
                      <span>{contact.company}</span>
                      {contact.position && <span className={styles.position}>• {contact.position}</span>}
                    </div>
                  )}
                  
                  {contact.email && (
                    <div className={styles.contactCardDetail}>
                      <Mail size={14} />
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </div>
                  )}
                  
                  {contact.phone && (
                    <div className={styles.contactCardDetail}>
                      <Phone size={14} />
                      <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                    </div>
                  )}
                  
                  {contact.notes && (
                    <p className={styles.contactCardNotes}>{contact.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
      >
        <div className={styles.modalContent}>
          <div className={styles.formGroup}>
            <label>Nombre *</label>
            <Input
              placeholder="Nombre del contacto"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Email</label>
              <Input
                type="email"
                placeholder="email@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Teléfono</label>
              <Input
                placeholder="+54 11 1234-5678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Empresa</label>
              <Input
                placeholder="Nombre de la empresa"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Cargo</label>
              <Input
                placeholder="Cargo o posición"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Categoría</label>
            <select
              className={styles.select}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ContactCategory })}
            >
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Notas</label>
            <textarea
              className={styles.textarea}
              placeholder="Notas adicionales..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
              {editingContact ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
