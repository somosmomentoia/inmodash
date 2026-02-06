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
  CheckCircle,
  Clock,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardContent,
  Badge,
  StatCard,
  DataTableReport,
  PeriodSelector,
  FilterChips,
  BarChart,
  AnalyticsCard,
  RadialProgressCard,
} from '@/components/ui'
import { useObligations } from '@/hooks/useObligations'
import { useContracts } from '@/hooks/useContracts'
import { useApartments } from '@/hooks/useApartments'
import styles from './page.module.css'

export default function AnaliticasPage() {
  const router = useRouter()
  const [period, setPeriod] = useState('current-month')
  const { obligations, loading: obligationsLoading } = useObligations()
  const { contracts, loading: contractsLoading } = useContracts()
  const { apartments, loading: apartmentsLoading } = useApartments()

  const loading = obligationsLoading || contractsLoading || apartmentsLoading

  const metrics = useMemo(() => {
    const now = new Date()
    const paidObligations = obligations.filter(o => o.status === 'paid')
    
    // Ingresos del año
    const ingresosAnio = paidObligations
      .filter(o => new Date(o.dueDate).getFullYear() === now.getFullYear())
      .reduce((sum, o) => sum + o.paidAmount, 0)

    // Registros este mes
    const registrosMes = paidObligations.filter(o => {
      const date = new Date(o.dueDate)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length

    // Contratos vigentes
    const contratosVigentes = contracts.filter(c => new Date(c.endDate) > now).length

    // Mora actual
    const moraActual = obligations
      .filter(o => o.status === 'overdue')
      .reduce((sum, o) => sum + (o.amount - o.paidAmount), 0)

    // Ingresos y egresos por mes
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      const month = date.toLocaleString('es-AR', { month: 'short' })
      
      const monthObligations = paidObligations.filter(o => {
        const oDate = new Date(o.dueDate)
        return oDate.getMonth() === date.getMonth() && oDate.getFullYear() === date.getFullYear()
      })

      const ingresos = monthObligations.reduce((sum, o) => sum + o.paidAmount, 0)
      const egresos = monthObligations.reduce((sum, o) => sum + Math.abs(Math.min(o.ownerImpact, 0)), 0)

      return { label: month, value: ingresos, egresos }
    })

    // Distribución de propiedades por tipo
    const propertyTypes = apartments.reduce((acc, a) => {
      acc[a.propertyType] = (acc[a.propertyType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const propertyDistribution = Object.entries(propertyTypes).map(([type, count], i) => ({
      label: type === 'departamento' ? 'Departamentos' : type === 'casa' ? 'Casas' : type === 'local' ? 'Locales' : type === 'ph' ? 'Ph' : type,
      value: count,
      color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i % 5],
    }))

    // Contratos por vencer
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    const contratosPorVencer = contracts
      .filter(c => {
        const endDate = new Date(c.endDate)
        return endDate <= in90Days && endDate > now
      })
      .map(c => {
        const daysLeft = Math.ceil((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return {
          id: c.id,
          property: c.apartment?.nomenclature || `Propiedad #${c.apartmentId}`,
          type: 'Renta',
          taa: `${daysLeft} días`,
          cuotas: c.initialAmount,
          adeudado: 0,
          ultimoPago: new Date(c.startDate).toLocaleDateString('es-AR'),
        }
      })

    // Puntualidad de inquilinos
    const totalObligations = obligations.filter(o => o.type === 'rent').length
    const paidOnTime = paidObligations.filter(o => o.type === 'rent').length
    const pending = obligations.filter(o => o.status === 'pending' && o.type === 'rent').length
    const overdue = obligations.filter(o => o.status === 'overdue' && o.type === 'rent').length
    const puntualidadRate = totalObligations > 0 ? Math.round((paidOnTime / totalObligations) * 100) : 0

    return {
      ingresosAnio,
      registrosMes,
      contratosVigentes,
      moraActual,
      monthlyData,
      propertyDistribution,
      contratosPorVencer,
      puntualidad: {
        rate: puntualidadRate,
        onTime: paidOnTime,
        pending,
        overdue,
      },
    }
  }, [obligations, contracts, apartments])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <DashboardLayout title="Analíticas" subtitle="Cargando...">
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
        <span className={styles.breadcrumbCurrent}>Analíticas</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <PeriodSelector
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'current-month', label: 'Abril 2024 (1 de abr. al 30 de abr.)' },
              { value: 'last-month', label: 'Marzo 2024' },
              { value: 'this-year', label: 'Año 2024' },
            ]}
          />
          <FilterChips
            chips={[
              { id: 'owners', label: 'Todos los propietarios', icon: <Users size={14} />, hasDropdown: true },
              { id: 'properties', label: 'Todas las propiedades', icon: <Building2 size={14} />, hasDropdown: true },
              { id: 'contracts', label: 'Todos los contratos', icon: <FileText size={14} />, hasDropdown: true },
            ]}
            variant="outline"
          />
        </div>
        <div className={styles.headerRight}>
          <Button leftIcon={<Download size={16} />}>
            Exportar Vista
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Ingresos este Año"
          value={formatCurrency(metrics.ingresosAnio)}
          icon={<DollarSign size={18} />}
          variant="success"
        />
        <StatCard
          title="Registros este Mes"
          value={String(metrics.registrosMes)}
          icon={<FileText size={18} />}
          variant="primary"
        />
        <StatCard
          title="Contratos Vigentes"
          value={String(metrics.contratosVigentes)}
          icon={<CheckCircle size={18} />}
          variant="primary"
        />
        <StatCard
          title="Mora Actual"
          value={formatCurrency(metrics.moraActual)}
          icon={<AlertTriangle size={18} />}
          variant="error"
        />
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        <Card className={styles.chartCard}>
          <CardContent>
            <div className={styles.chartHeader}>
              <h3>Ingresos y Egresos</h3>
              <PeriodSelector
                value="12-months"
                onChange={() => {}}
                options={[{ value: '12-months', label: 'Últimos 12 meses' }]}
              />
            </div>
            <BarChart data={metrics.monthlyData} showValues />
            <div className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#3b82f6' }} />
                Ingresos
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#ef4444' }} />
                Egresos
              </span>
            </div>
            <div className={styles.chartSummary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue} style={{ color: '#10b981' }}>
                  {formatCurrency(metrics.monthlyData.reduce((s, m) => s + m.value, 0))}
                </span>
                <span className={styles.summaryLabel}>Ingresos</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue} style={{ color: '#ef4444' }}>
                  -{formatCurrency(metrics.monthlyData.reduce((s, m) => s + (m.egresos || 0), 0))}
                </span>
                <span className={styles.summaryLabel}>Egresos</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue} style={{ color: '#3b82f6' }}>
                  +{formatCurrency(metrics.monthlyData.reduce((s, m) => s + m.value - (m.egresos || 0), 0))}
                </span>
                <span className={styles.summaryLabel}>Resultado Neto</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.chartCard}>
          <CardContent>
            <div className={styles.chartHeader}>
              <h3>Distribución de Tipos de Propiedad</h3>
            </div>
            <RadialProgressCard
              title=""
              segments={metrics.propertyDistribution.map(p => ({
                value: p.value,
                color: p.color,
                label: p.label,
              }))}
              centerValue={String(apartments.length)}
              centerLabel="Total"
              size="md"
            />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className={styles.bottomRow}>
        <DataTableReport
          title="Contratos por Vencer"
          columns={[
            { key: 'type', header: '', render: (item) => (
              <Badge variant="warning">{String(item.type)}</Badge>
            )},
            { key: 'property', header: 'Propiedad' },
            { key: 'taa', header: 'TAA', render: (item) => (
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>{String(item.taa)}</span>
            )},
            { key: 'cuotas', header: 'Cuotas', align: 'right', render: (item) => formatCurrency(Number(item.cuotas)) },
            { key: 'adeudado', header: 'Adeudado', align: 'right', render: (item) => (
              <span style={{ color: '#ef4444' }}>{formatCurrency(Number(item.adeudado))}</span>
            )},
            { key: 'ultimoPago', header: 'Último Pago', render: (item) => (
              <Button variant="ghost" size="sm" onClick={() => router.push(`/contracts/${item.id}`)}>
                {String(item.ultimoPago)} →
              </Button>
            )},
          ]}
          data={metrics.contratosPorVencer as unknown as Record<string, unknown>[]}
          pageSize={5}
          emptyMessage="No hay contratos próximos a vencer"
        />

        <Card>
          <CardContent>
            <h3 className={styles.cardTitle}>Puntualidad de Inquilinos</h3>
            <div className={styles.puntualidadChart}>
              <div className={styles.puntualidadCircle}>
                <span className={styles.puntualidadValue}>{metrics.puntualidad.rate}%</span>
              </div>
              <div className={styles.puntualidadLegend}>
                <div className={styles.puntualidadItem}>
                  <span className={styles.puntualidadDot} style={{ background: '#10b981' }} />
                  <span>Pago a tiempo</span>
                  <strong>{metrics.puntualidad.onTime}</strong>
                </div>
                <div className={styles.puntualidadItem}>
                  <span className={styles.puntualidadDot} style={{ background: '#f59e0b' }} />
                  <span>Pendiente</span>
                  <strong>{metrics.puntualidad.pending}</strong>
                </div>
                <div className={styles.puntualidadItem}>
                  <span className={styles.puntualidadDot} style={{ background: '#ef4444' }} />
                  <span>Mora</span>
                  <strong>{metrics.puntualidad.overdue}</strong>
                </div>
              </div>
            </div>
            <div className={styles.exportButtons}>
              <Button variant="secondary" size="sm" leftIcon={<FileText size={14} />}>
                Guardar PDF
              </Button>
              <Button variant="secondary" size="sm" leftIcon={<Download size={14} />}>
                Exportar Excel / CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
