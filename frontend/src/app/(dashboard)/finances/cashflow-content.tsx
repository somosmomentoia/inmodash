'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Search,
  Plus,
  ArrowLeftRight,
} from 'lucide-react'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Select,
  Badge,
  EmptyState,
} from '@/components/ui'
import { useCashFlow } from '@/hooks/useCashFlow'
import RegisterMovementModal from '@/components/cashflow/RegisterMovementModal'
import { ObligationPayment, ObligationType } from '@/types'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import styles from './cashflow.module.css'

type FlowFilter = 'all' | 'income' | 'expense'
type PeriodType = 'monthly' | 'annual'

const TYPE_LABELS: Record<ObligationType, string> = {
  rent: 'Alquiler',
  expenses: 'Expensas',
  service: 'Servicio',
  tax: 'Impuesto',
  insurance: 'Seguro',
  maintenance: 'Mantenimiento',
  debt: 'Deuda/Ajuste',
  income_other: 'Otro Ingreso',
  expense_other: 'Otro Egreso',
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  check: 'Cheque',
  card: 'Tarjeta',
  other: 'Otro',
}

const ORIGIN_LABELS: Record<string, string> = {
  tenant_ledger: 'Cuenta Corriente',
  cashflow: 'Flujo de Caja',
  contract_auto: 'Automático',
  liquidation_manual: 'Liquidación',
}

// Determinar si un pago es ingreso o egreso basado en la obligación
function isIncome(payment: ObligationPayment): boolean {
  const obligation = payment.obligation
  if (!obligation) return true
  // Si ownerImpact o agencyImpact son positivos → ingreso
  // Si ambos son negativos o cero → egreso
  // Para rent (tenant paga) → ingreso
  // Para tax/maintenance con paidBy=owner → egreso (la inmobiliaria pagó por el owner)
  const type = obligation.type as ObligationType
  if (['rent', 'expenses', 'income_other'].includes(type)) return true
  if (['expense_other'].includes(type)) return false
  // Para service/tax/insurance/maintenance/debt: depende de paidBy
  if (obligation.paidBy === 'tenant') return true
  return false
}

