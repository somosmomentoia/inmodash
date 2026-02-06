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
  CreditCard,
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
import { useGuarantor, useGuarantors } from '@/hooks/useGuarantors'
import { useContracts } from '@/hooks/useContracts'
import { useTenants } from '@/hooks/useTenants'
import styles from './guarantor-detail.module.css'

export default function GuarantorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const guarantorId = Number(params.id)

  const { guarantor, loading: guarantorLoading } = useGuarantor(guarantorId)
  const { contracts, loading: contractsLoading } = useContracts()
  const { tenants, loading: tenantsLoading } = useTenants()
  const { deleteGuarantor } = useGuarantors()
  const { updateGuarantor } = useGuarantor(guarantorId)
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    dni: '',
    address: '',
    phone: '',
    email: '',
  })

  const loading = guarantorLoading || contractsLoading || tenantsLoading

  // Get tenant info
  const tenant = useMemo(() => {
    if (!guarantor) return null
    return tenants.find(t => t.id === (guarantor as any).tenantId)
  }, [guarantor, tenants])

  // Get contracts where this guarantor is associated
  const guarantorContracts = useMemo(() => {
    if (!guarantor) return []
    const tenantId = (guarantor as any).tenantId
    if (!tenantId) return []
    return contracts.filter(c => c.tenantId === tenantId)
  }, [contracts, guarantor])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteGuarantor(guarantorId)
      router.push('/guarantors')
    } catch (error) {
      console.error('Error deleting guarantor:', error)
      alert('Error al eliminar el garante. Por favor intente nuevamente.')
    } finally {
      setDeleting(false)
    }
  }

  const openEditModal = () => {
    if (guarantor) {
      setFormData({
        name: guarantor.name,
        dni: guarantor.dni,
        address: guarantor.address || '',
        phone: guarantor.phone,
        email: guarantor.email,
      })
      setShowEditModal(true)
    }
  }

  const handleEdit = async () => {
    try {
      await updateGuarantor(formData)
      setShowEditModal(false)
    } catch (error) {
      console.error('Error updating guarantor:', error)
      alert('Error al actualizar el garante.')
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Cargando..." subtitle="Obteniendo información del garante">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Cargando garante...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!guarantor) {
    return (
      <DashboardLayout title="Garante no encontrado" subtitle="">
        <Card>
          <CardContent>
            <EmptyState
              icon={<Shield />}
              title="Garante no encontrado"
              description="El garante que buscas no existe o fue eliminado."
              action={
                <Link href="/guarantors">
                  <Button leftIcon={<ArrowLeft size={16} />}>
                    Volver a Garantes
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
      title={guarantor.name} 
      subtitle={`DNI: ${guarantor.dni}`}
    >
      {/* Back Button and Actions */}
      <div className={styles.header}>
        <Link href="/guarantors">
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
            Volver a Garantes
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

      {/* Guarantor Info Cards */}
      <div className={styles.infoGrid}>
        <Card>
          <CardHeader title="Información Personal" />
          <CardContent>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Nombre Completo</span>
                <span className={styles.infoValue}>{guarantor.name}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>DNI/CUIT</span>
                <span className={styles.infoValueMono}>{guarantor.dni}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Dirección</span>
                <span className={styles.infoValue}>
                  <MapPin size={14} className={styles.infoIcon} />
                  {guarantor.address || '-'}
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
                  {guarantor.phone}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>
                  <Mail size={14} className={styles.infoIcon} />
                  {guarantor.email}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Associated Tenant */}
      {tenant && (
        <Card>
          <CardHeader 
            title="Inquilino Asociado"
            subtitle="Este garante está vinculado al siguiente inquilino"
          />
          <CardContent>
            <div 
              className={styles.tenantCard}
              onClick={() => router.push(`/clients/${tenant.id}`)}
            >
              <div className={styles.tenantInfo}>
                <User size={20} className={styles.tenantIcon} />
                <div>
                  <span className={styles.tenantName}>{tenant.nameOrBusiness}</span>
                  <span className={styles.tenantDni}>{tenant.dniOrCuit}</span>
                </div>
              </div>
              <Button variant="secondary" size="sm">
                Ver Cliente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Associated Contracts */}
      <Card>
        <CardHeader 
          title={`Contratos Asociados (${guarantorContracts.length})`}
          subtitle="Contratos donde este garante está vinculado"
        />
        <CardContent>
          {guarantorContracts.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title="Sin contratos"
              description="Este garante no está asociado a ningún contrato."
            />
          ) : (
            <div className={styles.contractsList}>
              {guarantorContracts.map((contract) => {
                const isActive = new Date(contract.endDate) >= new Date()
                return (
                  <div key={contract.id} className={styles.contractCard}>
                    <div className={styles.contractHeader}>
                      <div className={styles.contractInfo}>
                        <Badge variant={isActive ? 'success' : 'default'}>
                          {isActive ? 'Activo' : 'Finalizado'}
                        </Badge>
                        <span className={styles.contractId}>Contrato #{contract.id}</span>
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => router.push(`/contracts/${contract.id}`)}
                      >
                        Ver Contrato
                      </Button>
                    </div>
                    <div className={styles.contractDetails}>
                      <div className={styles.contractDetail}>
                        <span className={styles.detailLabel}>Inicio</span>
                        <span className={styles.detailValue}>
                          {new Date(contract.startDate).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                      <div className={styles.contractDetail}>
                        <span className={styles.detailLabel}>Fin</span>
                        <span className={styles.detailValue}>
                          {new Date(contract.endDate).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                      <div className={styles.contractDetail}>
                        <span className={styles.detailLabel}>Monto</span>
                        <span className={styles.detailValueHighlight}>
                          {new Intl.NumberFormat('es-AR', {
                            style: 'currency',
                            currency: 'ARS',
                            minimumFractionDigits: 0,
                          }).format(contract.initialAmount)}
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

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Garante"
        subtitle={guarantor.name}
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
              label="DNI *"
              value={formData.dni}
              onChange={(e) => setFormData((prev) => ({ ...prev, dni: e.target.value }))}
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
        title="Eliminar Garante"
        size="sm"
      >
        <p className={styles.deleteText}>
          ¿Está seguro que desea eliminar al garante{' '}
          <strong>{guarantor.name}</strong>?
        </p>
        <p className={styles.deleteWarning}>
          Esta acción no se puede deshacer.
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
