'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  ArrowLeft,
  Download,
  FileText,
  TrendingUp,
  Building2,
  Users,
  AlertTriangle,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardContent,
  Badge,
  StatCard,
  SummaryPanel,
  DataTableReport,
  PeriodSelector,
  FilterChips,
  BarChart,
} from '@/components/ui'
import { useObligations } from '@/hooks/useObligations'
import { useApartments } from '@/hooks/useApartments'
import { useOwners } from '@/hooks/useOwners'
import { 
  PeriodType, 
  getPeriodOptions, 
  getDateRangeForPeriod 
} from '@/hooks/useReportFilters'
import styles from './page.module.css'

export default function CobranzaPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<PeriodType>('last-12-months')
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null)
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null)
  
  const { obligations, loading: obligationsLoading } = useObligations()
  const { apartments, loading: apartmentsLoading } = useApartments()
  const { owners, loading: ownersLoading } = useOwners()
  
  const loading = obligationsLoading || apartmentsLoading || ownersLoading
  
  const periodOptions = useMemo(() => [
    { value: 'last-12-months', label: 'Últimos 12 meses' },
    { value: 'this-year', label: `Año ${new Date().getFullYear()}` },
    { value: 'last-year', label: `Año ${new Date().getFullYear() - 1}` },
  ], [])

  const metrics = useMemo(() => {
    const now = new Date()
    
    // Filter obligations by property/owner if selected
    let filteredObligations = obligations
    
    if (selectedPropertyId) {
      filteredObligations = filteredObligations.filter(o => o.apartmentId === selectedPropertyId)
    }
    
    if (selectedOwnerId) {
      filteredObligations = filteredObligations.filter(o => {
        const apartment = o.apartment
        return apartment && apartment.ownerId === selectedOwnerId
      })
    }
    
    // Monthly data for last 12 months
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      const month = date.toLocaleString('es-AR', { month: 'short' })
      const year = date.getFullYear()
      
      const monthObligations = filteredObligations.filter(o => {
        const oDate = new Date(o.dueDate)
        return oDate.getMonth() === date.getMonth() && oDate.getFullYear() === date.getFullYear()
      })

      const cobrado = monthObligations
        .filter(o => o.status === 'paid')
        .reduce((sum, o) => sum + o.paidAmount, 0)
      
      const pendiente = monthObligations
        .filter(o => o.status !== 'paid')
        .reduce((sum, o) => sum + (o.amount - o.paidAmount), 0)

      const total = cobrado + pendiente
      const porcentajeCobrado = total > 0 ? (cobrado / total) * 100 : 0

      return { 
        label: month, 
        value: cobrado, 
        pendiente,
        total,
        porcentajeCobrado,
        month: date.getMonth(),
        year,
      }
    })

    const totalCobrado = monthlyData.reduce((s, m) => s + m.value, 0)
    const totalPendiente = monthlyData.reduce((s, m) => s + m.pendiente, 0)
    const porcentajeGlobal = (totalCobrado + totalPendiente) > 0 
      ? (totalCobrado / (totalCobrado + totalPendiente)) * 100 
      : 0

    // Detailed monthly data for table
    const tableData = monthlyData.map(m => ({
      id: `${m.year}-${m.month}`,
      mes: `${m.label} ${m.year}`,
      cobrado: m.value,
      pendiente: m.pendiente,
      total: m.total,
      porcentaje: m.porcentajeCobrado,
    })).reverse()

    return {
      totalCobrado,
      totalPendiente,
      porcentajeGlobal,
      meses: monthlyData.length,
      monthlyData,
      tableData,
    }
  }, [obligations, selectedPropertyId, selectedOwnerId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <DashboardLayout title="Cobranza por Mes" subtitle="Cargando...">
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
        <span className={styles.breadcrumbCurrent}>Cobranza por Mes</span>
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
            value={selectedOwnerId || ''}
            onChange={(e) => setSelectedOwnerId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Todos los propietarios</option>
            {owners.map(owner => (
              <option key={owner.id} value={owner.id}>{owner.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.headerRight}>
          <Button variant="secondary" leftIcon={<FileText size={16} />}>
            Guardar PDF
          </Button>
          <Button leftIcon={<Download size={16} />}>
            Exportar Excel / CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total Cobrado"
          value={formatCurrency(metrics.totalCobrado)}
          icon={<TrendingUp size={18} />}
          variant="success"
        />
        <StatCard
          title="Pendiente"
          value={formatCurrency(metrics.totalPendiente)}
          icon={<AlertTriangle size={18} />}
          variant="warning"
        />
        <StatCard
          title="% Cobranza"
          value={`${metrics.porcentajeGlobal.toFixed(1)}%`}
          icon={<DollarSign size={18} />}
          variant="primary"
        />
        <StatCard
          title="Meses"
          value={String(metrics.meses)}
          icon={<FileText size={18} />}
          variant="primary"
        />
      </div>

      {/* Chart */}
      <Card className={styles.chartCard}>
        <CardContent>
          <div className={styles.chartHeader}>
            <h3>Cobranza Mensual</h3>
            <div className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#10b981' }} />
                Cobrado
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#f59e0b' }} />
                Pendiente
              </span>
            </div>
          </div>
          <BarChart data={metrics.monthlyData} showValues />
          <div className={styles.chartSummary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue} style={{ color: '#10b981' }}>
                {formatCurrency(metrics.totalCobrado)}
              </span>
              <span className={styles.summaryLabel}>Total Cobrado</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue} style={{ color: '#f59e0b' }}>
                {formatCurrency(metrics.totalPendiente)}
              </span>
              <span className={styles.summaryLabel}>Pendiente</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue} style={{ color: '#3b82f6' }}>
                {metrics.porcentajeGlobal.toFixed(1)}%
              </span>
              <span className={styles.summaryLabel}>% Cobranza</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <DataTableReport
            title="Detalle por Mes"
            columns={[
              { key: 'mes', header: 'Mes' },
              { key: 'cobrado', header: 'Cobrado', align: 'right', render: (item) => (
                <span style={{ color: '#10b981' }}>{formatCurrency(Number(item.cobrado))}</span>
              )},
              { key: 'pendiente', header: 'Pendiente', align: 'right', render: (item) => (
                <span style={{ color: '#f59e0b' }}>{formatCurrency(Number(item.pendiente))}</span>
              )},
              { key: 'total', header: 'Total', align: 'right', render: (item) => (
                formatCurrency(Number(item.total))
              )},
              { key: 'porcentaje', header: '% Cobranza', align: 'center', render: (item) => (
                <Badge variant={Number(item.porcentaje) >= 80 ? 'success' : Number(item.porcentaje) >= 50 ? 'warning' : 'error'}>
                  {Number(item.porcentaje).toFixed(1)}%
                </Badge>
              )},
            ]}
            data={metrics.tableData as unknown as Record<string, unknown>[]}
            totals={{
              cobrado: metrics.totalCobrado,
              pendiente: metrics.totalPendiente,
              total: metrics.totalCobrado + metrics.totalPendiente,
            }}
            pageSize={12}
          />
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightColumn}>
          <SummaryPanel
            title="Resumen Anual"
            items={[
              { label: 'Total Cobrado', value: metrics.totalCobrado, color: 'success' },
              { label: 'Pendiente', value: metrics.totalPendiente, color: 'warning' },
              { label: '% Cobranza', value: `${metrics.porcentajeGlobal.toFixed(1)}%` },
            ]}
            total={{ label: 'Total', value: metrics.totalCobrado + metrics.totalPendiente }}
            actions={{
              onExportPDF: () => console.log('Export PDF'),
              onExportCSV: () => console.log('Export CSV'),
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
