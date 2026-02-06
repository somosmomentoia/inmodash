'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Home, Plus, MapPin, Search } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Input,
  CounterCard,
  Table,
  Badge,
  EmptyState,
} from '@/components/ui'
import { CreateBuildingModal } from '@/components/buildings'
import { useBuildings } from '@/hooks/useBuildings'
import { useApartments } from '@/hooks/useApartments'
import { useContracts } from '@/hooks/useContracts'
import { ApartmentStatus } from '@/types'
import styles from './properties.module.css'

export default function BuildingsContent() {
  const router = useRouter()
  const { buildings, loading, refresh } = useBuildings()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { apartments } = useApartments()
  const { contracts } = useContracts()
  const [searchTerm, setSearchTerm] = useState('')

  const today = new Date()
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

  const buildingsWithStats = buildings.map((building) => {
    const buildingApartments = apartments.filter((apt) => apt.buildingId === building.id)
    const available = buildingApartments.filter(
      (apt) => apt.status === ApartmentStatus.AVAILABLE
    ).length
    const rented = buildingApartments.filter(
      (apt) => apt.status === ApartmentStatus.RENTED
    ).length

    const buildingContracts = contracts.filter((contract) =>
      buildingApartments.some((apt) => apt.id === contract.apartmentId)
    )

    const expiringSoon = buildingContracts.filter((contract) => {
      const endDate = new Date(contract.endDate)
      return endDate >= today && endDate <= thirtyDaysFromNow
    }).length

    return {
      ...building,
      totalUnits: buildingApartments.length,
      available,
      rented,
      expiringSoon,
    }
  })

  const filteredBuildings = buildingsWithStats.filter(
    (building) =>
      building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleBuildingClick = (buildingId: number) => {
    router.push(`/buildings/${buildingId}`)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando edificios...</p>
      </div>
    )
  }

  const totalUnits = buildingsWithStats.reduce((sum, b) => sum + b.totalUnits, 0)
  const totalAvailable = buildingsWithStats.reduce((sum, b) => sum + b.available, 0)
  const totalRented = buildingsWithStats.reduce((sum, b) => sum + b.rented, 0)

  return (
    <div className={styles.content}>
      {/* Stats */}
      <div className={styles.statsGrid4}>
        <CounterCard
          title="Total Edificios"
          value={buildings.length}
          icon={<Building2 size={24} />}
          color="blue"
          size="sm"
        />
        <CounterCard
          title="Total Unidades"
          value={totalUnits}
          icon={<Home size={24} />}
          color="purple"
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
          color="cyan"
          size="sm"
        />
      </div>

      {/* Search and Actions */}
      <div className={styles.toolbar}>
        <Input
          placeholder="Buscar edificio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search size={18} />}
          className={styles.searchInput}
        />
        <Button leftIcon={<Plus size={16} />} onClick={() => setIsCreateModalOpen(true)}>
          Nuevo Edificio
        </Button>
      </div>

      {/* Buildings List */}
      {filteredBuildings.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Building2 />}
              title="No hay edificios"
              description="Comienza creando tu primer edificio para gestionar sus unidades."
              action={
                <Button leftIcon={<Plus size={16} />} onClick={() => setIsCreateModalOpen(true)}>
                  Crear Edificio
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
                  header: 'Edificio',
                  render: (building) => (
                    <div className={styles.buildingCell}>
                      <div className={styles.buildingIcon}>
                        <Building2 size={18} />
                      </div>
                      <div>
                        <span className={styles.buildingName}>{building.name as string}</span>
                        <span className={styles.buildingAddress}>
                          {building.address as string}, {building.city as string}
                        </span>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'totalUnits',
                  header: 'Unidades',
                  align: 'center',
                  render: (building) => (
                    <Badge>{building.totalUnits as number}</Badge>
                  ),
                },
                {
                  key: 'available',
                  header: 'Disponibles',
                  align: 'center',
                  render: (building) => (
                    <Badge variant="success">{building.available as number}</Badge>
                  ),
                },
                {
                  key: 'rented',
                  header: 'Alquiladas',
                  align: 'center',
                  render: (building) => (
                    <Badge variant="info">{building.rented as number}</Badge>
                  ),
                },
                {
                  key: 'expiringSoon',
                  header: 'Por Vencer',
                  align: 'center',
                  render: (building) => {
                    const expiring = building.expiringSoon as number
                    return expiring > 0 ? (
                      <Badge variant="warning">{expiring}</Badge>
                    ) : (
                      <span className={styles.cellText}>-</span>
                    )
                  },
                },
              ]}
              data={filteredBuildings as unknown as Record<string, unknown>[]}
              onRowClick={(building) => handleBuildingClick(building.id as number)}
            />
          </CardContent>
        </Card>
      )}

      {/* Create Building Modal */}
      <CreateBuildingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refresh()}
      />
    </div>
  )
}
