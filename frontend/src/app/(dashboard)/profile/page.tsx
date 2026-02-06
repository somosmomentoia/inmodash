'use client'

import { useState } from 'react'
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Camera,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  Avatar,
} from '@/components/ui'
import styles from './profile.module.css'

export default function ProfilePage() {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: 'Usuario Demo',
    email: 'demo@inmodash.com',
    phone: '+54 11 1234-5678',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleSave = async () => {
    setSaving(true)
    // TODO: Save profile
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
  }

  return (
    <DashboardLayout title="Mi Perfil" subtitle="Gestiona tu información personal">
      <div className={styles.content}>
        {/* Avatar Section */}
        <Card>
          <CardContent>
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper}>
                <Avatar name={formData.name} size="lg" />
                <button className={styles.avatarButton}>
                  <Camera size={16} />
                </button>
              </div>
              <div className={styles.avatarInfo}>
                <h3 className={styles.userName}>{formData.name}</h3>
                <p className={styles.userEmail}>{formData.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader title="Información Personal" />
          <CardContent>
            <div className={styles.formGrid}>
              <Input
                label="Nombre Completo"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                leftIcon={<User size={18} />}
                fullWidth
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                leftIcon={<Mail size={18} />}
                fullWidth
              />
              <Input
                label="Teléfono"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                leftIcon={<Phone size={18} />}
                fullWidth
              />
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader
            title="Cambiar Contraseña"
            subtitle="Deja en blanco si no deseas cambiarla"
          />
          <CardContent>
            <div className={styles.formGrid}>
              <Input
                label="Contraseña Actual"
                type="password"
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))
                }
                leftIcon={<Lock size={18} />}
                fullWidth
              />
              <div /> {/* Spacer */}
              <Input
                label="Nueva Contraseña"
                type="password"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                leftIcon={<Lock size={18} />}
                fullWidth
              />
              <Input
                label="Confirmar Nueva Contraseña"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                leftIcon={<Lock size={18} />}
                fullWidth
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className={styles.actions}>
          <Button
            onClick={handleSave}
            loading={saving}
            leftIcon={<Save size={16} />}
          >
            Guardar Cambios
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
