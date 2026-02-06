'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  User,
  Calendar,
  TrendingUp,
  Shield,
  Receipt,
  FolderOpen,
  Clock,
  ChevronRight,
  Upload,
  Download,
  Eye,
  File,
  FileImage,
  X,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Button, Modal, ModalFooter, Input, Select, Badge } from '@/components/ui'
import { useContracts, useContract } from '@/hooks/useContracts'
import { useApartments } from '@/hooks/useApartments'
import { useTenants } from '@/hooks/useTenants'
import { useBuildings } from '@/hooks/useBuildings'
import { useContractDocuments, useDocuments } from '@/hooks/useDocuments'
import { useObligations } from '@/hooks/useObligations'
import { Document, Obligation } from '@/types'
import { PDFViewer } from '@/components/ui/PDFViewer'
import styles from './contract-detail.module.css'

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = Number(params.id)

  const { contract, loading: contractLoading } = useContract(contractId)
  const { deleteContract } = useContracts()
  const { apartments } = useApartments()
  const { tenants } = useTenants()
  const { buildings } = useBuildings()
  const { documents: contractDocuments, loading: docsLoading, refresh: refreshDocs } = useContractDocuments(contractId)
  const { uploadDocument, deleteDocument } = useDocuments()
  const { obligations: contractObligations, loading: obligationsLoading } = useObligations(contractId)
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState('summary')
  
  // Document management state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDeleteDocModal, setShowDeleteDocModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [previewZoom, setPreviewZoom] = useState(100)
  const [previewRotation, setPreviewRotation] = useState(0)
  const [uploadType, setUploadType] = useState<'contract' | 'guarantor'>('contract')
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    type: 'contrato',
    description: '',
    guarantorId: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const apartment = contract ? apartments.find((a) => a.id === contract.apartmentId) : null
  const tenant = contract ? tenants.find((t) => t.id === contract.tenantId) : null
  const building = apartment?.buildingId ? buildings.find((b) => b.id === Number(apartment.buildingId)) : null

  const handleDelete = async () => {
    try {
      await deleteContract(contractId)
      router.push('/contracts')
    } catch (error) {
      alert('Error al eliminar el contrato. Por favor intente nuevamente.')
    }
  }

  const getContractStatus = () => {
    if (!contract) return { label: 'Desconocido', color: 'bg-slate-800/50 text-white' }
    
    const now = new Date()
    const endDate = new Date(contract.endDate)
    const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilEnd < 0) {
      return { label: 'Vencido', color: 'bg-red-500/20 text-red-300' }
    } else if (daysUntilEnd <= 30) {
      return { label: 'Por Vencer', color: 'bg-yellow-500/20 text-yellow-300' }
    } else {
      return { label: 'Activo', color: 'bg-green-500/20 text-green-300' }
    }
  }

  const calculateDuration = () => {
    if (!contract) return 0
    const start = new Date(contract.startDate)
    const end = new Date(contract.endDate)
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    return months
  }

  // Document helper functions
  const getFileIcon = (mimeType: string, size: number = 24) => {
    if (mimeType?.startsWith('image/')) return <FileImage size={size} className={styles.fileIconImage} />
    if (mimeType?.includes('pdf')) return <FileText size={size} className={styles.fileIconPdf} />
    return <File size={size} className={styles.fileIconDefault} />
  }

  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      dni: 'DNI',
      recibo_sueldo: 'Recibo de Sueldo',
      contrato: 'Contrato',
      garantia: 'Garantía',
      otro: 'Otro',
    }
    return labels[type] || type
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDocDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Separate documents by type (general contract docs vs guarantor docs)
  const generalDocs = contractDocuments.filter(d => d.type !== 'garantia')
  const guarantorDocs = contractDocuments.filter(d => d.type === 'garantia')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      await uploadDocument({
        file,
        type: uploadForm.type,
        description: uploadForm.description || undefined,
        contractId: contractId,
      })
      
      refreshDocs()
      setShowUploadModal(false)
      setUploadForm({ type: 'contrato', description: '', guarantorId: '' })
    } catch (error: any) {
      console.error('Error uploading document:', error)
      const errorMessage = error?.message || error?.data?.error || 'Error al subir el documento'
      alert(errorMessage)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteDoc = async () => {
    if (!selectedDocument) return
    try {
      await deleteDocument(selectedDocument.id)
      refreshDocs()
      setShowDeleteDocModal(false)
      setSelectedDocument(null)
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  const openPreview = (doc: Document) => {
    setPreviewDocument(doc)
    setPreviewZoom(100)
    setPreviewRotation(0)
  }

  const closePreview = () => {
    setPreviewDocument(null)
  }

  if (contractLoading) {
    return (
      <DashboardLayout title="Cargando..." subtitle="">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Cargando contrato...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!contract) {
    return (
      <DashboardLayout title="Contrato no encontrado" subtitle="">
        <div className={styles.emptyState}>
          <FileText size={64} className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>Contrato no encontrado</h2>
          <Link href="/contracts" className={styles.primaryButton}>
            <ArrowLeft size={16} />
            Volver a Contratos
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const status = getContractStatus()
  const duration = calculateDuration()

  return (
    <DashboardLayout 
      title={`Contrato #${contract.id}`} 
      subtitle={apartment?.fullAddress || apartment?.nomenclature || ''}
    >
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/contracts" className={styles.backButton}>
            <ArrowLeft size={16} />
            Volver
          </Link>
          <div className={styles.headerInfo}>
            <h1>
              <FileText size={28} className={styles.titleIcon} />
              Contrato #{contract.id}
            </h1>
            <p>
              {apartment && building && `${building.name} - ${apartment.nomenclature}`}
              {apartment && !building && apartment.fullAddress}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className={styles.deleteButton}
        >
          <Trash2 size={16} />
          Eliminar
        </button>
      </div>

      {/* Tabs Navigation - Estilo GlassCard */}
      <div className={styles.mainCard}>
        {/* Tab buttons */}
        <div className={styles.tabsNav}>
          {[
            { id: 'summary', label: 'Resumen', icon: FileText },
            { id: 'ledger', label: 'Cuenta Corriente', icon: Receipt },
            { id: 'guarantors', label: 'Garantes', icon: Shield },
            { id: 'documents', label: 'Documentos', icon: FolderOpen },
            { id: 'history', label: 'Historial', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ''}`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Contents */}
        <div className={styles.tabContent}>
          {activeTab === 'summary' && (
            <div>
              {/* Status and Actions */}
              <div className={styles.statusRow}>
                <span className={`${styles.statusBadge} ${
                  status.label === 'Activo' ? styles.statusActive : 
                  status.label === 'Por Vencer' ? styles.statusExpiring : 
                  styles.statusExpired
                }`}>{status.label}</span>
                <Link href={`/contracts/${contract.id}/edit`} className={styles.editButton}>
                  <Edit size={16} />
                  Editar Contrato
                </Link>
              </div>

              {/* Contract Details */}
              <div className={styles.cardsGrid}>
                {/* Property Info */}
                <div className={styles.glassCard}>
                  <div className={styles.cardHeader}>
                    <div className={`${styles.cardIcon} ${styles.cardIconBlue}`}>
                      <Building2 size={20} />
                    </div>
                    <div>
                      <div className={styles.cardTitle}>Propiedad</div>
                      <div className={styles.cardSubtitle}>Información de la unidad</div>
                    </div>
                  </div>
                  <div>
                    {apartment ? (
                      <>
                        <div className={styles.infoRow}>
                          <div className={styles.infoLabel}>Dirección</div>
                          <Link href={`/apartments/${apartment.id}`} className={styles.infoValueLink}>
                            {apartment.fullAddress || `${building?.name || 'Edificio'} - Piso ${apartment.floor}, ${apartment.nomenclature}`}
                          </Link>
                        </div>
                        <div className={styles.infoGrid}>
                          <div className={styles.infoRow}>
                            <div className={styles.infoLabel}>Tipo</div>
                            <div className={styles.infoValue}>{apartment.propertyType || 'Departamento'}</div>
                          </div>
                          <div className={styles.infoRow}>
                            <div className={styles.infoLabel}>Área</div>
                            <div className={styles.infoValue}>{apartment.area} m²</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className={styles.infoValue}>Sin propiedad asignada</div>
                    )}
                  </div>
                </div>

                {/* Tenant Info */}
                <div className={styles.glassCard}>
                  <div className={styles.cardHeader}>
                    <div className={`${styles.cardIcon} ${styles.cardIconGreen}`}>
                      <User size={20} />
                    </div>
                    <div>
                      <div className={styles.cardTitle}>Inquilino</div>
                      <div className={styles.cardSubtitle}>Información del cliente</div>
                    </div>
                  </div>
                  <div>
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>Nombre/Razón Social</div>
                      {tenant ? (
                        <Link href={`/clients/${tenant.id}`} className={styles.infoValueLink}>
                          {tenant.nameOrBusiness}
                        </Link>
                      ) : (
                        <div className={styles.infoValue}>Sin inquilino asignado</div>
                      )}
                    </div>
                    {tenant && (
                      <>
                        <div className={styles.infoRow}>
                          <div className={styles.infoLabel}>DNI/CUIT</div>
                          <div className={styles.infoValueMono}>{tenant.dniOrCuit}</div>
                        </div>
                        <div className={styles.infoRow}>
                          <div className={styles.infoLabel}>Contacto</div>
                          <div className={styles.infoValue}>{tenant.contactPhone}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Contract Terms */}
              <div className={styles.glassCard} style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIcon} ${styles.cardIconPurple}`}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className={styles.cardTitle}>Términos del Contrato</div>
                    <div className={styles.cardSubtitle}>Fechas y montos acordados</div>
                  </div>
                </div>
                <div className={styles.termsGrid}>
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Fecha de Inicio</div>
                    <div className={styles.infoValue}>
                      {new Date(contract.startDate).toLocaleDateString('es-AR')}
                    </div>
                  </div>
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Fecha de Fin</div>
                    <div className={styles.infoValue}>
                      {new Date(contract.endDate).toLocaleDateString('es-AR')}
                    </div>
                  </div>
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Duración</div>
                    <div className={styles.infoValue}>{duration} meses</div>
                  </div>
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Monto Inicial</div>
                    <div className={styles.infoValueGreen}>
                      ${Number(contract.initialAmount).toLocaleString('es-AR')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Update Rule */}
              {contract.updateRule && (
                <div className={styles.glassCard} style={{ marginBottom: 'var(--spacing-xl)' }}>
                  <div className={styles.cardHeader}>
                    <div className={`${styles.cardIcon} ${styles.cardIconBlue}`}>
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <div className={styles.cardTitle}>Regla de Actualización</div>
                      <div className={styles.cardSubtitle}>Configuración para actualización de montos</div>
                    </div>
                  </div>
                  <div className={styles.updateRuleGrid}>
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>Frecuencia</div>
                      <div className={styles.infoValue}>{contract.updateRule.updateFrequency}</div>
                    </div>
                    {contract.updateRule.monthlyCoefficient && (
                      <div className={styles.infoRow}>
                        <div className={styles.infoLabel}>Coeficiente Mensual</div>
                        <div className={styles.infoValue}>{contract.updateRule.monthlyCoefficient}</div>
                      </div>
                    )}
                    {contract.updateRule.lateInterestPercent && (
                      <div className={styles.infoRow}>
                        <div className={styles.infoLabel}>Interés por Mora</div>
                        <div className={styles.infoValue}>{contract.updateRule.lateInterestPercent}%</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className={styles.glassCard}>
                <div className={styles.cardTitle} style={{ marginBottom: 'var(--spacing-lg)' }}>Información del Sistema</div>
                <div className={styles.infoGrid}>
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Fecha de Creación</div>
                    <div className={styles.infoValue}>
                      {new Date(contract.createdAt).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Última Actualización</div>
                    <div className={styles.infoValue}>
                      {new Date(contract.updatedAt).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div>
              {/* Summary Stats */}
              <div className={styles.ledgerStats}>
                <div className={styles.ledgerStatCard}>
                  <span className={styles.ledgerStatLabel}>Total Obligaciones</span>
                  <span className={styles.ledgerStatValue}>
                    ${contractObligations.reduce((sum, o) => sum + o.amount, 0).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className={styles.ledgerStatCard}>
                  <span className={styles.ledgerStatLabel}>Total Pagado</span>
                  <span className={styles.ledgerStatValueGreen}>
                    ${contractObligations.reduce((sum, o) => sum + o.paidAmount, 0).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className={styles.ledgerStatCard}>
                  <span className={styles.ledgerStatLabel}>Saldo Pendiente</span>
                  <span className={styles.ledgerStatValueRed}>
                    ${contractObligations.reduce((sum, o) => sum + (o.amount - o.paidAmount), 0).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Obligations List */}
              <div className={styles.glassCard}>
                <div className={styles.ledgerHeader}>
                  <h3 className={styles.cardTitle}>Movimientos del Contrato</h3>
                  <Link href={`/obligations?contractId=${contract.id}`} className={styles.linkButton}>
                    Ver todo en Cuenta Corriente
                  </Link>
                </div>

                {obligationsLoading ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Cargando obligaciones...</p>
                  </div>
                ) : contractObligations.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Receipt size={48} className={styles.emptyIcon} />
                    <h3 className={styles.emptyTitle}>Sin Movimientos</h3>
                    <p className={styles.emptyText}>Este contrato no tiene obligaciones registradas.</p>
                    <Link href={`/obligations/new?contractId=${contract.id}`} className={styles.primaryButton}>
                      <Plus size={16} />
                      Nueva Obligación
                    </Link>
                  </div>
                ) : (
                  <div className={styles.ledgerList}>
                    {contractObligations.slice(0, 10).map((obligation) => (
                      <Link 
                        key={obligation.id} 
                        href={`/obligations/${obligation.id}`}
                        className={styles.ledgerItem}
                      >
                        <div className={styles.ledgerItemLeft}>
                          <div className={`${styles.ledgerItemIcon} ${
                            obligation.status === 'paid' ? styles.ledgerIconPaid :
                            obligation.status === 'overdue' ? styles.ledgerIconOverdue :
                            styles.ledgerIconPending
                          }`}>
                            {obligation.status === 'paid' ? (
                              <Receipt size={16} />
                            ) : obligation.status === 'overdue' ? (
                              <Clock size={16} />
                            ) : (
                              <Receipt size={16} />
                            )}
                          </div>
                          <div className={styles.ledgerItemInfo}>
                            <span className={styles.ledgerItemDesc}>{obligation.description}</span>
                            <span className={styles.ledgerItemMeta}>
                              {obligation.type === 'rent' ? 'Alquiler' :
                               obligation.type === 'expenses' ? 'Expensas' :
                               obligation.type === 'service' ? 'Servicio' :
                               obligation.type === 'tax' ? 'Impuesto' :
                               obligation.type === 'maintenance' ? 'Mantenimiento' :
                               obligation.type === 'debt' ? 'Deuda/Ajuste' : obligation.type}
                              {' • '}
                              {new Date(obligation.dueDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div className={styles.ledgerItemRight}>
                          <span className={styles.ledgerItemAmount}>
                            ${obligation.amount.toLocaleString('es-AR')}
                          </span>
                          <Badge 
                            variant={
                              obligation.status === 'paid' ? 'success' :
                              obligation.status === 'overdue' ? 'error' :
                              obligation.status === 'partial' ? 'warning' : 'info'
                            }
                            size="sm"
                          >
                            {obligation.status === 'paid' ? 'Pagado' :
                             obligation.status === 'overdue' ? 'Vencido' :
                             obligation.status === 'partial' ? 'Parcial' : 'Pendiente'}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                    {contractObligations.length > 10 && (
                      <div className={styles.ledgerMore}>
                        <Link href={`/obligations?contractId=${contract.id}`} className={styles.linkButton}>
                          Ver {contractObligations.length - 10} movimientos más
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'guarantors' && (
            <div>
              {!contract.guarantors || contract.guarantors.length === 0 ? (
                <div className={styles.glassCard}>
                  <div className={styles.emptyState}>
                    <Shield size={64} className={styles.emptyIcon} />
                    <h3 className={styles.emptyTitle}>Sin Garantes</h3>
                    <p className={styles.emptyText}>Este contrato no tiene garantes asociados.</p>
                  </div>
                </div>
              ) : (
                <div className={styles.guarantorList}>
                  {contract.guarantors.map((cg: any) => (
                    <Link key={cg.guarantorId} href={`/guarantors/${cg.guarantorId}`} className={styles.guarantorItem}>
                      <div className={styles.guarantorInfo}>
                        <div className={styles.guarantorIcon}>
                          <Shield size={20} />
                        </div>
                        <div>
                          <div className={styles.guarantorName}>{cg.guarantor?.name || 'Garante'}</div>
                          <div className={styles.guarantorDni}>{cg.guarantor?.dni}</div>
                        </div>
                      </div>
                      <ChevronRight size={20} className={styles.guarantorArrow} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className={styles.documentsSection}>
              {/* Header with upload button */}
              <div className={styles.documentsHeader}>
                <h3 className={styles.documentsSectionTitle}>Documentos del Contrato</h3>
                <Button 
                  leftIcon={<Upload size={16} />}
                  onClick={() => {
                    setUploadType('contract')
                    setUploadForm({ type: 'contrato', description: '', guarantorId: '' })
                    setShowUploadModal(true)
                  }}
                >
                  Subir Documento
                </Button>
              </div>

              {/* General Documents */}
              <div className={styles.glassCard}>
                <div className={styles.docCategoryHeader}>
                  <FolderOpen size={20} />
                  <span>Documentos Generales</span>
                  <Badge variant="default">{generalDocs.length}</Badge>
                </div>
                
                {generalDocs.length === 0 ? (
                  <div className={styles.emptyDocsState}>
                    <File size={32} className={styles.emptyIcon} />
                    <p>No hay documentos generales</p>
                  </div>
                ) : (
                  <div className={styles.documentsList}>
                    {generalDocs.map((doc) => (
                      <div key={doc.id} className={styles.documentItem}>
                        <div className={styles.documentIcon}>
                          {getFileIcon(doc.mimeType, 24)}
                        </div>
                        <div className={styles.documentInfo}>
                          <span className={styles.documentName}>{doc.fileName}</span>
                          <div className={styles.documentMeta}>
                            <Badge variant="info" size="sm">{getDocTypeLabel(doc.type)}</Badge>
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDocDate(doc.uploadedAt)}</span>
                          </div>
                          {doc.description && (
                            <span className={styles.documentDesc}>{doc.description}</span>
                          )}
                        </div>
                        <div className={styles.documentActions}>
                          <button 
                            className={styles.docActionBtn}
                            onClick={() => openPreview(doc)}
                            title="Ver"
                          >
                            <Eye size={16} />
                          </button>
                          <a 
                            href={doc.fileUrl} 
                            download={doc.fileName}
                            className={styles.docActionBtn}
                            title="Descargar"
                          >
                            <Download size={16} />
                          </a>
                          <button 
                            className={`${styles.docActionBtn} ${styles.docActionBtnDanger}`}
                            onClick={() => {
                              setSelectedDocument(doc)
                              setShowDeleteDocModal(true)
                            }}
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Guarantor Documents */}
              <div className={styles.glassCard}>
                <div className={styles.docCategoryHeader}>
                  <Shield size={20} />
                  <span>Documentos de Garantes</span>
                  <Badge variant="default">{guarantorDocs.length}</Badge>
                </div>
                
                {guarantorDocs.length === 0 ? (
                  <div className={styles.emptyDocsState}>
                    <Shield size={32} className={styles.emptyIcon} />
                    <p>No hay documentos de garantes</p>
                  </div>
                ) : (
                  <div className={styles.documentsList}>
                    {guarantorDocs.map((doc) => (
                      <div key={doc.id} className={styles.documentItem}>
                        <div className={styles.documentIcon}>
                          {getFileIcon(doc.mimeType, 24)}
                        </div>
                        <div className={styles.documentInfo}>
                          <span className={styles.documentName}>{doc.fileName}</span>
                          <div className={styles.documentMeta}>
                            <Badge variant="warning" size="sm">Garantía</Badge>
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDocDate(doc.uploadedAt)}</span>
                          </div>
                          {doc.description && (
                            <span className={styles.documentDesc}>{doc.description}</span>
                          )}
                        </div>
                        <div className={styles.documentActions}>
                          <button 
                            className={styles.docActionBtn}
                            onClick={() => openPreview(doc)}
                            title="Ver"
                          >
                            <Eye size={16} />
                          </button>
                          <a 
                            href={doc.fileUrl} 
                            download={doc.fileName}
                            className={styles.docActionBtn}
                            title="Descargar"
                          >
                            <Download size={16} />
                          </a>
                          <button 
                            className={`${styles.docActionBtn} ${styles.docActionBtnDanger}`}
                            onClick={() => {
                              setSelectedDocument(doc)
                              setShowDeleteDocModal(true)
                            }}
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Link to full documents module */}
              <div className={styles.documentsFooter}>
                <Link href={`/documents`} className={styles.linkButton}>
                  <FolderOpen size={16} />
                  Ver todos los documentos en el módulo de Documentos
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className={styles.glassCard}>
              <div className={styles.emptyState}>
                <Clock size={64} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>Historial</h3>
                <p className={styles.emptyText}>
                  El historial de cambios del contrato estará disponible próximamente.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>
                <Trash2 size={20} />
              </div>
              <h3 className={styles.modalTitle}>Confirmar Eliminación</h3>
            </div>
            <p className={styles.modalText}>
              ¿Está seguro que desea eliminar el contrato #{contract.id}?
            </p>
            <p className={styles.modalWarning}>
              Esta acción no se puede deshacer. Se eliminarán también las reglas de actualización asociadas.
            </p>
            <div className={styles.modalActions}>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                className={styles.confirmDeleteButton}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Subir Documento"
        subtitle="Sube un documento asociado a este contrato"
        size="md"
      >
        <div className={styles.uploadForm}>
          <Select
            label="Tipo de documento"
            options={[
              { value: 'contrato', label: 'Contrato' },
              { value: 'dni', label: 'DNI' },
              { value: 'recibo_sueldo', label: 'Recibo de Sueldo' },
              { value: 'garantia', label: 'Garantía' },
              { value: 'otro', label: 'Otro' },
            ]}
            value={uploadForm.type}
            onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
          />
          <Input
            label="Descripción (opcional)"
            value={uploadForm.description}
            onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
            placeholder="Ej: Contrato firmado, DNI frente..."
          />
          <div className={styles.uploadArea}>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className={styles.fileInput}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <div className={styles.uploadPlaceholder}>
              <Upload size={32} />
              <p>Arrastra un archivo o haz clic para seleccionar</p>
              <span>PDF, JPG, PNG, DOC (máx. 10MB)</span>
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Document Modal */}
      <Modal
        isOpen={showDeleteDocModal}
        onClose={() => {
          setShowDeleteDocModal(false)
          setSelectedDocument(null)
        }}
        title="Eliminar Documento"
        size="sm"
      >
        <p className={styles.deleteDocText}>
          ¿Estás seguro de que deseas eliminar el documento <strong>{selectedDocument?.fileName}</strong>?
        </p>
        <p className={styles.deleteDocWarning}>Esta acción no se puede deshacer.</p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => {
            setShowDeleteDocModal(false)
            setSelectedDocument(null)
          }}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteDoc}>
            Eliminar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Document Preview Modal */}
      {previewDocument && (
        <div className={styles.previewOverlay} onClick={closePreview}>
          <div className={styles.previewContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewHeader}>
              <span className={styles.previewTitle}>{previewDocument.fileName}</span>
              <div className={styles.previewControls}>
                <button onClick={() => setPreviewZoom(z => Math.max(z - 25, 50))} title="Alejar">
                  <ZoomOut size={18} />
                </button>
                <span>{previewZoom}%</span>
                <button onClick={() => setPreviewZoom(z => Math.min(z + 25, 200))} title="Acercar">
                  <ZoomIn size={18} />
                </button>
                <button onClick={() => setPreviewRotation(r => (r + 90) % 360)} title="Rotar">
                  <RotateCw size={18} />
                </button>
                <a href={previewDocument.fileUrl} download={previewDocument.fileName} title="Descargar">
                  <Download size={18} />
                </a>
                <button onClick={closePreview} title="Cerrar">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className={styles.previewContent}>
              {previewDocument.mimeType?.startsWith('image/') ? (
                <img
                  src={previewDocument.fileUrl}
                  alt={previewDocument.fileName}
                  style={{
                    transform: `scale(${previewZoom / 100}) rotate(${previewRotation}deg)`,
                    transition: 'transform 0.2s ease',
                  }}
                />
              ) : previewDocument.mimeType?.includes('pdf') ? (
                <PDFViewer 
                  url={previewDocument.fileUrl} 
                  zoom={previewZoom} 
                  rotation={previewRotation} 
                />
              ) : (
                <div className={styles.noPreview}>
                  <File size={64} />
                  <p>Vista previa no disponible</p>
                  <a href={previewDocument.fileUrl} download={previewDocument.fileName}>
                    <Button leftIcon={<Download size={16} />}>Descargar archivo</Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}