export default function CashFlowContent() {
  const router = useRouter()
  const { payments, loading, fetchPayments } = useCashFlow()
  const { hasPermission } = usePermissions()
  const [flowFilter, setFlowFilter] = useState<FlowFilter>('all')
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)

  const getPeriodRange = useCallback(() => {
    if (periodType === 'annual') {
      return {
        start: startOfYear(selectedDate),
        end: endOfYear(selectedDate),
      }
    }
    return {
      start: startOfMonth(selectedDate),
      end: endOfMonth(selectedDate),
    }
  }, [periodType, selectedDate])

  const filteredPayments = useMemo(() => {
    const range = getPeriodRange()

    return payments
      .filter((payment) => {
        // Period filter
        const paymentDate = new Date(payment.paymentDate)
        const matchesPeriod = isWithinInterval(paymentDate, range)

        // Flow filter (income/expense)
        let matchesFlow = true
        if (flowFilter === 'income') matchesFlow = isIncome(payment)
        if (flowFilter === 'expense') matchesFlow = !isIncome(payment)

        // Search filter
        const matchesSearch =
          searchTerm === '' ||
          payment.obligation?.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.obligation?.contract?.tenant?.nameOrBusiness.toLowerCase().includes(searchTerm.toLowerCase())

        return matchesPeriod && matchesFlow && matchesSearch
      })
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
  }, [payments, getPeriodRange, flowFilter, searchTerm])

  // Stats
  const stats = useMemo(() => {
    const income = filteredPayments.filter(isIncome).reduce((sum, p) => sum + p.amount, 0)
    const expense = filteredPayments.filter((p) => !isIncome(p)).reduce((sum, p) => sum + p.amount, 0)
    return { income, expense, net: income - expense }
  }, [filteredPayments])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd MMM HH:mm', { locale: es })
  }

  const getTypeLabel = (type: string) => {
    return TYPE_LABELS[type as ObligationType] || type
  }

  const getMethodLabel = (method: string | undefined) => {
    if (!method) return '-'
    return METHOD_LABELS[method] || method
  }

  const getOriginLabel = (origin: string | undefined) => {
    if (!origin) return 'Manual'
    return ORIGIN_LABELS[origin] || origin
  }

  // Period options
  const periodOptions = useMemo(() => {
    const options = []
    const now = new Date()

    if (periodType === 'monthly') {
      for (let i = -3; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const value = date.toISOString()
        const label = format(date, 'MMMM yyyy', { locale: es })
        options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
      }
    } else {
      for (let y = now.getFullYear() + 1; y >= now.getFullYear() - 3; y--) {
        const date = new Date(y, 0, 1)
        options.push({ value: date.toISOString(), label: `Año ${y}` })
      }
    }

    return options
  }, [periodType])

  const handleExport = () => {
    const rows = filteredPayments.map((p) => ({
      Fecha: format(new Date(p.paymentDate), 'dd/MM/yyyy'),
      Descripción: p.obligation?.description || '-',
      Tipo: getTypeLabel(p.obligation?.type || ''),
      Método: getMethodLabel(p.method),
      Monto: isIncome(p) ? p.amount : -p.amount,
      Origen: getOriginLabel((p.obligation as any)?.origin),
    }))

    const headers = Object.keys(rows[0] || {}).join(',')
    const csv = [headers, ...rows.map((r) => Object.values(r).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `flujo-de-caja-${format(selectedDate, 'yyyy-MM')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando flujo de caja...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {/* Flow filter tabs */}
          <div className={styles.filterTabs}>
            {(['all', 'income', 'expense'] as FlowFilter[]).map((filter) => (
              <button
                key={filter}
                className={`${styles.filterTab} ${flowFilter === filter ? styles.filterTabActive : ''}`}
                onClick={() => setFlowFilter(filter)}
              >
                {filter === 'all' ? 'Todos' : filter === 'income' ? 'Ingresos' : 'Egresos'}
              </button>
            ))}
          </div>

          {/* Period type */}
          <div className={styles.periodTypeSelector}>
            {(['monthly', 'annual'] as PeriodType[]).map((type) => (
              <button
                key={type}
                className={`${styles.periodTypeBtn} ${periodType === type ? styles.periodTypeBtnActive : ''}`}
                onClick={() => setPeriodType(type)}
              >
                {type === 'monthly' ? 'Mensual' : 'Anual'}
              </button>
            ))}
          </div>

          <Select
            options={periodOptions}
            value={selectedDate.toISOString()}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            size="sm"
          />

          {/* Search */}
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar movimiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.toolbarRight}>
          {hasPermission('finances', 'export') && (
            <Button leftIcon={<Download size={16} />} variant="secondary" size="sm" onClick={handleExport}>
              Exportar
            </Button>
          )}
          {hasPermission('finances', 'create_movement') && (
            <Button leftIcon={<Plus size={16} />} variant="primary" size="sm" onClick={() => setShowModal(true)}>
              Registrar Movimiento
            </Button>
          )}
        </div>
      </div>

      {/* Result Summary */}
      <div className={styles.resultSummary}>
        <div className={styles.resultCard}>
          <div className={`${styles.resultIcon} ${styles.incomeIcon}`}>
            <TrendingUp size={20} />
          </div>
          <div className={styles.resultInfo}>
            <span className={styles.resultLabel}>Ingresos</span>
            <span className={`${styles.resultValue} ${styles.incomeValue}`}>
              {formatCurrency(stats.income)}
            </span>
          </div>
        </div>
        <div className={styles.resultDivider}>-</div>
        <div className={styles.resultCard}>
          <div className={`${styles.resultIcon} ${styles.expenseIcon}`}>
            <TrendingDown size={20} />
          </div>
          <div className={styles.resultInfo}>
            <span className={styles.resultLabel}>Egresos</span>
            <span className={`${styles.resultValue} ${styles.expenseValue}`}>
              {formatCurrency(stats.expense)}
            </span>
          </div>
        </div>
        <div className={styles.resultDivider}>=</div>
        <div className={`${styles.resultCard} ${styles.resultCardMain}`}>
          <div className={`${styles.resultIcon} ${stats.net >= 0 ? styles.incomeIcon : styles.expenseIcon}`}>
            <DollarSign size={20} />
          </div>
          <div className={styles.resultInfo}>
            <span className={styles.resultLabel}>Neto</span>
            <span className={`${styles.resultValue} ${stats.net >= 0 ? styles.incomeValue : styles.expenseValue}`}>
              {formatCurrency(stats.net)}
            </span>
          </div>
        </div>
      </div>

      {/* Movements List */}
      <Card>
        <CardHeader
          title="Movimientos"
          subtitle={`${filteredPayments.length} movimientos en el período`}
        />
        <CardContent>
          {filteredPayments.length === 0 ? (
            <EmptyState
              icon={<ArrowLeftRight />}
              title="Sin movimientos"
              description="No hay movimientos registrados para el período y filtros seleccionados."
            />
          ) : (
            <div className={styles.movementsList}>
              <div className={styles.movementsHeader}>
                <span>Fecha</span>
                <span>Descripción</span>
                <span>Tipo</span>
                <span>Método</span>
                <span>Monto</span>
                <span>Origen</span>
              </div>
              {filteredPayments.map((payment) => {
                const income = isIncome(payment)
                const obligation = payment.obligation
                const tenantName = obligation?.contract?.tenant?.nameOrBusiness
                const origin = (obligation as any)?.origin

                return (
                  <div key={payment.id} className={styles.movementRow}>
                    <span className={styles.colDate}>
                      {formatDate(payment.paymentDate)}
                    </span>
                    <span className={styles.colDescription}>
                      <span>{obligation?.description || 'Movimiento'}</span>
                      {tenantName && (
                        <span className={styles.colDescriptionSub}>{tenantName}</span>
                      )}
                    </span>
                    <span className={styles.colType}>
                      <Badge variant="default" size="sm">
                        {getTypeLabel(obligation?.type || '')}
                      </Badge>
                    </span>
                    <span className={styles.colMethod}>
                      {getMethodLabel(payment.method)}
                    </span>
                    <span className={`${styles.colAmount} ${income ? styles.incomeAmount : styles.expenseAmount}`}>
                      {income ? '+' : '-'} {formatCurrency(payment.amount)}
                    </span>
                    <span className={styles.colOrigin}>
                      <Badge variant="default" size="sm">
                        {getOriginLabel(origin)}
                      </Badge>
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para registrar movimiento */}
      <RegisterMovementModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false)
          fetchPayments()
        }}
      />
    </div>
  )
}
