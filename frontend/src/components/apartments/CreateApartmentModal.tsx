'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Building2, 
  Home, 
  MapPin, 
  Sparkles,
  Building,
  Castle,
  Store,
  Car,
  Warehouse,
  TreePine,
  Briefcase,
  ChevronRight,
  Check,
  Loader2
} from 'lucide-react'
import { useApartments } from '@/hooks/useApartments'
import { useBuildings } from '@/hooks/useBuildings'
import { useOwners } from '@/hooks/useOwners'
import { ApartmentStatus, PropertyType, SaleStatus } from '@/types'
import styles from './CreateApartmentModal.module.css'

interface CreateApartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  preselectedBuildingId?: string | null
}

const propertyTypeCards = [
  { value: PropertyType.HOUSE, label: 'Casa', icon: Home, color: '#10b981' },
  { value: PropertyType.DUPLEX, label: 'Duplex', icon: Castle, color: '#8b5cf6' },
  { value: PropertyType.PH, label: 'PH', icon: Building, color: '#f59e0b' },
  { value: PropertyType.OFFICE, label: 'Oficina', icon: Briefcase, color: '#3b82f6' },
  { value: PropertyType.COMMERCIAL, label: 'Local', icon: Store, color: '#ec4899' },
  { value: PropertyType.PARKING, label: 'Cochera', icon: Car, color: '#6366f1' },
  { value: PropertyType.WAREHOUSE, label: 'Depósito', icon: Warehouse, color: '#14b8a6' },
  { value: PropertyType.LAND, label: 'Terreno', icon: TreePine, color: '#84cc16' },
]

