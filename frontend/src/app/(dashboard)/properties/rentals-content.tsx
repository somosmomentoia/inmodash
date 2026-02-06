'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Home,
  Search,
  MapPin,
  Maximize,
  BedDouble,
  ChevronRight,
  Building2,
  CheckCircle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  Input,
  Badge,
  EmptyState,
  StatCard,
} from '@/components/ui'
import { useApartments } from '@/hooks/useApartments'
import { useBuildings } from '@/hooks/useBuildings'
import { Apartment } from '@/types'
import styles from './properties.module.css'

export default function RentalsContent() {
  const router = useRouter()
  const { apartments, loading: apartmentsLoading } = useApartments()
  const { buildings, loading: buildingsLoading } = useBuildings()
  const [searchTerm, setSearchTerm] = useState('')

  const loading = apartmentsLoading || buildingsLoading

  // Sort apartments: available first, then rented
  const sortedApartments = [...apartments].sort((a, b) => {
    if (a.status === 'disponible' && b.status !== 'disponible') return -1
    if (a.status !== 'disponible' && b.status === 'disponible') return 1
    return 0
  })

  // Filter by search term
  const filteredApartments = sortedApartments.filter((apt) => {
    const building = buildings.find((b) => b.id === apt.buildingId)
    const searchLower = searchTerm.toLowerCase()
    return (
      apt.nomenclature.toLowerCase().includes(searchLower) ||
      apt.fullAddress?.toLowerCase().includes(searchLower) ||
      building?.name.toLowerCase().includes(searchLower) ||
      building?.address?.toLowerCase().includes(searchLower)
    )
  })

  const getBuildingName = (buildingId?: number) => {
    if (!buildingId) return null
    const building = buildings.find((b) => b.id === buildingId)
    return building?.name
  }

  const getAddress = (apt: Apartment) => {
    if (apt.fullAddress) return apt.fullAddress
    if (apt.buildingId) {
      const building = buildings.find((b) => b.id === apt.buildingId)
      return building?.address || 'Sin dirección'
    }
    return 'Sin dirección'
  }

  const goToDetail = (apartmentId: number) => {
    router.push(`/apartments/${apartmentId}`)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando propiedades...</p>
      </div>
    )
  }

  const totalAvailable = apartments.filter((a) => a.status === 'disponible').length
  const totalRented = apartments.filter((a) => a.status === 'alquilado').length

  return (
    <div className={styles.content}>
      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Disponibles"
          value={totalAvailable}
          icon={<CheckCircle size={18} />}
          variant="success"
        />
        <StatCard
          title="Alquiladas"
          value={totalRented}
          icon={<Home size={18} />}
          variant="primary"
        />
      </div>

      {/* Search */}
      <div className={styles.toolbar}>
        <Input
          placeholder="Buscar propiedad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search size={18} />}
          className={styles.searchInput}
        />
      </div>

      {/* Properties List */}
      {filteredApartments.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Home />}
              title="No hay propiedades disponibles"
              description={
                searchTerm
                  ? 'No se encontraron propiedades con ese criterio de búsqueda.'
                  : 'No hay propiedades disponibles para alquilar en este momento.'
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className={styles.rentalsList}>
          {filteredApartments.map((apartment) => (
            <div
              key={apartment.id}
              className={styles.rentalCard}
              onClick={() => goToDetail(apartment.id)}
            >
              <div className={styles.rentalCardMain}>
                <div className={styles.rentalIcon}>
                  <Home size={20} />
                </div>
                <div className={styles.rentalCardInfo}>
                  <span className={styles.rentalCardName}>{apartment.nomenclature}</span>
                  <span className={styles.rentalCardAddress}>
                    <MapPin size={12} />
                    {getAddress(apartment)}
                  </span>
                </div>
              </div>

              <div className={styles.rentalCardDetails}>
                {getBuildingName(apartment.buildingId) && (
                  <span className={styles.rentalCardDetail}>
                    <Building2 size={14} />
                    {getBuildingName(apartment.buildingId)}
                  </span>
                )}
                <span className={styles.rentalCardDetail}>
                  <Maximize size={14} />
                  {apartment.area} m²
                </span>
                <span className={styles.rentalCardDetail}>
                  <BedDouble size={14} />
                  {apartment.rooms} amb.
                </span>
              </div>

              <div className={styles.rentalCardStatus}>
                <Badge variant={apartment.status === 'disponible' ? 'success' : 'info'}>
                  {apartment.status === 'disponible' ? 'Disponible' : 'Alquilada'}
                </Badge>
              </div>

              <div className={styles.rentalCardActions}>
                <ChevronRight size={20} className={styles.chevron} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
