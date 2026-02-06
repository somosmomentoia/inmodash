'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Phone,
  Mail,
  Home,
  Calendar,
  User,
  FileText,
  MessageSquare,
  UserCheck,
  Edit,
  Trash2,
  Clock,
  Eye,
  FileCheck,
  UserX,
  Plus,
  ExternalLink,
} from 'lucide-react'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Badge,
  Modal,
  ModalFooter,
  Input,
  Textarea,
} from '@/components/ui'
import { DashboardLayout } from '@/components/layout'
import { prospectsService } from '@/services/prospects.service'
import {
  Prospect,
  ProspectStatus,
  ProspectActivityType,
  PROSPECT_STATUS_LABELS,
  PROSPECT_SOURCE_LABELS,
  PROSPECT_STATUS_COLORS,
  PROSPECT_ACTIVITY_LABELS,
} from '@/types'
import styles from '../prospects.module.css'

const STATUS_FLOW: ProspectStatus[] = [
  'new',
  'contacted',
  'visited',
  'under_review',
  'approved',
]

export default function ProspectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const prospectId = parseInt(params.id as string)

  const [prospect, setProspect] = useState<Prospect | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Modals
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    loadProspect()
  }, [prospectId])

  const loadProspect = async () => {
    try {
      setLoading(true)
      const data = await prospectsService.getById(prospectId)
      setProspect(data)
    } catch (error) {
      console.error('Error loading prospect:', error)
      router.push('/prospects')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: ProspectStatus) => {
    if (!prospect || updating) return
    
    try {
      setUpdating(true)
      await prospectsService.changeStatus(prospect.id, { status: newStatus })
      await loadProspect()
    } catch (error) {
      console.error('Error changing status:', error)
      alert('Error al cambiar el estado')
    } finally {
      setUpdating(false)
    }
  }

  const handleAddNote = async () => {
    if (!prospect || !noteText.trim()) return

    try {
      setUpdating(true)
      await prospectsService.addNote(prospect.id, noteText.trim())
      setNoteText('')
      setShowNoteModal(false)
      await loadProspect()
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Error al agregar nota')
    } finally {
      setUpdating(false)
    }
  }

  const handleConvert = async () => {
    if (!prospect) return

    try {
      setUpdating(true)
      const result = await prospectsService.convert(prospect.id, {
        createNewTenant: true,
        tenantData: {
          nameOrBusiness: prospect.fullName,
          dniOrCuit: prospect.dniOrCuit || '',
          address: '',
          contactName: prospect.fullName,
          contactPhone: prospect.phone,
          contactEmail: prospect.email || '',
          contactAddress: '',
        },
        redirectToContractWizard: true,
      })

      if (result.redirectUrl) {
        router.push(result.redirectUrl)
      } else {
        router.push('/prospects')
      }
    } catch (error) {
      console.error('Error converting prospect:', error)
      alert('Error al convertir el prospecto')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!prospect) return

    try {
      setUpdating(true)
      await prospectsService.delete(prospect.id)
      router.push('/prospects')
    } catch (error) {
      console.error('Error deleting prospect:', error)
      alert('Error al eliminar el prospecto')
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getActivityIcon = (type: ProspectActivityType) => {
    switch (type) {
      case 'created':
        return <Plus size={14} />
      case 'status_changed':
        return <Clock size={14} />
      case 'note_added':
        return <MessageSquare size={14} />
      case 'document_uploaded':
        return <FileText size={14} />
      case 'visit_scheduled':
      case 'visit_completed':
        return <Eye size={14} />
      case 'contact_attempt':
        return <Phone size={14} />
      case 'converted':
        return <UserCheck size={14} />
      case 'info_updated':
        return <Edit size={14} />
      default:
        return <Clock size={14} />
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Prospecto" subtitle="Cargando...">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Cargando prospecto...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!prospect) {
    return null
  }

  const isConverted = prospect.status === 'converted'
  const isRejected = prospect.status === 'rejected'
  const canConvert = prospect.status === 'approved'

  return (
    <DashboardLayout title={prospect.fullName} subtitle={PROSPECT_STATUS_LABELS[prospect.status]}>
      {/* Back Button */}
      <button className={styles.backButton} onClick={() => router.push('/prospects')}>
        <ArrowLeft size={16} />
        Volver a prospectos
      </button>

      {/* Header */}
      <div className={styles.detailHeader}>
        <div className={styles.detailInfo}>
          <h1 className={styles.detailName}>{prospect.fullName}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Badge variant={PROSPECT_STATUS_COLORS[prospect.status] as any}>
              {PROSPECT_STATUS_LABELS[prospect.status]}
            </Badge>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {PROSPECT_SOURCE_LABELS[prospect.source]}
            </span>
          </div>
        </div>
        <div className={styles.detailActions}>
          {!isConverted && !isRejected && (
            <>
              <Button
                variant="secondary"
                onClick={() => router.push(`/prospects/${prospect.id}/edit`)}
                leftIcon={<Edit size={16} />}
              >
                Editar
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowNoteModal(true)}
                leftIcon={<MessageSquare size={16} />}
              >
                Agregar Nota
              </Button>
            </>
          )}
          {canConvert && (
            <Button
              onClick={() => setShowConvertModal(true)}
              leftIcon={<UserCheck size={16} />}
            >
              Convertir a Contrato
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.detailGrid}>
        {/* Left Column - Info */}
        <div>
          {/* Contact Info */}
          <Card>
            <CardHeader title="Información de Contacto" />
            <CardContent>
              <div className={styles.infoSection}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>
                    <Phone size={14} /> Teléfono
                  </span>
                  <span className={styles.infoValue}>{prospect.phone}</span>
                </div>
                {prospect.email && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>
                      <Mail size={14} /> Email
                    </span>
                    <span className={styles.infoValue}>{prospect.email}</span>
                  </div>
                )}
                {prospect.dniOrCuit && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>
                      <User size={14} /> DNI/CUIT
                    </span>
                    <span className={styles.infoValue}>{prospect.dniOrCuit}</span>
                  </div>
                )}
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>
                    <Calendar size={14} /> Registrado
                  </span>
                  <span className={styles.infoValue}>{formatDate(prospect.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Interest */}
          {prospect.apartment && (
            <Card style={{ marginTop: 'var(--spacing-lg)' }}>
              <CardHeader title="Propiedad de Interés" />
              <CardContent>
                <div className={styles.infoSection}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>
                      <Home size={14} /> Propiedad
                    </span>
                    <span className={styles.infoValue}>
                      {prospect.apartment.nomenclature}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/apartments/${prospect.apartment?.id}`)}
                        style={{ marginLeft: '8px' }}
                      >
                        <ExternalLink size={14} />
                      </Button>
                    </span>
                  </div>
                  {prospect.apartment.fullAddress && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Dirección</span>
                      <span className={styles.infoValue}>{prospect.apartment.fullAddress}</span>
                    </div>
                  )}
                  {prospect.apartment.rentalPrice && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Precio</span>
                      <span className={styles.infoValue}>
                        ${prospect.apartment.rentalPrice.toLocaleString('es-AR')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {prospect.notes && (
            <Card style={{ marginTop: 'var(--spacing-lg)' }}>
              <CardHeader title="Notas" />
              <CardContent>
                <div className={styles.notesContent}>{prospect.notes}</div>
              </CardContent>
            </Card>
          )}

          {/* Status Change */}
          {!isConverted && !isRejected && (
            <Card style={{ marginTop: 'var(--spacing-lg)' }}>
              <CardHeader title="Cambiar Estado" />
              <CardContent>
                <div className={styles.statusSelector}>
                  {STATUS_FLOW.map((status) => (
                    <button
                      key={status}
                      className={`${styles.statusButton} ${prospect.status === status ? styles.active : ''}`}
                      onClick={() => handleStatusChange(status)}
                      disabled={updating || prospect.status === status}
                    >
                      {PROSPECT_STATUS_LABELS[status]}
                    </button>
                  ))}
                  <button
                    className={styles.statusButton}
                    onClick={() => handleStatusChange('rejected')}
                    disabled={updating}
                    style={{ color: 'var(--status-error)' }}
                  >
                    Rechazar
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Converted Info */}
          {isConverted && prospect.convertedToTenant && (
            <Card style={{ marginTop: 'var(--spacing-lg)' }}>
              <CardHeader title="Conversión" />
              <CardContent>
                <div className={styles.infoSection}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Inquilino</span>
                    <span className={styles.infoValue}>
                      {prospect.convertedToTenant.nameOrBusiness}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/clients/${prospect.convertedToTenantId}`)}
                        style={{ marginLeft: '8px' }}
                      >
                        <ExternalLink size={14} />
                      </Button>
                    </span>
                  </div>
                  {prospect.convertedToContract && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Contrato</span>
                      <span className={styles.infoValue}>
                        #{prospect.convertedToContractId}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/contracts/${prospect.convertedToContractId}`)}
                          style={{ marginLeft: '8px' }}
                        >
                          <ExternalLink size={14} />
                        </Button>
                      </span>
                    </div>
                  )}
                  {prospect.convertedAt && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Fecha</span>
                      <span className={styles.infoValue}>{formatDate(prospect.convertedAt)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delete Button */}
          <div style={{ marginTop: 'var(--spacing-xl)' }}>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(true)}
              leftIcon={<Trash2 size={16} />}
              style={{ color: 'var(--status-error)' }}
            >
              Eliminar Prospecto
            </Button>
          </div>
        </div>

        {/* Right Column - Timeline */}
        <div>
          <Card>
            <CardHeader title="Historial de Actividad" />
            <CardContent>
              {prospect.activities && prospect.activities.length > 0 ? (
                <div className={styles.timeline}>
                  {prospect.activities.map((activity) => (
                    <div key={activity.id} className={styles.timelineItem}>
                      <div className={styles.timelineIcon}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineDescription}>
                          {activity.description}
                        </div>
                        <div className={styles.timelineDate}>
                          {formatDate(activity.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                  No hay actividad registrada
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Agregar Nota"
        size="sm"
      >
        <Textarea
          placeholder="Escribe una nota..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={4}
        />
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowNoteModal(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAddNote} loading={updating} disabled={!noteText.trim()}>
            Agregar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Convert Modal */}
      <Modal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        title="Convertir a Contrato"
        subtitle="Se creará un inquilino y serás redirigido al wizard de contratos"
        size="sm"
      >
        <div className={styles.convertSection}>
          <p style={{ color: 'var(--text-secondary)' }}>
            Al convertir este prospecto:
          </p>
          <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px' }}>
            <li>Se creará un nuevo inquilino con los datos del prospecto</li>
            <li>Serás redirigido al wizard de creación de contrato</li>
            <li>El prospecto quedará marcado como "Convertido"</li>
          </ul>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowConvertModal(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConvert} loading={updating} leftIcon={<UserCheck size={16} />}>
            Convertir
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Prospecto"
        size="sm"
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Estás seguro de que deseas eliminar este prospecto? Esta acción no se puede deshacer.
        </p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={updating}
            leftIcon={<Trash2 size={16} />}
          >
            Eliminar
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  )
}
