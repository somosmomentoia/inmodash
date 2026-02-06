'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  ArrowLeft,
  ArrowRight,
  Calendar,
  DollarSign,
  User,
  Home,
  Check,
  Plus,
  X,
  Search,
  Percent,
  Building2,
  Repeat,
  Upload,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  Select,
  Badge,
  Avatar,
} from '@/components/ui'
import { useContracts } from '@/hooks/useContracts'
import { useApartments } from '@/hooks/useApartments'
import { useTenants } from '@/hooks/useTenants'
import { useBuildings } from '@/hooks/useBuildings'
import { useGuarantors } from '@/hooks/useGuarantors'
import { ApartmentStatus, PropertyType } from '@/types'
import styles from './new-contract.module.css'
import indicesService from '@/services/indices.service'

const STEPS = [
  { id: 1, name: 'Cliente', icon: User },
  { id: 2, name: 'Unidad', icon: Home },
  { id: 3, name: 'Contrato', icon: Calendar },
  { id: 4, name: 'Recurrencias', icon: Repeat },
  { id: 5, name: 'Documentos', icon: FileText },
]

const RECURRING_TYPES = [
  { value: 'expenses', label: 'Expensas' },
  { value: 'service', label: 'Servicio' },
  { value: 'tax', label: 'Impuesto' },
  { value: 'insurance', label: 'Seguro' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'debt', label: 'Deuda' },
]

interface RecurringObligation {
  id?: number
  type: string
  description: string
  amount: string
  dayOfMonth: string
}

