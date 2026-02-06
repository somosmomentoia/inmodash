'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Receipt,
  Wrench,
  Shield,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Repeat,
  Check,
  Building2,
  Briefcase,
  Info,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  Select,
} from '@/components/ui'
import { useObligations } from '@/hooks/useObligations'
import { useApartments } from '@/hooks/useApartments'
import { ObligationType, PaidBy } from '@/types'
import styles from './new-obligation.module.css'

// Configuración por tipo de obligación
// Define quién paga por defecto y si se puede cambiar
// Tipos de obligación disponibles para cargar manualmente
// NOTA: Los alquileres (rent) se generan automáticamente con los contratos
// NOTA: Las expensas fueron removidas - solo aplican a inquilinos y se manejan fuera del sistema
const OBLIGATION_TYPES: {
  value: ObligationType
  label: string
  icon: typeof Receipt
  description: string
  color: string
  defaultPaidBy: PaidBy
  showPaidBySelector: boolean
  allowedPaidBy?: PaidBy[]
  impactMessages: Record<PaidBy, string>
}[] = [
  {
    value: 'service',
    label: 'Servicio',
    icon: Wrench,
    description: 'Luz, agua, gas, internet, etc.',
    color: 'cyan',
    defaultPaidBy: 'owner',
    showPaidBySelector: true,
    allowedPaidBy: ['owner', 'agency'],
    impactMessages: {
      tenant: '', // No permitido
      owner: 'Se descuenta de la liquidación del propietario.',
      agency: 'La inmobiliaria asume el gasto.',
    },
  },
  {
    value: 'tax',
    label: 'Impuesto',
    icon: Receipt,
    description: 'ABL, ARBA, inmobiliario, etc.',
    color: 'red',
    defaultPaidBy: 'owner',
    showPaidBySelector: false,
    allowedPaidBy: ['owner'],
    impactMessages: {
      tenant: '', // No permitido
      owner: 'Se descuenta de la liquidación del propietario.',
      agency: '', // No permitido
    },
  },
  {
    value: 'insurance',
    label: 'Seguro',
    icon: Shield,
    description: 'Seguro de incendio, integral, etc.',
    color: 'blue',
    defaultPaidBy: 'owner',
    showPaidBySelector: true,
    allowedPaidBy: ['owner', 'agency'],
    impactMessages: {
      tenant: '', // No permitido
      owner: 'Se descuenta de la liquidación del propietario.',
      agency: 'La inmobiliaria asume el gasto.',
    },
  },
  {
    value: 'maintenance',
    label: 'Mantenimiento',
    icon: Wrench,
    description: 'Reparaciones y arreglos',
    color: 'yellow',
    defaultPaidBy: 'owner',
    showPaidBySelector: true,
    allowedPaidBy: ['owner', 'agency'],
    impactMessages: {
      tenant: '', // No permitido
      owner: 'Se descuenta de la liquidación del propietario.',
      agency: 'La inmobiliaria asume el gasto (no afecta propietario).',
    },
  },
  {
    value: 'debt',
    label: 'Ajuste / Crédito',
    icon: FileText,
    description: 'Ajustes a favor del propietario',
    color: 'gray',
    defaultPaidBy: 'agency',
    showPaidBySelector: false,
    allowedPaidBy: ['agency'],
    impactMessages: {
      tenant: '', // No permitido
      owner: '', // No permitido
      agency: 'Ajuste a favor del propietario. Se suma al saldo del propietario.',
    },
  },
]

const SERVICE_CATEGORIES = [
  { value: 'luz', label: 'Luz / Electricidad' },
  { value: 'agua', label: 'Agua' },
  { value: 'gas', label: 'Gas' },
  { value: 'internet', label: 'Internet / Cable' },
  { value: 'telefono', label: 'Teléfono' },
  { value: 'otro', label: 'Otro servicio' },
]

const TAX_CATEGORIES = [
  { value: 'abl', label: 'ABL' },
  { value: 'arba', label: 'ARBA' },
  { value: 'inmobiliario', label: 'Impuesto Inmobiliario' },
  { value: 'otro', label: 'Otro impuesto' },
]

const INSURANCE_CATEGORIES = [
  { value: 'caucion', label: 'Seguro de Caución' },
  { value: 'incendio', label: 'Seguro de Incendio' },
  { value: 'integral', label: 'Seguro Integral' },
  { value: 'otro', label: 'Otro seguro' },
]

