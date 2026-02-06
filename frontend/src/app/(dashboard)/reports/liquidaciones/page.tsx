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
  Badge,
  StatCard,
  SummaryPanel,
  DataTableReport,
  PeriodSelector,
  FilterChips,
} from '@/components/ui'
import { useOwners } from '@/hooks/useOwners'
import { useObligations } from '@/hooks/useObligations'
import { useApartments } from '@/hooks/useApartments'
import { 
  PeriodType, 
  getPeriodOptions, 
  filterObligationsByPeriod,
  getDateRangeForPeriod 
} from '@/hooks/useReportFilters'
import styles from './page.module.css'

export default function LiquidacionesPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<PeriodType>('current-month')
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null)
  
  const { owners, loading: ownersLoading } = useOwners()
  const { obligations, loading: obligationsLoading } = useObligations()
  const { apartments, loading: apartmentsLoading } = useApartments()

  const loading = ownersLoading || obligationsLoading || apartmentsLoading
  
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
    
    // Filter by owner if selected
    if (selectedOwnerId) {
      paidObligations = paidObligations.filter(o => {
        const apartment = o.apartment
        return apartment && apartment.ownerId === selectedOwnerId
      })
    }
    
    // Filter by property if selected
    if (selectedPropertyId) {
      paidObligations = paidObligations.filter(o => o.apartmentId === selectedPropertyId)
    }
    
    const ingresos = paidObligations
      .filter(o => o.ownerImpact > 0)
      .reduce((sum, o) => sum + o.ownerImpact, 0)
    
    const ajustes = paidObligations
      .filter(o => o.ownerImpact < 0)
      .reduce((sum, o) => sum + o.ownerImpact, 0)
    
    const comisiones = paidObligations
      .filter(o => o.type === 'rent')
      .reduce((sum, o) => sum + (o.commissionAmount || 0), 0)

    const aLiquidar = ingresos + ajustes - comisiones

    // Calculate per owner (filter owners if one is selected)
    const filteredOwners = selectedOwnerId 
      ? owners.filter(o => o.id === selectedOwnerId)
      : owners

    const ownerData = filteredOwners.map(owner => {
      const ownerObligations = paidObligations.filter(o => {
        const apartment = o.apartment
        return apartment && apartment.ownerId === owner.id
      })

      const ownerIngresos = ownerObligations
        .filter(o => o.ownerImpact > 0)
        .reduce((sum, o) => sum + o.ownerImpact, 0)

      const ownerAjustes = ownerObligations
        .filter(o => o.ownerImpact < 0)
        .reduce((sum, o) => sum + Math.abs(o.ownerImpact), 0)

      const ownerComision = ownerObligations
        .filter(o => o.type === 'rent')
        .reduce((sum, o) => sum + (o.commissionAmount || 0), 0)

      const ownerALiquidar = ownerIngresos - ownerAjustes - ownerComision

      return {
        id: owner.id,
        name: owner.name,
        email: owner.email || '',
        egresos: ownerObligations.filter(o => o.ownerImpact < 0).length,
        inmuebles: owner.apartments?.length || 0,
        ajustes: ownerIngresos,
        comision: -ownerComision,
        aLiquidar: ownerALiquidar,
      }
    }).filter(o => o.ajustes > 0 || o.aLiquidar !== 0)

    return {
      ingresos,
      ajustes: Math.abs(ajustes),
      comisiones,
      aLiquidar,
      ownerData,
    }
  }, [owners, obligations, period, selectedOwnerId, selectedPropertyId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <DashboardLayout title="Liquidaciones Mensuales" subtitle="Cargando...">
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
        <span className={styles.breadcrumbCurrent}>Liquidaciones Mensuales</span>
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
            value={selectedOwnerId || ''}
            onChange={(e) => setSelectedOwnerId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Todos los propietarios</option>
            {owners.map(owner => (
              <option key={owner.id} value={owner.id}>{owner.name}</option>
            ))}
          </select>
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
          title="Ajustes"
          value={formatCurrency(-metrics.ajustes)}
          icon={<TrendingDown size={18} />}
          variant="warning"
        />
        <StatCard
          title="A Liquidar"
          value={formatCurrency(metrics.aLiquidar)}
          icon={<DollarSign size={18} />}
          variant="primary"
        />
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          {/* Owners Table */}
          <DataTableReport
            title={`Resumen de Liquidaciones - ${periodLabel}`}
            showAvatar
            columns={[
              { key: 'name', header: 'Propietario' },
              { key: 'category', header: 'Categoría', render: (item) => (
                <div style={{ display: 'flex', gap: 4 }}>
                  <Badge variant="success">{String(item.egresos)} Egresos</Badge>
                  <Badge variant="info">{String(item.inmuebles)} inmuebles</Badge>
                </div>
              )},
              { key: 'ajustes', header: 'Ajustes / Deuda', align: 'right', render: (item) => (
                <span style={{ color: '#10b981' }}>{formatCurrency(Number(item.ajustes))}</span>
              )},
              { key: 'comision', header: 'Comisión', align: 'right', render: (item) => (
                <span style={{ color: '#ef4444' }}>{formatCurrency(Number(item.comision))}</span>
              )},
              { key: 'aLiquidar', header: 'A Liquidar', align: 'right', render: (item) => (
                <span style={{ color: '#3b82f6', fontWeight: 600 }}>{formatCurrency(Number(item.aLiquidar))}</span>
              )},
            ]}
            data={metrics.ownerData as unknown as Record<string, unknown>[]}
            totals={{
              ajustes: metrics.ingresos,
              comision: -metrics.comisiones,
              aLiquidar: metrics.aLiquidar,
            }}
            onRowClick={(item) => router.push(`/reports/estado-cuenta/${item.id}`)}
            pageSize={10}
          />
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightColumn}>
          <SummaryPanel
            title={`Totales ${periodLabel}`}
            items={[
              { label: 'Cobrado', value: metrics.ingresos, color: 'success' },
              { label: 'Ajustes', value: -metrics.ajustes, color: 'error' },
              { label: 'Comisión', value: -metrics.comisiones, color: 'warning' },
            ]}
            total={{ label: 'Total', value: metrics.aLiquidar }}
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
