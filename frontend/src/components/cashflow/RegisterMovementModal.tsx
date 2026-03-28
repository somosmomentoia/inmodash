'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, AlertCircle, Building2, Info } from 'lucide-react'
import { format } from 'date-fns'
import { Modal, ModalFooter, Button, Input, Select } from '@/components/ui'
import { useCashFlow } from '@/hooks/useCashFlow'
import { useContracts, useApartments } from '@/hooks'
import { ObligationType, PaymentMethod, PaidBy } from '@/types'
import styles from './RegisterMovementModal.module.css'

interface RegisterMovementModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type Direction = 'income' | 'expense'

const INCOME_TYPES: { value: ObligationType; label: string; hint?: string }[] = [
  { value: 'income_other', label: 'Otro Ingreso', hint: 'Tasación, venta, honorario extra, etc.' },
  { value: 'rent', label: 'Cobro de Alquiler', hint: 'Requiere contrato' },
  { value: 'expenses', label: 'Cobro de Expensas', hint: 'Requiere contrato' },
  { value: 'debt', label: 'Cobro de Deuda/Ajuste' },
  { value: 'service', label: 'Cobro de Servicio' },
]

const EXPENSE_TYPES: { value: ObligationType; label: string; hint?: string }[] = [
  { value: 'expense_other', label: 'Otro Egreso', hint: 'Gasto operativo, proveedor, etc.' },
  { value: 'tax', label: 'Pago de Impuesto' },
  { value: 'service', label: 'Pago de Servicio' },
  { value: 'insurance', label: 'Pago de Seguro' },
  { value: 'maintenance', label: 'Pago de Mantenimiento' },
]

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'transfer', label: 'Transferencia' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'check', label: 'Cheque' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'other', label: 'Otro' },
]

// Defaults de paidBy según tipo y dirección
function getDefaultPaidBy(direction: Direction, type: ObligationType): PaidBy {
  if (direction === 'income') {
    if (['rent', 'expenses', 'service', 'debt'].includes(type)) return 'tenant'
    return 'agency'
  }
  // expense
  if (['tax'].includes(type)) return 'owner'
  if (['expense_other'].includes(type)) return 'agency'
  return 'owner'
}

// Determinar si el tipo requiere contrato
function requiresContract(type: ObligationType): boolean {
  return ['rent', 'expenses'].includes(type)
}

// Determinar si el checkbox "Imputar al propietario" aplica
function showImputeCheckbox(direction: Direction, type: ObligationType): boolean {
  if (direction === 'income') {
    // Para ingresos genéricos, podés elegir si va al owner o a la agency
    return ['income_other', 'debt', 'service'].includes(type)
  }
  // Para egresos, casi todos pueden imputarse al owner
  return ['service', 'insurance', 'maintenance', 'expense_other'].includes(type)
}

// Default del checkbox imputar
function getDefaultImpute(direction: Direction, type: ObligationType): boolean {
  if (direction === 'expense') {
    // tax siempre imputa al owner, maintenance/service default sí
    return ['tax', 'maintenance', 'service', 'insurance'].includes(type)
  }
  return false
}

