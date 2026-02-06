'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Search,
  Building2,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Input,
  CounterCard,
  Table,
  Badge,
  Modal,
  ModalFooter,
  EmptyState,
  Avatar,
} from '@/components/ui'
import { useTenants } from '@/hooks/useTenants'
import { Tenant } from '@/types'
import styles from './clients.module.css'

export default function ClientsContent() {
  const router = useRouter()
  const { tenants, loading, createTenant, updateTenant, deleteTenant } = useTenants()
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [formData, setFormData] = useState({
    nameOrBusiness: '',
    dniOrCuit: '',
    address: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    contactAddress: '',
  })

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.nameOrBusiness.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.dniOrCuit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const resetForm = () => {
    setFormData({
      nameOrBusiness: '',
      dniOrCuit: '',
      address: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      contactAddress: '',
    })
  }

  const handleCreate = async () => {
    try {
      await createTenant(formData)
      setShowCreateModal(false)
      resetForm()
    } catch (error) {
      console.error('Error creating tenant:', error)
    }
  }

  const handleEdit = async () => {
    if (!selectedTenant) return
    try {
      await updateTenant(selectedTenant.id, formData)
      setShowEditModal(false)
      setSelectedTenant(null)
      resetForm()
    } catch (error) {
      console.error('Error updating tenant:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedTenant) return
    try {
      await deleteTenant(selectedTenant.id)
      setShowDeleteModal(false)
      setSelectedTenant(null)
    } catch (error) {
      console.error('Error deleting tenant:', error)
    }
  }

  const openEditModal = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setFormData({
      nameOrBusiness: tenant.nameOrBusiness,
      dniOrCuit: tenant.dniOrCuit,
      address: tenant.address,
      contactName: tenant.contactName,
      contactPhone: tenant.contactPhone,
      contactEmail: tenant.contactEmail,
      contactAddress: tenant.contactAddress,
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setShowDeleteModal(true)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando inquilinos...</p>
      </div>
    )
  }

  return (
    <>
      {/* Stats */}
      <div className={styles.statsGrid}>
        <CounterCard
          title="Total Inquilinos"
          value={tenants.length}
          icon={<Users size={24} />}
          color="blue"
          size="sm"
        />
        <CounterCard
          title="Con Contrato"
          value={tenants.length}
          icon={<Building2 size={24} />}
          color="green"
          size="sm"
        />
      </div>

      {/* Search and Actions */}
      <div className={styles.toolbar}>
        <Input
          placeholder="Buscar inquilino..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search size={18} />}
          className={styles.searchInput}
        />
        <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
          Nuevo Inquilino
        </Button>
      </div>

      {/* Tenants List */}
      {filteredTenants.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Users />}
              title="No hay inquilinos"
              description="Comienza creando tu primer inquilino para gestionar contratos."
              action={
                <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
                  Crear Inquilino
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
                  key: 'nameOrBusiness',
                  header: 'Inquilino',
                  render: (tenant) => (
                    <div className={styles.tenantCell}>
                      <Avatar name={tenant.nameOrBusiness as string} size="sm" />
                      <div>
                        <span className={styles.tenantName}>
                          {tenant.nameOrBusiness as string}
                        </span>
                        <span className={styles.tenantDni}>
                          {tenant.dniOrCuit as string}
                        </span>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'contactPhone',
                  header: 'Teléfono',
                  render: (tenant) => (
                    <span className={styles.cellText}>
                      {(tenant.contactPhone as string) || '-'}
                    </span>
                  ),
                },
                {
                  key: 'contactEmail',
                  header: 'Email',
                  render: (tenant) => (
                    <span className={styles.cellText}>
                      {(tenant.contactEmail as string) || '-'}
                    </span>
                  ),
                },
                {
                  key: 'guarantors',
                  header: 'Garantes',
                  align: 'center',
                  render: (tenant) => (
                    <Badge>
                      {(tenant.guarantors as unknown[])?.length || 0}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  render: (tenant) => (
                    <div className={styles.actions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(tenant as unknown as Tenant)
                        }}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDeleteModal(tenant as unknown as Tenant)
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={filteredTenants as unknown as Record<string, unknown>[]}
              onRowClick={(tenant) => router.push(`/clients/${(tenant as unknown as Tenant).id}`)}
            />
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
        }}
        title="Nuevo Inquilino"
        subtitle="Ingrese los datos del inquilino"
        size="lg"
      >
        <div className={styles.formSection}>
          <h4 className={styles.formSectionTitle}>Datos del Inquilino</h4>
          <div className={styles.formGrid}>
            <Input
              label="Nombre / Razón Social *"
              value={formData.nameOrBusiness}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nameOrBusiness: e.target.value }))
              }
              placeholder="Nombre completo o razón social"
              fullWidth
            />
            <Input
              label="DNI/CUIT *"
              value={formData.dniOrCuit}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dniOrCuit: e.target.value }))
              }
              placeholder="20-12345678-9"
              fullWidth
            />
          </div>
          <Input
            label="Dirección"
            value={formData.address}
            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Dirección del inquilino"
            fullWidth
          />
        </div>

        <div className={styles.formSection}>
          <h4 className={styles.formSectionTitle}>Persona de Contacto</h4>
          <div className={styles.formGrid}>
            <Input
              label="Nombre de Contacto"
              value={formData.contactName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contactName: e.target.value }))
              }
              placeholder="Nombre del contacto"
              fullWidth
            />
            <Input
              label="Teléfono"
              value={formData.contactPhone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))
              }
              placeholder="+54 11 1234-5678"
              leftIcon={<Phone size={18} />}
              fullWidth
            />
          </div>
          <div className={styles.formGrid}>
            <Input
              label="Email"
              type="email"
              value={formData.contactEmail}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))
              }
              placeholder="email@ejemplo.com"
              leftIcon={<Mail size={18} />}
              fullWidth
            />
            <Input
              label="Dirección de Contacto"
              value={formData.contactAddress}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contactAddress: e.target.value }))
              }
              placeholder="Dirección del contacto"
              fullWidth
            />
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowCreateModal(false)
              resetForm()
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!formData.nameOrBusiness || !formData.dniOrCuit}
          >
            Crear Inquilino
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedTenant(null)
          resetForm()
        }}
        title="Editar Inquilino"
        subtitle={selectedTenant?.nameOrBusiness}
        size="lg"
      >
        <div className={styles.formSection}>
          <h4 className={styles.formSectionTitle}>Datos del Inquilino</h4>
          <div className={styles.formGrid}>
            <Input
              label="Nombre / Razón Social *"
              value={formData.nameOrBusiness}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nameOrBusiness: e.target.value }))
              }
              placeholder="Nombre completo o razón social"
              fullWidth
            />
            <Input
              label="DNI/CUIT *"
              value={formData.dniOrCuit}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dniOrCuit: e.target.value }))
              }
              placeholder="20-12345678-9"
              fullWidth
            />
          </div>
          <Input
            label="Dirección"
            value={formData.address}
            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Dirección del inquilino"
            fullWidth
          />
        </div>

        <div className={styles.formSection}>
          <h4 className={styles.formSectionTitle}>Persona de Contacto</h4>
          <div className={styles.formGrid}>
            <Input
              label="Nombre de Contacto"
              value={formData.contactName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contactName: e.target.value }))
              }
              placeholder="Nombre del contacto"
              fullWidth
            />
            <Input
              label="Teléfono"
              value={formData.contactPhone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))
              }
              placeholder="+54 11 1234-5678"
              leftIcon={<Phone size={18} />}
              fullWidth
            />
          </div>
          <div className={styles.formGrid}>
            <Input
              label="Email"
              type="email"
              value={formData.contactEmail}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))
              }
              placeholder="email@ejemplo.com"
              leftIcon={<Mail size={18} />}
              fullWidth
            />
            <Input
              label="Dirección de Contacto"
              value={formData.contactAddress}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contactAddress: e.target.value }))
              }
              placeholder="Dirección del contacto"
              fullWidth
            />
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditModal(false)
              setSelectedTenant(null)
              resetForm()
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEdit}
            disabled={!formData.nameOrBusiness || !formData.dniOrCuit}
          >
            Guardar Cambios
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedTenant(null)
        }}
        title="Eliminar Inquilino"
        size="sm"
      >
        <p className={styles.deleteText}>
          ¿Está seguro que desea eliminar al inquilino{' '}
          <strong>{selectedTenant?.nameOrBusiness}</strong>?
        </p>
        <p className={styles.deleteWarning}>Esta acción no se puede deshacer.</p>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeleteModal(false)
              setSelectedTenant(null)
            }}
          >
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Eliminar
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
