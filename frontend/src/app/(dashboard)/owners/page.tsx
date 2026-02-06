'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building2,
  Search,
  Percent,
  CreditCard,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  CounterCard,
  Badge,
  Modal,
  ModalFooter,
  EmptyState,
  Avatar,
} from '@/components/ui'
import { useOwners } from '@/hooks/useOwners'
import { Owner } from '@/types'
import styles from './owners.module.css'

export default function OwnersPage() {
  const router = useRouter()
  const { owners, loading, createOwner, updateOwner, deleteOwner } = useOwners()
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    dniOrCuit: '',
    address: '',
    phone: '',
    email: '',
    bankAccount: '',
    commissionPercentage: '10',
  })

  const filteredOwners = owners.filter(
    (owner) =>
      owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.dniOrCuit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const resetForm = () => {
    setFormData({
      name: '',
      dniOrCuit: '',
      address: '',
      phone: '',
      email: '',
      bankAccount: '',
      commissionPercentage: '10',
    })
  }

  const handleCreate = async () => {
    try {
      await createOwner({
        ...formData,
        commissionPercentage: parseFloat(formData.commissionPercentage) || 10,
      })
      setShowCreateModal(false)
      resetForm()
    } catch (error) {
      console.error('Error creating owner:', error)
    }
  }

  const handleEdit = async () => {
    if (!selectedOwner) return
    try {
      await updateOwner(selectedOwner.id, {
        ...formData,
        commissionPercentage: parseFloat(formData.commissionPercentage) || 10,
      })
      setShowEditModal(false)
      setSelectedOwner(null)
      resetForm()
    } catch (error) {
      console.error('Error updating owner:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedOwner) return
    try {
      await deleteOwner(selectedOwner.id)
      setShowDeleteModal(false)
      setSelectedOwner(null)
    } catch (error) {
      console.error('Error deleting owner:', error)
    }
  }

  const openEditModal = (owner: Owner) => {
    setSelectedOwner(owner)
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

  const openDeleteModal = (owner: Owner) => {
    setSelectedOwner(owner)
    setShowDeleteModal(true)
  }

  if (loading) {
    return (
      <DashboardLayout title="Propietarios" subtitle="Gestión de propietarios">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Cargando propietarios...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Propietarios" subtitle="Gestión de propietarios">
      {/* Stats */}
      <div className={styles.statsGrid}>
        <CounterCard
          title="Total Propietarios"
          value={owners.length}
          icon={<Users size={24} />}
          color="blue"
          size="sm"
        />
        <CounterCard
          title="Propiedades Asignadas"
          value={owners.reduce((acc, o) => acc + (o.apartments?.length || 0), 0)}
          icon={<Building2 size={24} />}
          color="green"
          size="sm"
        />
      </div>

      {/* Search and Actions */}
      <div className={styles.toolbar}>
        <Input
          placeholder="Buscar propietario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search size={18} />}
          className={styles.searchInput}
        />
        <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
          Nuevo Propietario
        </Button>
      </div>

      {/* Owners Grid */}
      {filteredOwners.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Users />}
              title="No hay propietarios"
              description="Comienza registrando propietarios para gestionar sus propiedades."
              action={
                <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
                  Crear Propietario
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className={styles.ownersGrid}>
          {filteredOwners.map((owner) => (
            <Card key={owner.id} hoverable className={styles.ownerCard} onClick={() => router.push(`/owners/${owner.id}`)}>
              <CardContent>
                <div className={styles.ownerHeader}>
                  <Avatar name={owner.name} size="md" />
                  <div className={styles.ownerInfo}>
                    <h3 className={styles.ownerName}>{owner.name}</h3>
                    <span className={styles.ownerDni}>{owner.dniOrCuit}</span>
                  </div>
                </div>

                <div className={styles.ownerDetails}>
                  <div className={styles.detailItem}>
                    <Mail size={14} />
                    <span>{owner.email}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <Phone size={14} />
                    <span>{owner.phone}</span>
                  </div>
                  {owner.apartments && owner.apartments.length > 0 && (
                    <div className={styles.detailItem}>
                      <Building2 size={14} />
                      <span>{owner.apartments.length} propiedad(es)</span>
                    </div>
                  )}
                  <div className={styles.detailItem}>
                    <Percent size={14} />
                    <span>Comisión: {owner.commissionPercentage || 10}%</span>
                  </div>
                </div>

                {owner.bankAccount && (
                  <div className={styles.bankInfo}>
                    <CreditCard size={14} />
                    <span>{owner.bankAccount}</span>
                  </div>
                )}

                <div className={styles.ownerActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditModal(owner)
                    }}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      openDeleteModal(owner)
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
        }}
        title="Nuevo Propietario"
        subtitle="Ingrese los datos del propietario"
        size="lg"
      >
        <div className={styles.formSection}>
          <h4 className={styles.formSectionTitle}>Datos Personales</h4>
          <div className={styles.formGrid}>
            <Input
              label="Nombre Completo *"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nombre del propietario"
              fullWidth
            />
            <Input
              label="DNI/CUIT *"
              value={formData.dniOrCuit}
              onChange={(e) => setFormData((prev) => ({ ...prev, dniOrCuit: e.target.value }))}
              placeholder="20-12345678-9"
              fullWidth
            />
          </div>
          <Input
            label="Dirección"
            value={formData.address}
            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Dirección del propietario"
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
              placeholder="+54 11 1234-5678"
              leftIcon={<Phone size={18} />}
              fullWidth
            />
            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="email@ejemplo.com"
              leftIcon={<Mail size={18} />}
              fullWidth
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <h4 className={styles.formSectionTitle}>Datos Bancarios y Comisión</h4>
          <div className={styles.formGrid}>
            <Input
              label="Cuenta Bancaria (CBU/Alias)"
              value={formData.bankAccount}
              onChange={(e) => setFormData((prev) => ({ ...prev, bankAccount: e.target.value }))}
              placeholder="CBU o Alias"
              leftIcon={<CreditCard size={18} />}
              fullWidth
            />
            <Input
              label="Comisión (%)"
              type="number"
              value={formData.commissionPercentage}
              onChange={(e) => setFormData((prev) => ({ ...prev, commissionPercentage: e.target.value }))}
              placeholder="10"
              leftIcon={<Percent size={18} />}
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
            disabled={!formData.name || !formData.dniOrCuit || !formData.phone || !formData.email}
          >
            Crear Propietario
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedOwner(null)
          resetForm()
        }}
        title="Editar Propietario"
        subtitle={selectedOwner?.name}
        size="lg"
      >
        <div className={styles.formSection}>
          <h4 className={styles.formSectionTitle}>Datos Personales</h4>
          <div className={styles.formGrid}>
            <Input
              label="Nombre Completo *"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nombre del propietario"
              fullWidth
            />
            <Input
              label="DNI/CUIT *"
              value={formData.dniOrCuit}
              onChange={(e) => setFormData((prev) => ({ ...prev, dniOrCuit: e.target.value }))}
              placeholder="20-12345678-9"
              fullWidth
            />
          </div>
          <Input
            label="Dirección"
            value={formData.address}
            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Dirección del propietario"
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
              placeholder="+54 11 1234-5678"
              leftIcon={<Phone size={18} />}
              fullWidth
            />
            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="email@ejemplo.com"
              leftIcon={<Mail size={18} />}
              fullWidth
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <h4 className={styles.formSectionTitle}>Datos Bancarios y Comisión</h4>
          <div className={styles.formGrid}>
            <Input
              label="Cuenta Bancaria (CBU/Alias)"
              value={formData.bankAccount}
              onChange={(e) => setFormData((prev) => ({ ...prev, bankAccount: e.target.value }))}
              placeholder="CBU o Alias"
              leftIcon={<CreditCard size={18} />}
              fullWidth
            />
            <Input
              label="Comisión (%)"
              type="number"
              value={formData.commissionPercentage}
              onChange={(e) => setFormData((prev) => ({ ...prev, commissionPercentage: e.target.value }))}
              placeholder="10"
              leftIcon={<Percent size={18} />}
              fullWidth
            />
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditModal(false)
              setSelectedOwner(null)
              resetForm()
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEdit}
            disabled={!formData.name || !formData.dniOrCuit || !formData.phone || !formData.email}
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
          setSelectedOwner(null)
        }}
        title="Eliminar Propietario"
        size="sm"
      >
        <p className={styles.deleteText}>
          ¿Está seguro que desea eliminar al propietario{' '}
          <strong>{selectedOwner?.name}</strong>?
        </p>
        <p className={styles.deleteWarning}>Esta acción no se puede deshacer.</p>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeleteModal(false)
              setSelectedOwner(null)
            }}
          >
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