export default function CreateObligationPage() {
  const router = useRouter()
  const { create } = useObligations()
  const { apartments } = useApartments()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [createdObligationId, setCreatedObligationId] = useState<number | null>(null)
  const [showOptionalFields, setShowOptionalFields] = useState(false)

  // Form state
  const [selectedType, setSelectedType] = useState<ObligationType | null>(null)
  const [apartmentId, setApartmentId] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [period, setPeriod] = useState('')
  const [notes, setNotes] = useState('')
  const [paidBy, setPaidBy] = useState<PaidBy>('owner')

  // Recurrence
  const [isRecurring, setIsRecurring] = useState(false)
  const [dayOfMonth, setDayOfMonth] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Get current type config
  const typeConfig = useMemo(() => {
    return selectedType ? OBLIGATION_TYPES.find((t) => t.value === selectedType) : null
  }, [selectedType])

  // Get category options based on type
  const categoryOptions = useMemo(() => {
    switch (selectedType) {
      case 'service':
        return SERVICE_CATEGORIES
      case 'tax':
        return TAX_CATEGORIES
      case 'insurance':
        return INSURANCE_CATEGORIES
      default:
        return []
    }
  }, [selectedType])

  const handleTypeSelect = (type: ObligationType) => {
    setSelectedType(type)
    const config = OBLIGATION_TYPES.find((t) => t.value === type)
    if (config) {
      setPaidBy(config.defaultPaidBy)
      if (!description) {
        setDescription(config.label)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType || !description || !amount || !apartmentId) return
    if (!isRecurring && !dueDate) return
    if (isRecurring && (!dayOfMonth || !startDate)) return

    setLoading(true)
    setError(null)

    try {
      const amountNum = parseFloat(amount)

      // Calculate ownerImpact and agencyImpact based on paidBy and type
      // NOTA: Ya no hay opción de inquilino, solo propietario o inmobiliaria
      let ownerImpact = 0
      let agencyImpact = 0
      
      if (selectedType === 'debt') {
        // Ajuste/Crédito: Solo inmobiliaria puede crear (a favor del propietario)
        ownerImpact = amountNum // Owner receives credit
        agencyImpact = -amountNum // Agency pays
      } else {
        // Obligaciones regulares (servicios, impuestos, seguros, mantenimiento)
        if (paidBy === 'owner') {
          ownerImpact = -amountNum // Se descuenta de liquidación del propietario
        } else if (paidBy === 'agency') {
          agencyImpact = -amountNum // Gasto de la inmobiliaria
        }
      }

      const basePayload: Record<string, unknown> = {
        apartmentId: parseInt(apartmentId),
        type: selectedType,
        category: category || undefined,
        description,
        period: period || new Date().toISOString(),
        amount: amountNum,
        paidBy,
        ownerImpact,
        agencyImpact,
        notes: notes || undefined,
      }
      
      if (isRecurring) {
        // TODO: Create recurring obligation via API
        // For now, just create a single obligation
        const obligation = await create({
          ...basePayload,
          dueDate: startDate,
        } as Parameters<typeof create>[0])
        setCreatedObligationId(obligation.id)
      } else {
        const obligation = await create({
          ...basePayload,
          dueDate,
        } as Parameters<typeof create>[0])
        setCreatedObligationId(obligation.id)
      }
      setSuccess(true)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la obligación'
      setError(errorMessage)
      setLoading(false)
    }
  }

  const canSubmit =
    selectedType &&
    description &&
    amount &&
    apartmentId &&
    (isRecurring ? dayOfMonth && startDate : dueDate)

  const resetForm = () => {
    setSuccess(false)
    setCreatedObligationId(null)
    setSelectedType(null)
    setDescription('')
    setDueDate('')
    setAmount('')
    setApartmentId('')
    setCategory('')
    setPeriod('')
    setNotes('')
    setPaidBy('owner')
    setIsRecurring(false)
    setDayOfMonth('')
    setStartDate('')
    setEndDate('')
  }

  // Success screen
  if (success) {
    return (
      <DashboardLayout title="Obligación Creada" subtitle="">
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>
            <Check size={32} />
          </div>
          <h2 className={styles.successTitle}>
            {isRecurring ? '¡Recurrencia creada!' : '¡Obligación creada!'}
          </h2>
          <p className={styles.successText}>
            {isRecurring
              ? 'La recurrencia se configuró correctamente. Las obligaciones se generarán automáticamente.'
              : 'La obligación se registró correctamente en el sistema.'}
          </p>
          <div className={styles.successActions}>
            {createdObligationId && (
              <Link href={`/obligations/${createdObligationId}`}>
                <Button>Registrar pago ahora</Button>
              </Link>
            )}
            <Link href="/obligations">
              <Button variant="secondary">Ver en cuenta corriente</Button>
            </Link>
            <Button variant="ghost" onClick={resetForm}>
              Crear otra obligación
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Nueva Obligación" subtitle="Registrar una nueva deuda o gasto">
      {/* Back Button */}
      <div className={styles.backRow}>
        <Link href="/obligations">
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
            Volver a Cuenta Corriente
          </Button>
        </Link>
      </div>

      {/* Info Box */}
      <div className={styles.infoBox}>
        <AlertCircle size={20} />
        <div>
          <p className={styles.infoTitle}>Los alquileres se generan automáticamente</p>
          <p className={styles.infoText}>
            Usa el botón "Generar Obligaciones" en Cuenta Corriente para crear los alquileres del
            mes.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Error */}
        {error && <div className={styles.errorBox}>{error}</div>}

        {/* Step 1: Type Selection */}
        <Card>
          <CardHeader title="¿Qué querés cargar?" />
          <CardContent>
            <div className={styles.typeGrid}>
              {OBLIGATION_TYPES.map((type) => {
                const Icon = type.icon
                const isSelected = selectedType === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeSelect(type.value)}
                    className={`${styles.typeCard} ${isSelected ? styles.typeCardSelected : ''}`}
                  >
                    <div className={`${styles.typeIcon} ${styles[`typeIcon${type.color}`]}`}>
                      <Icon size={24} />
                    </div>
                    <h3 className={styles.typeLabel}>{type.label}</h3>
                    <p className={styles.typeDesc}>{type.description}</p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Who Pays - Only show if type allows selection */}
        {selectedType && typeConfig?.showPaidBySelector && (
          <Card>
            <CardHeader title="¿Quién paga esta obligación?" />
            <CardContent>
              <div className={styles.paidBySelector}>
                {/* Owner option */}
                {typeConfig.allowedPaidBy?.includes('owner') && (
                  <button
                    type="button"
                    onClick={() => setPaidBy('owner')}
                    className={`${styles.paidByOption} ${paidBy === 'owner' ? styles.paidByOptionActive : ''}`}
                  >
                    <Briefcase size={20} />
                    <span>Propietario</span>
                    <small className={styles.paidByHint}>Se descuenta de liquidación</small>
                  </button>
                )}
                {/* Agency option */}
                {typeConfig.allowedPaidBy?.includes('agency') && (
                  <button
                    type="button"
                    onClick={() => setPaidBy('agency')}
                    className={`${styles.paidByOption} ${paidBy === 'agency' ? styles.paidByOptionActive : ''}`}
                  >
                    <Building2 size={20} />
                    <span>Inmobiliaria</span>
                    <small className={styles.paidByHint}>Gasto de la inmobiliaria</small>
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Where to apply */}
        {selectedType && (
          <Card>
            <CardHeader title="¿Dónde aplica?" />
            <CardContent>
              {/* Todas las obligaciones ahora se asocian a una unidad (propietario o inmobiliaria paga) */}
              <Select
                label="Unidad *"
                options={[
                  { value: '', label: 'Seleccionar unidad' },
                  ...apartments.map((a) => ({
                    value: a.id.toString(),
                    label: `${a.nomenclature || a.fullAddress || `Unidad #${a.id}`}${a.owner ? ` - ${a.owner.name}` : ''}`,
                  })),
                ]}
                value={apartmentId}
                onChange={(e) => setApartmentId(e.target.value)}
                fullWidth
              />
            </CardContent>
          </Card>
        )}

        {/* Impact Message */}
        {selectedType && apartmentId && typeConfig && (
          <div className={styles.impactMessage}>
            <Info size={18} />
            <p>{typeConfig.impactMessages[paidBy]}</p>
          </div>
        )}

        {/* Step 4: Essential Data */}
        {selectedType && apartmentId && (
          <Card>
            <CardHeader title="Datos esenciales" />
            <CardContent>
              <Input
                label="Descripción *"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: ABL Enero 2025"
                fullWidth
              />

              {/* Recurring Toggle */}
              <div className={styles.recurringToggle}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                  <Repeat size={18} />
                  <span>Crear como recurrente</span>
                </label>
                <p className={styles.recurringHint}>Se generará automáticamente cada mes</p>
              </div>

              {!isRecurring ? (
                <Input
                  label="Fecha de vencimiento *"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  fullWidth
                />
              ) : (
                <>
                  <Input
                    label="Día del mes para vencimiento *"
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    placeholder="Ej: 10"
                    hint="La obligación vencerá este día cada mes"
                    fullWidth
                  />
                  <div className={styles.formGrid}>
                    <Input
                      label="Desde cuándo generar *"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      fullWidth
                    />
                    <Input
                      label="Hasta cuándo generar (opcional)"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      hint="Dejar vacío para generar indefinidamente"
                      fullWidth
                    />
                  </div>
                </>
              )}

              <Input
                label="Monto *"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                fullWidth
              />
            </CardContent>
          </Card>
        )}

        {/* Step 4: Optional Details */}
        {selectedType && apartmentId && (
          <Card>
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className={styles.optionalHeader}
            >
              <span>Detalles opcionales</span>
              {showOptionalFields ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {showOptionalFields && (
              <CardContent>
                <Input
                  label="Categoría"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ej: Mensual, Trimestral, etc."
                  fullWidth
                />
                <Input
                  label="Período"
                  type="month"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  fullWidth
                />
                <div className={styles.textareaWrapper}>
                  <label className={styles.textareaLabel}>Notas</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Notas adicionales..."
                    className={styles.textarea}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Actions */}
        {selectedType && (
          <div className={styles.actions}>
            <Button type="submit" disabled={!canSubmit || loading} loading={loading} fullWidth>
              {isRecurring ? 'Crear Recurrencia' : 'Crear Obligación'}
            </Button>
            <p className={styles.actionHint}>Esto crea una deuda, no registra un pago.</p>
            <Link href="/obligations">
              <Button variant="secondary" fullWidth>
                Cancelar
              </Button>
            </Link>
          </div>
        )}
      </form>
    </DashboardLayout>
  )
}
