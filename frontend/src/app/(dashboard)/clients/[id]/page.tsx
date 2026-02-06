'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Shield,
  FileText,
  Building2,
  Home,
  Calendar,
  Clock,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Badge,
  Modal,
  ModalFooter,
  EmptyState,
} from '@/components/ui'
import { useTenant, useTenants } from '@/hooks/useTenants'
import { useGuarantors } from '@/hooks/useGuarantors'
import { useContracts } from '@/hooks/useContracts'
import { useApartments } from '@/hooks/useApartments'
import { useBuildings } from '@/hooks/useBuildings'
import { TenantPortalStatus } from '@/components/tenant-portal'
import styles from './client-detail.module.css'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = Number(params.id)

  const { tenant, loading: tenantLoading } = useTenant(tenantId)
  const { guarantors, loading: guarantorsLoading } = useGuarantors()
  const { contracts, loading: contractsLoading } = useContracts()
  const { apartments, loading: apartmentsLoading } = useApartments()
  const { buildings, loading: buildingsLoading } = useBuildings()
  const { deleteTenant } = useTenants()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loading = tenantLoading || guarantorsLoading || contractsLoading || apartmentsLoading || buildingsLoading

  // Filter contracts for this tenant
  const tenantContracts = useMemo(() => {
    return contracts.filter(contract => contract.tenantId === tenantId)
  }, [contracts, tenantId])

  // Separate active and past contracts
  const { activeContracts, pastContracts } = useMemo(() => {
    const now = new Date()
    const active = tenantContracts.filter(contract => 
      new Date(contract.startDate) <= now && new Date(contract.endDate) >= now
    )
    const past = tenantContracts.filter(contract => 
      new Date(contract.endDate) < now
    )
    return { activeContracts: active, pastContracts: past }
  }, [tenantContracts])

  // Helper to get apartment and building info
  const getPropertyInfo = (apartmentId: number) => {
    const apartment = apartments.find(apt => apt.id === apartmentId)
    if (!apartment) return null

    const building = apartment.buildingId 
      ? buildings.find(b => b.id === apartment.buildingId)
      : null

    return {
      apartment,
      building,
      buildingName: building?.name || 'Propiedad Independiente',
      unitName: apartment.nomenclature || '-',
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteTenant(tenantId)
      router.push('/clients')
    } catch (error) {
      console.error('Error deleting tenant:', error)
      alert('Error al eliminar el cliente. Por favor intente nuevamente.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
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
      title={tenant.nameOrBusiness} 
      subtitle={`DNI/CUIT: ${tenant.dniOrCuit}`}
    >
      {/* Back Button and Actions */}
      <div className={styles.header}>
        <Link href="/clients">
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
            Volver a Clientes
          </Button>
        </Link>
        <div className={styles.headerActions}>
          <Button 
            variant="secondary" 
            leftIcon={<Edit size={16} />}
            onClick={() => router.push(`/clients/${tenant.id}/edit`)}
          >
            Editar
          </Button>
          <Button 
            variant="danger" 
            leftIcon={<Trash2 size={16} />}
            onClick={() => setShowDeleteModal(true)}
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* Client Info Cards */}
      <div className={styles.infoGrid}>
        <Card>
          <CardHeader title="Información del Cliente" />
          <CardContent>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Nombre o Razón Social</span>
                <span className={styles.infoValue}>{tenant.nameOrBusiness}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>DNI/CUIT</span>
                <span className={styles.infoValueMono}>{tenant.dniOrCuit}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Dirección</span>
                <span className={styles.infoValue}>
                  <MapPin size={14} className={styles.infoIcon} />
                  {tenant.address || '-'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Información de Contacto" />
          <CardContent>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Persona de Contacto</span>
                <span className={styles.infoValue}>
                  <User size={14} className={styles.infoIcon} />
                  {tenant.contactName || '-'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Teléfono</span>
                <span className={styles.infoValue}>
                  <Phone size={14} className={styles.infoIcon} />
                  {tenant.contactPhone || '-'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>
                  <Mail size={14} className={styles.infoIcon} />
                  {tenant.contactEmail || '-'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Dirección de Contacto</span>
                <span className={styles.infoValue}>
                  <MapPin size={14} className={styles.infoIcon} />
                  {tenant.contactAddress || '-'}
                </span>
              </div>
            </div>

            {/* Portal del Inquilino */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <TenantPortalStatus
                tenantId={tenant.id}
                tenantName={tenant.nameOrBusiness}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Contracts */}
      <Card>
        <CardHeader 
          title={`Contratos Activos (${activeContracts.length})`}
          subtitle="Contratos de alquiler vigentes"
        />
        <CardContent>
          {activeContracts.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title="Sin contratos activos"
              description="Este cliente no tiene contratos de alquiler vigentes."
            />
          ) : (
            <div className={styles.contractsList}>
              {activeContracts.map((contract) => {
                const propertyInfo = getPropertyInfo(contract.apartmentId)
                return (
                  <div key={contract.id} className={styles.contractCard}>
                    <div className={styles.contractHeader}>
                      <div className={styles.contractInfo}>
                        <Badge variant="success">Activo</Badge>
                        <span className={styles.contractId}>Contrato #{contract.id}</span>
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => router.push(`/contracts/${contract.id}`)}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                    <div className={styles.contractProperty}>
                      <div className={styles.propertyItem}>
                        <Building2 size={16} />
                        <span>{propertyInfo?.buildingName}</span>
                      </div>
                      <div className={styles.propertyItem}>
                        <Home size={16} />
                        <span>Unidad: {propertyInfo?.unitName}</span>
                      </div>
                    </div>
                    <div className={styles.contractDetails}>
                      <div className={styles.contractDetail}>
                        <span className={styles.detailLabel}>Inicio</span>
                        <span className={styles.detailValue}>
                          <Calendar size={14} />
                          {formatDate(contract.startDate)}
                        </span>
                      </div>
                      <div className={styles.contractDetail}>
                        <span className={styles.detailLabel}>Fin</span>
                        <span className={styles.detailValue}>
                          <Calendar size={14} />
                          {formatDate(contract.endDate)}
                        </span>
                      </div>
                      <div className={styles.contractDetail}>
                        <span className={styles.detailLabel}>Monto</span>
                        <span className={styles.detailValueHighlight}>
                          {formatCurrency(contract.initialAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Contracts */}
      <Card>
        <CardHeader 
          title={`Historial de Contratos (${pastContracts.length})`}
          subtitle="Contratos de alquiler finalizados"
        />
        <CardContent>
          {pastContracts.length === 0 ? (
            <EmptyState
              icon={<Clock />}
              title="Sin historial"
              description="Este cliente no tiene contratos finalizados."
            />
          ) : (
            <div className={styles.contractsList}>
              {pastContracts.map((contract) => {
                const propertyInfo = getPropertyInfo(contract.apartmentId)
                return (
                  <div key={contract.id} className={`${styles.contractCard} ${styles.contractCardPast}`}>
                    <div className={styles.contractHeader}>
                      <div className={styles.contractInfo}>
                        <Badge variant="default">Finalizado</Badge>
                        <span className={styles.contractId}>Contrato #{contract.id}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/contracts/${contract.id}`)}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                    <div className={styles.contractProperty}>
                      <div className={styles.propertyItem}>
                        <Building2 size={16} />
                        <span>{propertyInfo?.buildingName}</span>
                      </div>
                      <div className={styles.propertyItem}>
                        <Home size={16} />
                        <span>Unidad: {propertyInfo?.unitName}</span>
                      </div>
                    </div>
                    <div className={styles.contractDetails}>
                      <div className={styles.contractDetail}>
                        <span className={styles.detailLabel}>Inicio</span>
                        <span className={styles.detailValue}>
                          <Calendar size={14} />
                          {formatDate(contract.startDate)}
                        </span>
                      </div>
                      <div className={styles.contractDetail}>
                        <span className={styles.detailLabel}>Fin</span>
                        <span className={styles.detailValue}>
                          <Calendar size={14} />
                          {formatDate(contract.endDate)}
                        </span>
                      </div>
                      <div className={styles.contractDetail}>
                        <span className={styles.detailLabel}>Monto</span>
                        <span className={styles.detailValue}>
                          {formatCurrency(contract.initialAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guarantors */}
      <Card>
        <CardHeader 
          title={`Garantes (${guarantors.length})`}
          subtitle="Personas que garantizan los contratos"
        />
        <CardContent>
          {guarantors.length === 0 ? (
            <EmptyState
              icon={<Shield />}
              title="Sin garantes"
              description="Este cliente no tiene garantes registrados."
            />
          ) : (
            <div className={styles.guarantorsList}>
              {guarantors.map((guarantor) => (
                <div key={guarantor.id} className={styles.guarantorCard}>
                  <div className={styles.guarantorHeader}>
                    <span className={styles.guarantorName}>{guarantor.name}</span>
                    <Shield size={16} className={styles.guarantorIcon} />
                  </div>
                  <div className={styles.guarantorInfo}>
                    <span>DNI: {guarantor.dni}</span>
                    <span>
                      <MapPin size={14} />
                      {guarantor.address}
                    </span>
                    <span>
                      <Phone size={14} />
                      {guarantor.phone}
                    </span>
                    <span>
                      <Mail size={14} />
                      {guarantor.email}
                    </span>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    fullWidth
                    onClick={() => router.push(`/guarantors/${guarantor.id}`)}
                  >
                    Ver Detalle
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Cliente"
        size="sm"
      >
        <p className={styles.deleteText}>
          ¿Está seguro que desea eliminar al cliente{' '}
          <strong>{tenant.nameOrBusiness}</strong>?
        </p>
        <p className={styles.deleteWarning}>
          Esta acción no se puede deshacer. Se eliminarán también todos los garantes asociados.
        </p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Eliminar
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  )
}
