'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building2,
  Search,
  ChevronRight,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Input,
  Badge,
  Modal,
  ModalFooter,
  EmptyState,
  Avatar,
  StatCard,
} from '@/components/ui'
import { useOwners } from '@/hooks/useOwners'
import { Owner } from '@/types'
import styles from './properties.module.css'

export default function OwnersContent() {
  const router = useRouter()
  const { owners, loading, error: apiError, createOwner, updateOwner, deleteOwner } = useOwners()
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    dniOrCuit: '',
    phone: '',
    email: '',
    address: '',
    bankAccount: '',
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
      phone: '',
      email: '',
      address: '',
      bankAccount: '',
    })
  }

  const handleCreate = async () => {
    setFormError(null)
    setIsSubmitting(true)
    try {
      await createOwner({
        name: formData.name,
        dniOrCuit: formData.dniOrCuit,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        bankAccount: formData.bankAccount || undefined,
      })
      setShowCreateModal(false)
      resetForm()
    } catch (error: any) {
      console.error('Error creating owner:', error)
      setFormError(error?.message || 'Error al crear propietario. Verifique que esté autenticado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedOwner) return
    try {
      await updateOwner(selectedOwner.id, {
        name: formData.name,
        dniOrCuit: formData.dniOrCuit,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        bankAccount: formData.bankAccount || undefined,
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
      phone: owner.phone,
      email: owner.email,
      address: owner.address,
      bankAccount: owner.bankAccount || '',
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (owner: Owner) => {
    setSelectedOwner(owner)
    setShowDeleteModal(true)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando propietarios...</p>
      </div>
    )
  }

  const ownersWithProperties = owners.filter(
    (o) => o.apartments && o.apartments.length > 0
  ).length

  const goToOwnerDetail = (ownerId: number) => {
    router.push(`/owners/${ownerId}`)
  }

  return (
    <div className={styles.content}>
      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total Propietarios"
          value={owners.length}
          icon={<User size={18} />}
          variant="primary"
        />
        <StatCard
          title="Con Propiedades"
          value={ownersWithProperties}
          icon={<Building2 size={18} />}
          variant="success"
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

      {/* Owners List */}
      {filteredOwners.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<User />}
              title="No hay propietarios"
              description="Comienza creando tu primer propietario para gestionar sus propiedades."
              action={
                <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
                  Crear Propietario
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className={styles.ownersList}>
          {filteredOwners.map((owner) => (
            <div
              key={owner.id}
              className={styles.ownerCard}
              onClick={() => goToOwnerDetail(owner.id)}
            >
              <div className={styles.ownerCardMain}>
                <Avatar name={owner.name} size="md" />
                <div className={styles.ownerCardInfo}>
                  <span className={styles.ownerCardName}>{owner.name}</span>
                  <span className={styles.ownerCardDni}>{owner.dniOrCuit}</span>
                </div>
              </div>
              <div className={styles.ownerCardContact}>
                <span className={styles.ownerCardContactItem}>
                  <Phone size={14} />
                  {owner.phone || '-'}
                </span>
                <span className={styles.ownerCardContactItem}>
                  <Mail size={14} />
                  {owner.email || '-'}
                </span>
              </div>
              <div className={styles.ownerCardProperties}>
                <Badge variant="success">
                  {owner.apartments?.length || 0} propiedades
                </Badge>
              </div>
              <div className={styles.ownerCardActions}>
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
                <ChevronRight size={20} className={styles.chevron} />
              </div>
            </div>
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
        size="md"
      >
        <div className={styles.formGrid}>
          <Input
            label="Nombre *"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Nombre completo"
            fullWidth
          />
          <Input
            label="DNI/CUIT *"
            value={formData.dniOrCuit}
            onChange={(e) => setFormData((prev) => ({ ...prev, dniOrCuit: e.target.value }))}
            placeholder="20-12345678-9"
            fullWidth
          />
          <Input
            label="Teléfono"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="+54 11 1234-5678"
            leftIcon={<Phone size={18} />}
            fullWidth
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="email@ejemplo.com"
            leftIcon={<Mail size={18} />}
            fullWidth
          />
        </div>
        <div className={styles.formFullWidth}>
          <Input
            label="Dirección"
            value={formData.address}
            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Dirección completa"
            fullWidth
          />
          <Input
            label="Cuenta Bancaria"
            value={formData.bankAccount}
            onChange={(e) => setFormData((prev) => ({ ...prev, bankAccount: e.target.value }))}
            placeholder="CBU o Alias"
            fullWidth
          />
        </div>
        {formError && (
          <div className={styles.formError}>
            {formError}
          </div>
        )}
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowCreateModal(false)
              setFormError(null)
              resetForm()
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!formData.name || !formData.dniOrCuit || isSubmitting}
            loading={isSubmitting}
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
        size="md"
      >
        <div className={styles.formGrid}>
          <Input
            label="Nombre *"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Nombre completo"
            fullWidth
          />
          <Input
            label="DNI/CUIT *"
            value={formData.dniOrCuit}
            onChange={(e) => setFormData((prev) => ({ ...prev, dniOrCuit: e.target.value }))}
            placeholder="20-12345678-9"
            fullWidth
          />
          <Input
            label="Teléfono"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="+54 11 1234-5678"
            leftIcon={<Phone size={18} />}
            fullWidth
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="email@ejemplo.com"
            leftIcon={<Mail size={18} />}
            fullWidth
          />
        </div>
        <div className={styles.formFullWidth}>
          <Input
            label="Dirección"
            value={formData.address}
            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Dirección completa"
            fullWidth
          />
          <Input
            label="Cuenta Bancaria"
            value={formData.bankAccount}
            onChange={(e) => setFormData((prev) => ({ ...prev, bankAccount: e.target.value }))}
            placeholder="CBU o Alias"
            fullWidth
          />
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
          <Button onClick={handleEdit} disabled={!formData.name || !formData.dniOrCuit}>
            Guardar Cambios
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
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
    </div>
  )
}
