'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Search,
  User,
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
import { useGuarantors } from '@/hooks/useGuarantors'
import { Guarantor } from '@/types'
import styles from './guarantors.module.css'

export default function GuarantorsContent() {
  const router = useRouter()
  const { guarantors, loading, createGuarantor, deleteGuarantor } =
    useGuarantors()
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedGuarantor, setSelectedGuarantor] = useState<Guarantor | null>(null)
  const [formData, setFormData] = useState({
    tenantId: 0,
    name: '',
    dni: '',
    address: '',
    email: '',
    phone: '',
  })

  const filteredGuarantors = guarantors.filter(
    (guarantor) =>
      guarantor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guarantor.dni.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guarantor.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const resetForm = () => {
    setFormData({
      tenantId: 0,
      name: '',
      dni: '',
      address: '',
      email: '',
      phone: '',
    })
  }

  const handleCreate = async () => {
    try {
      await createGuarantor(formData)
      setShowCreateModal(false)
      resetForm()
    } catch (error) {
      console.error('Error creating guarantor:', error)
    }
  }

  const handleEdit = async () => {
    if (!selectedGuarantor) return
    setShowEditModal(false)
    setSelectedGuarantor(null)
    resetForm()
  }

  const handleDelete = async () => {
    if (!selectedGuarantor) return
    try {
      await deleteGuarantor(selectedGuarantor.id)
      setShowDeleteModal(false)
      setSelectedGuarantor(null)
    } catch (error) {
      console.error('Error deleting guarantor:', error)
    }
  }

  const openEditModal = (guarantor: Guarantor) => {
    setSelectedGuarantor(guarantor)
    setFormData({
      tenantId: guarantor.tenantId,
      name: guarantor.name,
      dni: guarantor.dni,
      address: guarantor.address,
      email: guarantor.email,
      phone: guarantor.phone,
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (guarantor: Guarantor) => {
    setSelectedGuarantor(guarantor)
    setShowDeleteModal(true)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando garantes...</p>
      </div>
    )
  }

  return (
    <>
      {/* Stats */}
      <div className={styles.statsGrid}>
        <CounterCard
          title="Total Garantes"
          value={guarantors.length}
          icon={<Shield size={24} />}
          color="blue"
          size="sm"
        />
        <CounterCard
          title="Activos"
          value={guarantors.length}
          icon={<User size={24} />}
          color="green"
          size="sm"
        />
      </div>

      {/* Search and Actions */}
      <div className={styles.toolbar}>
        <Input
          placeholder="Buscar garante..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search size={18} />}
          className={styles.searchInput}
        />
        <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
          Nuevo Garante
        </Button>
      </div>

      {/* Guarantors List */}
      {filteredGuarantors.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Shield />}
              title="No hay garantes"
              description="Comienza creando tu primer garante."
              action={
                <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
                  Crear Garante
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
                  header: 'Garante',
                  render: (guarantor) => (
                    <div className={styles.guarantorCell}>
                      <Avatar name={guarantor.name as string} size="sm" />
                      <div>
                        <span className={styles.guarantorName}>
                          {guarantor.name as string}
                        </span>
                        <span className={styles.guarantorDni}>
                          {guarantor.dni as string}
                        </span>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'phone',
                  header: 'Teléfono',
                  render: (guarantor) => (
                    <span className={styles.cellText}>
                      {(guarantor.phone as string) || '-'}
                    </span>
                  ),
                },
                {
                  key: 'email',
                  header: 'Email',
                  render: (guarantor) => (
                    <span className={styles.cellText}>
                      {(guarantor.email as string) || '-'}
                    </span>
                  ),
                },
                {
                  key: 'address',
                  header: 'Dirección',
                  render: (guarantor) => (
                    <span className={styles.cellText}>
                      {(guarantor.address as string) || '-'}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  render: (guarantor) => (
                    <div className={styles.actions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(guarantor as unknown as Guarantor)
                        }}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDeleteModal(guarantor as unknown as Guarantor)
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={filteredGuarantors as unknown as Record<string, unknown>[]}
              onRowClick={(guarantor) => router.push(`/guarantors/${(guarantor as unknown as Guarantor).id}`)}
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
        title="Nuevo Garante"
        subtitle="Ingrese los datos del garante"
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
            label="DNI *"
            value={formData.dni}
            onChange={(e) => setFormData((prev) => ({ ...prev, dni: e.target.value }))}
            placeholder="12345678"
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
        <Input
          label="Dirección"
          value={formData.address}
          onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
          placeholder="Dirección completa"
          fullWidth
        />
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
          <Button onClick={handleCreate} disabled={!formData.name || !formData.dni}>
            Crear Garante
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedGuarantor(null)
          resetForm()
        }}
        title="Editar Garante"
        subtitle={selectedGuarantor?.name}
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
            label="DNI *"
            value={formData.dni}
            onChange={(e) => setFormData((prev) => ({ ...prev, dni: e.target.value }))}
            placeholder="12345678"
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
        <Input
          label="Dirección"
          value={formData.address}
          onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
          placeholder="Dirección completa"
          fullWidth
        />
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditModal(false)
              setSelectedGuarantor(null)
              resetForm()
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleEdit} disabled={!formData.name || !formData.dni}>
            Guardar Cambios
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedGuarantor(null)
        }}
        title="Eliminar Garante"
        size="sm"
      >
        <p className={styles.deleteText}>
          ¿Está seguro que desea eliminar al garante{' '}
          <strong>{selectedGuarantor?.name}</strong>?
        </p>
        <p className={styles.deleteWarning}>Esta acción no se puede deshacer.</p>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeleteModal(false)
              setSelectedGuarantor(null)
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