export default function RegisterMovementModal({
  open,
  onClose,
  onSuccess,
}: RegisterMovementModalProps) {
  const { createMovement } = useCashFlow()
  const { contracts } = useContracts()
  const { apartments } = useApartments()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [direction, setDirection] = useState<Direction>('income')
  const [type, setType] = useState<ObligationType>('income_other')
  const [imputeToOwner, setImputeToOwner] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    contractId: '',
    apartmentId: '',
    method: 'transfer' as PaymentMethod,
    reference: '',
    notes: '',
    category: '',
  })

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setDirection('income')
      setType('income_other')
      setImputeToOwner(false)
      setFormData({
        description: '',
        amount: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        contractId: '',
        apartmentId: '',
        method: 'transfer',
        reference: '',
        notes: '',
        category: '',
      })
      setError(null)
    }
  }, [open])

  // Update defaults when direction/type changes
  useEffect(() => {
    setImputeToOwner(getDefaultImpute(direction, type))
  }, [direction, type])

  // When direction changes, set primary FC type for that direction
  useEffect(() => {
    if (direction === 'income') {
      setType('income_other')
    } else {
      setType('expense_other')
    }
  }, [direction])

  // Active contracts for selector
  const activeContracts = useMemo(() => {
    return (contracts || [])
      .filter((c: any) => c.status === 'active' || !c.status)
      .map((c: any) => ({
        value: String(c.id),
        label: `${c.apartment?.nomenclature || c.apartment?.fullAddress || `Propiedad #${c.apartmentId}`} - ${c.tenant?.nameOrBusiness || `Inquilino #${c.tenantId}`}`,
      }))
  }, [contracts])

  // Apartments with owners for impute selector
  const apartmentsWithOwner = useMemo(() => {
    return (apartments || [])
      .filter((a: any) => a.owner)
      .map((a: any) => ({
        value: String(a.id),
        label: `${a.nomenclature || a.fullAddress || `Unidad #${a.id}`} — ${a.owner?.name || 'Propietario'}`,
      }))
  }, [apartments])

  // Calculate paidBy based on direction, type, and impute checkbox
  const calculatedPaidBy = useMemo((): PaidBy => {
    if (direction === 'income') {
      if (['rent', 'expenses'].includes(type)) return 'tenant'
      if (imputeToOwner) return 'tenant' // tenant pays, owner receives
      return 'agency'
    }
    // expense
    if (['tax'].includes(type)) return 'owner'
    if (imputeToOwner) return 'owner'
    return 'agency'
  }, [direction, type, imputeToOwner])

  // Impact preview
  const impactPreview = useMemo(() => {
    const amount = formData.amount || 0
    if (amount === 0) return null

    if (direction === 'income') {
      if (['rent', 'expenses'].includes(type)) {
        return { owner: '+', agency: 'Comisión', label: 'Ingreso del inquilino → propietario + comisión' }
      }
      if (imputeToOwner) {
        return { owner: '+', agency: '0', label: 'Ingreso imputado al propietario' }
      }
      return { owner: '0', agency: '+', label: 'Ingreso de la inmobiliaria' }
    }

    // expense
    if (imputeToOwner || ['tax'].includes(type)) {
      return { owner: '-', agency: '0', label: 'Se descuenta de la liquidación del propietario' }
    }
    return { owner: '0', agency: '-', label: 'Gasto de la inmobiliaria' }
  }, [direction, type, imputeToOwner, formData.amount])

  const typeOptions = direction === 'income' ? INCOME_TYPES : EXPENSE_TYPES

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.description.trim()) {
      setError('La descripción es requerida')
      return
    }
    if (formData.amount <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }
    if (requiresContract(type) && !formData.contractId) {
      setError('Seleccioná un contrato para este tipo de movimiento')
      return
    }
    if (imputeToOwner && !formData.apartmentId && !formData.contractId) {
      setError('Seleccioná una unidad para imputar al propietario')
      return
    }

    try {
      setLoading(true)
      await createMovement({
        type,
        description: formData.description,
        amount: formData.amount,
        date: formData.date,
        paidBy: calculatedPaidBy,
        contractId: formData.contractId ? parseInt(formData.contractId) : undefined,
        apartmentId: formData.apartmentId ? parseInt(formData.apartmentId) : undefined,
        method: formData.method,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
        category: formData.category || undefined,
      })
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Error al registrar movimiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Registrar Movimiento"
      subtitle="Flujo de Caja"
      size="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Direction: Ingreso / Egreso */}
        <div>
          <label className={styles.sectionLabel}>Tipo de movimiento</label>
          <div className={styles.directionGrid}>
            <button
              type="button"
              onClick={() => setDirection('income')}
              className={`${styles.directionCard} ${styles.directionCardIncome} ${direction === 'income' ? styles.directionCardActive : ''}`}
            >
              <TrendingUp size={24} />
              <span className={styles.directionTitle}>Ingreso</span>
              <span className={styles.directionDesc}>Cobro o entrada de dinero</span>
            </button>
            <button
              type="button"
              onClick={() => setDirection('expense')}
              className={`${styles.directionCard} ${styles.directionCardExpense} ${direction === 'expense' ? styles.directionCardActive : ''}`}
            >
              <TrendingDown size={24} />
              <span className={styles.directionTitle}>Egreso</span>
              <span className={styles.directionDesc}>Pago o salida de dinero</span>
            </button>
          </div>
        </div>

        {/* Type selector */}
        <Select
          label="Categoría"
          options={typeOptions.map((t) => ({ value: t.value, label: t.label }))}
          value={type}
          onChange={(e) => setType(e.target.value as ObligationType)}
        />

        {/* Contract selector (if required) */}
        {(requiresContract(type) || formData.contractId) && (
          <Select
            label={requiresContract(type) ? 'Contrato *' : 'Contrato (opcional)'}
            options={[
              { value: '', label: 'Sin contrato' },
              ...activeContracts,
            ]}
            value={formData.contractId}
            onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
          />
        )}

        {/* Description + Amount */}
        <Input
          label="Descripción *"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={direction === 'income' ? 'Ej: Cobro alquiler Depto 3A - Enero' : 'Ej: ABL Propiedad Av. Corrientes 1234'}
        />

        <div className={styles.fieldsGrid}>
          <Input
            label="Monto *"
            type="number"
            required
            min={0.01}
            step={0.01}
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Fecha"
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>

        {/* Payment method + reference */}
        <div className={styles.fieldsGrid}>
          <Select
            label="Método de pago"
            options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
            value={formData.method}
            onChange={(e) => setFormData({ ...formData, method: e.target.value as PaymentMethod })}
          />
          <Input
            label="Referencia"
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            placeholder="#12345, CBU, etc."
          />
        </div>

        {/* Impute to owner checkbox */}
        {showImputeCheckbox(direction, type) && (
          <div className={styles.imputeSection}>
            <div className={styles.imputeRow}>
              <input
                type="checkbox"
                id="imputeToOwner"
                checked={imputeToOwner}
                onChange={(e) => {
                  setImputeToOwner(e.target.checked)
                  if (!e.target.checked) {
                    setFormData(prev => ({ ...prev, apartmentId: '' }))
                  }
                }}
                className={styles.imputeCheckbox}
              />
              <label htmlFor="imputeToOwner" className={styles.imputeLabel}>
                <Building2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                Imputar al propietario
              </label>
            </div>
            <span className={styles.imputeHint}>
              {direction === 'expense'
                ? 'Se descontará de la liquidación del propietario'
                : 'El ingreso se acreditará al propietario'}
            </span>
            {imputeToOwner && !requiresContract(type) && (
              <div className={styles.imputeSelect}>
                <Select
                  label="Unidad / Propietario *"
                  options={[
                    { value: '', label: 'Seleccionar unidad...' },
                    ...apartmentsWithOwner,
                  ]}
                  value={formData.apartmentId}
                  onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
                />
              </div>
            )}
          </div>
        )}

        {/* Impact preview */}
        {impactPreview && formData.amount > 0 && (
          <div className={styles.impactPreview}>
            <div className={styles.impactRow}>
              <span className={styles.impactLabel}>
                <Info size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                {impactPreview.label}
              </span>
            </div>
            <div className={styles.impactRow}>
              <span className={styles.impactLabel}>Liquidación propietario</span>
              <span className={
                impactPreview.owner === '+' ? styles.impactValuePositive :
                impactPreview.owner === '-' ? styles.impactValueNegative :
                styles.impactValueNeutral
              }>
                {impactPreview.owner === '+' ? `+$${formData.amount.toLocaleString('es-AR')}` :
                 impactPreview.owner === '-' ? `-$${formData.amount.toLocaleString('es-AR')}` :
                 'Sin impacto'}
              </span>
            </div>
            <div className={styles.impactRow}>
              <span className={styles.impactLabel}>Contabilidad inmobiliaria</span>
              <span className={
                impactPreview.agency === '+' ? styles.impactValuePositive :
                impactPreview.agency === '-' ? styles.impactValueNegative :
                styles.impactValueNeutral
              }>
                {impactPreview.agency === '+' ? `+$${formData.amount.toLocaleString('es-AR')}` :
                 impactPreview.agency === '-' ? `-$${formData.amount.toLocaleString('es-AR')}` :
                 impactPreview.agency === 'Comisión' ? 'Comisión' :
                 'Sin impacto'}
              </span>
            </div>
          </div>
        )}

        {/* Notes */}
        <Input
          label="Notas"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notas adicionales..."
        />

        {/* Error */}
        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {direction === 'income' ? 'Registrar Ingreso' : 'Registrar Egreso'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
