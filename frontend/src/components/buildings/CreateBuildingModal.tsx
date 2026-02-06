'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  X, 
  Building2, 
  MapPin, 
  Sparkles,
  Layers,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Check,
  Loader2,
  Plus,
  Minus,
  User,
  Ruler
} from 'lucide-react'
import { useBuildings } from '@/hooks/useBuildings'
import { useOwners } from '@/hooks/useOwners'
import { FloorConfiguration } from '@/types'
import styles from './CreateBuildingModal.module.css'

interface CreateBuildingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const PROVINCES = [
  { value: 'Buenos Aires', label: 'Buenos Aires' },
  { value: 'CABA', label: 'CABA' },
  { value: 'Catamarca', label: 'Catamarca' },
  { value: 'Chaco', label: 'Chaco' },
  { value: 'Chubut', label: 'Chubut' },
  { value: 'Córdoba', label: 'Córdoba' },
  { value: 'Corrientes', label: 'Corrientes' },
  { value: 'Entre Ríos', label: 'Entre Ríos' },
  { value: 'Formosa', label: 'Formosa' },
  { value: 'Jujuy', label: 'Jujuy' },
  { value: 'La Pampa', label: 'La Pampa' },
  { value: 'La Rioja', label: 'La Rioja' },
  { value: 'Mendoza', label: 'Mendoza' },
  { value: 'Misiones', label: 'Misiones' },
  { value: 'Neuquén', label: 'Neuquén' },
  { value: 'Río Negro', label: 'Río Negro' },
  { value: 'Salta', label: 'Salta' },
  { value: 'San Juan', label: 'San Juan' },
  { value: 'San Luis', label: 'San Luis' },
  { value: 'Santa Cruz', label: 'Santa Cruz' },
  { value: 'Santa Fe', label: 'Santa Fe' },
  { value: 'Santiago del Estero', label: 'Santiago del Estero' },
  { value: 'Tierra del Fuego', label: 'Tierra del Fuego' },
  { value: 'Tucumán', label: 'Tucumán' },
]

