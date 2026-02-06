'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  ArrowLeft,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  CheckCircle,
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
import { 
  PeriodType, 
  getPeriodOptions, 
  filterObligationsByPeriod,
  getDateRangeForPeriod 
} from '@/hooks/useReportFilters'
import styles from './page.module.css'

export default function ResultadoPeriodoPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<PeriodType>('current-month')
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null)
  
  const { obligations, loading: obligationsLoading } = useObligations()
  const { apartments, loading: apartmentsLoading } = useApartments()
  
  const loading = obligationsLoading || apartmentsLoading
  
  const periodOptions = useMemo(() => getPeriodOptions(), [])
  const dateRange = useMemo(() => getDateRangeForPeriod(period), [period])
  const periodLabel = useMemo(() => {
    return dateRange.start.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  }, [dateRange])

  const metrics = useMemo(() => {
    // Filter by period first
    const periodFiltered = filterObligationsByPeriod(obligations, period, 'dueDate')
    
    let paidObligations = periodFiltered.filter(o => o.status === 'paid')
    
    // Filter by property if selected
    if (selectedPropertyId) {
      paidObligations = paidObligations.filter(o => o.apartmentId === selectedPropertyId)
    }
    
    const ingresos = paidObligations
      .filter(o => o.ownerImpact > 0 || o.agencyImpact > 0)
      .reduce((sum, o) => sum + Math.max(o.ownerImpact, 0) + Math.max(o.agencyImpact, 0), 0)
    
    const egresos = paidObligations
      .filter(o => o.ownerImpact < 0 || o.agencyImpact < 0)
      .reduce((sum, o) => sum + Math.abs(Math.min(o.ownerImpact, 0)) + Math.abs(Math.min(o.agencyImpact, 0)), 0)
    
    const resultadoNeto = ingresos - egresos

    const alquileres = paidObligations
      .filter(o => o.type === 'rent')
      .reduce((sum, o) => sum + o.paidAmount, 0)

    const pagosAPropietarios = paidObligations
      .filter(o => o.ownerImpact > 0)
      .reduce((sum, o) => sum + o.ownerImpact, 0)

    const mantenimiento = paidObligations
      .filter(o => o.type === 'maintenance')
      .reduce((sum, o) => sum + o.paidAmount, 0)

    const comisiones = paidObligations
      .filter(o => o.type === 'rent')
      .reduce((sum, o) => sum + (o.commissionAmount || 0), 0)

    return {
      ingresos,
      egresos,
      resultadoNeto,
      alquileres,
      pagosAPropietarios,
      mantenimiento,
      comisiones,
      movimientos: paidObligations,
    }
  }, [obligations, period, selectedPropertyId])

  const formatCurrency = (amount: number) => {
    const prefix = amount >= 0 ? '+' : ''
    return prefix + new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatCurrencySimple = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Generate chart data from real obligations (last 6 months)
  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      const month = date.toLocaleString('es-AR', { month: 'short' })
      
      let monthObligations = obligations.filter(o => {
        const oDate = new Date(o.dueDate)
        return oDate.getMonth() === date.getMonth() && 
               oDate.getFullYear() === date.getFullYear() &&
               o.status === 'paid'
      })
      
      if (selectedPropertyId) {
        monthObligations = monthObligations.filter(o => o.apartmentId === selectedPropertyId)
      }
      
      const value = monthObligations.reduce((sum, o) => 
        sum + Math.max(o.ownerImpact, 0) + Math.max(o.agencyImpact, 0), 0)
      
      return { label: month, value }
    })
  }, [obligations, selectedPropertyId])

  if (loading) {
    return (
      <DashboardLayout title="Resultado del Período" subtitle="Cargando...">
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
        <span className={styles.breadcrumbCurrent}>Resultado del Período</span>
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
        </div>
        <div className={styles.headerRight}>
          <Button variant="secondary" leftIcon={<Download size={16} />}>
            Exportar
          </Button>
          <Button variant="secondary" leftIcon={<FileText size={16} />}>
            Guardar PDF
          </Button>
          <Button leftIcon={<Download size={16} />}>
            Exportar Vista
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Ingresos"
          value={formatCurrency(metrics.ingresos)}
          icon={<TrendingUp size={18} />}
          variant="success"
        />
        <StatCard
          title="Egresos"
          value={formatCurrency(-metrics.egresos)}
          icon={<TrendingDown size={18} />}
          variant="error"
        />
        <StatCard
          title="Resultado Neto"
          value={formatCurrency(metrics.resultadoNeto)}
          icon={<DollarSign size={18} />}
          variant={metrics.resultadoNeto >= 0 ? 'success' : 'error'}
        />
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          {/* Chart */}
          <Card>
            <CardContent>
              <div className={styles.chartHeader}>
                <h3>Ingresos vs. Egresos</h3>
                <div className={styles.chartLegend}>
                  <span className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: '#10b981' }} />
                    Ingresos
                  </span>
                  <span className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: '#ef4444' }} />
                    Egresos
                  </span>
                </div>
              </div>
              <BarChart data={chartData} showValues />
              <div className={styles.chartSummary}>
                <div className={styles.chartSummaryItem}>
                  <span className={styles.chartSummaryValue} style={{ color: '#10b981' }}>
                    {formatCurrencySimple(metrics.ingresos)}
                  </span>
                  <span className={styles.chartSummaryLabel}>Ingresos</span>
                </div>
                <div className={styles.chartSummaryItem}>
                  <span className={styles.chartSummaryValue} style={{ color: '#ef4444' }}>
                    -{formatCurrencySimple(metrics.egresos)}
                  </span>
                  <span className={styles.chartSummaryLabel}>Egresos</span>
                </div>
                <div className={styles.chartSummaryItem}>
                  <span className={styles.chartSummaryValue} style={{ color: '#3b82f6' }}>
                    {formatCurrency(metrics.resultadoNeto)}
                  </span>
                  <span className={styles.chartSummaryLabel}>Resultado Neto</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movements Table */}
          <DataTableReport
            title={`Movimientos Detallados - ${periodLabel}`}
            columns={[
              { key: 'date', header: 'Fecha', render: (item) => {
                const date = new Date(item.dueDate as string)
                return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
              }},
              { key: 'category', header: 'Categoría', render: (item) => (
                <Badge variant={item.type === 'rent' ? 'success' : 'info'}>
                  {item.type === 'rent' ? 'Alquiler' : item.type === 'expenses' ? 'Expensas' : item.type === 'maintenance' ? 'Mantenimiento' : String(item.type)}
                </Badge>
              )},
              { key: 'description', header: 'Descripción' },
              { key: 'ingresos', header: 'Ingresos', align: 'right', render: (item) => {
                const val = Math.max(Number(item.ownerImpact) || 0, 0) + Math.max(Number(item.agencyImpact) || 0, 0)
                return val > 0 ? <span style={{ color: '#10b981' }}>{formatCurrencySimple(val)}</span> : '-'
              }},
              { key: 'egresos', header: 'Egresos', align: 'right', render: (item) => {
                const val = Math.abs(Math.min(Number(item.ownerImpact) || 0, 0)) + Math.abs(Math.min(Number(item.agencyImpact) || 0, 0))
                return val > 0 ? <span style={{ color: '#ef4444' }}>-{formatCurrencySimple(val)}</span> : '-'
              }},
            ]}
            data={metrics.movimientos.slice(0, 10) as unknown as Record<string, unknown>[]}
            pageSize={10}
          />
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightColumn}>
          <SummaryPanel
            title="Resumen del período"
            items={[
              { label: 'Alquileres', value: metrics.alquileres, color: 'success' },
              { label: 'Pagos de Propietarios', value: metrics.pagosAPropietarios, color: 'success' },
              { label: 'Mantenimiento', value: -metrics.mantenimiento, color: 'error' },
              { label: 'Honorarios Profesionales', value: 0, color: 'error' },
              { label: 'Comisiones', value: -metrics.comisiones, color: 'error' },
            ]}
            total={{ label: 'Resultado Neto', value: metrics.resultadoNeto }}
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