export default function NewContractPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createContract } = useContracts()
  const { apartments } = useApartments()
  const { tenants, createTenant } = useTenants()
  const { buildings } = useBuildings()
  const { guarantors, createGuarantor, refresh: refreshGuarantors } = useGuarantors()

  // URL params for prospect conversion
  const urlTenantId = searchParams.get('tenantId')
  const urlApartmentId = searchParams.get('apartmentId')
  const urlProspectId = searchParams.get('prospectId')
  const isFromProspect = !!urlProspectId

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [createdContractId, setCreatedContractId] = useState<number | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Step 1: Client selection
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [newClientData, setNewClientData] = useState({
    nameOrBusiness: '',
    dniOrCuit: '',
    address: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
  })

  // Step 2: Apartment selection
  const [apartmentSearch, setApartmentSearch] = useState('')
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType | 'all'>('all')
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | 'all'>('all')
  const [selectedApartmentId, setSelectedApartmentId] = useState<number | null>(null)

  // Step 3: Contract details
  const [contractData, setContractData] = useState({
    startDate: '',
    endDate: '',
    initialAmount: '',
    updateFrequency: 'MONTHLY',
    monthlyCoefficient: '1.05',
    commissionType: '' as '' | 'percentage' | 'fixed',
    commissionValue: '',
    // Configuración de actualización por índice
    updateIndexType: '' as '' | 'icl' | 'ipc' | 'fixed' | 'none',
    updateFrequencyMonths: '4', // Por defecto cada 4 meses
    fixedUpdateCoefficient: '1.05', // Coeficiente fijo por defecto
  })

  // Estado para el valor actual del índice (se obtiene de Argly)
  const [currentIndexValue, setCurrentIndexValue] = useState<number | null>(null)
  const [loadingIndex, setLoadingIndex] = useState(false)

  // Guarantors
  const [selectedGuarantorIds, setSelectedGuarantorIds] = useState<number[]>([])
  const [showNewGuarantorForm, setShowNewGuarantorForm] = useState(false)
  const [creatingGuarantor, setCreatingGuarantor] = useState(false)
  const [newGuarantorData, setNewGuarantorData] = useState({
    name: '',
    dni: '',
    address: '',
    email: '',
    phone: '',
  })

  // Step 4: Recurring Obligations
  const [recurringObligations, setRecurringObligations] = useState<RecurringObligation[]>([])
  const [showRecurringForm, setShowRecurringForm] = useState(false)
  const [newRecurring, setNewRecurring] = useState<RecurringObligation>({
    type: 'expenses',
    description: '',
    amount: '',
    dayOfMonth: '10',
  })

  // Step 5: Documents
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([])

  // Initialize from URL params (prospect conversion)
  useEffect(() => {
    if (initialized) return
    if (tenants.length === 0 || apartments.length === 0) return
    
    // Pre-select tenant from URL
    if (urlTenantId) {
      const tenantId = parseInt(urlTenantId)
      const tenant = tenants.find(t => t.id === tenantId)
      if (tenant) {
        setSelectedTenantId(tenantId)
        
        // If we have apartment ID, try to pre-select it
        if (urlApartmentId) {
          const apartmentId = parseInt(urlApartmentId)
          const apartment = apartments.find(a => a.id === apartmentId)
          
          if (apartment && apartment.status === ApartmentStatus.AVAILABLE) {
            setSelectedApartmentId(apartmentId)
            setCurrentStep(3) // Go directly to contract details
          } else {
            // Apartment not available or not found, go to apartment selection
            setCurrentStep(2)
          }
        } else {
          // No apartment specified, go to apartment selection
          setCurrentStep(2)
        }
        setInitialized(true)
      }
    }
  }, [urlTenantId, urlApartmentId, tenants, apartments, initialized])

  // Obtener valor del índice cuando se selecciona ICL o IPC
  useEffect(() => {
    // Solo fetch si hay un tipo de índice válido seleccionado (ICL o IPC)
    const indexType = contractData.updateIndexType
    if (!indexType || indexType === 'none' || indexType === 'fixed') {
      setCurrentIndexValue(null)
      return
    }

    const fetchIndex = async () => {
      setLoadingIndex(true)
      try {
        const index = await indicesService.getIndex(contractData.updateIndexType as 'icl' | 'ipc')
        setCurrentIndexValue(index.value)
      } catch (error) {
        console.error('Error al obtener índice:', error)
        setCurrentIndexValue(null)
      } finally {
        setLoadingIndex(false)
      }
    }
    fetchIndex()
  }, [contractData.updateIndexType])

  // Filter tenants by search
  const filteredTenants = useMemo(() => {
    if (!searchTerm) return tenants
    const term = searchTerm.toLowerCase()
    return tenants.filter(
      (t) =>
        t.nameOrBusiness.toLowerCase().includes(term) ||
        t.dniOrCuit.toLowerCase().includes(term) ||
        t.contactEmail.toLowerCase().includes(term)
    )
  }, [tenants, searchTerm])

  // Filter available apartments
  const availableApartments = useMemo(() => {
    let filtered = apartments.filter((apt) => apt.status === ApartmentStatus.AVAILABLE)
    if (selectedPropertyType !== 'all') {
      filtered = filtered.filter((apt) => apt.propertyType === selectedPropertyType)
    }
    if (selectedBuildingId !== 'all') {
      filtered = filtered.filter((apt) => apt.buildingId === selectedBuildingId)
    }
    if (apartmentSearch) {
      const term = apartmentSearch.toLowerCase()
      filtered = filtered.filter((apt) =>
        apt.nomenclature?.toLowerCase().includes(term) ||
        apt.fullAddress?.toLowerCase().includes(term)
      )
    }
    return filtered
  }, [apartments, selectedPropertyType, selectedBuildingId, apartmentSearch])

  // Available buildings for filter
  const availableBuildings = useMemo(() => {
    return buildings.filter((building) => {
      return apartments.some(
        (apt) =>
          apt.buildingId === building.id &&
          apt.status === ApartmentStatus.AVAILABLE &&
          (selectedPropertyType === 'all' || apt.propertyType === selectedPropertyType)
      )
    })
  }, [buildings, apartments, selectedPropertyType])

  const getBuildingName = (buildingId: number | null | undefined) => {
    if (!buildingId) return 'Propiedad Independiente'
    const building = buildings.find((b) => b.id === buildingId)
    return building?.name || 'Edificio desconocido'
  }

  const getPropertyTypeLabel = (type: PropertyType) => {
    const labels: Record<PropertyType, string> = {
      [PropertyType.APARTMENT]: 'Departamento',
      [PropertyType.HOUSE]: 'Casa',
      [PropertyType.DUPLEX]: 'Duplex',
      [PropertyType.PH]: 'PH',
      [PropertyType.OFFICE]: 'Oficina',
      [PropertyType.COMMERCIAL]: 'Local Comercial',
      [PropertyType.PARKING]: 'Cochera',
      [PropertyType.WAREHOUSE]: 'Depósito',
      [PropertyType.LAND]: 'Terreno',
    }
    return labels[type] || type
  }

  const toggleGuarantor = (guarantorId: number) => {
    setSelectedGuarantorIds((prev) =>
      prev.includes(guarantorId)
        ? prev.filter((id) => id !== guarantorId)
        : [...prev, guarantorId]
    )
  }

  const handleCreateGuarantor = async () => {
    if (!newGuarantorData.name || !newGuarantorData.dni || !newGuarantorData.address ||
        !newGuarantorData.email || !newGuarantorData.phone) {
      return
    }
    setCreatingGuarantor(true)
    try {
      const created = await createGuarantor(newGuarantorData)
      if (created) {
        setSelectedGuarantorIds((prev) => [...prev, created.id])
        setNewGuarantorData({ name: '', dni: '', address: '', email: '', phone: '' })
        setShowNewGuarantorForm(false)
        await refreshGuarantors()
      }
    } catch (error) {
      console.error('Error creating guarantor:', error)
    } finally {
      setCreatingGuarantor(false)
    }
  }

  const [creatingClient, setCreatingClient] = useState(false)

  const handleCreateClient = async () => {
    if (!newClientData.nameOrBusiness || !newClientData.dniOrCuit || !newClientData.address ||
        !newClientData.contactName || !newClientData.contactEmail || !newClientData.contactPhone ||
        !newClientData.contactAddress) {
      alert('Por favor completa todos los campos requeridos')
      return
    }
    setCreatingClient(true)
    try {
      const newTenant = await createTenant(newClientData)
      if (newTenant) {
        setSelectedTenantId(newTenant.id)
        setShowNewClientForm(false)
        setNewClientData({
          nameOrBusiness: '', dniOrCuit: '', address: '', contactName: '',
          contactEmail: '', contactPhone: '', contactAddress: '',
        })
      }
    } catch (error: any) {
      console.error('Error creating tenant:', error)
      if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        alert('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.')
        window.location.href = '/login'
        return
      }
      alert(`Error al crear cliente: ${error?.message || 'Error desconocido'}`)
    } finally {
      setCreatingClient(false)
    }
  }

  // Step 4: Add recurring obligation
  const handleAddRecurring = async () => {
    if (!createdContractId || !newRecurring.description || !newRecurring.amount || !newRecurring.dayOfMonth) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/recurring-obligations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contractId: createdContractId,
          type: newRecurring.type,
          description: newRecurring.description,
          amount: parseFloat(newRecurring.amount),
          dayOfMonth: parseInt(newRecurring.dayOfMonth),
          isActive: true,
          startDate: contractData.startDate,
          endDate: contractData.endDate,
        }),
      })

      if (!response.ok) throw new Error('Error al crear obligación recurrente')

      const created = await response.json()
      setRecurringObligations((prev) => [...prev, created])
      setNewRecurring({ type: 'expenses', description: '', amount: '', dayOfMonth: '10' })
      setShowRecurringForm(false)
    } catch (error) {
      console.error('Error adding recurring obligation:', error)
      alert('Error al agregar la obligación recurrente')
    }
  }

  const handleRemoveRecurring = async (id: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      await fetch(`${apiUrl}/api/recurring-obligations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      setRecurringObligations((prev) => prev.filter((r) => r.id !== id))
    } catch (error) {
      console.error('Error removing recurring obligation:', error)
    }
  }

  // Step 5: File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024)
    if (validFiles.length < files.length) {
      alert('Algunos archivos superan el tamaño máximo de 10MB')
    }
    setSelectedFiles((prev) => [...prev, ...validFiles])
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUploadDocuments = async () => {
    if (!createdContractId || selectedFiles.length === 0) return
    // TODO: Implement actual file upload
    const uploadedNames = selectedFiles.map((f) => f.name)
    setUploadedDocuments((prev) => [...prev, ...uploadedNames])
    setSelectedFiles([])
    alert(`${uploadedNames.length} documento(s) preparado(s). La subida al servidor se implementará próximamente.`)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedTenantId !== null
      case 2: return selectedApartmentId !== null
      case 3: return contractData.startDate && contractData.endDate && contractData.initialAmount
      case 4: return true // Recurring obligations are optional
      case 5: return true // Documents are optional
      default: return false
    }
  }

  // Create contract at step 3
  const handleCreateContract = async () => {
    if (!selectedTenantId || !selectedApartmentId) return
    setLoading(true)
    try {
      // Obtener valor actual del índice si es necesario
      let initialIndexValue = currentIndexValue
      if ((contractData.updateIndexType === 'icl' || contractData.updateIndexType === 'ipc') && !initialIndexValue) {
        try {
          const index = await indicesService.getIndex(contractData.updateIndexType)
          initialIndexValue = index.value
        } catch (error) {
          console.error('Error al obtener índice:', error)
        }
      }

      const newContract = await createContract({
        apartmentId: selectedApartmentId,
        tenantId: selectedTenantId,
        startDate: contractData.startDate,
        endDate: contractData.endDate,
        initialAmount: parseFloat(contractData.initialAmount),
        guarantorIds: selectedGuarantorIds,
        updateRule: {
          updateFrequency: contractData.updateFrequency,
          monthlyCoefficient: parseFloat(contractData.monthlyCoefficient),
          updatePeriods: [],
        },
        // Commission fields
        ...(contractData.commissionType && {
          commissionType: contractData.commissionType,
          commissionValue: contractData.commissionValue ? parseFloat(contractData.commissionValue) : undefined,
        }),
        // Index update fields for recurring rent obligation
        ...(contractData.updateIndexType && {
          updateIndexType: contractData.updateIndexType,
          updateFrequencyMonths: contractData.updateFrequencyMonths ? parseInt(contractData.updateFrequencyMonths) : undefined,
          initialIndexValue: initialIndexValue || undefined,
          fixedUpdateCoefficient: contractData.updateIndexType === 'fixed' && contractData.fixedUpdateCoefficient 
            ? parseFloat(contractData.fixedUpdateCoefficient) 
            : undefined,
        }),
      } as any)
      setCreatedContractId(newContract.id)
      setCurrentStep(4)
    } catch (error) {
      console.error('Error creating contract:', error)
      alert('Error al crear el contrato')
    } finally {
      setLoading(false)
    }
  }

  const handleFinalSubmit = () => {
    router.push('/contracts')
  }

  return (
    <DashboardLayout title="Nuevo Contrato" subtitle="Crear un nuevo contrato de alquiler paso a paso">
      {/* Back Button */}
      <div className={styles.backRow}>
        <Link href="/contracts">
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
            Volver a Contratos
          </Button>
        </Link>
      </div>

      {/* Progress Steps - Horizontal Pills */}
      <div className={styles.stepsContainer}>
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          return (
            <div key={step.id} className={styles.stepWrapper}>
              <div className={`${styles.stepPill} ${isActive ? styles.stepPillActive : ''} ${isCompleted ? styles.stepPillCompleted : ''}`}>
                {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                <span>{step.name}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`${styles.stepConnector} ${isCompleted ? styles.stepConnectorCompleted : ''}`} />
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.formContainer}>
        {/* Step 1: Select Client */}
        {currentStep === 1 && (
          <Card>
            <CardHeader title="Seleccionar Cliente" subtitle="Busca un cliente existente o crea uno nuevo" />
            <CardContent>
              <div className={styles.searchRow}>
                <Input
                  placeholder="Buscar por nombre, DNI/CUIT o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search size={18} />}
                  fullWidth
                />
              </div>

              {!showNewClientForm ? (
                <Button
                  variant="secondary"
                  leftIcon={<Plus size={16} />}
                  onClick={() => setShowNewClientForm(true)}
                  fullWidth
                  className={styles.newClientBtn}
                >
                  Crear Nuevo Cliente
                </Button>
              ) : (
                <div className={styles.newClientForm}>
                  <div className={styles.formHeader}>
                    <h4>Nuevo Cliente</h4>
                    <Button variant="ghost" size="sm" onClick={() => setShowNewClientForm(false)}>
                      <X size={16} />
                    </Button>
                  </div>
                  <div className={styles.formGrid}>
                    <Input label="Nombre / Razón Social *" value={newClientData.nameOrBusiness}
                      onChange={(e) => setNewClientData({ ...newClientData, nameOrBusiness: e.target.value })} fullWidth />
                    <Input label="DNI / CUIT *" value={newClientData.dniOrCuit}
                      onChange={(e) => setNewClientData({ ...newClientData, dniOrCuit: e.target.value })} fullWidth />
                    <Input label="Dirección *" value={newClientData.address}
                      onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })} fullWidth />
                    <Input label="Nombre de Contacto *" value={newClientData.contactName}
                      onChange={(e) => setNewClientData({ ...newClientData, contactName: e.target.value })} fullWidth />
                    <Input label="Teléfono *" value={newClientData.contactPhone}
                      onChange={(e) => setNewClientData({ ...newClientData, contactPhone: e.target.value })} fullWidth />
                    <Input label="Email *" type="email" value={newClientData.contactEmail}
                      onChange={(e) => setNewClientData({ ...newClientData, contactEmail: e.target.value })} fullWidth />
                    <Input label="Dirección de Contacto *" value={newClientData.contactAddress}
                      onChange={(e) => setNewClientData({ ...newClientData, contactAddress: e.target.value })} fullWidth />
                  </div>
                  <Button onClick={handleCreateClient} leftIcon={<Plus size={16} />} loading={creatingClient} disabled={creatingClient}>
                    {creatingClient ? 'Guardando...' : 'Guardar Cliente'}
                  </Button>
                </div>
              )}

              <div className={styles.clientList}>
                {filteredTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    onClick={() => setSelectedTenantId(tenant.id)}
                    className={`${styles.clientItem} ${selectedTenantId === tenant.id ? styles.clientItemSelected : ''}`}
                  >
                    <Avatar name={tenant.nameOrBusiness} size="sm" />
                    <div className={styles.clientInfo}>
                      <span className={styles.clientName}>{tenant.nameOrBusiness}</span>
                      <span className={styles.clientDetail}>DNI/CUIT: {tenant.dniOrCuit}</span>
                      <span className={styles.clientDetail}>{tenant.contactEmail}</span>
                    </div>
                    {selectedTenantId === tenant.id && <Check size={20} className={styles.checkIcon} />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Apartment */}
        {currentStep === 2 && (
          <Card>
            <CardHeader title="Seleccionar Unidad" subtitle="Elige la unidad que se alquilará" />
            <CardContent>
              <div className={styles.filtersRow}>
                <Input placeholder="Buscar por nomenclatura..." value={apartmentSearch}
                  onChange={(e) => setApartmentSearch(e.target.value)} leftIcon={<Search size={18} />} />
                <Select
                  options={[
                    { value: 'all', label: 'Todos los tipos' },
                    ...Object.values(PropertyType).map((t) => ({ value: t, label: getPropertyTypeLabel(t) })),
                  ]}
                  value={selectedPropertyType}
                  onChange={(e) => { setSelectedPropertyType(e.target.value as PropertyType | 'all'); setSelectedBuildingId('all') }}
                />
                {availableBuildings.length > 0 && (
                  <Select
                    options={[
                      { value: 'all', label: 'Todos los edificios' },
                      ...availableBuildings.map((b) => ({ value: b.id.toString(), label: b.name })),
                    ]}
                    value={selectedBuildingId === 'all' ? 'all' : selectedBuildingId.toString()}
                    onChange={(e) => setSelectedBuildingId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  />
                )}
              </div>

              <p className={styles.resultsCount}>{availableApartments.length} unidades disponibles</p>

              <div className={styles.apartmentGrid}>
                {availableApartments.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => setSelectedApartmentId(apt.id)}
                    className={`${styles.apartmentItem} ${selectedApartmentId === apt.id ? styles.apartmentItemSelected : ''}`}
                  >
                    <Badge variant="success">Disponible</Badge>
                    <div className={styles.apartmentInfo}>
                      <Building2 size={16} />
                      <span>{getBuildingName(apt.buildingId)}</span>
                    </div>
                    <div className={styles.apartmentInfo}>
                      <Home size={16} />
                      <span>Unidad: {apt.nomenclature || apt.fullAddress}</span>
                    </div>
                    <span className={styles.apartmentDetail}>{apt.rooms} amb • {apt.area}m²</span>
                    {selectedApartmentId === apt.id && <Check size={20} className={styles.checkIcon} />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Contract Details */}
        {currentStep === 3 && (
          <>
            <Card>
              <CardHeader title="Datos del Contrato" />
              <CardContent>
                <div className={styles.formGrid}>
                  <Input label="Fecha de Inicio *" type="date" value={contractData.startDate}
                    onChange={(e) => setContractData({ ...contractData, startDate: e.target.value })}
                    leftIcon={<Calendar size={18} />} fullWidth />
                  <Input label="Fecha de Fin *" type="date" value={contractData.endDate}
                    onChange={(e) => setContractData({ ...contractData, endDate: e.target.value })}
                    leftIcon={<Calendar size={18} />} fullWidth />
                  <Input label="Monto Inicial *" type="number" value={contractData.initialAmount}
                    onChange={(e) => setContractData({ ...contractData, initialAmount: e.target.value })}
                    leftIcon={<DollarSign size={18} />} placeholder="150000" fullWidth />
                  <Input label="Coeficiente Mensual" type="number" step="0.01" value={contractData.monthlyCoefficient}
                    onChange={(e) => setContractData({ ...contractData, monthlyCoefficient: e.target.value })} fullWidth />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Comisión de la Inmobiliaria" subtitle="Define la comisión sobre cada alquiler" />
              <CardContent>
                <div className={styles.formGrid}>
                  <Select label="Tipo de Comisión"
                    options={[
                      { value: '', label: 'Sin comisión' },
                      { value: 'percentage', label: 'Porcentaje del alquiler' },
                      { value: 'fixed', label: 'Monto fijo' },
                    ]}
                    value={contractData.commissionType}
                    onChange={(e) => setContractData({ ...contractData, commissionType: e.target.value as '' | 'percentage' | 'fixed', commissionValue: '' })}
                    fullWidth />
                  {contractData.commissionType && (
                    <Input
                      label={contractData.commissionType === 'percentage' ? 'Porcentaje (%)' : 'Monto Fijo (ARS)'}
                      type="number"
                      step={contractData.commissionType === 'percentage' ? '0.1' : '1'}
                      value={contractData.commissionValue}
                      onChange={(e) => setContractData({ ...contractData, commissionValue: e.target.value })}
                      leftIcon={contractData.commissionType === 'percentage' ? <Percent size={18} /> : <DollarSign size={18} />}
                      placeholder={contractData.commissionType === 'percentage' ? '10' : '15000'}
                      fullWidth />
                  )}
                </div>
                {contractData.commissionType === 'percentage' && contractData.initialAmount && contractData.commissionValue && (
                  <p className={styles.commissionEstimate}>
                    Comisión estimada: ${(parseFloat(contractData.initialAmount) * (parseFloat(contractData.commissionValue) / 100)).toLocaleString('es-AR')} por mes
                  </p>
                )}
                <div className={styles.infoBox}>
                  <p>💡 <strong>Importante:</strong> Esta comisión se aplicará automáticamente a cada obligación de alquiler generada.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Actualización del Alquiler" subtitle="Configura cómo se actualizará el monto del alquiler" />
              <CardContent>
                <div className={styles.formGrid}>
                  <Select label="Tipo de Actualización"
                    options={[
                      { value: '', label: 'Sin actualización automática' },
                      { value: 'icl', label: 'ICL (Índice para Contratos de Locación)' },
                      { value: 'ipc', label: 'IPC (Índice de Precios al Consumidor)' },
                      { value: 'fixed', label: 'Coeficiente Fijo' },
                    ]}
                    value={contractData.updateIndexType}
                    onChange={(e) => setContractData({ ...contractData, updateIndexType: e.target.value as '' | 'icl' | 'ipc' | 'fixed' | 'none' })}
                    fullWidth />
                  {contractData.updateIndexType && contractData.updateIndexType !== 'none' && (
                    <Input
                      label="Frecuencia de Actualización (meses)"
                      type="number"
                      min="1"
                      max="12"
                      value={contractData.updateFrequencyMonths}
                      onChange={(e) => setContractData({ ...contractData, updateFrequencyMonths: e.target.value })}
                      hint="Cada cuántos meses se actualiza el alquiler"
                      fullWidth />
                  )}
                  {contractData.updateIndexType === 'fixed' && (
                    <Input
                      label="Coeficiente de Actualización"
                      type="number"
                      step="0.01"
                      value={contractData.fixedUpdateCoefficient}
                      onChange={(e) => setContractData({ ...contractData, fixedUpdateCoefficient: e.target.value })}
                      hint="Ej: 1.05 = 5% de aumento"
                      fullWidth />
                  )}
                </div>
                {(contractData.updateIndexType === 'icl' || contractData.updateIndexType === 'ipc') && (
                  <div className={styles.infoBox}>
                    {loadingIndex ? (
                      <p>⏳ Obteniendo valor actual del índice...</p>
                    ) : currentIndexValue ? (
                      <>
                        <p>📊 <strong>Valor actual del {contractData.updateIndexType.toUpperCase()}:</strong> {currentIndexValue}</p>
                        <p>Este valor se guardará como referencia inicial para calcular las actualizaciones futuras.</p>
                      </>
                    ) : (
                      <p>⚠️ No se pudo obtener el valor del índice. Se intentará al crear el contrato.</p>
                    )}
                  </div>
                )}
                {contractData.updateIndexType === 'fixed' && contractData.initialAmount && contractData.fixedUpdateCoefficient && (
                  <div className={styles.infoBox}>
                    <p>📈 <strong>Ejemplo de actualización:</strong></p>
                    <p>Monto actual: ${parseFloat(contractData.initialAmount).toLocaleString('es-AR')}</p>
                    <p>Después de {contractData.updateFrequencyMonths} meses: ${Math.round(parseFloat(contractData.initialAmount) * parseFloat(contractData.fixedUpdateCoefficient)).toLocaleString('es-AR')}</p>
                  </div>
                )}
                {contractData.updateIndexType && (
                  <div className={styles.infoBox}>
                    <p>💡 <strong>Importante:</strong> La actualización se aplicará automáticamente cada {contractData.updateFrequencyMonths} meses a las obligaciones de alquiler generadas.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Garantes" subtitle="Selecciona garantes existentes o crea uno nuevo"
                action={!showNewGuarantorForm && (
                  <Button size="sm" variant="secondary" leftIcon={<Plus size={14} />} onClick={() => setShowNewGuarantorForm(true)}>
                    Nuevo Garante
                  </Button>
                )} />
              <CardContent>
                {showNewGuarantorForm && (
                  <div className={styles.newClientForm}>
                    <div className={styles.formHeader}>
                      <h4>Crear Nuevo Garante</h4>
                      <Button variant="ghost" size="sm" onClick={() => setShowNewGuarantorForm(false)}><X size={16} /></Button>
                    </div>
                    <div className={styles.formGrid}>
                      <Input label="Nombre Completo *" value={newGuarantorData.name}
                        onChange={(e) => setNewGuarantorData({ ...newGuarantorData, name: e.target.value })} fullWidth />
                      <Input label="DNI *" value={newGuarantorData.dni}
                        onChange={(e) => setNewGuarantorData({ ...newGuarantorData, dni: e.target.value })} fullWidth />
                      <Input label="Dirección *" value={newGuarantorData.address}
                        onChange={(e) => setNewGuarantorData({ ...newGuarantorData, address: e.target.value })} fullWidth />
                      <Input label="Email *" type="email" value={newGuarantorData.email}
                        onChange={(e) => setNewGuarantorData({ ...newGuarantorData, email: e.target.value })} fullWidth />
                      <Input label="Teléfono *" value={newGuarantorData.phone}
                        onChange={(e) => setNewGuarantorData({ ...newGuarantorData, phone: e.target.value })} fullWidth />
                    </div>
                    <Button onClick={handleCreateGuarantor} loading={creatingGuarantor}>Crear Garante</Button>
                  </div>
                )}

                <div className={styles.guarantorList}>
                  {guarantors.length === 0 && !showNewGuarantorForm ? (
                    <p className={styles.emptyText}>No hay garantes registrados. Crea uno nuevo usando el botón de arriba.</p>
                  ) : (
                    guarantors.map((g) => (
                      <div key={g.id} onClick={() => toggleGuarantor(g.id)}
                        className={`${styles.guarantorItem} ${selectedGuarantorIds.includes(g.id) ? styles.guarantorItemSelected : ''}`}>
                        <div>
                          <span className={styles.guarantorName}>{g.name}</span>
                          <span className={styles.guarantorDetail}>DNI: {g.dni} • {g.email}</span>
                        </div>
                        {selectedGuarantorIds.includes(g.id) && <Check size={20} className={styles.checkIcon} />}
                      </div>
                    ))
                  )}
                </div>
                {selectedGuarantorIds.length > 0 && (
                  <p className={styles.selectedCount}>{selectedGuarantorIds.length} garante(s) seleccionado(s)</p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 4: Recurring Obligations */}
        {currentStep === 4 && (
          <Card>
            <CardHeader title="Obligaciones Recurrentes" subtitle="Define obligaciones que se generarán automáticamente cada mes" />
            <CardContent>
              {!createdContractId ? (
                <div className={styles.warningBox}>
                  <p>⚠️ Primero debes crear el contrato en el paso 3</p>
                </div>
              ) : (
                <>
                  <div className={styles.infoBox}>
                    <Repeat size={18} />
                    <div>
                      <h4>Cómo funciona</h4>
                      <p>Las obligaciones recurrentes son plantillas. El sistema generará automáticamente las obligaciones mes a mes según estas plantillas.</p>
                    </div>
                  </div>

                  <div className={styles.sectionHeader}>
                    <h4>Plantillas de Obligaciones</h4>
                    {!showRecurringForm && (
                      <Button size="sm" variant="secondary" leftIcon={<Plus size={14} />} onClick={() => setShowRecurringForm(true)}>
                        Agregar Obligación Recurrente
                      </Button>
                    )}
                  </div>

                  {showRecurringForm && (
                    <div className={styles.newClientForm}>
                      <div className={styles.formHeader}>
                        <h4>Nueva Obligación Recurrente</h4>
                        <Button variant="ghost" size="sm" onClick={() => setShowRecurringForm(false)}><X size={16} /></Button>
                      </div>
                      <div className={styles.formGrid}>
                        <Select label="Tipo *" options={RECURRING_TYPES} value={newRecurring.type}
                          onChange={(e) => setNewRecurring({ ...newRecurring, type: e.target.value })} fullWidth />
                        <Input label="Monto Mensual *" type="number" value={newRecurring.amount}
                          onChange={(e) => setNewRecurring({ ...newRecurring, amount: e.target.value })}
                          leftIcon={<DollarSign size={18} />} fullWidth />
                        <Input label="Descripción *" value={newRecurring.description}
                          onChange={(e) => setNewRecurring({ ...newRecurring, description: e.target.value })}
                          placeholder="Ej: Expensas edificio" fullWidth />
                        <Input label="Día de Vencimiento *" type="number" min="1" max="28" value={newRecurring.dayOfMonth}
                          onChange={(e) => setNewRecurring({ ...newRecurring, dayOfMonth: e.target.value })}
                          hint="Día del mes (1-28)" fullWidth />
                      </div>
                      <Button onClick={handleAddRecurring} leftIcon={<Plus size={16} />}
                        disabled={!newRecurring.description || !newRecurring.amount || !newRecurring.dayOfMonth}>
                        Crear Plantilla
                      </Button>
                    </div>
                  )}

                  {recurringObligations.length > 0 && (
                    <div className={styles.recurringList}>
                      <h4>Plantillas Creadas</h4>
                      {recurringObligations.map((recurring) => (
                        <div key={recurring.id} className={styles.recurringItem}>
                          <div className={styles.recurringInfo}>
                            <div className={styles.recurringBadges}>
                              <Badge>{RECURRING_TYPES.find((t) => t.value === recurring.type)?.label || recurring.type}</Badge>
                              <Badge variant="success"><Repeat size={12} /> Activa</Badge>
                            </div>
                            <span className={styles.recurringDesc}>{recurring.description}</span>
                            <span className={styles.recurringAmount}>
                              ${parseFloat(recurring.amount).toLocaleString('es-AR')} - Vence día {recurring.dayOfMonth} de cada mes
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => recurring.id && handleRemoveRecurring(recurring.id)}>
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {recurringObligations.length > 0 && (
                    <div className={styles.successBox}>
                      <p>✓ {recurringObligations.length} plantilla(s) de obligaciones recurrentes creada(s)</p>
                      <span>El sistema generará las obligaciones automáticamente cada mes</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 5: Documents */}
        {currentStep === 5 && (
          <Card>
            <CardHeader title="Documentos del Contrato" subtitle="Sube los documentos relacionados con el contrato (opcional)" />
            <CardContent>
              {!createdContractId ? (
                <div className={styles.warningBox}>
                  <p>⚠️ Primero debes crear el contrato en el paso 3</p>
                </div>
              ) : (
                <>
                  <div className={styles.uploadArea}>
                    <input
                      type="file"
                      id="contractDocument"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className={styles.fileInput}
                    />
                    <label htmlFor="contractDocument" className={styles.uploadLabel}>
                      <Upload size={32} />
                      <p>Click para seleccionar archivos</p>
                      <span>PDF, Word, o imágenes (máx. 10MB por archivo)</span>
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className={styles.fileList}>
                      <h4>Archivos Seleccionados</h4>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className={styles.fileItem}>
                          <div className={styles.fileInfo}>
                            <FileText size={18} />
                            <div>
                              <span>{file.name}</span>
                              <span className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(index)}>
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                      <Button onClick={handleUploadDocuments} leftIcon={<Upload size={16} />} fullWidth>
                        Subir {selectedFiles.length} Documento(s)
                      </Button>
                    </div>
                  )}

                  {uploadedDocuments.length > 0 && (
                    <div className={styles.uploadedList}>
                      <h4>Documentos Subidos</h4>
                      {uploadedDocuments.map((doc, index) => (
                        <div key={index} className={styles.uploadedItem}>
                          <Check size={18} />
                          <span>{doc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className={styles.actions}>
          {currentStep > 1 && currentStep !== 4 && (
            <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 4 && createdContractId !== null}>
              Anterior
            </Button>
          )}
          <div className={styles.actionsSpacer} />
          
          {currentStep === 3 ? (
            <Button onClick={handleCreateContract} loading={loading} disabled={!canProceed()} leftIcon={<Check size={16} />}>
              Crear y Continuar
            </Button>
          ) : currentStep < STEPS.length ? (
            <Button rightIcon={<ArrowRight size={16} />} onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed() || (currentStep === 4 && !createdContractId)}>
              Siguiente
            </Button>
          ) : (
            <Button onClick={handleFinalSubmit} leftIcon={<Check size={16} />} variant="primary">
              Finalizar
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
