'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  ArrowLeft,
  Download,
  FileText,
  AlertTriangle,
  Building2,
  Users,
  Clock,
  Search,
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
  EntityHeader,
  PeriodSelector,
  FilterChips,
  Input,
} from '@/components/ui'
import { useOwners } from '@/hooks/useOwners'
import { useObligations } from '@/hooks/useObligations'
import { useApartments } from '@/hooks/useApartments'
import { 
  PeriodType, 
  getPeriodOptions, 
  getDateRangeForPeriod 
} from '@/hooks/useReportFilters'
import styles from './page.module.css'

type MoraFilter = 'all' | '0-30' | '31-60' | '61-90' | '90+'

export default function MoraPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<PeriodType>('all')
  const [moraFilter, setMoraFilter] = useState<MoraFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null)
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null)
  
  const { owners, loading: ownersLoading } = useOwners()
  const { obligations, loading: obligationsLoading } = useObligations()
  const { apartments, loading: apartmentsLoading } = useApartments()

  const loading = ownersLoading || obligationsLoading || apartmentsLoading
  
  const periodOptions = useMemo(() => getPeriodOptions(true), [])
  const dateRange = useMemo(() => getDateRangeForPeriod(period), [period])
  const periodLabel = useMemo(() => {
    if (period === 'all') return 'Todo el período'
    return dateRange.start.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  }, [dateRange, period])

  const metrics = useMemo(() => {
    const now = new Date()
    let overdueObligations = obligations.filter(o => o.status === 'overdue' || o.status === 'pending')
    
    // Filter by property if selected
    if (selectedPropertyId) {
      overdueObligations = overdueObligations.filter(o => o.apartmentId === selectedPropertyId)
    }
    
    // Filter by owner if selected
    if (selectedOwnerId) {
      overdueObligations = overdueObligations.filter(o => {
        const apartment = o.apartment
        return apartment && apartment.ownerId === selectedOwnerId
      })
    }
    
    const calculateDaysMora = (dueDate: Date) => {
      const due = new Date(dueDate)
      const diff = now.getTime() - due.getTime()
      return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
    }

    const debtData = overdueObligations.map(o => {
      const daysMora = calculateDaysMora(o.dueDate)
      const apartment = o.apartment
      const owner = owners.find(ow => apartment && ow.id === apartment.ownerId)
      
      return {
        id: o.id,
        type: o.type,
        property: apartment?.nomenclature || 'Sin propiedad',
        tenant: o.contract?.tenantId ? `Inquilino #${o.contract.tenantId}` : 'Sin inquilino',
        daysMora,
        adeudado: o.amount - o.paidAmount,
        comision: o.commissionAmount || 0,
        neto: (o.amount - o.paidAmount) - (o.commissionAmount || 0),
        ownerId: owner?.id,
        ownerName: owner?.name || 'Sin propietario',
        ownerEmail: owner?.email || '',
        ownerPhone: owner?.phone || '',
        dueDate: o.dueDate,
      }
    }).filter(d => d.adeudado > 0)

    // Filter by mora range
    const filteredData = debtData.filter(d => {
      if (moraFilter === 'all') return true
      if (moraFilter === '0-30') return d.daysMora >= 0 && d.daysMora <= 30
      if (moraFilter === '31-60') return d.daysMora >= 31 && d.daysMora <= 60
      if (moraFilter === '61-90') return d.daysMora >= 61 && d.daysMora <= 90
      if (moraFilter === '90+') return d.daysMora > 90
      return true
    })

    // Search filter
    const searchedData = searchQuery 
      ? filteredData.filter(d => 
          d.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.tenant.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : filteredData

    // Group by owner for display
    const ownerGroups = searchedData.reduce((acc, d) => {
      const key = d.ownerId || 'unknown'
      if (!acc[key]) {
        acc[key] = {
          ownerId: d.ownerId,
          ownerName: d.ownerName,
          ownerEmail: d.ownerEmail,
          ownerPhone: d.ownerPhone,
          debts: [],
          totalAdeudado: 0,
        }
      }
      acc[key].debts.push(d)
      acc[key].totalAdeudado += d.adeudado
      return acc
    }, {} as Record<string, { ownerId?: number; ownerName: string; ownerEmail: string; ownerPhone: string; debts: typeof searchedData; totalAdeudado: number }>)

    // Summary by mora range
    const range0_30 = debtData.filter(d => d.daysMora >= 0 && d.daysMora <= 30)
    const range31_60 = debtData.filter(d => d.daysMora >= 31 && d.daysMora <= 60)
    const range61_90 = debtData.filter(d => d.daysMora >= 61 && d.daysMora <= 90)
    const range90plus = debtData.filter(d => d.daysMora > 90)

    const totalAdeudado = debtData.reduce((sum, d) => sum + d.adeudado, 0)
    const totalComision = debtData.reduce((sum, d) => sum + d.comision, 0)

    return {
      totalAdeudado,
      totalComision,
      totalContratos: debtData.length,
      ownerGroups: Object.values(ownerGroups),
      searchedData,
      summary: {
        range0_30: { count: range0_30.length, total: range0_30.reduce((s, d) => s + d.adeudado, 0) },
        range31_60: { count: range31_60.length, total: range31_60.reduce((s, d) => s + d.adeudado, 0) },
        range61_90: { count: range61_90.length, total: range61_90.reduce((s, d) => s + d.adeudado, 0) },
        range90plus: { count: range90plus.length, total: range90plus.reduce((s, d) => s + d.adeudado, 0) },
      },
    }
  }, [owners, obligations, moraFilter, searchQuery, selectedPropertyId, selectedOwnerId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const moraFilters: { id: MoraFilter; label: string; color: string }[] = [
    { id: 'all', label: 'Todos', color: '#6b7280' },
    { id: '0-30', label: '0-30 días', color: '#10b981' },
    { id: '31-60', label: '31-60 días', color: '#f59e0b' },
    { id: '61-90', label: '61-90 días', color: '#f97316' },
    { id: '90+', label: '+90 días', color: '#ef4444' },
  ]

  if (loading) {
    return (
      <DashboardLayout title="Mora y Deudas" subtitle="Cargando...">
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
        <span className={styles.breadcrumbCurrent}>Mora y Deudas</span>
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

      {/* Mora Filters */}
      <div className={styles.moraFilters}>
        {moraFilters.map(filter => (
          <button
            key={filter.id}
            className={`${styles.moraFilter} ${moraFilter === filter.id ? styles.active : ''}`}
            onClick={() => setMoraFilter(filter.id)}
            style={{ '--filter-color': filter.color } as React.CSSProperties}
          >
            <span className={styles.moraFilterDot} />
            {filter.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          {/* Owner Groups */}
          {metrics.ownerGroups.map((group, idx) => (
            <div key={idx} className={styles.ownerSection}>
              <EntityHeader
                name={group.ownerName}
                email={group.ownerEmail}
                phone={group.ownerPhone}
                balance={group.totalAdeudado}
              />

              {/* Search and filters */}
              <div className={styles.tableFilters}>
                <div className={styles.miniFilters}>
                  {moraFilters.slice(1).map(filter => (
                    <button
                      key={filter.id}
                      className={`${styles.miniFilter} ${moraFilter === filter.id ? styles.active : ''}`}
                      onClick={() => setMoraFilter(filter.id)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="Buscar cont..."
                  leftIcon={<Search size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ maxWidth: 200 }}
                />
              </div>

              <DataTableReport
                columns={[
                  { key: 'type', header: 'Tipo', render: (item) => (
                    <Badge variant={item.type === 'rent' ? 'warning' : 'info'}>
                      {item.type === 'rent' ? 'Renta' : String(item.type)}
                    </Badge>
                  )},
                  { key: 'property', header: 'Propiedad' },
                  { key: 'tenant', header: 'Inquilino' },
                  { key: 'daysMora', header: 'Mora', align: 'center', render: (item) => (
                    <span style={{ 
                      color: Number(item.daysMora) > 60 ? '#ef4444' : Number(item.daysMora) > 30 ? '#f59e0b' : '#10b981',
                      fontWeight: 600 
                    }}>
                      {String(item.daysMora)}
                    </span>
                  )},
                  { key: 'adeudado', header: 'Adeudado', align: 'right', render: (item) => (
                    <span style={{ color: '#ef4444' }}>{formatCurrency(Number(item.adeudado))}</span>
                  )},
                  { key: 'comision', header: 'Comisión', align: 'right', render: (item) => formatCurrency(Number(item.comision)) },
                  { key: 'neto', header: 'Neto', align: 'right', render: (item) => (
                    <span style={{ color: '#3b82f6', fontWeight: 600 }}>{formatCurrency(Number(item.neto))}</span>
                  )},
                ]}
                data={group.debts as unknown as Record<string, unknown>[]}
                pageSize={5}
              />
            </div>
          ))}

          {metrics.ownerGroups.length === 0 && (
            <Card>
              <CardContent>
                <div className={styles.emptyState}>
                  <AlertTriangle size={48} />
                  <h3>No hay deudas pendientes</h3>
                  <p>No se encontraron obligaciones vencidas en el período seleccionado.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mora Summary */}
          <Card>
            <CardContent>
              <h3 className={styles.summaryTitle}>Resumen de Mora</h3>
              <div className={styles.moraSummary}>
                <div className={styles.moraSummaryItem}>
                  <span className={styles.moraDot} style={{ background: '#10b981' }} />
                  <span className={styles.moraLabel}>0-30 días, {metrics.summary.range0_30.count} contratos</span>
                  <span className={styles.moraValue}>{formatCurrency(metrics.summary.range0_30.total)}</span>
                </div>
                <div className={styles.moraSummaryItem}>
                  <span className={styles.moraDot} style={{ background: '#f59e0b' }} />
                  <span className={styles.moraLabel}>31-60 días, {metrics.summary.range31_60.count} contratos</span>
                  <span className={styles.moraValue}>{formatCurrency(metrics.summary.range31_60.total)}</span>
                </div>
                <div className={styles.moraSummaryItem}>
                  <span className={styles.moraDot} style={{ background: '#f97316' }} />
                  <span className={styles.moraLabel}>61-90 días</span>
                  <span className={styles.moraValue}>{formatCurrency(metrics.summary.range61_90.total)}</span>
                </div>
                <div className={styles.moraSummaryItem}>
                  <span className={styles.moraDot} style={{ background: '#ef4444' }} />
                  <span className={styles.moraLabel}>+90 días, {metrics.summary.range90plus.count} contratos</span>
                  <span className={styles.moraValue}>{formatCurrency(metrics.summary.range90plus.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightColumn}>
          <SummaryPanel
            title={`Resumen ${periodLabel}`}
            items={[
              { label: 'Total Adeudado', value: metrics.totalAdeudado, color: 'error' },
              { label: 'Comisiones', value: -metrics.totalComision, color: 'warning' },
            ]}
            total={{ label: 'Total', value: metrics.totalAdeudado - metrics.totalComision }}
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
