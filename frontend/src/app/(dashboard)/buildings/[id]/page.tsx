'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  Home,
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  MapPin,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CounterCard,
  Table,
  Badge,
  EmptyState,
  Modal,
  ModalFooter,
} from '@/components/ui'
import { useBuildings } from '@/hooks/useBuildings'
import { useApartments } from '@/hooks/useApartments'
import { ApartmentStatus, Building } from '@/types'
import styles from './building.module.css'

export default function BuildingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const buildingId = Number(params.id)
  
  const { buildings, loading: buildingsLoading, deleteBuilding } = useBuildings()
  const { apartments, loading: apartmentsLoading } = useApartments()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const loading = buildingsLoading || apartmentsLoading
  const building = buildings.find((b) => b.id === buildingId)
  const buildingApartments = apartments.filter((apt) => apt.buildingId === buildingId)

  const handleDelete = async () => {
    try {
      await deleteBuilding(buildingId)
      router.push('/properties')
    } catch (error) {
      console.error('Error deleting building:', error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Cargando..." subtitle="">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Cargando edificio...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!building) {
    return (
      <DashboardLayout title="Edificio no encontrado" subtitle="">
        <Card>
          <CardContent>
            <EmptyState
              icon={<Building2 />}
              title="Edificio no encontrado"
              description="El edificio que buscas no existe o fue eliminado."
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

  const available = buildingApartments.filter(
    (apt) => apt.status === ApartmentStatus.AVAILABLE
  ).length
  const rented = buildingApartments.filter(
    (apt) => apt.status === ApartmentStatus.RENTED
  ).length

  const getStatusColor = (status: ApartmentStatus) => {
    switch (status) {
      case ApartmentStatus.AVAILABLE:
        return 'success'
      case ApartmentStatus.RENTED:
        return 'info'
      case ApartmentStatus.UNDER_RENOVATION:
        return 'warning'
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

  return (
    <DashboardLayout
      title={building.name}
      subtitle={`${building.address}, ${building.city}`}
    >
      {/* Back Button */}
      <div className={styles.backRow}>
        <Link href="/properties">
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
            Volver a Propiedades
          </Button>
        </Link>
        <div className={styles.actions}>
          <Link href={`/buildings/${buildingId}/edit`}>
            <Button variant="secondary" leftIcon={<Edit size={16} />}>
              Editar
            </Button>
          </Link>
          <Button
            variant="danger"
            leftIcon={<Trash2 size={16} />}
            onClick={() => setShowDeleteModal(true)}
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <CounterCard
          title="Total Unidades"
          value={buildingApartments.length}
          icon={<Home size={24} />}
          color="blue"
          size="sm"
        />
        <CounterCard
          title="Disponibles"
          value={available}
          icon={<Home size={24} />}
          color="green"
          size="sm"
        />
        <CounterCard
          title="Alquiladas"
          value={rented}
          icon={<Home size={24} />}
          color="purple"
          size="sm"
        />
        <CounterCard
          title="Pisos"
          value={building.floors}
          icon={<Building2 size={24} />}
          color="cyan"
          size="sm"
        />
      </div>

      {/* Building Info */}
      <div className={styles.grid2}>
        <Card>
          <CardHeader title="Información del Edificio" />
          <CardContent>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Dirección</span>
                <span className={styles.infoValue}>
                  <MapPin size={14} /> {building.address}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Ciudad</span>
                <span className={styles.infoValue}>{building.city}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Provincia</span>
                <span className={styles.infoValue}>{building.province}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Propietario</span>
                <span className={styles.infoValue}>{building.owner || '-'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Área Total</span>
                <span className={styles.infoValue}>{building.totalArea} m²</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Pisos</span>
                <span className={styles.infoValue}>{building.floors}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Distribución por Piso" />
          <CardContent>
            {building.floorConfiguration && building.floorConfiguration.length > 0 ? (
              <div className={styles.floorList}>
                {building.floorConfiguration.map((floor) => (
                  <div key={floor.floor} className={styles.floorItem}>
                    <span className={styles.floorNumber}>Piso {floor.floor}</span>
                    <Badge>{floor.apartmentsCount} unidades</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noData}>Sin configuración de pisos</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Apartments List */}
      <Card>
        <CardHeader
          title="Unidades del Edificio"
          action={
            <Link href={`/apartments/new?buildingId=${buildingId}`}>
              <Button size="sm" leftIcon={<Plus size={14} />}>
                Nueva Unidad
              </Button>
            </Link>
          }
        />
        <CardContent>
          {buildingApartments.length === 0 ? (
            <EmptyState
              icon={<Home />}
              title="Sin unidades"
              description="Este edificio no tiene unidades registradas."
              action={
                <Link href={`/apartments/new?buildingId=${buildingId}`}>
                  <Button leftIcon={<Plus size={16} />}>Crear Unidad</Button>
                </Link>
              }
            />
          ) : (
            <Table
              columns={[
                {
                  key: 'nomenclature',
                  header: 'Unidad',
                  render: (apt) => (
                    <div className={styles.unitCell}>
                      <span className={styles.unitName}>
                        {(apt.apartmentLetter as string) || (apt.nomenclature as string)}
                      </span>
                      <span className={styles.unitFloor}>Piso {apt.floor as number}</span>
                    </div>
                  ),
                },
                {
                  key: 'area',
                  header: 'Área',
                  render: (apt) => (
                    <span className={styles.cellText}>{apt.area as number} m²</span>
                  ),
                },
                {
                  key: 'rooms',
                  header: 'Ambientes',
                  align: 'center',
                  render: (apt) => <Badge>{apt.rooms as number}</Badge>,
                },
                {
                  key: 'status',
                  header: 'Estado',
                  align: 'center',
                  render: (apt) => (
                    <Badge variant={getStatusColor(apt.status as ApartmentStatus)}>
                      {getStatusLabel(apt.status as ApartmentStatus)}
                    </Badge>
                  ),
                },
              ]}
              data={buildingApartments as unknown as Record<string, unknown>[]}
              onRowClick={(apt) => router.push(`/apartments/${apt.id}`)}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Edificio"
        size="sm"
      >
        <p className={styles.deleteText}>
          ¿Está seguro que desea eliminar el edificio <strong>{building.name}</strong>?
        </p>
        <p className={styles.deleteWarning}>
          Esta acción eliminará también todas las unidades asociadas y no se puede deshacer.
        </p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Eliminar
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  )
}
