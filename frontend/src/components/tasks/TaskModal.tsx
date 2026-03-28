'use client'

import { useState, useEffect } from 'react'
import { CreateTaskDto, TaskPriority, StaffUser } from '@/types'
import { useStaff } from '@/hooks/useStaff'
import styles from './TaskModal.module.css'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (task: CreateTaskDto) => Promise<void>
  initialData?: Partial<CreateTaskDto>
}

export default function TaskModal({ isOpen, onClose, onSubmit, initialData }: TaskModalProps) {
  const { staffUsers } = useStaff()
  const [formData, setFormData] = useState<CreateTaskDto>({
    title: '',
    priority: 'medium',
    ...initialData,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({ title: '', priority: 'medium', ...initialData })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError('El título es requerido')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onSubmit(formData)
      setFormData({ title: '', priority: 'medium' })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar tarea')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Nueva Tarea</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label>Título *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Llamar al inquilino"
              required
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label>Descripción</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalles adicionales..."
              rows={3}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Prioridad *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                required
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Fecha de Vencimiento</label>
              <input
                type="date"
                value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value ? new Date(e.target.value) : undefined })}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Asignar a Usuario Staff</label>
            <select
              value={formData.assignedToStaffId || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                assignedToStaffId: e.target.value ? parseInt(e.target.value) : undefined 
              })}
            >
              <option value="">Sin asignar</option>
              {staffUsers.filter(u => u.isActive).map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            <small className={styles.hint}>
              Opcional: Asigna esta tarea a un miembro del equipo
            </small>
          </div>

          <div className={styles.formGroup}>
            <label>Tipo de Entidad Relacionada</label>
            <select
              value={formData.relatedEntityType || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                relatedEntityType: e.target.value || undefined,
                relatedEntityId: undefined // Reset ID when type changes
              })}
            >
              <option value="">Ninguna</option>
              <option value="contract">Contrato</option>
              <option value="apartment">Propiedad</option>
              <option value="tenant">Inquilino</option>
              <option value="owner">Propietario</option>
              <option value="obligation">Obligación</option>
            </select>
          </div>

          {formData.relatedEntityType && (
            <div className={styles.formGroup}>
              <label>ID de la Entidad</label>
              <input
                type="number"
                value={formData.relatedEntityId || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  relatedEntityId: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="ID de la entidad relacionada"
              />
              <small className={styles.hint}>
                Vincula esta tarea con un {formData.relatedEntityType} específico
              </small>
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? 'Guardando...' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
