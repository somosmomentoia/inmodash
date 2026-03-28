'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStaff } from '@/hooks/useStaff'
import { StaffUser, StaffRole, STAFF_ROLE_LABELS } from '@/types'
import { staffService } from '@/services/staff.service'
import styles from './users.module.css'

export default function UsersPage() {
  const router = useRouter()
  const { staffUsers, loading, error, refetch } = useStaff()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUsers = staffUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return

    try {
      await staffService.delete(id)
      refetch()
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Error al desactivar usuario')
    }
  }

  const handleToggleActive = async (user: StaffUser) => {
    try {
      await staffService.update(user.id, { isActive: !user.isActive })
      refetch()
    } catch (err) {
      console.error('Error toggling user status:', err)
      alert('Error al cambiar estado del usuario')
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando usuarios...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Usuarios del Sistema</h1>
          <p className={styles.subtitle}>
            Gestiona los usuarios internos y sus permisos
          </p>
        </div>
        <button
          className={styles.createButton}
          onClick={() => setShowCreateModal(true)}
        >
          + Nuevo Usuario
        </button>
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.stats}>
          <span className={styles.stat}>
            Total: <strong>{staffUsers.length}</strong>
          </span>
          <span className={styles.stat}>
            Activos: <strong>{staffUsers.filter(u => u.isActive).length}</strong>
          </span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className={!user.isActive ? styles.inactiveRow : ''}>
                  <td>
                    <div className={styles.userName}>{user.name}</div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.roleBadge} ${styles[`role${user.role}`]}`}>
                      {STAFF_ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${user.isActive ? styles.active : styles.inactive}`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => router.push(`/settings/users/${user.id}`)}
                        title="Gestionar Permisos"
                      >
                        🔑
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => setEditingUser(user)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleToggleActive(user)}
                        title={user.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {user.isActive ? '🔒' : '🔓'}
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => handleDelete(user.id)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            refetch()
          }}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: StaffRole.READ_ONLY,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await staffService.create(formData)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Nuevo Usuario</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.formGroup}>
            <label>Nombre Completo *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Contraseña *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Rol *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffRole })}
              required
            >
              {Object.entries(STAFF_ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditUserModal({ user, onClose, onSuccess }: { user: StaffUser; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await staffService.update(user.id, formData)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Editar Usuario</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.formGroup}>
            <label>Nombre Completo *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Rol *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffRole })}
              required
            >
              {Object.entries(STAFF_ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