export function CreateBuildingModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: CreateBuildingModalProps) {
  const { createBuilding } = useBuildings()
  const { owners } = useOwners()
  
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    province: '',
    city: '',
    ownerId: '',
    owner: '',
    floors: 1,
    totalArea: '',
  })
  const [floorConfig, setFloorConfig] = useState<FloorConfiguration[]>([
    { floor: 1, apartmentsCount: 2 },
  ])
  const [uniformUnits, setUniformUnits] = useState(true)
  const [unitsPerFloor, setUnitsPerFloor] = useState(2)

  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setFormData({
        name: '',
        address: '',
        province: '',
        city: '',
        ownerId: '',
        owner: '',
        floors: 1,
        totalArea: '',
      })
      setFloorConfig([{ floor: 1, apartmentsCount: 2 }])
      setUniformUnits(true)
      setUnitsPerFloor(2)
    }
  }, [isOpen])

  const handleFloorsChange = (newFloors: number) => {
    const floors = Math.max(1, Math.min(30, newFloors))
    setFormData((prev) => ({ ...prev, floors }))

    const newConfigs: FloorConfiguration[] = []
    for (let i = 1; i <= floors; i++) {
      const existing = floorConfig.find(fc => fc.floor === i)
      newConfigs.push({ 
        floor: i, 
        apartmentsCount: existing?.apartmentsCount || unitsPerFloor 
      })
    }
    setFloorConfig(newConfigs)
  }

  const handleUniformUnitsChange = (units: number) => {
    const safeUnits = Math.max(1, Math.min(12, units))
    setUnitsPerFloor(safeUnits)
    if (uniformUnits) {
      setFloorConfig(prev => prev.map(fc => ({ ...fc, apartmentsCount: safeUnits })))
    }
  }

  const handleFloorConfigChange = (floor: number, apartmentsCount: number) => {
    const safeCount = Math.max(1, Math.min(12, apartmentsCount))
    setFloorConfig((prev) =>
      prev.map((fc) =>
        fc.floor === floor ? { ...fc, apartmentsCount: safeCount } : fc
      )
    )
  }

  const totalUnits = useMemo(() => 
    floorConfig.reduce((sum, fc) => sum + fc.apartmentsCount, 0), 
    [floorConfig]
  )

  const handleSubmit = async () => {
    if (!formData.name || !formData.address || !formData.province || !formData.city) {
      return
    }

    setLoading(true)
    try {
      await createBuilding({
        name: formData.name,
        address: formData.address,
        province: formData.province,
        city: formData.city,
        owner: formData.owner,
        ownerId: formData.ownerId ? parseInt(formData.ownerId) : undefined,
        floors: formData.floors,
        totalArea: formData.totalArea ? Number(formData.totalArea) : 0,
        floorConfiguration: floorConfig,
      })
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error creating building:', error)
    } finally {
      setLoading(false)
    }
  }

  const canProceedToStep2 = formData.name && formData.address && formData.province && formData.city

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <Building2 className={styles.buildingIcon} />
            </div>
            <div>
              <h2 className={styles.title}>Nuevo Edificio</h2>
              <p className={styles.subtitle}>
                {step === 1 ? 'Información básica y ubicación' : 'Estructura del edificio'}
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
              {/* Basic Info */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>Identificación</label>
                <div className={styles.fieldGroup}>
                  <div className={styles.inputWrapper}>
                    <Building2 size={18} className={styles.fieldIcon} />
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Nombre del edificio *"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className={styles.selectWrapper}>
                    <User size={18} className={styles.fieldIcon} />
                    <select
                      className={styles.select}
                      value={formData.ownerId}
                      onChange={(e) => {
                        const selectedOwner = owners.find(o => o.id.toString() === e.target.value)
                        setFormData(prev => ({ 
                          ...prev, 
                          ownerId: e.target.value,
                          owner: selectedOwner?.name || ''
                        }))
                      }}
                    >
                      <option value="">Propietario (opcional)</option>
                      {owners.map((o) => (
                        <option key={o.id} value={o.id.toString()}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>Ubicación</label>
                <div className={styles.fieldGroup}>
                  <div className={styles.inputWrapper}>
                    <MapPin size={18} className={styles.fieldIcon} />
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Dirección completa *"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className={styles.inlineFields}>
                    <div className={styles.inputWrapper}>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Ciudad *"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div className={styles.selectWrapper}>
                      <select
                        className={styles.select}
                        value={formData.province}
                        onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                      >
                        <option value="">Provincia *</option>
                        {PROVINCES.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Area */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>Superficie (opcional)</label>
                <div className={styles.inputWrapper}>
                  <Ruler size={18} className={styles.fieldIcon} />
                  <input
                    type="number"
                    className={styles.input}
                    placeholder="Área total en m²"
                    value={formData.totalArea}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalArea: e.target.value }))}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Building Structure */}
              <div className={styles.structureSection}>
                {/* Left: Controls */}
                <div className={styles.structureControls}>
                  <div className={styles.section}>
                    <label className={styles.sectionLabel}>
                      <Layers size={14} />
                      Cantidad de Pisos
                    </label>
                    <div className={styles.counterControl}>
                      <button 
                        className={styles.counterBtn}
                        onClick={() => handleFloorsChange(formData.floors - 1)}
                        disabled={formData.floors <= 1}
                      >
                        <Minus size={18} />
                      </button>
                      <span className={styles.counterValue}>{formData.floors}</span>
                      <button 
                        className={styles.counterBtn}
                        onClick={() => handleFloorsChange(formData.floors + 1)}
                        disabled={formData.floors >= 30}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.section}>
                    <div className={styles.uniformToggle}>
                      <label className={styles.sectionLabel}>Unidades por piso</label>
                      <button 
                        className={`${styles.toggleBtn} ${uniformUnits ? styles.toggleActive : ''}`}
                        onClick={() => setUniformUnits(!uniformUnits)}
                      >
                        {uniformUnits ? 'Uniforme' : 'Variable'}
                      </button>
                    </div>
                    
                    {uniformUnits ? (
                      <div className={styles.counterControl}>
                        <button 
                          className={styles.counterBtn}
                          onClick={() => handleUniformUnitsChange(unitsPerFloor - 1)}
                          disabled={unitsPerFloor <= 1}
                        >
                          <Minus size={18} />
                        </button>
                        <span className={styles.counterValue}>{unitsPerFloor}</span>
                        <button 
                          className={styles.counterBtn}
                          onClick={() => handleUniformUnitsChange(unitsPerFloor + 1)}
                          disabled={unitsPerFloor >= 12}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className={styles.floorList}>
                        {floorConfig.slice().reverse().map((fc, index) => (
                          <div 
                            key={fc.floor} 
                            className={styles.floorItem}
                            style={{ '--floor-delay': `${index * 30}ms` } as React.CSSProperties}
                          >
                            <span className={styles.floorLabel}>Piso {fc.floor}</span>
                            <div className={styles.floorCounter}>
                              <button 
                                className={styles.miniBtn}
                                onClick={() => handleFloorConfigChange(fc.floor, fc.apartmentsCount - 1)}
                                disabled={fc.apartmentsCount <= 1}
                              >
                                <Minus size={14} />
                              </button>
                              <span>{fc.apartmentsCount}</span>
                              <button 
                                className={styles.miniBtn}
                                onClick={() => handleFloorConfigChange(fc.floor, fc.apartmentsCount + 1)}
                                disabled={fc.apartmentsCount >= 12}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className={styles.statsRow}>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{formData.floors}</span>
                      <span className={styles.statLabel}>Pisos</span>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{totalUnits}</span>
                      <span className={styles.statLabel}>Unidades</span>
                    </div>
                  </div>
                </div>

                {/* Right: Building Preview */}
                <div 
                  className={styles.buildingPreview}
                  style={{
                    '--floor-count': formData.floors,
                    '--max-units': Math.max(...floorConfig.map(fc => fc.apartmentsCount)),
                  } as React.CSSProperties}
                >
                  <div className={styles.buildingWrapper}>
                    <div className={styles.buildingRoof}>
                      <div className={styles.roofTop} />
                    </div>
                    <div className={styles.buildingBody}>
                      {floorConfig.slice().reverse().map((fc, index) => (
                        <div 
                          key={fc.floor} 
                          className={styles.floorRow}
                          style={{ '--floor-index': index } as React.CSSProperties}
                        >
                          <div className={styles.floorNumber}>{fc.floor}</div>
                          <div className={styles.unitsRow}>
                            {Array.from({ length: fc.apartmentsCount }).map((_, i) => (
                              <div 
                                key={i} 
                                className={styles.unitWindow}
                                style={{ '--unit-delay': `${(index * fc.apartmentsCount + i) * 20}ms` } as React.CSSProperties}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={styles.buildingBase}>
                      <div className={styles.entrance} />
                    </div>
                  </div>
                  <div className={styles.buildingName}>{formData.name || 'Edificio'}</div>
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
                disabled={loading}
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
                    Crear Edificio
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
