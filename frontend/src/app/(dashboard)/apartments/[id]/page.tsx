'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  User,
  FileText,
  MapPin,
  Maximize,
  DoorOpen,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CounterCard,
  Badge,
  Modal,
  ModalFooter,
  EmptyState,
  Avatar,
} from '@/components/ui'
import { useApartments } from '@/hooks/useApartments'
import { useBuildings } from '@/hooks/useBuildings'
import { useOwners } from '@/hooks/useOwners'
import { useContracts } from '@/hooks/useContracts'
import { ApartmentStatus, PropertyType } from '@/types'
import styles from './apartment-detail.module.css'

export default function ApartmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const apartmentId = Number(params.id)

  const { apartments, loading: apartmentsLoading, deleteApartment } = useApartments()
  const { buildings } = useBuildings()
  const { owners } = useOwners()
  const { contracts } = useContracts()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const loading = apartmentsLoading
  const apartment = apartments.find((a) => a.id === apartmentId)
  const building = apartment?.buildingId
    ? buildings.find((b) => b.id === apartment.buildingId)
    : null
  const owner = apartment?.ownerId ? owners.find((o) => o.id === apartment.ownerId) : null
  const activeContract = contracts.find(
    (c) =>
      c.apartmentId === apartmentId &&
      new Date(c.startDate) <= new Date() &&
      new Date(c.endDate) >= new Date()
  )

  const handleDelete = async () => {
    try {
      await deleteApartment(apartmentId)
      router.push('/properties')
    } catch (error) {
      console.error('Error deleting apartment:', error)
    }
  }

  const getStatusBadge = (status: ApartmentStatus) => {
    switch (status) {
      case ApartmentStatus.AVAILABLE:
        return <Badge variant="success">Disponible</Badge>
      case ApartmentStatus.RENTED:
        return <Badge variant="info">Alquilado</Badge>
      case ApartmentStatus.UNDER_RENOVATION:
        return <Badge variant="warning">En Refacción</Badge>
      case ApartmentStatus.PERSONAL_USE:
        return <Badge variant="default">Uso Propio</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPropertyTypeLabel = (type: PropertyType | string) => {
    const labels: Record<string, string> = {
      departamento: 'Departamento',
      casa: 'Casa',
      duplex: 'Duplex',
      ph: 'PH',
      oficina: 'Oficina',
      local_comercial: 'Local Comercial',
      cochera: 'Cochera',
      deposito: 'Depósito',
      terreno: 'Terreno',
    }
    return labels[type] || type
  }

  if (loading) {
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

  // Construir nombre y subtítulo de la propiedad
  const getApartmentTitle = () => {
    // Si está en un edificio, mostrar dirección del edificio + nomenclatura
    if (building) {
      const nomenclature = apartment.nomenclature || 
        (apartment.floor !== null ? `Piso ${apartment.floor}${apartment.apartmentLetter ? ` - ${apartment.apartmentLetter}` : ''}` : '')
      return `${building.address}${nomenclature ? ` - ${nomenclature}` : ''}`
    }
    // Si es independiente, mostrar dirección completa + nomenclatura
    if (apartment.fullAddress) {
      return apartment.nomenclature 
        ? `${apartment.fullAddress} - ${apartment.nomenclature}`
        : apartment.fullAddress
    }
    return apartment.nomenclature || `Propiedad #${apartment.id}`
  }

  const getApartmentSubtitle = () => {
    if (building) {
      return `${building.city}, ${building.province}`
    }
    if (apartment.city || apartment.province) {
      return [apartment.city, apartment.province].filter(Boolean).join(', ')
    }
    return ''
  }

  const apartmentName = getApartmentTitle()

  return (
    <DashboardLayout title={apartmentName} subtitle={getApartmentSubtitle()}>
      {/* Back Button and Actions */}
      <div className={styles.backRow}>
        <Link href="/properties">
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
            Volver a Propiedades
          </Button>
        </Link>
        <div className={styles.actions}>
          {getStatusBadge(apartment.status)}
          <Link href={`/apartments/${apartmentId}/edit`}>
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
          title="Superficie"
          value={apartment.area}
          icon={<Maximize size={24} />}
          color="blue"
          size="sm"
          suffix=" m²"
        />
        <CounterCard
          title="Ambientes"
          value={apartment.rooms}
          icon={<DoorOpen size={24} />}
          color="purple"
          size="sm"
        />
        <CounterCard
          title="Tipo"
          value={0}
          icon={<Home size={24} />}
          color="green"
          size="sm"
          suffix={getPropertyTypeLabel(apartment.propertyType)}
        />
        <CounterCard
          title="Contrato Activo"
          value={activeContract ? 1 : 0}
          icon={<FileText size={24} />}
          color={activeContract ? 'green' : 'orange'}
          size="sm"
          suffix={activeContract ? 'Sí' : 'No'}
        />
      </div>

      {/* Property Info */}
      <div className={styles.grid2}>
        <Card>
          <CardHeader title="Información de la Propiedad" />
          <CardContent>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Nomenclatura</span>
                <span className={styles.infoValue}>{apartment.nomenclature || '-'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>ID Único</span>
                <span className={styles.infoValue}>{apartment.uniqueId}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tipo</span>
                <span className={styles.infoValue}>
                  {getPropertyTypeLabel(apartment.propertyType)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Estado</span>
                <span className={styles.infoValue}>
                  {getStatusBadge(apartment.status)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Superficie</span>
                <span className={styles.infoValue}>{apartment.area} m²</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Ambientes</span>
                <span className={styles.infoValue}>{apartment.rooms}</span>
              </div>
              {apartment.floor !== undefined && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Piso</span>
                  <span className={styles.infoValue}>{apartment.floor}</span>
                </div>
              )}
              {apartment.apartmentLetter && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Unidad</span>
                  <span className={styles.infoValue}>{apartment.apartmentLetter}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Ubicación" />
          <CardContent>
            <div className={styles.infoGrid}>
              {building ? (
                <>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Edificio</span>
                    <Link href={`/buildings/${building.id}`} className={styles.linkValue}>
                      <Building2 size={14} />
                      {building.name}
                    </Link>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Dirección</span>
                    <span className={styles.infoValue}>
                      <MapPin size={14} />
                      {building.address}
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
                </>
              ) : (
                <>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Dirección</span>
                    <span className={styles.infoValue}>
                      <MapPin size={14} />
                      {apartment.fullAddress || '-'}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Ciudad</span>
                    <span className={styles.infoValue}>{apartment.city || '-'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Provincia</span>
                    <span className={styles.infoValue}>{apartment.province || '-'}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Owner and Contract */}
      <div className={styles.grid2}>
        <Card>
          <CardHeader title="Propietario" />
          <CardContent>
            {owner ? (
              <Link href={`/owners/${owner.id}`} className={styles.partyLink}>
                <div className={styles.partyInfo}>
                  <Avatar name={owner.name} size="md" />
                  <div>
                    <span className={styles.partyName}>{owner.name}</span>
                    <span className={styles.partyDetail}>{owner.dniOrCuit}</span>
                    <span className={styles.partyDetail}>{owner.phone}</span>
                  </div>
                </div>
              </Link>
            ) : (
              <EmptyState
                icon={<User />}
                title="Sin propietario"
                description="Esta propiedad no tiene propietario asignado."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Contrato Actual"
            action={
              !activeContract && apartment.status === ApartmentStatus.AVAILABLE ? (
                <Link href={`/contracts/new?apartmentId=${apartmentId}`}>
                  <Button size="sm">Crear Contrato</Button>
                </Link>
              ) : undefined
            }
          />
          <CardContent>
            {activeContract ? (
              <Link href={`/contracts/${activeContract.id}`} className={styles.partyLink}>
                <div className={styles.contractInfo}>
                  <FileText size={24} className={styles.contractIcon} />
                  <div>
                    <span className={styles.partyName}>Contrato #{activeContract.id}</span>
                    <span className={styles.partyDetail}>
                      {new Date(activeContract.startDate).toLocaleDateString('es-AR')} -{' '}
                      {new Date(activeContract.endDate).toLocaleDateString('es-AR')}
                    </span>
                    <span className={styles.partyDetail}>
                      $
                      {activeContract.initialAmount.toLocaleString('es-AR')} /mes
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <EmptyState
                icon={<FileText />}
                title="Sin contrato"
                description="Esta propiedad no tiene contrato activo."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Propiedad"
        size="sm"
      >
        <p className={styles.deleteText}>
          ¿Está seguro que desea eliminar la propiedad <strong>{apartmentName}</strong>?
        </p>
        <p className={styles.deleteWarning}>Esta acción no se puede deshacer.</p>
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
