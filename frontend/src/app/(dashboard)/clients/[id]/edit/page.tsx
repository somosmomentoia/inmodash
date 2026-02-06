'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  EmptyState,
} from '@/components/ui'
import { useTenant, useTenants } from '@/hooks/useTenants'
import styles from './edit-client.module.css'

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = Number(params.id)

  const { tenant, loading: tenantLoading } = useTenant(clientId)
  const { updateTenant } = useTenants()
  
  const [formData, setFormData] = useState({
    nameOrBusiness: '',
    dniOrCuit: '',
    address: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    contactAddress: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Populate form when tenant loads
  useEffect(() => {
    if (tenant) {
      setFormData({
        nameOrBusiness: tenant.nameOrBusiness || '',
        dniOrCuit: tenant.dniOrCuit || '',
        address: tenant.address || '',
        contactName: tenant.contactName || '',
        contactPhone: tenant.contactPhone || '',
        contactEmail: tenant.contactEmail || '',
        contactAddress: tenant.contactAddress || '',
      })
    }
  }, [tenant])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nameOrBusiness || !formData.dniOrCuit) {
      alert('Por favor complete los campos requeridos')
      return
    }

    setSubmitting(true)
    try {
      await updateTenant(clientId, formData)
      router.push(`/clients/${clientId}`)
    } catch (error) {
      console.error('Error updating client:', error)
      alert('Error al actualizar el cliente. Por favor intente nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (tenantLoading) {
    return (
      <DashboardLayout title="Cargando..." subtitle="Obteniendo información del cliente">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Cargando cliente...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!tenant) {
    return (
      <DashboardLayout title="Cliente no encontrado" subtitle="">
        <Card>
          <CardContent>
            <EmptyState
              icon={<User />}
              title="Cliente no encontrado"
              description="El cliente que buscas no existe o fue eliminado."
              action={
                <Link href="/clients">
                  <Button leftIcon={<ArrowLeft size={16} />}>
                    Volver a Clientes
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="Editar Cliente" 
      subtitle={tenant.nameOrBusiness}
    >
      {/* Back Button */}
      <div className={styles.header}>
        <Link href={`/clients/${clientId}`}>
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
            Volver al Cliente
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.formContainer}>
          {/* Personal Info */}
          <Card>
            <CardHeader 
              title="Información del Cliente"
              subtitle="Datos personales o de la empresa"
            />
            <CardContent>
              <div className={styles.formGrid}>
                <Input
                  label="Nombre o Razón Social *"
                  value={formData.nameOrBusiness}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameOrBusiness: e.target.value }))}
                  placeholder="Nombre completo o razón social"
                  leftIcon={<User size={18} />}
                  fullWidth
                />
                <Input
                  label="DNI/CUIT *"
                  value={formData.dniOrCuit}
                  onChange={(e) => setFormData(prev => ({ ...prev, dniOrCuit: e.target.value }))}
                  placeholder="20-12345678-9"
                  fullWidth
                />
              </div>
              <Input
                label="Dirección"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección del cliente"
                leftIcon={<MapPin size={18} />}
                fullWidth
              />
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader 
              title="Información de Contacto"
              subtitle="Persona de contacto para comunicaciones"
            />
            <CardContent>
              <div className={styles.formGrid}>
                <Input
                  label="Nombre de Contacto"
                  value={formData.contactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  placeholder="Nombre de la persona de contacto"
                  leftIcon={<User size={18} />}
                  fullWidth
                />
                <Input
                  label="Teléfono de Contacto"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="+54 11 1234-5678"
                  leftIcon={<Phone size={18} />}
                  fullWidth
                />
              </div>
              <div className={styles.formGrid}>
                <Input
                  label="Email de Contacto"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="email@ejemplo.com"
                  leftIcon={<Mail size={18} />}
                  fullWidth
                />
                <Input
                  label="Dirección de Contacto"
                  value={formData.contactAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactAddress: e.target.value }))}
                  placeholder="Dirección de contacto"
                  leftIcon={<MapPin size={18} />}
                  fullWidth
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/clients/${clientId}`)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              leftIcon={<Save size={16} />}
              loading={submitting}
              disabled={!formData.nameOrBusiness || !formData.dniOrCuit}
            >
              Guardar Cambios
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  )
}
