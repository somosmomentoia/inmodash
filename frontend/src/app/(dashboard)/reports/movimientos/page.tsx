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
import { useApartments } from '@/hooks/useApartments'
import { useOwners } from '@/hooks/useOwners'
import { 
  PeriodType, 
  getPeriodOptions, 
  filterObligationsByPeriod,
  getDateRangeForPeriod 
} from '@/hooks/useReportFilters'
import styles from './page.module.css'

export default function MovimientosPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<PeriodType>('current-month')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null)
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null)
  
  const { obligations, loading: obligationsLoading } = useObligations()
  const { apartments, loading: apartmentsLoading } = useApartments()
  const { owners, loading: ownersLoading } = useOwners()
  
  const loading = obligationsLoading || apartmentsLoading || ownersLoading
  
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
    
    // Filter by owner if selected
    if (selectedOwnerId) {
      paidObligations = paidObligations.filter(o => {
        const apartment = o.apartment
        return apartment && apartment.ownerId === selectedOwnerId
      })
    }
    
    const ingresos = paidObligations
      .filter(o => o.ownerImpact > 0 || o.agencyImpact > 0)
      .reduce((sum, o) => sum + Math.max(o.ownerImpact, 0) + Math.max(o.agencyImpact, 0), 0)
    
    const egresos = paidObligations
      .filter(o => o.ownerImpact < 0 || o.agencyImpact < 0)
      .reduce((sum, o) => sum + Math.abs(Math.min(o.ownerImpact, 0)) + Math.abs(Math.min(o.agencyImpact, 0)), 0)

    const resultadoNeto = ingresos - egresos

    // Movimientos data
    const movimientosData = paidObligations.map(o => {
      const ingreso = Math.max(o.ownerImpact, 0) + Math.max(o.agencyImpact, 0)
      const egreso = Math.abs(Math.min(o.ownerImpact, 0)) + Math.abs(Math.min(o.agencyImpact, 0))
      
      return {
        id: o.id,
        tipo: o.type,
        fecha: new Date(o.updatedAt).toLocaleDateString('es-AR'),
        concepto: o.description,
        propiedad: o.apartment?.nomenclature || 'Sin propiedad',
        ingreso,
        egreso,
        neto: ingreso - egreso,
      }
    })

    // Filter by type
    const filteredByType = typeFilter === 'all' 
      ? movimientosData 
      : movimientosData.filter(m => m.tipo === typeFilter)

    // Filter by search
    const filteredData = searchQuery
      ? filteredByType.filter(m =>
          m.concepto.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.propiedad.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : filteredByType

    return {
      ingresos,
      egresos,
      resultadoNeto,
      registros: paidObligations.length,
      movimientosData: filteredData,
    }
  }, [obligations, searchQuery, typeFilter, period, selectedPropertyId, selectedOwnerId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const typeFilters = [
    { id: 'all', label: 'Todos' },
    { id: 'rent', label: 'Alquiler' },
    { id: 'expenses', label: 'Expensas' },
    { id: 'maintenance', label: 'Mantenimiento' },
    { id: 'tax', label: 'Impuestos' },
    { id: 'service', label: 'Servicios' },
  ]

  if (loading) {
    return (
      <DashboardLayout title="Movimientos Financieros" subtitle="Cargando...">
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
        <span className={styles.breadcrumbCurrent}>Movimientos Financieros</span>
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
          title="Ingresos"
          value={formatCurrency(metrics.ingresos)}
          icon={<TrendingUp size={18} />}
          variant="success"
        />
        <StatCard
          title="Egresos"
          value={formatCurrency(metrics.egresos)}
          icon={<TrendingDown size={18} />}
          variant="error"
        />
        <StatCard
          title="Resultado Neto"
          value={formatCurrency(metrics.resultadoNeto)}
          icon={<DollarSign size={18} />}
          variant={metrics.resultadoNeto >= 0 ? 'success' : 'error'}
        />
        <StatCard
          title="Registros"
          value={String(metrics.registros)}
          icon={<FileText size={18} />}
          variant="primary"
        />
      </div>

      {/* Type Filters */}
      <div className={styles.typeFilters}>
        {typeFilters.map(filter => (
          <button
            key={filter.id}
            className={`${styles.typeFilter} ${typeFilter === filter.id ? styles.active : ''}`}
            onClick={() => setTypeFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          {/* Search */}
          <div className={styles.tableHeader}>
            <h3>Movimientos - {periodLabel}</h3>
            <Input
              placeholder="Buscar movimientos..."
              leftIcon={<Search size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: 250 }}
            />
          </div>

          <DataTableReport
            columns={[
              { key: 'tipo', header: 'Tipo', render: (item) => (
                <Badge variant={
                  item.tipo === 'rent' ? 'success' : 
                  item.tipo === 'maintenance' ? 'warning' : 
                  item.tipo === 'expenses' ? 'info' : 
                  item.tipo === 'tax' ? 'error' : 'default'
                }>
                  {item.tipo === 'rent' ? 'Alquiler' : 
                   item.tipo === 'maintenance' ? 'Mant.' : 
                   item.tipo === 'expenses' ? 'Expensas' : 
                   item.tipo === 'tax' ? 'Impuesto' : 
                   item.tipo === 'service' ? 'Servicio' : String(item.tipo)}
                </Badge>
              )},
              { key: 'fecha', header: 'Fecha' },
              { key: 'concepto', header: 'Concepto' },
              { key: 'propiedad', header: 'Propiedad' },
              { key: 'ingreso', header: 'Ingreso', align: 'right', render: (item) => (
                Number(item.ingreso) > 0 
                  ? <span style={{ color: '#10b981' }}>{formatCurrency(Number(item.ingreso))}</span>
                  : '-'
              )},
              { key: 'egreso', header: 'Egreso', align: 'right', render: (item) => (
                Number(item.egreso) > 0 
                  ? <span style={{ color: '#ef4444' }}>-{formatCurrency(Number(item.egreso))}</span>
                  : '-'
              )},
              { key: 'neto', header: 'Neto', align: 'right', render: (item) => (
                <span style={{ 
                  color: Number(item.neto) >= 0 ? '#3b82f6' : '#ef4444', 
                  fontWeight: 600 
                }}>
                  {formatCurrency(Number(item.neto))}
                </span>
              )},
            ]}
            data={metrics.movimientosData as unknown as Record<string, unknown>[]}
            totals={{
              ingreso: metrics.ingresos,
              egreso: metrics.egresos,
              neto: metrics.resultadoNeto,
            }}
            pageSize={15}
          />
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightColumn}>
          <SummaryPanel
            title={`Resumen ${periodLabel}`}
            items={[
              { label: 'Ingresos', value: metrics.ingresos, color: 'success' },
              { label: 'Egresos', value: -metrics.egresos, color: 'error' },
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