export function CreateApartmentModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  preselectedBuildingId 
}: CreateApartmentModalProps) {
  const { createApartment } = useApartments()
  const { buildings } = useBuildings()
  const { owners } = useOwners()
  
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [isIndependent, setIsIndependent] = useState<boolean | null>(
    preselectedBuildingId ? false : null
  )
  const [showPropertyTypes, setShowPropertyTypes] = useState(false)
  const [formData, setFormData] = useState({
    buildingId: preselectedBuildingId || '',
    ownerId: '',
    floor: '',
    apartmentLetter: '',
    nomenclature: '',
    fullAddress: '',
    city: '',
    province: '',
    propertyType: PropertyType.APARTMENT,
    area: '',
    rooms: '',
    status: ApartmentStatus.AVAILABLE,
    saleStatus: SaleStatus.NOT_FOR_SALE,
  })

  useEffect(() => {
    if (isIndependent === true) {
      const timer = setTimeout(() => setShowPropertyTypes(true), 300)
      return () => clearTimeout(timer)
    } else {
      setShowPropertyTypes(false)
    }
  }, [isIndependent])

  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setIsIndependent(preselectedBuildingId ? false : null)
      setShowPropertyTypes(false)
      setFormData({
        buildingId: preselectedBuildingId || '',
        ownerId: '',
        floor: '',
        apartmentLetter: '',
        nomenclature: '',
        fullAddress: '',
        city: '',
        province: '',
        propertyType: PropertyType.APARTMENT,
        area: '',
        rooms: '',
        status: ApartmentStatus.AVAILABLE,
        saleStatus: SaleStatus.NOT_FOR_SALE,
      })
    }
  }, [isOpen, preselectedBuildingId])

  const handleSubmit = async () => {
    if (!formData.area || !formData.rooms) return
    if (!isIndependent && !formData.buildingId) return
    if (isIndependent && !formData.fullAddress) return

    setLoading(true)
    try {
      await createApartment({
        buildingId: isIndependent ? undefined : Number(formData.buildingId),
        ownerId: formData.ownerId ? Number(formData.ownerId) : undefined,
        floor: formData.floor ? Number(formData.floor) : undefined,
        apartmentLetter: formData.apartmentLetter || undefined,
        nomenclature: formData.nomenclature,
        fullAddress: isIndependent ? formData.fullAddress : undefined,
        city: isIndependent ? formData.city : undefined,
        province: isIndependent ? formData.province : undefined,
        propertyType: formData.propertyType,
        area: Number(formData.area),
        rooms: Number(formData.rooms),
        status: formData.status,
        saleStatus: formData.saleStatus,
      })
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error creating apartment:', error)
    } finally {
      setLoading(false)
    }
  }

  const canProceedToStep2 = isIndependent !== null && (
    (isIndependent && formData.propertyType && formData.fullAddress) ||
    (!isIndependent && formData.buildingId)
  )

  const canSubmit = canProceedToStep2 && formData.area && formData.rooms

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <Sparkles className={styles.sparkleIcon} />
            </div>
            <div>
              <h2 className={styles.title}>Nueva Propiedad</h2>
              <p className={styles.subtitle}>
                {step === 1 ? 'Selecciona el tipo y ubicación' : 'Completa los detalles'}
              </p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Progress indicator */}
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Content */}
        <div className={styles.content}>
          {step === 1 ? (
            <>
              {/* Property Mode Selection */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>¿Qué tipo de propiedad es?</label>
                <div className={styles.modeSelector}>
                  <button
                    className={`${styles.modeCard} ${isIndependent === false ? styles.modeCardActive : ''}`}
                    onClick={() => {
                      setIsIndependent(false)
                      setFormData(prev => ({ ...prev, propertyType: PropertyType.APARTMENT }))
                    }}
                  >
                    <div className={styles.modeIconWrapper}>
                      <Building2 size={28} />
                    </div>
                    <div className={styles.modeInfo}>
                      <span className={styles.modeTitle}>En Edificio</span>
                      <span className={styles.modeDesc}>Departamento en un edificio existente</span>
                    </div>
                    {isIndependent === false && (
                      <div className={styles.checkBadge}>
                        <Check size={14} />
                      </div>
                    )}
                  </button>

                  <button
                    className={`${styles.modeCard} ${isIndependent === true ? styles.modeCardActive : ''}`}
                    onClick={() => setIsIndependent(true)}
                  >
                    <div className={styles.modeIconWrapper}>
                      <Home size={28} />
                    </div>
                    <div className={styles.modeInfo}>
                      <span className={styles.modeTitle}>Independiente</span>
                      <span className={styles.modeDesc}>Casa, PH, local u otra propiedad</span>
                    </div>
                    {isIndependent === true && (
                      <div className={styles.checkBadge}>
                        <Check size={14} />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Property Type Cards - Only for Independent */}
              {isIndependent === true && (
                <div className={`${styles.section} ${styles.revealSection} ${showPropertyTypes ? styles.revealed : ''}`}>
                  <label className={styles.sectionLabel}>
                    <Sparkles size={14} className={styles.labelSparkle} />
                    Tipo de propiedad
                  </label>
                  <div className={styles.propertyTypeGrid}>
                    {propertyTypeCards.map((type, index) => {
                      const Icon = type.icon
                      const isSelected = formData.propertyType === type.value
                      return (
                        <button
                          key={type.value}
                          className={`${styles.propertyTypeCard} ${isSelected ? styles.propertyTypeCardActive : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, propertyType: type.value }))}
                          style={{ 
                            '--card-color': type.color,
                            '--card-delay': `${index * 50}ms`
                          } as React.CSSProperties}
                        >
                          <div className={styles.propertyTypeIcon} style={{ color: type.color }}>
                            <Icon size={24} />
                          </div>
                          <span className={styles.propertyTypeLabel}>{type.label}</span>
                          {isSelected && (
                            <div className={styles.selectedGlow} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Location Fields */}
              {isIndependent !== null && (
                <div className={`${styles.section} ${styles.revealSection} ${isIndependent !== null ? styles.revealed : ''}`}>
                  <label className={styles.sectionLabel}>Ubicación</label>
                  
                  {!isIndependent ? (
                    <div className={styles.fieldGroup}>
                      <div className={styles.selectWrapper}>
                        <Building2 size={18} className={styles.fieldIcon} />
                        <select
                          className={styles.select}
                          value={formData.buildingId}
                          onChange={(e) => setFormData(prev => ({ ...prev, buildingId: e.target.value }))}
                        >
                          <option value="">Selecciona un edificio...</option>
                          {buildings.map((b) => (
                            <option key={b.id} value={b.id.toString()}>
                              {b.name} - {b.address}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.inlineFields}>
                        <div className={styles.inputWrapper}>
                          <input
                            type="number"
                            className={styles.input}
                            placeholder="Piso"
                            value={formData.floor}
                            onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                          />
                        </div>
                        <div className={styles.inputWrapper}>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder="Unidad (ej: A)"
                            value={formData.apartmentLetter}
                            onChange={(e) => setFormData(prev => ({ ...prev, apartmentLetter: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.fieldGroup}>
                      <div className={styles.inputWrapper}>
                        <MapPin size={18} className={styles.fieldIcon} />
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Dirección completa *"
                          value={formData.fullAddress}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullAddress: e.target.value }))}
                        />
                      </div>
                      <div className={styles.inlineFields}>
                        <div className={styles.inputWrapper}>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder="Ciudad"
                            value={formData.city}
                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          />
                        </div>
                        <div className={styles.inputWrapper}>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder="Provincia"
                            value={formData.province}
                            onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Step 2: Details */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>Detalles de la propiedad</label>
                <div className={styles.detailsGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Superficie (m²) *</label>
                    <input
                      type="number"
                      className={styles.input}
                      placeholder="50"
                      value={formData.area}
                      onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Ambientes *</label>
                    <input
                      type="number"
                      className={styles.input}
                      placeholder="2"
                      value={formData.rooms}
                      onChange={(e) => setFormData(prev => ({ ...prev, rooms: e.target.value }))}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Nomenclatura</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder={isIndependent ? "Casa Principal" : "1A"}
                      value={formData.nomenclature}
                      onChange={(e) => setFormData(prev => ({ ...prev, nomenclature: e.target.value }))}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Estado</label>
                    <select
                      className={styles.select}
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ApartmentStatus }))}
                    >
                      <option value={ApartmentStatus.AVAILABLE}>Disponible</option>
                      <option value={ApartmentStatus.RENTED}>Alquilado</option>
                      <option value={ApartmentStatus.UNDER_RENOVATION}>En Refacción</option>
                      <option value={ApartmentStatus.PERSONAL_USE}>Uso Propio</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <label className={styles.sectionLabel}>Propietario (opcional)</label>
                <div className={styles.selectWrapper}>
                  <select
                    className={styles.select}
                    value={formData.ownerId}
                    onChange={(e) => setFormData(prev => ({ ...prev, ownerId: e.target.value }))}
                  >
                    <option value="">Sin propietario asignado</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id.toString()}>
                        {o.name} - {o.dniOrCuit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {step === 2 && (
            <button 
              className={styles.backButton}
              onClick={() => setStep(1)}
            >
              Volver
            </button>
          )}
          <div className={styles.footerRight}>
            <button className={styles.cancelButton} onClick={onClose}>
              Cancelar
            </button>
            {step === 1 ? (
              <button
                className={styles.nextButton}
                disabled={!canProceedToStep2}
                onClick={() => setStep(2)}
              >
                Continuar
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                className={styles.submitButton}
                disabled={!canSubmit || loading}
                onClick={handleSubmit}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className={styles.spinner} />
                    Creando...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Crear Propiedad
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
