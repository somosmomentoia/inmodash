'use client'

import { useState, useEffect, useMemo } from 'react'
import { AlertCircle, User, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import { Modal, ModalFooter, Button, Input, Select } from '@/components/ui'
import { useObligationPayments } from '@/hooks/useObligationPayments'
import { Obligation, PaymentMethod, PaidBy } from '@/types'
import styles from './RegisterPaymentModal.module.css'

interface RegisterPaymentModalProps {
  obligation: Obligation
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'transfer', label: 'Transferencia' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'check', label: 'Cheque' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'other', label: 'Otro' }
]

const PAID_BY_LABELS: Record<PaidBy, string> = {
  tenant: 'Inquilino',
  owner: 'Propietario',
  agency: 'Inmobiliaria'
}

const PAID_BY_ICONS: Record<PaidBy, typeof User> = {
  tenant: User,
  owner: Building2,
  agency: Building2
}

export default function RegisterPaymentModal({
  obligation,
  open,
  onClose,
  onSuccess
}: RegisterPaymentModalProps) {
  const { create: createPayment } = useObligationPayments()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remaining = obligation.amount - obligation.paidAmount

  // Determinar si es una obligación que el propietario debe pagar
  const isOwnerObligation = useMemo(() => {
    if (obligation.paidBy === 'owner') return true
    if (obligation.paidBy === 'agency') return false
    const ownerTypicalTypes = ['debt', 'tax', 'maintenance']
    if (ownerTypicalTypes.includes(obligation.type)) {
      return obligation.paidBy !== 'tenant' && obligation.paidBy !== 'agency'
    }
    return false
  }, [obligation])

  // Obtener el propietario de la obligación
  const owner = useMemo((): Owner | null => {
    return obligation.contract?.apartment?.owner || 
           obligation.apartment?.owner ||
           null
  }, [obligation])

  // Obtener el inquilino de la obligación
  const tenant = useMemo(() => {
    return obligation.contract?.tenant || null
  }, [obligation])

  // Obtener el nombre de quien debe pagar
  const payerName = useMemo(() => {
    if (obligation.paidBy === 'tenant' && tenant) {
      return tenant.nameOrBusiness || null
    }
    if (obligation.paidBy === 'owner' && owner) {
      return owner.name
    }
    if (obligation.paidBy === 'agency') {
      return 'Inmobiliaria'
    }
    return null
  }, [obligation.paidBy, tenant, owner])

  const [formData, setFormData] = useState({
    amount: remaining,
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    method: 'transfer' as PaymentMethod,
    reference: '',
    notes: ''
  })

  useEffect(() => {
    if (open) {
      setFormData({
        amount: remaining,
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        method: 'transfer',
        reference: '',
        notes: ''
      })
      setError(null)
    }
  }, [open, remaining])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.amount <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }
    if (formData.amount > remaining) {
      setError(`El monto no puede exceder el saldo pendiente ($${remaining.toLocaleString('es-AR')})`)
      return
    }
    try {
      setLoading(true)
      await createPayment({
        obligationId: obligation.id,
        amount: formData.amount,
        paymentDate: formData.paymentDate,
        method: formData.method,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined
      })
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Error al registrar el pago')
    } finally {
      setLoading(false)
    }
  }

  const PaidByIcon = obligation.paidBy ? PAID_BY_ICONS[obligation.paidBy] : User

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Registrar Pago"
      subtitle={obligation.description}
      size="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Quién debe pagar */}
        <div className={styles.paidBySection}>
          <div className={styles.paidByBadge}>
            <PaidByIcon size={16} />
            <span>A cargo de: <strong>{PAID_BY_LABELS[obligation.paidBy || 'tenant']}</strong></span>
          </div>
          {payerName && (
            <div className={styles.payerName}>
              {payerName}
            </div>
          )}
        </div>

        {/* Resumen de la obligación */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Monto Total</span>
            <span className={styles.summaryValue}>
              ${obligation.amount.toLocaleString('es-AR')}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Ya Pagado</span>
            <span className={`${styles.summaryValue} ${styles.summaryValueGreen}`}>
              ${obligation.paidAmount.toLocaleString('es-AR')}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Pendiente</span>
            <span className={`${styles.summaryValue} ${styles.summaryValueOrange}`}>
              ${remaining.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {/* Aviso si es obligación del propietario pero no hay owner */}
        {isOwnerObligation && !owner && (
          <div className={styles.alertBox}>
            <AlertCircle size={16} />
            <span>No se encontró propietario asignado a esta propiedad.</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Campos del formulario */}
        <div className={styles.fieldsGrid}>
          <Input
            label="Monto a pagar"
            type="number"
            required
            min={0.01}
            max={remaining}
            step={0.01}
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            hint={`Máximo: $${remaining.toLocaleString('es-AR')}`}
          />
          <Input
            label="Fecha de pago"
            type="date"
            required
            value={formData.paymentDate}
            onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
          />
        </div>

        <div className={styles.fieldsGrid}>
            <Select
              label="Método de pago"
              options={PAYMENT_METHODS.map(m => ({ value: m.value, label: m.label }))}
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

        <Input
          label="Notas"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notas adicionales..."
        />

        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Registrar Pago
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
