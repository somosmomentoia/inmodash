'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  Edit2,
  Trash2,
  User,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Flag,
  Loader2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Button, Badge, Card, CardContent, Input, Modal } from '@/components/ui'
import { contactsService } from '@/services/contacts.service'
import { useTasksByContact } from '@/hooks/useTasks'
import { Contact, ContactCategory, Task, CreateTaskDto, UpdateContactDto } from '@/types'
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

const getCategoryLabel = (category: ContactCategory) => {
  return CATEGORY_OPTIONS.find(c => c.value === category)?.label || category
}

const getPriorityColor = (priority: string): 'error' | 'warning' | 'info' | 'default' => {
  switch (priority) {
    case 'urgent': return 'error'
    case 'high': return 'warning'
    case 'medium': return 'info'
    default: return 'default'
  }
}

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'Urgente'
    case 'high': return 'Alta'
    case 'medium': return 'Media'
    case 'low': return 'Baja'
    default: return priority
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle size={16} className={styles.statusIconCompleted} />
    case 'in_progress':
      return <Clock size={16} className={styles.statusIconProgress} />
    default:
      return <Clock size={16} className={styles.statusIconPending} />
  }
}

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contactId = Number(params.id)

  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [formData, setFormData] = useState<UpdateContactDto>({})

  const { tasks, loading: tasksLoading, toggleTask, refetch: refetchTasks } = useTasksByContact(contactId)

  useEffect(() => {
    const fetchContact = async () => {
      try {
        setLoading(true)
        const data = await contactsService.getById(contactId)
        setContact(data)
        setFormData({
          name: data.name,
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
          position: data.position || '',
          notes: data.notes || '',
          category: data.category,
        })
      } catch (err) {
        console.error('Error fetching contact:', err)
        setError('Error al cargar el contacto')
      } finally {
        setLoading(false)
      }
    }

    if (contactId) {
      fetchContact()
    }
  }, [contactId])

  const handleUpdate = async () => {
    if (!contact || !formData.name?.trim()) return
    try {
      const updated = await contactsService.update(contact.id, formData)
      setContact(updated)
      setShowEditModal(false)
    } catch (err) {
      console.error('Error updating contact:', err)
    }
  }

  const handleDelete = async () => {
    if (!contact) return
    if (!confirm(`¿Eliminar el contacto "${contact.name}"? Esta acción no se puede deshacer.`)) return
    try {
      await contactsService.delete(contact.id)
      router.push('/tasks?tab=contacts')
    } catch (err) {
      console.error('Error deleting contact:', err)
    }
  }

  const handleToggleTask = async (taskId: number) => {
    await toggleTask(taskId)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  if (loading) {
    return (
      <DashboardLayout title="Cargando..." subtitle="">
        <div className={styles.loadingContainer}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Cargando contacto...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !contact) {
    return (
      <DashboardLayout title="Error" subtitle="">
        <div className={styles.errorContainer}>
          <AlertCircle size={48} />
          <p>{error || 'Contacto no encontrado'}</p>
          <Button onClick={() => router.push('/tasks?tab=contacts')}>
            Volver a Contactos
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title={contact.name} 
      subtitle={getCategoryLabel(contact.category)}
    >
      <div className={styles.container}>
        {/* Back Button */}
        <Link href="/tasks?tab=contacts" className={styles.backLink}>
          <ArrowLeft size={20} />
          Volver a Contactos
        </Link>

        {/* Main Card - Todo unificado */}
        <Card className={styles.mainCard}>
          <CardContent className={styles.mainCardContent}>
            {/* Header con avatar y acciones */}
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.avatar}>
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.headerInfo}>
                  <h2 className={styles.contactName}>{contact.name}</h2>
                  <div className={styles.headerMeta}>
                    <Badge variant={getCategoryColor(contact.category)}>
                      {getCategoryLabel(contact.category)}
                    </Badge>
                    {contact.company && (
                      <span className={styles.companyInline}>
                        <Building2 size={14} />
                        {contact.company}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.headerActions}>
                <Button 
                  variant="secondary" 
                  size="sm"
                  leftIcon={<Edit2 size={16} />}
                  onClick={() => setShowEditModal(true)}
                >
                  Editar
                </Button>
                <Button 
                  variant="danger" 
                  size="sm"
                  leftIcon={<Trash2 size={16} />}
                  onClick={handleDelete}
                >
                  Eliminar
                </Button>
              </div>
            </div>

            {/* Contenido en dos columnas */}
            <div className={styles.cardBody}>
              {/* Columna izquierda - Info de contacto */}
              <div className={styles.infoColumn}>
                <h3 className={styles.sectionTitle}>
                  <User size={18} />
                  Información de Contacto
                </h3>
                <div className={styles.infoGrid}>
                  {contact.email && (
                    <div className={styles.infoItem}>
                      <div className={styles.infoIcon}>
                        <Mail size={16} />
                      </div>
                      <div className={styles.infoContent}>
                        <span className={styles.infoLabel}>Email</span>
                        <a href={`mailto:${contact.email}`} className={styles.infoValue}>
                          {contact.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {contact.phone && (
                    <div className={styles.infoItem}>
                      <div className={styles.infoIcon}>
                        <Phone size={16} />
                      </div>
                      <div className={styles.infoContent}>
                        <span className={styles.infoLabel}>Teléfono</span>
                        <a href={`tel:${contact.phone}`} className={styles.infoValue}>
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {contact.company && (
                    <div className={styles.infoItem}>
                      <div className={styles.infoIcon}>
                        <Building2 size={16} />
                      </div>
                      <div className={styles.infoContent}>
                        <span className={styles.infoLabel}>Empresa</span>
                        <span className={styles.infoValue}>
                          {contact.company}
                          {contact.position && ` • ${contact.position}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {contact.notes && (
                  <div className={styles.notesBox}>
                    <span className={styles.notesLabel}>Notas</span>
                    <p className={styles.notesText}>{contact.notes}</p>
                  </div>
                )}
              </div>

              {/* Columna derecha - Tareas */}
              <div className={styles.tasksColumn}>
                <div className={styles.tasksSectionHeader}>
                  <h3 className={styles.sectionTitle}>
                    <CheckCircle size={18} />
                    Tareas Asociadas
                    {tasks.length > 0 && (
                      <span className={styles.taskCount}>{tasks.length}</span>
                    )}
                  </h3>
                  <Link href={`/tasks/new?contactId=${contact.id}`}>
                    <Button size="sm" leftIcon={<Plus size={16} />}>
                      Nueva Tarea
                    </Button>
                  </Link>
                </div>

                <div className={styles.tasksContainer}>
                  {tasksLoading ? (
                    <div className={styles.tasksLoading}>
                      <Loader2 size={24} className={styles.spinner} />
                      <p>Cargando tareas...</p>
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className={styles.emptyTasks}>
                      <div className={styles.emptyIcon}>
                        <CheckCircle size={32} />
                      </div>
                      <p>No hay tareas asociadas</p>
                      <Link href={`/tasks/new?contactId=${contact.id}`}>
                        <Button size="sm" variant="secondary" leftIcon={<Plus size={14} />}>
                          Crear tarea
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      {/* Pending Tasks */}
                      {pendingTasks.length > 0 && (
                        <div className={styles.taskGroup}>
                          <div className={styles.taskGroupHeader}>
                            <span className={styles.taskGroupTitle}>Pendientes</span>
                            <span className={styles.taskGroupCount}>{pendingTasks.length}</span>
                          </div>
                          <div className={styles.tasksList}>
                            {pendingTasks.map(task => (
                              <div key={task.id} className={styles.taskItem}>
                                <button 
                                  className={styles.taskCheckbox}
                                  onClick={() => handleToggleTask(task.id)}
                                  title="Marcar como completada"
                                >
                                  <div className={styles.checkboxCircle}>
                                    {getStatusIcon(task.status)}
                                  </div>
                                </button>
                                <div className={styles.taskContent}>
                                  <Link href={`/tasks/${task.id}`} className={styles.taskTitle}>
                                    {task.title}
                                  </Link>
                                  <div className={styles.taskMeta}>
                                    {task.dueDate && (
                                      <span className={styles.taskDueDate}>
                                        <Calendar size={12} />
                                        {formatDate(task.dueDate)}
                                      </span>
                                    )}
                                    <Badge variant={getPriorityColor(task.priority)} size="sm">
                                      {getPriorityLabel(task.priority)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Completed Tasks */}
                      {completedTasks.length > 0 && (
                        <div className={styles.taskGroup}>
                          <div className={styles.taskGroupHeader}>
                            <span className={styles.taskGroupTitle}>Completadas</span>
                            <span className={styles.taskGroupCount}>{completedTasks.length}</span>
                          </div>
                          <div className={styles.tasksList}>
                            {completedTasks.map(task => (
                              <div key={task.id} className={`${styles.taskItem} ${styles.taskCompleted}`}>
                                <button 
                                  className={styles.taskCheckbox}
                                  onClick={() => handleToggleTask(task.id)}
                                  title="Marcar como pendiente"
                                >
                                  <div className={`${styles.checkboxCircle} ${styles.checkboxCompleted}`}>
                                    <CheckCircle size={16} />
                                  </div>
                                </button>
                                <div className={styles.taskContent}>
                                  <Link href={`/tasks/${task.id}`} className={styles.taskTitle}>
                                    {task.title}
                                  </Link>
                                  <div className={styles.taskMeta}>
                                    {task.completedAt && (
                                      <span className={styles.taskCompletedDate}>
                                        Completada el {formatDate(task.completedAt)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Contacto"
      >
        <div className={styles.modalContent}>
          <div className={styles.formGroup}>
            <label>Nombre *</label>
            <Input
              placeholder="Nombre del contacto"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Email</label>
              <Input
                type="email"
                placeholder="email@ejemplo.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Teléfono</label>
              <Input
                placeholder="+54 11 1234-5678"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Empresa</label>
              <Input
                placeholder="Nombre de la empresa"
                value={formData.company || ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Cargo</label>
              <Input
                placeholder="Cargo o posición"
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Categoría</label>
            <select
              className={styles.select}
              value={formData.category || 'other'}
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
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name?.trim()}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
