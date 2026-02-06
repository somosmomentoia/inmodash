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
  Percent,
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
import { useObligations } from '@/hooks/useObligations'
import { useOwners } from '@/hooks/useOwners'
import { useApartments } from '@/hooks/useApartments'
import { 
  PeriodType, 
  getPeriodOptions, 
  filterObligationsByPeriod,
  getDateRangeForPeriod 
} from '@/hooks/useReportFilters'
import styles from './page.module.css'

export default function ComisionesPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<PeriodType>('current-month')
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null)
  
  const { obligations, loading: obligationsLoading } = useObligations()
  const { owners, loading: ownersLoading } = useOwners()
  const { apartments, loading: apartmentsLoading } = useApartments()

  const loading = obligationsLoading || ownersLoading || apartmentsLoading
  
  const periodOptions = useMemo(() => getPeriodOptions(), [])
  const dateRange = useMemo(() => getDateRangeForPeriod(period), [period])
  const periodLabel = useMemo(() => {
    return dateRange.start.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  }, [dateRange])

  const metrics = useMemo(() => {
    // Filter by period first
    const periodFiltered = filterObligationsByPeriod(obligations, period, 'dueDate')
    
    let paidRentObligations = periodFiltered.filter(o => o.status === 'paid' && o.type === 'rent')
    
    // Filter by owner if selected
    if (selectedOwnerId) {
      paidRentObligations = paidRentObligations.filter(o => {
        const apartment = o.apartment
        return apartment && apartment.ownerId === selectedOwnerId
      })
    }
    
    // Filter by property if selected
    if (selectedPropertyId) {
      paidRentObligations = paidRentObligations.filter(o => o.apartmentId === selectedPropertyId)
    }
    
    const totalComisiones = paidRentObligations.reduce((sum, o) => sum + (o.commissionAmount || 0), 0)
    const totalAlquileres = paidRentObligations.reduce((sum, o) => sum + o.paidAmount, 0)
    const porcentajePromedio = totalAlquileres > 0 ? (totalComisiones / totalAlquileres) * 100 : 0

    // Per owner commission data
    const comisionesData = owners.map(owner => {
      const ownerObligations = paidRentObligations.filter(o => {
        const apartment = o.apartment
        return apartment && apartment.ownerId === owner.id
      })

      const ownerComision = ownerObligations.reduce((sum, o) => sum + (o.commissionAmount || 0), 0)
      const ownerAlquileres = ownerObligations.reduce((sum, o) => sum + o.paidAmount, 0)
      const ownerPorcentaje = ownerAlquileres > 0 ? (ownerComision / ownerAlquileres) * 100 : 0

      return {
        id: owner.id,
        name: owner.name,
        email: owner.email || '',
        propiedades: owner.apartments?.length || 0,
        alquileres: ownerAlquileres,
        porcentaje: ownerPorcentaje,
        comision: ownerComision,
      }
    }).filter(o => o.comision > 0)

    return {
      totalComisiones,
      totalAlquileres,
      porcentajePromedio,
      contratos: paidRentObligations.length,
      comisionesData,
    }
  }, [obligations, owners, period, selectedOwnerId, selectedPropertyId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <DashboardLayout title="Comisiones Cobradas" subtitle="Cargando...">
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
        <span className={styles.breadcrumbCurrent}>Comisiones Cobradas</span>
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
          title="Total Comisiones"
          value={formatCurrency(metrics.totalComisiones)}
          icon={<DollarSign size={18} />}
          variant="success"
        />
        <StatCard
          title="Total Alquileres"
          value={formatCurrency(metrics.totalAlquileres)}
          icon={<TrendingUp size={18} />}
          variant="primary"
        />
        <StatCard
          title="% Promedio"
          value={`${metrics.porcentajePromedio.toFixed(1)}%`}
          icon={<Percent size={18} />}
          variant="warning"
        />
        <StatCard
          title="Contratos"
          value={String(metrics.contratos)}
          icon={<FileText size={18} />}
          variant="primary"
        />
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <DataTableReport
            title={`Comisiones por Propietario - ${periodLabel}`}
            showAvatar
            columns={[
              { key: 'name', header: 'Propietario' },
              { key: 'propiedades', header: 'Propiedades', align: 'center' },
              { key: 'alquileres', header: 'Alquileres', align: 'right', render: (item) => (
                formatCurrency(Number(item.alquileres))
              )},
              { key: 'porcentaje', header: '%', align: 'center', render: (item) => (
                <Badge variant="info">{Number(item.porcentaje).toFixed(1)}%</Badge>
              )},
              { key: 'comision', header: 'Comisión', align: 'right', render: (item) => (
                <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(Number(item.comision))}</span>
              )},
            ]}
            data={metrics.comisionesData as unknown as Record<string, unknown>[]}
            totals={{
              propiedades: metrics.comisionesData.reduce((s, o) => s + o.propiedades, 0),
              alquileres: metrics.totalAlquileres,
              comision: metrics.totalComisiones,
            }}
            onRowClick={(item) => router.push(`/reports/estado-cuenta/${item.id}`)}
            pageSize={10}
          />
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightColumn}>
          <SummaryPanel
            title={`Resumen ${periodLabel}`}
            items={[
              { label: 'Total Alquileres', value: metrics.totalAlquileres, color: 'default' },
              { label: 'Comisiones', value: metrics.totalComisiones, color: 'success' },
              { label: '% Promedio', value: `${metrics.porcentajePromedio.toFixed(1)}%` },
            ]}
            total={{ label: 'Total Comisiones', value: metrics.totalComisiones }}
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
