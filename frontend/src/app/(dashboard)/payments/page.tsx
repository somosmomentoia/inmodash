'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Search,
  ChevronRight,
  TrendingUp,
  FileText,
  X,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardContent,
  Input,
  CounterCard,
  Badge,
  EmptyState,
  Table,
} from '@/components/ui'
import { useObligationPayments } from '@/hooks/useObligationPayments'
import { useContracts } from '@/hooks/useContracts'
import { PaymentMethod, ObligationPayment } from '@/types'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import styles from './payments.module.css'

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  check: 'Cheque',
  card: 'Tarjeta',
  other: 'Otro',
  owner_balance: 'Saldo Propietario'
}

export default function PaymentsPage() {
  const router = useRouter()
  const [selectedContractId, setSelectedContractId] = useState<number | undefined>(undefined)
  const { payments, loading, error } = useObligationPayments(selectedContractId)
  const { contracts } = useContracts()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesMethod = selectedMethod === 'all' || payment.method === selectedMethod
      
      let matchesMonth = true
      if (selectedMonth) {
        const paymentDate = new Date(payment.paymentDate)
        const selectedDate = new Date(selectedMonth)
        matchesMonth = isWithinInterval(paymentDate, {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate)
        })
      }

      const matchesSearch = searchTerm === '' ||
        payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.obligation?.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.obligation?.contract?.tenant?.nameOrBusiness.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesMethod && matchesMonth && matchesSearch
    })
  }, [payments, selectedMethod, selectedMonth, searchTerm])

  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = payments.filter(p => {
      const paymentDate = new Date(p.paymentDate)
      return paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear()
    })

    const thisYear = payments.filter(p => {
      const paymentDate = new Date(p.paymentDate)
      return paymentDate.getFullYear() === now.getFullYear()
    })

    const totalMonth = thisMonth.reduce((sum, p) => sum + p.amount, 0)
    const totalYear = thisYear.reduce((sum, p) => sum + p.amount, 0)
    const lastPayment = payments.length > 0 ? payments[0] : null

    return {
      totalMonth,
      totalYear,
      countMonth: thisMonth.length,
      countYear: thisYear.length,
      lastPayment
    }
  }, [payments])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleExport = () => {
    const csv = [
      ['Fecha', 'Monto', 'Método', 'Referencia', 'Obligación', 'Inquilino', 'Notas'].join(','),
      ...filteredPayments.map(p => [
        format(new Date(p.paymentDate), 'dd/MM/yyyy'),
        p.amount,
        p.method || '',
        p.reference || '',
        p.obligation?.description || '',
        p.obligation?.contract?.tenant?.nameOrBusiness || '',
        p.notes || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `pagos-registrados-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  if (loading) {
    return (
      <DashboardLayout title="Pagos Registrados" subtitle="Registro de pagos recibidos">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Cargando pagos...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Pagos Registrados" subtitle="Registro de pagos recibidos">
        <Card>
          <CardContent>
            <div className={styles.errorContainer}>
              <AlertCircle size={48} />
              <p>Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Pagos Registrados" subtitle="Registro de pagos recibidos">
      {/* Stats */}
      <div className={styles.statsGrid}>
        <CounterCard
          title={`Este Mes (${stats.countMonth})`}
          value={stats.totalMonth}
          icon={<DollarSign size={24} />}
          color="green"
          size="sm"
          prefix="$"
        />
        <CounterCard
          title={`Este Año (${stats.countYear})`}
          value={stats.totalYear}
          icon={<TrendingUp size={24} />}
          color="blue"
          size="sm"
          prefix="$"
        />
        <CounterCard
          title="Total Registros"
          value={payments.length}
          icon={<FileText size={24} />}
          color="purple"
          size="sm"
        />
        <CounterCard
          title={stats.lastPayment ? `Último: ${format(new Date(stats.lastPayment.paymentDate), 'dd/MM')}` : 'Sin pagos'}
          value={stats.lastPayment ? stats.lastPayment.amount : 0}
          icon={<Calendar size={24} />}
          color="cyan"
          size="sm"
          prefix="$"
        />
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <CardContent>
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Contrato</label>
              <select
                value={selectedContractId || ''}
                onChange={(e) => setSelectedContractId(e.target.value ? parseInt(e.target.value) : undefined)}
                className={styles.filterSelect}
              >
                <option value="">Todos</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    #{contract.id} - {contract.tenant?.nameOrBusiness || `Cliente #${contract.tenantId}`}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Método de Pago</label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Todos</option>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Mes</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Buscar</label>
              <Input
                placeholder="Referencia, obligación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search size={16} />}
              />
            </div>
          </div>
          
          {selectedContractId && (
            <div className={styles.activeFilter}>
              <Badge variant="info">
                Contrato #{selectedContractId} - {contracts.find(c => c.id === selectedContractId)?.tenant?.nameOrBusiness}
              </Badge>
              <button
                onClick={() => setSelectedContractId(undefined)}
                className={styles.clearFilter}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarInfo}>
          <span>{filteredPayments.length} pago(s) encontrado(s)</span>
        </div>
        <div className={styles.toolbarActions}>
          <Button
            variant="secondary"
            leftIcon={<FileText size={16} />}
            onClick={handleExport}
            disabled={filteredPayments.length === 0}
          >
            Exportar CSV
          </Button>
          <Link href="/obligations">
            <Button variant="ghost">
              ← Cuenta Corriente
            </Button>
          </Link>
        </div>
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<DollarSign />}
              title="No hay pagos registrados"
              description="Los pagos aparecerán aquí cuando se registren desde las obligaciones"
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Table
              columns={[
                {
                  key: 'paymentDate',
                  header: 'Fecha',
                  render: (payment) => (
                    <span className={styles.dateText}>
                      {format(new Date(payment.paymentDate as Date), 'dd/MM/yyyy')}
                    </span>
                  ),
                },
                {
                  key: 'amount',
                  header: 'Monto',
                  render: (payment) => (
                    <span className={styles.amountText}>
                      {formatCurrency(payment.amount as number)}
                    </span>
                  ),
                },
                {
                  key: 'method',
                  header: 'Método',
                  render: (payment) => (
                    <span className={styles.cellText}>
                      {payment.method ? PAYMENT_METHOD_LABELS[payment.method as PaymentMethod] : '-'}
                    </span>
                  ),
                },
                {
                  key: 'description',
                  header: 'Descripción',
                  render: (payment) => (
                    <span className={styles.cellText}>
                      {(payment.obligation as ObligationPayment['obligation'])?.description || '-'}
                    </span>
                  ),
                },
                {
                  key: 'tenant',
                  header: 'Inquilino',
                  render: (payment) => (
                    <span className={styles.cellText}>
                      {(payment.obligation as ObligationPayment['obligation'])?.contract?.tenant?.nameOrBusiness || '-'}
                    </span>
                  ),
                },
              ]}
              data={filteredPayments as unknown as Record<string, unknown>[]}
              onRowClick={(payment) => {
                const obligation = payment.obligation as ObligationPayment['obligation']
                if (obligation?.id) {
                  router.push(`/obligations/${obligation.id}`)
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {filteredPayments.length > 0 && (
        <Card className={styles.summaryCard}>
          <CardContent>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>
                Total mostrado ({filteredPayments.length} pagos):
              </span>
              <span className={styles.summaryValue}>
                {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.amount, 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  )
}
