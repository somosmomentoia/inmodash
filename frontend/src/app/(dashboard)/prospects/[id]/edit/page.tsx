'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Home,
  Save,
} from 'lucide-react'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  Select,
  Textarea,
  SearchSelect,
} from '@/components/ui'
import { DashboardLayout } from '@/components/layout'
import { prospectsService } from '@/services/prospects.service'
import { useApartments } from '@/hooks/useApartments'
import {
  Prospect,
  UpdateProspectDto,
  ProspectSource,
  PROSPECT_SOURCE_LABELS,
} from '@/types'
import styles from '../../prospects.module.css'

export default function EditProspectPage() {
  const router = useRouter()
  const params = useParams()
  const prospectId = parseInt(params.id as string)
  
  const [loading, setLoading] = useState(false)
  const [loadingProspect, setLoadingProspect] = useState(true)
  const [prospect, setProspect] = useState<Prospect | null>(null)
  const { apartments: rawApartments, loading: loadingApartments } = useApartments()

  // Sort apartments: available first, then occupied
  const apartments = [...rawApartments].sort((a, b) => {
    if (a.status === 'disponible' && b.status !== 'disponible') return -1
    if (a.status !== 'disponible' && b.status === 'disponible') return 1
    return 0
  })

  const [formData, setFormData] = useState<UpdateProspectDto>({
    fullName: '',
    phone: '',
    email: '',
    dniOrCuit: '',
    apartmentId: undefined,
    source: 'other',
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadProspect()
  }, [prospectId])

  const loadProspect = async () => {
    try {
      setLoadingProspect(true)
      const data = await prospectsService.getById(prospectId)
      setProspect(data)
      setFormData({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || '',
        dniOrCuit: data.dniOrCuit || '',
        apartmentId: data.apartmentId,
        source: data.source,
        notes: data.notes || '',
      })
    } catch (error) {
      console.error('Error loading prospect:', error)
      router.push('/prospects')
    } finally {
      setLoadingProspect(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName?.trim()) {
      newErrors.fullName = 'El nombre es requerido'
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      setLoading(true)
      await prospectsService.update(prospectId, formData)
      router.push(`/prospects/${prospectId}`)
    } catch (error) {
      console.error('Error updating prospect:', error)
      alert('Error al actualizar el prospecto')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof UpdateProspectDto, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  if (loadingProspect) {
    return (
      <DashboardLayout title="Editar Prospecto" subtitle="Cargando...">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Cargando prospecto...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!prospect) {
    return null
  }

  return (
    <DashboardLayout title="Editar Prospecto" subtitle={prospect.fullName}>
      {/* Back Button */}
      <button className={styles.backButton} onClick={() => router.push(`/prospects/${prospectId}`)}>
        <ArrowLeft size={16} />
        Volver al prospecto
      </button>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader title="Datos del Prospecto" />
          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-lg)' }}>
              {/* Full Name */}
              <Input
                label="Nombre Completo *"
                placeholder="Juan Pérez"
                value={formData.fullName || ''}
                onChange={(e) => handleChange('fullName', e.target.value)}
                error={errors.fullName}
                leftIcon={<User size={16} />}
              />

              {/* Phone */}
              <Input
                label="Teléfono *"
                placeholder="+54 11 1234-5678"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                error={errors.phone}
                leftIcon={<Phone size={16} />}
              />

              {/* Email */}
              <Input
                label="Email"
                placeholder="juan@ejemplo.com"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                leftIcon={<Mail size={16} />}
              />

              {/* DNI/CUIT */}
              <Input
                label="DNI/CUIT"
                placeholder="12345678"
                value={formData.dniOrCuit || ''}
                onChange={(e) => handleChange('dniOrCuit', e.target.value)}
                leftIcon={<User size={16} />}
              />

              {/* Source */}
              <Select
                label="Origen"
                options={Object.entries(PROSPECT_SOURCE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                value={formData.source || 'other'}
                onChange={(e) => handleChange('source', e.target.value as ProspectSource)}
              />

              {/* Apartment */}
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)' }}>
                  Propiedad de Interés
                </label>
                <SearchSelect
                  options={apartments.map((apt) => ({
                    value: apt.id,
                    label: apt.nomenclature + (apt.status !== 'disponible' ? ' (Alquilada)' : ''),
                    sublabel: apt.fullAddress || apt.propertyType,
                    icon: <Home size={16} />,
                  }))}
                  value={formData.apartmentId || null}
                  onChange={(value) => handleChange('apartmentId', value ? Number(value) : undefined)}
                  placeholder="Seleccionar propiedad..."
                  searchPlaceholder="Buscar por nombre o dirección..."
                  emptyMessage={loadingApartments ? 'Cargando propiedades...' : 'No hay propiedades'}
                  icon={<Home size={16} />}
                  disabled={loadingApartments}
                />
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginTop: 'var(--spacing-lg)' }}>
              <Textarea
                label="Notas"
                placeholder="Información adicional sobre el prospecto..."
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
          <Button variant="secondary" type="button" onClick={() => router.push(`/prospects/${prospectId}`)}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} leftIcon={<Save size={16} />}>
            Guardar Cambios
          </Button>
        </div>
      </form>
    </DashboardLayout>
  )
}
