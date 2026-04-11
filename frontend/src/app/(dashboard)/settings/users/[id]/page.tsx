'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { staffService } from '@/services/staff.service'
import { permissionsService } from '@/services/permissions.service'
import { StaffUser, PermissionTemplate, StaffRole, STAFF_ROLE_LABELS, STAFF_ROLE_DESCRIPTIONS } from '@/types'
import PermissionsMatrix from '@/components/permissions/PermissionsMatrix'
import styles from './user-detail.module.css'

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = parseInt(params.id as string)

  const [user, setUser] = useState<StaffUser | null>(null)
  const [permissions, setPermissions] = useState<PermissionTemplate[]>([])
  const [selectedRole, setSelectedRole] = useState<StaffRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [userId])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [userData, permissionsData] = await Promise.all([
        staffService.getById(userId),
        permissionsService.getByStaffUser(userId),
      ])

      setUser(userData)
      setSelectedRole(userData.role)
      
      // Convert UserPermission[] to PermissionTemplate[]
      const permissionTemplates = permissionsData.permissions.map((p: any) => ({
        module: p.module,
        action: p.action,
        allowed: p.allowed,
      }))
      setPermissions(permissionTemplates)
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del usuario')
      console.error('Error fetching user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionsChange = (newPermissions: PermissionTemplate[]) => {
    setPermissions(newPermissions)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!user || !selectedRole) return

    try {
      setSaving(true)
      
      // Si cambió el rol, actualizar el usuario primero
      if (selectedRole !== user.role) {
        await staffService.update(userId, { role: selectedRole })
      }
      
      // Guardar permisos personalizados
      await permissionsService.assign(userId, permissions)
      
      setHasChanges(false)
      alert('Rol y permisos guardados exitosamente')
      
      // Recargar datos
      await fetchUserData()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (newRole: StaffRole) => {
    if (!confirm(`¿Cambiar el rol a ${STAFF_ROLE_LABELS[newRole]}? Esto cargará automáticamente los permisos del template de ese rol.`)) return

    try {
      setSelectedRole(newRole)
      
      // Cargar template del nuevo rol
      const template = await permissionsService.getTemplates(newRole)
      setPermissions(template)
      setHasChanges(true)
    } catch (err: any) {
      alert('Error al cargar template del rol')
    }
  }

  const handleResetToTemplate = async () => {
    if (!selectedRole) return
    if (!confirm('¿Resetear los permisos al template del rol actual?')) return

    try {
      const template = await permissionsService.getTemplates(selectedRole)
      setPermissions(template)
      setHasChanges(true)
    } catch (err: any) {
      alert('Error al cargar template')
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando...</div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || 'Usuario no encontrado'}</div>
        <button onClick={() => router.push('/settings?tab=users')} className={styles.backButton}>
          ← Volver a Usuarios
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.push('/settings?tab=users')} className={styles.backButton}>
          ← Volver
        </button>
        <div className={styles.userInfo}>
          <h1 className={styles.title}>{user.name}</h1>
          <div className={styles.userMeta}>
            <span className={styles.email}>{user.email}</span>
            <span className={`${styles.roleBadge} ${styles[`role${user.role}`]}`}>
              {STAFF_ROLE_LABELS[user.role]}
            </span>
            <span className={`${styles.statusBadge} ${user.isActive ? styles.active : styles.inactive}`}>
              {user.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <p className={styles.roleDescription}>
            {STAFF_ROLE_DESCRIPTIONS[user.role]}
          </p>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Rol y Permisos</h2>
            <p className={styles.sectionSubtitle}>
              Selecciona el rol y personaliza los permisos específicos
            </p>
          </div>
          <div className={styles.actions}>
            <button
              onClick={handleResetToTemplate}
              className={styles.resetButton}
              disabled={saving || !selectedRole}
            >
              🔄 Resetear a Template
            </button>
            <button
              onClick={handleSave}
              className={styles.saveButton}
              disabled={saving || !hasChanges}
            >
              {saving ? 'Guardando...' : hasChanges ? '💾 Guardar Cambios' : '✓ Guardado'}
            </button>
          </div>
        </div>

        <div className={styles.roleSelector}>
          <label className={styles.roleLabel}>Rol del Usuario</label>
          <select
            value={selectedRole || ''}
            onChange={(e) => handleRoleChange(e.target.value as StaffRole)}
            className={styles.roleSelect}
            disabled={saving}
          >
            {Object.entries(STAFF_ROLE_LABELS).map(([role, label]) => (
              <option key={role} value={role}>
                {label} - {STAFF_ROLE_DESCRIPTIONS[role as StaffRole]}
              </option>
            ))}
          </select>
        </div>

        {hasChanges && (
          <div className={styles.changesWarning}>
            ⚠️ Tienes cambios sin guardar. No olvides hacer click en "Guardar Cambios".
          </div>
        )}

        <PermissionsMatrix
          permissions={permissions}
          onChange={handlePermissionsChange}
          readonly={false}
        />
      </div>
    </div>
  )
}
