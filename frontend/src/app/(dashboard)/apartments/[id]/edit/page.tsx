'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, ArrowLeft, Building2, MapPin, Save } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  Select,
  EmptyState,
} from '@/components/ui'
import { useApartments } from '@/hooks/useApartments'
import { useBuildings } from '@/hooks/useBuildings'
import { useOwners } from '@/hooks/useOwners'
import { ApartmentStatus, PropertyType, SaleStatus } from '@/types'
import styles from '../apartment-detail.module.css'

export default function EditApartmentPage() {
  const params = useParams()
  const router = useRouter()
  const apartmentId = Number(params.id)

  const { apartments, loading: apartmentsLoading, updateApartment } = useApartments()
  const { buildings } = useBuildings()
  const { owners } = useOwners()
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const apartment = apartments.find((a) => a.id === apartmentId)
  const isIndependent = !apartment?.buildingId

  const [formData, setFormData] = useState({
    buildingId: '',
    ownerId: '',
    floor: '',
    apartmentLetter: '',
    nomenclature: '',
    fullAddress: '',
    city: '',
    province: '',
    propertyType: PropertyType.APARTMENT,
    area: '',
    rooms: '',
    status: ApartmentStatus.AVAILABLE,
    saleStatus: SaleStatus.NOT_FOR_SALE,
  })

  // Load apartment data into form
  useEffect(() => {
    if (apartment) {
      setFormData({
        buildingId: apartment.buildingId?.toString() || '',
        ownerId: apartment.ownerId?.toString() || '',
        floor: apartment.floor?.toString() || '',
        apartmentLetter: apartment.apartmentLetter || '',
        nomenclature: apartment.nomenclature || '',
        fullAddress: apartment.fullAddress || '',
        city: apartment.city || '',
        province: apartment.province || '',
        propertyType: apartment.propertyType as PropertyType || PropertyType.APARTMENT,
        area: apartment.area?.toString() || '',
        rooms: apartment.rooms?.toString() || '',
        status: apartment.status as ApartmentStatus || ApartmentStatus.AVAILABLE,
        saleStatus: apartment.saleStatus as SaleStatus || SaleStatus.NOT_FOR_SALE,
      })
    }
  }, [apartment])

  const handleSubmit = async () => {
    if (!formData.area || !formData.rooms) return

    setSaving(true)
    setFormError(null)
    try {
      await updateApartment(apartmentId, {
        ownerId: formData.ownerId ? Number(formData.ownerId) : undefined,
        floor: formData.floor ? Number(formData.floor) : undefined,
        apartmentLetter: formData.apartmentLetter || undefined,
        nomenclature: formData.nomenclature,
        fullAddress: isIndependent ? formData.fullAddress : undefined,
        city: isIndependent ? formData.city : undefined,
        province: isIndependent ? formData.province : undefined,
        propertyType: formData.propertyType,
        area: Number(formData.area),
        rooms: Number(formData.rooms),
        status: formData.status,
        saleStatus: formData.saleStatus,
      })
      router.push(`/apartments/${apartmentId}`)
    } catch (error: any) {
      console.error('Error updating apartment:', error)
      setFormError(error?.message || 'Error al actualizar la propiedad')
    } finally {
      setSaving(false)
    }
  }

  const propertyTypeOptions = [
    { value: PropertyType.APARTMENT, label: 'Departamento' },
    { value: PropertyType.HOUSE, label: 'Casa' },
    { value: PropertyType.DUPLEX, label: 'Duplex' },
    { value: PropertyType.PH, label: 'PH' },
    { value: PropertyType.OFFICE, label: 'Oficina' },
    { value: PropertyType.COMMERCIAL, label: 'Local Comercial' },
    { value: PropertyType.PARKING, label: 'Cochera' },
    { value: PropertyType.WAREHOUSE, label: 'Depósito' },
    { value: PropertyType.LAND, label: 'Terreno' },
  ]

  const statusOptions = [
    { value: ApartmentStatus.AVAILABLE, label: 'Disponible' },
    { value: ApartmentStatus.RENTED, label: 'Alquilado' },
    { value: ApartmentStatus.UNDER_RENOVATION, label: 'En Refacción' },
    { value: ApartmentStatus.PERSONAL_USE, label: 'Uso Propio' },
  ]

  if (apartmentsLoading) {
    return (
      <DashboardLayout title="Cargando..." subtitle="">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Cargando propiedad...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!apartment) {
    return (
      <DashboardLayout title="Propiedad no encontrada" subtitle="">
        <Card>
          <CardContent>
            <EmptyState
              icon={<Home />}
              title="Propiedad no encontrada"
              description="La propiedad que buscas no existe o fue eliminada."
              action={
                <Link href="/properties">
                  <Button leftIcon={<ArrowLeft size={16} />}>Volver a Propiedades</Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  const building = apartment.buildingId
    ? buildings.find((b) => b.id === apartment.buildingId)
    : null

  // Get display title
  const getTitle = () => {
    if (building) {
      return `${building.address}${apartment.nomenclature ? ` - ${apartment.nomenclature}` : ''}`
    }
    if (apartment.fullAddress) {
      return apartment.nomenclature
        ? `${apartment.fullAddress} - ${apartment.nomenclature}`
        : apartment.fullAddress
    }
    return apartment.nomenclature || `Propiedad #${apartment.id}`
  }

  return (
    <DashboardLayout title={`Editar: ${getTitle()}`} subtitle="Modificar datos de la propiedad">
      {/* Back Button */}
      <div className={styles.backRow}>
        <Link href={`/apartments/${apartmentId}`}>
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
            Volver a Detalles
          </Button>
        </Link>
      </div>

      <div className={styles.grid2}>
        {/* Location */}
        <Card>
          <CardHeader title="Ubicación" />
          <CardContent>
            {!isIndependent ? (
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Edificio</span>
                  <span className={styles.infoValue}>
                    <Building2 size={14} />
                    {building?.name} - {building?.address}
                  </span>
                </div>
                <Input
                  label="Piso"
                  type="number"
                  value={formData.floor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, floor: e.target.value }))
                  }
                  placeholder="1"
                  fullWidth
                />
                <Input
                  label="Unidad / Letra"
                  value={formData.apartmentLetter}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, apartmentLetter: e.target.value }))
                  }
                  placeholder="A"
                  fullWidth
                />
                <Input
                  label="Nomenclatura"
                  value={formData.nomenclature}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nomenclature: e.target.value }))
                  }
                  placeholder="1A"
                  fullWidth
                />
              </div>
            ) : (
              <div className={styles.infoGrid}>
                <Input
                  label="Dirección Completa *"
                  value={formData.fullAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fullAddress: e.target.value }))
                  }
                  placeholder="Av. Corrientes 1234"
                  leftIcon={<MapPin size={18} />}
                  fullWidth
                />
                <Input
                  label="Ciudad"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="Buenos Aires"
                  fullWidth
                />
                <Input
                  label="Provincia"
                  value={formData.province}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, province: e.target.value }))
                  }
                  placeholder="Buenos Aires"
                  fullWidth
                />
                <Input
                  label="Nomenclatura"
                  value={formData.nomenclature}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nomenclature: e.target.value }))
                  }
                  placeholder="Casa Principal"
                  fullWidth
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader title="Detalles de la Propiedad" />
          <CardContent>
            <div className={styles.infoGrid}>
              <Select
                label="Tipo *"
                options={propertyTypeOptions}
                value={formData.propertyType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    propertyType: e.target.value as PropertyType,
                  }))
                }
                fullWidth
              />
              <Select
                label="Estado *"
                options={statusOptions}
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as ApartmentStatus,
                  }))
                }
                fullWidth
              />
              <Input
                label="Superficie (m²) *"
                type="number"
                value={formData.area}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, area: e.target.value }))
                }
                placeholder="50"
                fullWidth
              />
              <Input
                label="Ambientes *"
                type="number"
                value={formData.rooms}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, rooms: e.target.value }))
                }
                placeholder="2"
                fullWidth
              />
            </div>
          </CardContent>
        </Card>

        {/* Owner */}
        <Card>
          <CardHeader title="Propietario" />
          <CardContent>
            <Select
              label="Propietario"
              options={[
                { value: '', label: 'Sin propietario asignado' },
                ...owners.map((o) => ({
                  value: o.id.toString(),
                  label: `${o.name} - ${o.dniOrCuit}`,
                })),
              ]}
              value={formData.ownerId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ownerId: e.target.value }))
              }
              fullWidth
            />
          </CardContent>
        </Card>
      </div>

      {/* Error Message */}
      {formError && (
        <Card>
          <CardContent>
            <div style={{ color: 'var(--status-error)', padding: 'var(--spacing-md)' }}>
              {formError}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className={styles.backRow} style={{ justifyContent: 'flex-end', marginTop: 'var(--spacing-xl)' }}>
        <Link href={`/apartments/${apartmentId}`}>
          <Button variant="secondary">Cancelar</Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={saving || !formData.area || !formData.rooms}
          loading={saving}
          leftIcon={<Save size={16} />}
        >
          Guardar Cambios
        </Button>
      </div>
    </DashboardLayout>
  )
}
