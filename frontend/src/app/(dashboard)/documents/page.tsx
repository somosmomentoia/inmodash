'use client'

import { useState, useMemo } from 'react'
import {
  FileText,
  Search,
  Upload,
  Download,
  Trash2,
  Eye,
  File,
  Image,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Grid,
  List,
  Building2,
  Users,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileImage,
  Plus,
  MoreVertical,
  Home,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
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
} from '@/components/ui'
import { useDocuments } from '@/hooks/useDocuments'
import { useContracts } from '@/hooks/useContracts'
import { Document, Contract } from '@/types'
import { PDFViewer } from '@/components/ui/PDFViewer'
import styles from './documents.module.css'

type ViewMode = 'grid' | 'list'
type ActiveSection = 'contracts' | 'agency'

interface DocumentFolder {
  id: string
  name: string
  subtitle?: string
  icon: React.ReactNode
  documentCount: number
  contractId?: number
  type: 'contract' | 'agency'
}

export default function DocumentsPage() {
  const { documents, loading: docsLoading, deleteDocument } = useDocuments()
  const { contracts, loading: contractsLoading } = useContracts()
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeSection, setActiveSection] = useState<ActiveSection>('contracts')
  const [selectedFolder, setSelectedFolder] = useState<DocumentFolder | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [previewZoom, setPreviewZoom] = useState(100)
  const [previewRotation, setPreviewRotation] = useState(0)

  const loading = docsLoading || contractsLoading

  // Build folder structure from contracts
  const contractFolders: DocumentFolder[] = useMemo(() => {
    return contracts.map((contract) => {
      const contractDocs = documents.filter((d) => d.contractId === contract.id)
      return {
        id: `contract-${contract.id}`,
        name: contract.tenant?.nameOrBusiness || 'Sin inquilino',
        subtitle: contract.apartment?.nomenclature || contract.apartment?.fullAddress || 'Sin propiedad',
        icon: <Users size={20} />,
        documentCount: contractDocs.length,
        contractId: contract.id,
        type: 'contract' as const,
      }
    })
  }, [contracts, documents])

  // Agency documents (documents without contractId)
  const agencyDocuments = useMemo(() => {
    return documents.filter((d) => !d.contractId)
  }, [documents])

  const agencyFolders: DocumentFolder[] = [
    {
      id: 'agency-general',
      name: 'Documentos Generales',
      subtitle: 'Documentos de la inmobiliaria',
      icon: <Building2 size={20} />,
      documentCount: agencyDocuments.length,
      type: 'agency',
    },
  ]

  // Get documents for selected folder
  const currentDocuments = useMemo(() => {
    if (!selectedFolder) return []
    
    if (selectedFolder.type === 'contract' && selectedFolder.contractId) {
      return documents.filter((d) => d.contractId === selectedFolder.contractId)
    }
    
    if (selectedFolder.type === 'agency') {
      return agencyDocuments
    }
    
    return []
  }, [selectedFolder, documents, agencyDocuments])

  // Filter documents by search
  const filteredDocuments = useMemo(() => {
    if (!searchTerm) return currentDocuments
    const search = searchTerm.toLowerCase()
    return currentDocuments.filter(
      (doc) =>
        doc.fileName.toLowerCase().includes(search) ||
        doc.description?.toLowerCase().includes(search)
    )
  }, [currentDocuments, searchTerm])

  // Filter folders by search when no folder is selected
  const filteredFolders = useMemo(() => {
    const folders = activeSection === 'contracts' ? contractFolders : agencyFolders
    if (!searchTerm) return folders
    const search = searchTerm.toLowerCase()
    return folders.filter(
      (folder) =>
        folder.name.toLowerCase().includes(search) ||
        folder.subtitle?.toLowerCase().includes(search)
    )
  }, [activeSection, contractFolders, agencyFolders, searchTerm])

  const getFileIcon = (mimeType: string, size: number = 24) => {
    if (mimeType.startsWith('image/')) return <FileImage size={size} className={styles.fileIconImage} />
    if (mimeType.includes('pdf')) return <FileText size={size} className={styles.fileIconPdf} />
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
      return <FileSpreadsheet size={size} className={styles.fileIconSpreadsheet} />
    return <File size={size} className={styles.fileIconDefault} />
  }

  const getTypeLabel = (type: string) => {
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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleDelete = async () => {
    if (!selectedDocument) return
    try {
      await deleteDocument(selectedDocument.id)
      setShowDeleteModal(false)
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
    setPreviewZoom(100)
    setPreviewRotation(0)
  }

  const handleZoomIn = () => setPreviewZoom((z) => Math.min(z + 25, 200))
  const handleZoomOut = () => setPreviewZoom((z) => Math.max(z - 25, 50))
  const handleRotate = () => setPreviewRotation((r) => (r + 90) % 360)

  const totalDocuments = documents.length
  const totalContracts = contractFolders.filter((f) => f.documentCount > 0).length

  if (loading) {
    return (
      <DashboardLayout title="Documentos" subtitle="Gestión de documentos">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Cargando documentos...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Documentos" subtitle="Gestión de documentos">
      <div className={styles.fileManager}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Explorador</h3>
            <Button variant="ghost" size="sm">
              <Plus size={16} />
            </Button>
          </div>

          {/* Section Tabs */}
          <div className={styles.sectionTabs}>
            <button
              className={`${styles.sectionTab} ${activeSection === 'contracts' ? styles.active : ''}`}
              onClick={() => {
                setActiveSection('contracts')
                setSelectedFolder(null)
              }}
            >
              <Users size={16} />
              <span>Contratos</span>
              <Badge variant="default" className={styles.tabBadge}>
                {contractFolders.length}
              </Badge>
            </button>
            <button
              className={`${styles.sectionTab} ${activeSection === 'agency' ? styles.active : ''}`}
              onClick={() => {
                setActiveSection('agency')
                setSelectedFolder(null)
              }}
            >
              <Building2 size={16} />
              <span>Inmobiliaria</span>
              <Badge variant="default" className={styles.tabBadge}>
                {agencyDocuments.length}
              </Badge>
            </button>
          </div>

          {/* Folder Tree */}
          <div className={styles.folderTree}>
            {(activeSection === 'contracts' ? contractFolders : agencyFolders).map((folder) => (
              <button
                key={folder.id}
                className={`${styles.folderItem} ${selectedFolder?.id === folder.id ? styles.selected : ''}`}
                onClick={() => setSelectedFolder(folder)}
              >
                <div className={styles.folderIcon}>
                  {selectedFolder?.id === folder.id ? (
                    <FolderOpen size={18} />
                  ) : (
                    <Folder size={18} />
                  )}
                </div>
                <div className={styles.folderInfo}>
                  <span className={styles.folderName}>{folder.name}</span>
                  {folder.subtitle && (
                    <span className={styles.folderSubtitle}>{folder.subtitle}</span>
                  )}
                </div>
                <span className={styles.folderCount}>{folder.documentCount}</span>
              </button>
            ))}
          </div>

          {/* Storage Info */}
          <div className={styles.storageInfo}>
            <div className={styles.storageHeader}>
              <span>Almacenamiento</span>
              <span className={styles.storageUsed}>
                {totalDocuments} archivos
              </span>
            </div>
            <div className={styles.storageBar}>
              <div
                className={styles.storageProgress}
                style={{ width: `${Math.min((totalDocuments / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
              <button
                className={styles.breadcrumbItem}
                onClick={() => setSelectedFolder(null)}
              >
                <Home size={14} />
                <span>Inicio</span>
              </button>
              {selectedFolder && (
                <>
                  <ChevronRight size={14} className={styles.breadcrumbSeparator} />
                  <span className={styles.breadcrumbCurrent}>{selectedFolder.name}</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className={styles.toolbarActions}>
              <div className={styles.searchWrapper}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                {searchTerm && (
                  <button
                    className={styles.clearSearch}
                    onClick={() => setSearchTerm('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid size={16} />
                </button>
                <button
                  className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List size={16} />
                </button>
              </div>

              <Button leftIcon={<Upload size={16} />} size="sm">
                Subir
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className={styles.contentArea}>
            {!selectedFolder ? (
              // Show folders
              <div className={viewMode === 'grid' ? styles.folderGrid : styles.folderList}>
                {filteredFolders.length === 0 ? (
                  <EmptyState
                    icon={<Folder />}
                    title="Sin carpetas"
                    description={
                      activeSection === 'contracts'
                        ? 'No hay contratos con documentos.'
                        : 'No hay documentos de la inmobiliaria.'
                    }
                  />
                ) : (
                  filteredFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className={`${styles.folderCard} ${viewMode === 'list' ? styles.listItem : ''}`}
                      onClick={() => setSelectedFolder(folder)}
                    >
                      <div className={styles.folderCardIcon}>{folder.icon}</div>
                      <div className={styles.folderCardInfo}>
                        <h4>{folder.name}</h4>
                        {folder.subtitle && <p>{folder.subtitle}</p>}
                      </div>
                      <div className={styles.folderCardMeta}>
                        <span>{folder.documentCount} archivos</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Show documents
              <div className={viewMode === 'grid' ? styles.documentGrid : styles.documentList}>
                {filteredDocuments.length === 0 ? (
                  <EmptyState
                    icon={<FileText />}
                    title="Sin documentos"
                    description="Esta carpeta no tiene documentos."
                    action={
                      <Button leftIcon={<Upload size={16} />}>Subir Documento</Button>
                    }
                  />
                ) : (
                  filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className={`${styles.documentCard} ${viewMode === 'list' ? styles.listItem : ''}`}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <div
                            className={styles.documentPreview}
                            onClick={() => openPreview(doc)}
                          >
                            {doc.mimeType.startsWith('image/') ? (
                              <img src={doc.fileUrl} alt={doc.fileName} />
                            ) : (
                              <div className={styles.documentPlaceholder}>
                                {getFileIcon(doc.mimeType, 48)}
                              </div>
                            )}
                            <div className={styles.documentOverlay}>
                              <Eye size={24} />
                            </div>
                          </div>
                          <div className={styles.documentInfo}>
                            <h4 title={doc.fileName}>{doc.fileName}</h4>
                            <div className={styles.documentMeta}>
                              <Badge variant="default" className={styles.typeBadge}>
                                {getTypeLabel(doc.type)}
                              </Badge>
                              <span>{formatFileSize(doc.fileSize)}</span>
                            </div>
                          </div>
                          <div className={styles.documentActions}>
                            <button onClick={() => openPreview(doc)}>
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = doc.fileUrl
                                link.download = doc.fileName
                                link.click()
                              }}
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDocument(doc)
                                setShowDeleteModal(true)
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={styles.listItemIcon}>
                            {getFileIcon(doc.mimeType, 24)}
                          </div>
                          <div className={styles.listItemInfo}>
                            <h4>{doc.fileName}</h4>
                            <p>{doc.description || 'Sin descripción'}</p>
                          </div>
                          <Badge variant="default">{getTypeLabel(doc.type)}</Badge>
                          <span className={styles.listItemSize}>
                            {formatFileSize(doc.fileSize)}
                          </span>
                          <span className={styles.listItemDate}>
                            {formatDate(doc.uploadedAt)}
                          </span>
                          <div className={styles.listItemActions}>
                            <button onClick={() => openPreview(doc)}>
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = doc.fileUrl
                                link.download = doc.fileName
                                link.click()
                              }}
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDocument(doc)
                                setShowDeleteModal(true)
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <div className={styles.previewOverlay} onClick={closePreview}>
          <div className={styles.previewContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewHeader}>
              <div className={styles.previewTitle}>
                {getFileIcon(previewDocument.mimeType, 20)}
                <span>{previewDocument.fileName}</span>
              </div>
              <div className={styles.previewControls}>
                <button onClick={handleZoomOut} title="Alejar">
                  <ZoomOut size={18} />
                </button>
                <span className={styles.zoomLevel}>{previewZoom}%</span>
                <button onClick={handleZoomIn} title="Acercar">
                  <ZoomIn size={18} />
                </button>
                <button onClick={handleRotate} title="Rotar">
                  <RotateCw size={18} />
                </button>
                <button
                  onClick={() => window.open(previewDocument.fileUrl, '_blank')}
                  title="Pantalla completa"
                >
                  <Maximize2 size={18} />
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = previewDocument.fileUrl
                    link.download = previewDocument.fileName
                    link.click()
                  }}
                  title="Descargar"
                >
                  <Download size={18} />
                </button>
                <button onClick={closePreview} title="Cerrar">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className={styles.previewContent}>
              {previewDocument.mimeType.startsWith('image/') ? (
                <img
                  src={previewDocument.fileUrl}
                  alt={previewDocument.fileName}
                  style={{
                    transform: `scale(${previewZoom / 100}) rotate(${previewRotation}deg)`,
                    transition: 'transform 0.2s ease',
                  }}
                />
              ) : previewDocument.mimeType.includes('pdf') ? (
                <PDFViewer 
                  url={previewDocument.fileUrl} 
                  zoom={previewZoom} 
                  rotation={previewRotation} 
                />
              ) : (
                <div className={styles.previewUnsupported}>
                  {getFileIcon(previewDocument.mimeType, 64)}
                  <p>Vista previa no disponible</p>
                  <Button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = previewDocument.fileUrl
                      link.download = previewDocument.fileName
                      link.click()
                    }}
                  >
                    Descargar archivo
                  </Button>
                </div>
              )}
            </div>
            <div className={styles.previewFooter}>
              <div className={styles.previewMeta}>
                <Badge>{getTypeLabel(previewDocument.type)}</Badge>
                <span>{formatFileSize(previewDocument.fileSize)}</span>
                <span>{formatDate(previewDocument.uploadedAt)}</span>
              </div>
              {previewDocument.description && (
                <p className={styles.previewDescription}>{previewDocument.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedDocument(null)
        }}
        title="Eliminar Documento"
        size="sm"
      >
        <p className={styles.deleteText}>
          ¿Está seguro que desea eliminar el documento{' '}
          <strong>{selectedDocument?.fileName}</strong>?
        </p>
        <p className={styles.deleteWarning}>Esta acción no se puede deshacer.</p>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeleteModal(false)
              setSelectedDocument(null)
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
