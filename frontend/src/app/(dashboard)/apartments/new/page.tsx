'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Home, ArrowLeft, Building2, MapPin } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  Select,
} from '@/components/ui'
import { useApartments } from '@/hooks/useApartments'
import { useBuildings } from '@/hooks/useBuildings'
import { useOwners } from '@/hooks/useOwners'
import { ApartmentStatus, PropertyType, SaleStatus } from '@/types'
import styles from './new-apartment.module.css'

function NewApartmentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedBuildingId = searchParams.get('buildingId')

  const { createApartment } = useApartments()
  const { buildings } = useBuildings()
  const { owners } = useOwners()
  const [loading, setLoading] = useState(false)
  const [isIndependent, setIsIndependent] = useState(!preselectedBuildingId)
  const [formData, setFormData] = useState({
    buildingId: preselectedBuildingId || '',
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

  const handleSubmit = async () => {
    if (!formData.area || !formData.rooms) return

    if (!isIndependent && !formData.buildingId) return
    if (isIndependent && !formData.fullAddress) return

    setLoading(true)
    try {
      await createApartment({
        buildingId: isIndependent ? undefined : Number(formData.buildingId),
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
      router.push('/properties')
    } catch (error) {
      console.error('Error creating apartment:', error)
    } finally {
      setLoading(false)
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

  return (
    <DashboardLayout title="Nueva Propiedad" subtitle="Crear una nueva propiedad">
      {/* Back Button */}
      <div className={styles.backRow}>
        <Link href="/properties">
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
            Volver a Propiedades
          </Button>
        </Link>
      </div>

      <div className={styles.formContainer}>
        {/* Property Type Selection */}
        <Card>
          <CardHeader title="Tipo de Propiedad" />
          <CardContent>
            <div className={styles.typeSelector}>
              <button
                className={`${styles.typeOption} ${!isIndependent ? styles.typeOptionActive : ''}`}
                onClick={() => setIsIndependent(false)}
              >
                <Building2 size={24} />
                <span>En Edificio</span>
                <small>Pertenece a un edificio existente</small>
              </button>
              <button
                className={`${styles.typeOption} ${isIndependent ? styles.typeOptionActive : ''}`}
                onClick={() => setIsIndependent(true)}
              >
                <Home size={24} />
                <span>Independiente</span>
                <small>Casa, PH u otra propiedad independiente</small>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader title="Ubicación" />
          <CardContent>
            {!isIndependent ? (
              <div className={styles.formGrid}>
                <Select
                  label="Edificio *"
                  options={[
                    { value: '', label: 'Seleccione un edificio...' },
                    ...buildings.map((b) => ({
                      value: b.id.toString(),
                      label: `${b.name} - ${b.address}`,
                    })),
                  ]}
                  value={formData.buildingId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, buildingId: e.target.value }))
                  }
                  fullWidth
                />
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
              <div className={styles.formGrid}>
                <div className={styles.fullWidth}>
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
                </div>
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
            <div className={styles.formGrid}>
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
          <CardHeader title="Propietario" subtitle="Opcional" />
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

        {/* Actions */}
        <div className={styles.actions}>
          <Link href="/properties">
            <Button variant="secondary">Cancelar</Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !formData.area ||
              !formData.rooms ||
              (!isIndependent && !formData.buildingId) ||
              (isIndependent && !formData.fullAddress)
            }
            loading={loading}
            leftIcon={<Home size={16} />}
          >
            Crear Propiedad
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function NewApartmentPage() {
  return (
    <Suspense fallback={
      <DashboardLayout title="Nueva Propiedad" subtitle="Crear una nueva propiedad">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
          <p>Cargando...</p>
        </div>
      </DashboardLayout>
    }>
      <NewApartmentPageContent />
    </Suspense>
  )
}
