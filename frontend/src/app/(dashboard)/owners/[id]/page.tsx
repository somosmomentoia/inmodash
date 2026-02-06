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
  Building2,
  Home,
  CreditCard,
  Percent,
  DollarSign,
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
  Input,
} from '@/components/ui'
import { useOwner, useOwners } from '@/hooks/useOwners'
import { useApartments } from '@/hooks/useApartments'
import { useBuildings } from '@/hooks/useBuildings'
import styles from './owner-detail.module.css'

export default function OwnerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ownerId = Number(params.id)

  const { owner, loading: ownerLoading } = useOwner(ownerId)
  const { apartments, loading: apartmentsLoading } = useApartments()
  const { buildings, loading: buildingsLoading } = useBuildings()
  const { deleteOwner, updateOwner } = useOwners()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    dniOrCuit: '',
    address: '',
    phone: '',
    email: '',
    bankAccount: '',
    commissionPercentage: '10',
  })

  const loading = ownerLoading || apartmentsLoading || buildingsLoading

  // Filter apartments for this owner
  const ownerApartments = useMemo(() => {
    return apartments.filter(apt => apt.ownerId === ownerId)
  }, [apartments, ownerId])

  // Helper to get building info
  const getBuildingName = (buildingId?: number) => {
    if (!buildingId) return 'Propiedad Independiente'
    const building = buildings.find(b => b.id === buildingId)
    return building?.name || 'Edificio Desconocido'
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
      await deleteOwner(ownerId)
      router.push('/owners')
    } catch (error) {
      console.error('Error deleting owner:', error)
      alert('Error al eliminar el propietario. Por favor intente nuevamente.')
    } finally {
      setDeleting(false)
    }
  }

  const openEditModal = () => {
    if (owner) {
      setFormData({
        name: owner.name,
        dniOrCuit: owner.dniOrCuit,
        address: owner.address || '',
        phone: owner.phone,
        email: owner.email,
        bankAccount: owner.bankAccount || '',
        commissionPercentage: owner.commissionPercentage?.toString() || '10',
      })
      setShowEditModal(true)
    }
  }

  const handleEdit = async () => {
    try {
      await updateOwner(ownerId, {
        ...formData,
        commissionPercentage: parseFloat(formData.commissionPercentage) || 10,
      })
      setShowEditModal(false)
    } catch (error) {
      console.error('Error updating owner:', error)
      alert('Error al actualizar el propietario.')
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Cargando..." subtitle="Obteniendo información del propietario">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Cargando propietario...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!owner) {
    return (
      <DashboardLayout title="Propietario no encontrado" subtitle="">
        <Card>
          <CardContent>
            <EmptyState
              icon={<User />}
              title="Propietario no encontrado"
              description="El propietario que buscas no existe o fue eliminado."
              action={
                <Link href="/owners">
                  <Button leftIcon={<ArrowLeft size={16} />}>
                    Volver a Propietarios
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
      title={owner.name} 
      subtitle={`DNI/CUIT: ${owner.dniOrCuit}`}
    >
      {/* Back Button and Actions */}
      <div className={styles.header}>
        <Link href="/properties">
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
            Volver a Alquileres
          </Button>
        </Link>
        <div className={styles.headerActions}>
          <Button 
            variant="secondary" 
            leftIcon={<Edit size={16} />}
            onClick={openEditModal}
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

      {/* Owner Info Cards */}
      <div className={styles.infoGrid}>
        <Card>
          <CardHeader title="Información Personal" />
          <CardContent>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Nombre Completo</span>
                <span className={styles.infoValue}>{owner.name}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>DNI/CUIT</span>
                <span className={styles.infoValueMono}>{owner.dniOrCuit}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Dirección</span>
                <span className={styles.infoValue}>
                  <MapPin size={14} className={styles.infoIcon} />
                  {owner.address || '-'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Contacto" />
          <CardContent>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Teléfono</span>
                <span className={styles.infoValue}>
                  <Phone size={14} className={styles.infoIcon} />
                  {owner.phone}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>
                  <Mail size={14} className={styles.infoIcon} />
                  {owner.email}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Info */}
      <div className={styles.infoGrid}>
        <Card>
          <CardHeader title="Datos Bancarios" />
          <CardContent>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Cuenta Bancaria (CBU/Alias)</span>
                <span className={styles.infoValue}>
                  <CreditCard size={14} className={styles.infoIcon} />
                  {owner.bankAccount || 'No especificada'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Comisión de Inmobiliaria</span>
                <span className={styles.infoValue}>
                  <Percent size={14} className={styles.infoIcon} />
                  {owner.commissionPercentage || 10}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Balance" />
          <CardContent>
            <div className={styles.balanceCard}>
              <DollarSign size={24} className={styles.balanceIcon} />
              <div className={styles.balanceInfo}>
                <span className={styles.balanceLabel}>Saldo Actual</span>
                <span className={`${styles.balanceValue} ${owner.balance >= 0 ? styles.positive : styles.negative}`}>
                  {formatCurrency(owner.balance || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties */}
      <Card>
        <CardHeader 
          title={`Propiedades (${ownerApartments.length})`}
          subtitle="Propiedades asignadas a este propietario"
        />
        <CardContent>
          {ownerApartments.length === 0 ? (
            <EmptyState
              icon={<Building2 />}
              title="Sin propiedades"
              description="Este propietario no tiene propiedades asignadas."
            />
          ) : (
            <div className={styles.propertiesList}>
              {ownerApartments.map((apartment) => (
                <div key={apartment.id} className={styles.propertyCard}>
                  <div className={styles.propertyHeader}>
                    <div className={styles.propertyInfo}>
                      <Home size={16} className={styles.propertyIcon} />
                      <span className={styles.propertyName}>{apartment.nomenclature}</span>
                    </div>
                    <Badge variant={apartment.status === 'alquilado' ? 'success' : 'default'}>
                      {apartment.status === 'alquilado' ? 'Alquilado' : 'Disponible'}
                    </Badge>
                  </div>
                  <div className={styles.propertyDetails}>
                    <span>
                      <Building2 size={14} />
                      {getBuildingName(apartment.buildingId)}
                    </span>
                    <span>{apartment.area} m²</span>
                    <span>{apartment.rooms} amb.</span>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => router.push(`/apartments/${apartment.id}`)}
                  >
                    Ver Propiedad
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Propietario"
        subtitle={owner.name}
        size="lg"
      >
        <div className={styles.formSection}>
          <h4 className={styles.formSectionTitle}>Datos Personales</h4>
          <div className={styles.formGrid}>
            <Input
              label="Nombre Completo *"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <Input
              label="DNI/CUIT *"
              value={formData.dniOrCuit}
              onChange={(e) => setFormData((prev) => ({ ...prev, dniOrCuit: e.target.value }))}
              fullWidth
            />
          </div>
          <Input
            label="Dirección"
            value={formData.address}
            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            fullWidth
          />
        </div>

        <div className={styles.formSection}>
          <h4 className={styles.formSectionTitle}>Contacto</h4>
          <div className={styles.formGrid}>
            <Input
              label="Teléfono *"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              leftIcon={<Phone size={18} />}
              fullWidth
            />
            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              leftIcon={<Mail size={18} />}
              fullWidth
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <h4 className={styles.formSectionTitle}>Datos Bancarios</h4>
          <div className={styles.formGrid}>
            <Input
              label="Cuenta Bancaria (CBU/Alias)"
              value={formData.bankAccount}
              onChange={(e) => setFormData((prev) => ({ ...prev, bankAccount: e.target.value }))}
              leftIcon={<CreditCard size={18} />}
              fullWidth
            />
            <Input
              label="Comisión (%)"
              type="number"
              value={formData.commissionPercentage}
              onChange={(e) => setFormData((prev) => ({ ...prev, commissionPercentage: e.target.value }))}
              leftIcon={<Percent size={18} />}
              fullWidth
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancelar
          </Button>
          <Button onClick={handleEdit}>
            Guardar Cambios
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Propietario"
        size="sm"
      >
        <p className={styles.deleteText}>
          ¿Está seguro que desea eliminar al propietario{' '}
          <strong>{owner.name}</strong>?
        </p>
        <p className={styles.deleteWarning}>
          Esta acción no se puede deshacer. Las propiedades asociadas quedarán sin propietario.
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
