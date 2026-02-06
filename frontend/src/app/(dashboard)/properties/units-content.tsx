'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Home, Plus, Search } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  CounterCard,
  RadialProgressCard,
  Table,
  Badge,
  EmptyState,
} from '@/components/ui'
import { CreateApartmentModal } from '@/components/apartments'
import { useApartments } from '@/hooks/useApartments'
import { useBuildings } from '@/hooks/useBuildings'
import { ApartmentStatus } from '@/types'
import styles from './properties.module.css'

type PropertyFilter = 'all' | 'departamento' | 'casa' | 'cochera' | 'local_comercial'

export default function UnitsContent() {
  const router = useRouter()
  const { apartments, loading: apartmentsLoading, refresh } = useApartments()
  const { buildings, loading: buildingsLoading } = useBuildings()
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>('all')
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const loading = apartmentsLoading || buildingsLoading

  const getBuildingName = (buildingId: number | null) => {
    if (!buildingId) return 'Independiente'
    const building = buildings.find((b) => b.id === buildingId)
    return building?.name || 'Edificio desconocido'
  }

  const getApartmentDisplayName = (apartment: typeof apartments[0]) => {
    // Si tiene nomenclatura, usarla como nombre principal
    if (apartment.nomenclature) {
      return apartment.nomenclature
    }
    // Si es independiente y tiene dirección completa
    if (apartment.fullAddress) {
      return apartment.fullAddress
    }
    // Si está en un edificio, mostrar piso y letra
    if (apartment.buildingId && apartment.floor !== null) {
      const letter = apartment.apartmentLetter || ''
      return `Piso ${apartment.floor}${letter ? ` - ${letter}` : ''}`
    }
    return 'Sin nombre'
  }

  const getApartmentAddress = (apartment: typeof apartments[0]) => {
    // Si es independiente, mostrar ciudad/provincia
    if (apartment.fullAddress) {
      const parts = [apartment.city, apartment.province].filter(Boolean)
      return parts.length > 0 ? parts.join(', ') : apartment.fullAddress
    }
    // Si está en un edificio, mostrar la dirección del edificio
    if (apartment.buildingId) {
      const building = buildings.find((b) => b.id === apartment.buildingId)
      return building?.address || ''
    }
    return ''
  }

  const getStatusColor = (status: ApartmentStatus) => {
    switch (status) {
      case ApartmentStatus.AVAILABLE:
        return 'success'
      case ApartmentStatus.RENTED:
        return 'info'
      case ApartmentStatus.UNDER_RENOVATION:
        return 'warning'
      case ApartmentStatus.PERSONAL_USE:
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: ApartmentStatus) => {
    switch (status) {
      case ApartmentStatus.AVAILABLE:
        return 'Disponible'
      case ApartmentStatus.RENTED:
        return 'Alquilado'
      case ApartmentStatus.UNDER_RENOVATION:
        return 'En Refacción'
      case ApartmentStatus.PERSONAL_USE:
        return 'Uso Propio'
      default:
        return status
    }
  }

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case 'departamento':
        return 'Departamento'
      case 'casa':
        return 'Casa'
      case 'cochera':
        return 'Cochera'
      case 'local_comercial':
        return 'Local Comercial'
      case 'ph':
        return 'PH'
      default:
        return type
    }
  }

  const filteredApartments = apartments.filter((apartment) => {
    let matchesPropertyType = true
    if (propertyFilter !== 'all') {
      matchesPropertyType = apartment.propertyType === propertyFilter
    }

    let matchesBuilding = true
    if (selectedBuildingId !== 'all' && apartment.buildingId) {
      matchesBuilding = apartment.buildingId.toString() === selectedBuildingId
    }

    let matchesStatus = true
    if (selectedStatus !== 'all') {
      matchesStatus = apartment.status === selectedStatus
    }

    let matchesSearch = true
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      matchesSearch =
        (apartment.nomenclature?.toLowerCase().includes(search) ?? false) ||
        (apartment.fullAddress?.toLowerCase().includes(search) ?? false) ||
        (apartment.apartmentLetter?.toLowerCase().includes(search) ?? false)
    }

    return matchesPropertyType && matchesBuilding && matchesStatus && matchesSearch
  })

  const handleApartmentClick = (apartmentId: number) => {
    router.push(`/apartments/${apartmentId}`)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando unidades...</p>
      </div>
    )
  }

  const totalAvailable = apartments.filter(
    (a) => a.status === ApartmentStatus.AVAILABLE
  ).length
  const totalRented = apartments.filter(
    (a) => a.status === ApartmentStatus.RENTED
  ).length
  const totalRenovation = apartments.filter(
    (a) => a.status === ApartmentStatus.UNDER_RENOVATION
  ).length

  return (
    <div className={styles.content}>
      {/* Stats con RadialProgress para visualización de ocupación */}
      <div className={styles.unitsHeader}>
        <div className={styles.statsGrid3}>
          <CounterCard
            title="Total Propiedades"
            value={apartments.length}
            icon={<Home size={24} />}
            color="blue"
            size="sm"
          />
          <CounterCard
            title="Disponibles"
            value={totalAvailable}
            icon={<Home size={24} />}
            color="green"
            size="sm"
          />
          <CounterCard
            title="Alquiladas"
            value={totalRented}
            icon={<Home size={24} />}
            color="purple"
            size="sm"
          />
        </div>
        <RadialProgressCard
          title="Ocupación"
          segments={[
            { value: totalRented, color: '#10B981', label: 'Alquiladas' },
            { value: totalAvailable, color: '#3B82F6', label: 'Disponibles' },
            { value: totalRenovation, color: '#F59E0B', label: 'En Refacción' },
          ]}
          centerValue={`${apartments.length > 0 ? Math.round((totalRented / apartments.length) * 100) : 0}%`}
          centerLabel="Ocupación"
          size="sm"
        />
      </div>

      {/* Filters */}
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <Input
            placeholder="Buscar propiedad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={18} />}
            className={styles.searchInput}
          />
          <Select
            options={[
              { value: 'all', label: 'Todos los tipos' },
              { value: 'departamento', label: 'Departamentos' },
              { value: 'casa', label: 'Casas' },
              { value: 'cochera', label: 'Cocheras' },
              { value: 'local_comercial', label: 'Locales' },
            ]}
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value as PropertyFilter)}
            size="sm"
          />
          <Select
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: ApartmentStatus.AVAILABLE, label: 'Disponible' },
              { value: ApartmentStatus.RENTED, label: 'Alquilado' },
              { value: ApartmentStatus.UNDER_RENOVATION, label: 'En Refacción' },
              { value: ApartmentStatus.PERSONAL_USE, label: 'Uso Propio' },
            ]}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            size="sm"
          />
          {buildings.length > 0 && (
            <Select
              options={[
                { value: 'all', label: 'Todos los edificios' },
                ...buildings.map((b) => ({ value: b.id.toString(), label: b.name })),
              ]}
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              size="sm"
            />
          )}
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setIsCreateModalOpen(true)}>
          Nueva Propiedad
        </Button>
      </div>

      {/* Units List */}
      {filteredApartments.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Home />}
              title="No hay propiedades"
              description="Comienza creando tu primera propiedad para gestionar tus alquileres."
              action={
                <Button leftIcon={<Plus size={16} />} onClick={() => setIsCreateModalOpen(true)}>
                  Crear Propiedad
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Table
              columns={[
                {
                  key: 'name',
                  header: 'Propiedad',
                  render: (apartment) => {
                    const apt = apartment as unknown as typeof apartments[0]
                    return (
                      <div className={styles.unitCell}>
                        <div className={styles.unitIcon}>
                          <Home size={18} />
                        </div>
                        <div>
                          <span className={styles.unitName}>
                            {getApartmentDisplayName(apt)}
                          </span>
                          <span className={styles.unitAddress}>
                            {getApartmentAddress(apt)}
                          </span>
                        </div>
                      </div>
                    )
                  },
                },
                {
                  key: 'propertyType',
                  header: 'Tipo',
                  render: (apartment) => (
                    <span className={styles.cellText}>
                      {getPropertyTypeLabel(apartment.propertyType as string)}
                    </span>
                  ),
                },
                {
                  key: 'building',
                  header: 'Edificio',
                  render: (apartment) => (
                    <span className={styles.cellText}>
                      {getBuildingName(apartment.buildingId as number | null)}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Estado',
                  align: 'center',
                  render: (apartment) => (
                    <Badge variant={getStatusColor(apartment.status as ApartmentStatus)}>
                      {getStatusLabel(apartment.status as ApartmentStatus)}
                    </Badge>
                  ),
                },
              ]}
              data={filteredApartments as unknown as Record<string, unknown>[]}
              onRowClick={(apartment) => handleApartmentClick(apartment.id as number)}
            />
          </CardContent>
        </Card>
      )}

      {/* Create Apartment Modal */}
      <CreateApartmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refresh()}
      />
    </div>
  )
}
