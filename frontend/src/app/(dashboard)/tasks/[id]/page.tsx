'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  Clock,
  Calendar,
  AlertTriangle,
  Building2,
  User,
  Users,
  FileText,
  Edit,
  Trash2,
  Save,
  Receipt,
  Home,
  Link2,
  ExternalLink,
  Phone,
  Mail,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Button, Badge, Card, CardContent, Input } from '@/components/ui'
import { useTask } from '@/hooks/useTasks'
import { TaskStatus, TaskPriority, UpdateTaskDto } from '@/types'
import styles from './page.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = Number(params.id)
  const { task, loading, refetch } = useTask(taskId)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<UpdateTaskDto>({})

  const isOverdue = () => {
    if (!task?.dueDate || task.status === 'completed') return false
    return new Date(task.dueDate) < new Date()
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: Date | string | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'default'
      case 'low': return 'success'
    }
  }

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Alta'
      case 'medium': return 'Media'
      case 'low': return 'Baja'
    }
  }

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'in_progress': return 'En Progreso'
      case 'completed': return 'Completada'
      case 'cancelled': return 'Cancelada'
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'in_progress': return 'info'
      case 'completed': return 'success'
      case 'cancelled': return 'error'
    }
  }

  const handleToggle = async () => {
    try {
      await fetch(`${API_URL}/api/tasks/${taskId}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
      })
      refetch()
    } catch (err) {
      console.error('Error toggling task:', err)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return
    try {
      await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      router.push('/tasks')
    } catch (err) {
      console.error('Error deleting task:', err)
    }
  }

  const handleSave = async () => {
    try {
      await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editData),
      })
      setIsEditing(false)
      refetch()
    } catch (err) {
      console.error('Error updating task:', err)
    }
  }

  const startEditing = () => {
    if (!task) return
    setEditData({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : undefined,
      priority: task.priority,
      status: task.status,
    })
    setIsEditing(true)
  }

  if (loading) {
    return (
      <DashboardLayout title="Tarea" subtitle="Cargando...">
        <div className={styles.loading}>Cargando tarea...</div>
      </DashboardLayout>
    )
  }

  if (!task) {
    return (
      <DashboardLayout title="Tarea" subtitle="No encontrada">
        <div className={styles.notFound}>
          <FileText size={48} />
          <p>Tarea no encontrada</p>
          <Button onClick={() => router.push('/tasks')}>Volver a Tareas</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Detalle de Tarea" subtitle="">
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <button className={styles.backButton} onClick={() => router.push('/tasks')}>
          <ArrowLeft size={16} />
          Tareas
        </button>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>{task.title}</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            className={`${styles.checkbox} ${task.status === 'completed' ? styles.checked : ''}`}
            onClick={handleToggle}
          >
            {task.status === 'completed' && <Check size={20} />}
          </button>
          <div className={styles.headerInfo}>
            <h1 className={`${styles.title} ${task.status === 'completed' ? styles.completed : ''}`}>
              {task.title}
            </h1>
            <div className={styles.badges}>
              <Badge variant={getStatusColor(task.status)}>
                {getStatusLabel(task.status)}
              </Badge>
              <Badge variant={getPriorityColor(task.priority)}>
                {getPriorityLabel(task.priority)}
              </Badge>
              {isOverdue() && <Badge variant="error">Vencida</Badge>}
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button leftIcon={<Save size={16} />} onClick={handleSave}>
                Guardar
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" leftIcon={<Edit size={16} />} onClick={startEditing}>
                Editar
              </Button>
              <Button variant="secondary" leftIcon={<Trash2 size={16} />} onClick={handleDelete}>
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {/* Main Info */}
        <Card className={styles.mainCard}>
          <CardContent>
            {isEditing ? (
              <div className={styles.editForm}>
                <div className={styles.formGroup}>
                  <label>Título</label>
                  <Input
                    value={editData.title || ''}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Descripción</label>
                  <textarea
                    className={styles.textarea}
                    value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Fecha de vencimiento</label>
                    <Input
                      type="date"
                      value={typeof editData.dueDate === 'string' ? editData.dueDate : ''}
                      onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Prioridad</label>
                    <select
                      className={styles.select}
                      value={editData.priority}
                      onChange={(e) => setEditData({ ...editData, priority: e.target.value as TaskPriority })}
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Estado</label>
                    <select
                      className={styles.select}
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value as TaskStatus })}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h3 className={styles.sectionTitle}>Descripción</h3>
                <p className={styles.description}>
                  {task.description || 'Sin descripción'}
                </p>

                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <Calendar size={18} />
                    <div>
                      <span className={styles.infoLabel}>Fecha de vencimiento</span>
                      <span className={styles.infoValue}>{formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <Clock size={18} />
                    <div>
                      <span className={styles.infoLabel}>Creada</span>
                      <span className={styles.infoValue}>{formatDateTime(task.createdAt)}</span>
                    </div>
                  </div>
                  {task.completedAt && (
                    <div className={styles.infoItem}>
                      <Check size={18} />
                      <div>
                        <span className={styles.infoLabel}>Completada</span>
                        <span className={styles.infoValue}>{formatDateTime(task.completedAt)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sidebar - Vinculaciones */}
        <div className={styles.sidebar}>
          <Card className={styles.linksCard}>
            <CardContent>
              <h3 className={styles.sectionTitle}>
                <Link2 size={18} />
                Vinculaciones
              </h3>
              
              {!task.contract && !task.apartment && !task.owner && !task.tenant && !task.obligation && !task.contact ? (
                <p className={styles.noLinks}>Sin vinculaciones</p>
              ) : (
                <div className={styles.linksList}>
                  {task.contract && (
                    <Link href={`/contracts/${task.contract.id}`} className={styles.linkItem}>
                      <div className={styles.linkIcon} style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
                        <FileText size={16} style={{ color: '#a78bfa' }} />
                      </div>
                      <div className={styles.linkContent}>
                        <span className={styles.linkLabel}>Contrato</span>
                        <span className={styles.linkValue}>
                          {task.contract.apartment?.nomenclature || `Contrato #${task.contract.id}`}
                        </span>
                        {task.contract.tenant?.nameOrBusiness && (
                          <span className={styles.linkSub}>{task.contract.tenant.nameOrBusiness}</span>
                        )}
                      </div>
                      <ExternalLink size={14} className={styles.linkArrow} />
                    </Link>
                  )}

                  {task.apartment && (
                    <Link href={`/properties?id=${task.apartment.id}`} className={styles.linkItem}>
                      <div className={styles.linkIcon} style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                        <Home size={16} style={{ color: '#60a5fa' }} />
                      </div>
                      <div className={styles.linkContent}>
                        <span className={styles.linkLabel}>Unidad</span>
                        <span className={styles.linkValue}>{task.apartment.nomenclature}</span>
                        {task.apartment.fullAddress && task.apartment.fullAddress !== task.apartment.nomenclature && (
                          <span className={styles.linkSub}>{task.apartment.fullAddress}</span>
                        )}
                      </div>
                      <ExternalLink size={14} className={styles.linkArrow} />
                    </Link>
                  )}

                  {task.owner && (
                    <Link href={`/owners/${task.owner.id}`} className={styles.linkItem}>
                      <div className={styles.linkIcon} style={{ background: 'rgba(34, 197, 94, 0.2)' }}>
                        <User size={16} style={{ color: '#4ade80' }} />
                      </div>
                      <div className={styles.linkContent}>
                        <span className={styles.linkLabel}>Propietario</span>
                        <span className={styles.linkValue}>{task.owner.name}</span>
                        <div className={styles.linkMeta}>
                          {task.owner.email && (
                            <span><Mail size={12} /> {task.owner.email}</span>
                          )}
                          {task.owner.phone && (
                            <span><Phone size={12} /> {task.owner.phone}</span>
                          )}
                        </div>
                      </div>
                      <ExternalLink size={14} className={styles.linkArrow} />
                    </Link>
                  )}

                  {task.tenant && (
                    <Link href={`/contracts?tab=clients&id=${task.tenant.id}`} className={styles.linkItem}>
                      <div className={styles.linkIcon} style={{ background: 'rgba(249, 115, 22, 0.2)' }}>
                        <Users size={16} style={{ color: '#fb923c' }} />
                      </div>
                      <div className={styles.linkContent}>
                        <span className={styles.linkLabel}>Inquilino</span>
                        <span className={styles.linkValue}>{task.tenant.nameOrBusiness}</span>
                        <div className={styles.linkMeta}>
                          {task.tenant.contactEmail && (
                            <span><Mail size={12} /> {task.tenant.contactEmail}</span>
                          )}
                          {task.tenant.contactPhone && (
                            <span><Phone size={12} /> {task.tenant.contactPhone}</span>
                          )}
                        </div>
                      </div>
                      <ExternalLink size={14} className={styles.linkArrow} />
                    </Link>
                  )}

                  {task.obligation && (
                    <Link href={`/obligations/${task.obligation.id}`} className={styles.linkItem}>
                      <div className={styles.linkIcon} style={{ background: 'rgba(236, 72, 153, 0.2)' }}>
                        <Receipt size={16} style={{ color: '#f472b6' }} />
                      </div>
                      <div className={styles.linkContent}>
                        <span className={styles.linkLabel}>Obligación</span>
                        <span className={styles.linkValue}>{task.obligation.description}</span>
                        <span className={styles.linkSub}>
                          ${task.obligation.amount?.toLocaleString('es-AR')} • {task.obligation.status === 'pending' ? 'Pendiente' : task.obligation.status === 'paid' ? 'Pagada' : task.obligation.status}
                        </span>
                      </div>
                      <ExternalLink size={14} className={styles.linkArrow} />
                    </Link>
                  )}

                  {task.contact && (
                    <div className={styles.linkItem}>
                      <div className={styles.linkIcon} style={{ background: 'rgba(14, 165, 233, 0.2)' }}>
                        <Building2 size={16} style={{ color: '#38bdf8' }} />
                      </div>
                      <div className={styles.linkContent}>
                        <span className={styles.linkLabel}>Contacto</span>
                        <span className={styles.linkValue}>{task.contact.name}</span>
                        <div className={styles.linkMeta}>
                          {task.contact.email && (
                            <span><Mail size={12} /> {task.contact.email}</span>
                          )}
                          {task.contact.phone && (
                            <span><Phone size={12} /> {task.contact.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
