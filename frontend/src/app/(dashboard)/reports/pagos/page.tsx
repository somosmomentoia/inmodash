'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  ArrowLeft,
  Download,
  FileText,
  Printer,
  Building2,
  Users,
  CreditCard,
  Banknote,
  AlertTriangle,
  Search,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Badge,
  StatCard,
  SummaryPanel,
  DataTableReport,
  PeriodSelector,
  FilterChips,
  Input,
} from '@/components/ui'
import { useObligations } from '@/hooks/useObligations'
import { useOwners } from '@/hooks/useOwners'
import { useApartments } from '@/hooks/useApartments'
import { useContracts } from '@/hooks/useContracts'
import { 
  PeriodType, 
  getPeriodOptions, 
  filterObligationsByPeriod,
  getDateRangeForPeriod 
} from '@/hooks/useReportFilters'
import styles from './page.module.css'

export default function PagosPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<PeriodType>('current-month')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null)
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null)
  
  const { obligations, loading: obligationsLoading } = useObligations()
  const { owners, loading: ownersLoading } = useOwners()
  const { apartments, loading: apartmentsLoading } = useApartments()
  const { contracts, loading: contractsLoading } = useContracts()

  const loading = obligationsLoading || ownersLoading || apartmentsLoading || contractsLoading
  
  const periodOptions = useMemo(() => getPeriodOptions(), [])
  const dateRange = useMemo(() => getDateRangeForPeriod(period), [period])
  const periodLabel = useMemo(() => {
    return dateRange.start.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  }, [dateRange])

  const metrics = useMemo(() => {
    // Filter by period first
    const periodFiltered = filterObligationsByPeriod(obligations, period, 'dueDate')
    
    // Then filter by status
    let paidObligations = periodFiltered.filter(o => o.status === 'paid')
    
    // Filter by property if selected
    if (selectedPropertyId) {
      paidObligations = paidObligations.filter(o => o.apartmentId === selectedPropertyId)
    }
    
    // Filter by contract if selected
    if (selectedContractId) {
      paidObligations = paidObligations.filter(o => o.contractId === selectedContractId)
    }
    
    const total = paidObligations.reduce((sum, o) => sum + o.paidAmount, 0)
    
    // Group by payment method (paymentMethod field may not exist yet)
    const efectivo = paidObligations
      .filter(o => (o as any).paymentMethod === 'cash' || (o as any).paymentMethod === 'efectivo')
      .reduce((sum, o) => sum + o.paidAmount, 0)
    
    // If no payment method field, all goes to transferencia
    const transferencia = total - efectivo

    const vencidos = obligations
      .filter(o => o.status === 'overdue')
      .reduce((sum, o) => sum + (o.amount - o.paidAmount), 0)

    // Pagos data
    const pagosData = paidObligations.map(o => {
      const apartment = o.apartment
      const owner = owners.find(ow => apartment && ow.id === apartment.ownerId)
      return {
        id: o.id,
        tipo: ((o as any).paymentMethod === 'cash' || (o as any).paymentMethod === 'efectivo') ? 'Efectivo' : 'Transferencia',
        fecha: new Date(o.updatedAt).toLocaleDateString('es-AR'),
        propietario: owner?.name || 'Sin propietario',
        propiedad: apartment?.nomenclature || 'Sin propiedad',
        monto: o.paidAmount,
        periodo: new Date(o.period).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
        vencido: o.status === 'overdue',
      }
    })

    // Filter by search
    const filteredData = searchQuery
      ? pagosData.filter(p =>
          p.propietario.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.propiedad.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : pagosData

    return {
      total,
      efectivo,
      transferencia,
      vencidos,
      pagosData: filteredData,
      count: paidObligations.length,
    }
  }, [obligations, owners, searchQuery, period, selectedPropertyId, selectedContractId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <DashboardLayout title="Pagos Registrados" subtitle="Cargando...">
        <div className={styles.loading}>Cargando datos...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Reportes" subtitle="">
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <button className={styles.backButton} onClick={() => router.push('/reports')}>
          <ArrowLeft size={16} />
          Reportes
        </button>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>Pagos Registrados</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <PeriodSelector
            value={period}
            onChange={(value) => setPeriod(value as PeriodType)}
            options={periodOptions}
          />
          <select 
            className={styles.filterSelect}
            value={selectedPropertyId || ''}
            onChange={(e) => setSelectedPropertyId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Todas las propiedades</option>
            {apartments.map(apt => (
              <option key={apt.id} value={apt.id}>{apt.nomenclature || apt.fullAddress}</option>
            ))}
          </select>
          <select 
            className={styles.filterSelect}
            value={selectedContractId || ''}
            onChange={(e) => setSelectedContractId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Todos los contratos</option>
            {contracts.map(c => (
              <option key={c.id} value={c.id}>Contrato #{c.id}</option>
            ))}
          </select>
        </div>
        <div className={styles.headerRight}>
          <Button variant="secondary" leftIcon={<Printer size={16} />}>
            Imprimir
          </Button>
          <Button variant="secondary" leftIcon={<FileText size={16} />}>
            Guardar PDF
          </Button>
          <Button leftIcon={<Download size={16} />}>
            Reenviar Liquidación
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total"
          value={formatCurrency(metrics.total)}
          icon={<DollarSign size={18} />}
          variant="success"
        />
        <StatCard
          title="Efectivo"
          value={formatCurrency(metrics.efectivo)}
          icon={<Banknote size={18} />}
          variant="warning"
        />
        <StatCard
          title="Transferencia"
          value={formatCurrency(metrics.transferencia)}
          icon={<CreditCard size={18} />}
          variant="primary"
        />
        <StatCard
          title="Vencidos"
          value={formatCurrency(metrics.vencidos)}
          icon={<AlertTriangle size={18} />}
          variant="error"
        />
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          {/* Search */}
          <div className={styles.tableHeader}>
            <h3>Pagos Registrados - {periodLabel}</h3>
            <Input
              placeholder="Buscar pagos..."
              leftIcon={<Search size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: 250 }}
            />
          </div>

          <DataTableReport
            columns={[
              { key: 'tipo', header: 'Tipo', render: (item) => (
                <Badge variant={item.tipo === 'Efectivo' ? 'warning' : 'info'}>
                  {String(item.tipo)}
                </Badge>
              )},
              { key: 'fecha', header: 'Fecha' },
              { key: 'propietario', header: 'Propietario' },
              { key: 'propiedad', header: 'Propiedad' },
              { key: 'monto', header: 'Monto', align: 'right', render: (item) => (
                <span style={{ fontWeight: 600 }}>{formatCurrency(Number(item.monto))}</span>
              )},
              { key: 'periodo', header: 'Período' },
            ]}
            data={metrics.pagosData as unknown as Record<string, unknown>[]}
            showAvatar
            avatarKey="propietario"
            nameKey="propietario"
            pageSize={10}
          />
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightColumn}>
          <SummaryPanel
            title="Resumen"
            items={[
              { label: periodLabel, value: formatCurrency(metrics.total) },
              { label: 'Efectivo', value: formatCurrency(metrics.efectivo) },
              { label: 'Transferencia', value: formatCurrency(metrics.transferencia) },
              { label: 'Forma de Pago', value: `${metrics.count} pagos` },
              { label: 'Período', value: periodLabel },
            ]}
            total={{ label: 'Total', value: metrics.total }}
            actions={{
              customAction: {
                label: 'Exportar Vista',
                icon: <Download size={16} />,
                onClick: () => console.log('Export'),
              },
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
