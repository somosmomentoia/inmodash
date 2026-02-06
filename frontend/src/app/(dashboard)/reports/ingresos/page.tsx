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
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardContent,
  StatCard,
  DataTableReport,
  PeriodSelector,
  FilterChips,
  BarChart,
  MiniChart,
} from '@/components/ui'
import { useObligations } from '@/hooks/useObligations'
import { useOwners } from '@/hooks/useOwners'
import styles from './page.module.css'

export default function IngresosPage() {
  const router = useRouter()
  const [period, setPeriod] = useState('last-12-months')
  const { obligations, loading: obligationsLoading } = useObligations()
  const { owners, loading: ownersLoading } = useOwners()

  const loading = obligationsLoading || ownersLoading

  const metrics = useMemo(() => {
    const now = new Date()
    const paidObligations = obligations.filter(o => o.status === 'paid')
    
    const ingresosAnio = paidObligations.reduce((sum, o) => sum + o.paidAmount, 0)
    const registros = paidObligations.length
    
    const egresos = paidObligations
      .filter(o => o.ownerImpact < 0)
      .reduce((sum, o) => sum + Math.abs(o.ownerImpact), 0)

    const moraActual = obligations
      .filter(o => o.status === 'overdue')
      .reduce((sum, o) => sum + (o.amount - o.paidAmount), 0)

    // Monthly data
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      const month = date.toLocaleString('es-AR', { month: 'short', year: '2-digit' })
      
      const monthObligations = paidObligations.filter(o => {
        const oDate = new Date(o.dueDate)
        return oDate.getMonth() === date.getMonth() && oDate.getFullYear() === date.getFullYear()
      })

      const ingresos = monthObligations.reduce((sum, o) => sum + o.paidAmount, 0)
      const egresosMonth = monthObligations.reduce((sum, o) => sum + Math.abs(Math.min(o.ownerImpact, 0)), 0)

      return { label: month, value: ingresos, egresos: egresosMonth }
    })

    // Per owner data
    const ownerData = owners.map(owner => {
      const ownerObligations = paidObligations.filter(o => {
        const apartment = o.apartment
        return apartment && apartment.ownerId === owner.id
      })

      const ownerIngresos = ownerObligations.reduce((sum, o) => sum + o.paidAmount, 0)
      const ownerEgresos = ownerObligations.reduce((sum, o) => sum + Math.abs(Math.min(o.ownerImpact, 0)), 0)

      return {
        id: owner.id,
        name: owner.name,
        email: owner.email || '',
        propiedades: owner.apartments?.length || 0,
        ingresos: ownerIngresos,
        egresos: ownerEgresos,
      }
    }).filter(o => o.ingresos > 0)

    const totalIngresos = monthlyData.reduce((s, m) => s + m.value, 0)
    const totalEgresos = monthlyData.reduce((s, m) => s + (m.egresos || 0), 0)
    const resultadoNeto = totalIngresos - totalEgresos

    return {
      ingresosAnio,
      registros,
      egresos,
      moraActual,
      monthlyData,
      ownerData,
      totalIngresos,
      totalEgresos,
      resultadoNeto,
    }
  }, [obligations, owners])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <DashboardLayout title="Ingresos" subtitle="Cargando...">
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
        <span className={styles.breadcrumbCurrent}>Ingresos</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <PeriodSelector
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'last-12-months', label: 'Últimos 12 meses (may. 2023 - abr.)' },
              { value: 'this-year', label: 'Año 2024' },
              { value: 'last-year', label: 'Año 2023' },
            ]}
          />
          <FilterChips
            chips={[
              { id: 'owners', label: 'Todos los propietarios', icon: <Users size={14} />, hasDropdown: true },
              { id: 'properties', label: 'Todas las propiedades', icon: <Building2 size={14} />, hasDropdown: true },
            ]}
            variant="outline"
          />
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
          title="Ingresos este Año"
          value={formatCurrency(metrics.ingresosAnio)}
          icon={<DollarSign size={18} />}
          variant="success"
        />
        <StatCard
          title="Registros"
          value={String(metrics.registros)}
          icon={<FileText size={18} />}
          variant="primary"
        />
        <StatCard
          title="Egresos"
          value={formatCurrency(metrics.egresos)}
          icon={<TrendingDown size={18} />}
          variant="error"
        />
        <StatCard
          title="Mora Actual"
          value={formatCurrency(metrics.moraActual)}
          icon={<TrendingUp size={18} />}
          variant="warning"
        />
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        <Card className={styles.chartCard}>
          <CardContent>
            <div className={styles.chartHeader}>
              <h3>Ingresos Mensuales</h3>
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
                  {formatCurrency(metrics.totalIngresos)}
                </span>
                <span className={styles.summaryLabel}>Ingresos</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue} style={{ color: '#ef4444' }}>
                  -{formatCurrency(metrics.totalEgresos)}
                </span>
                <span className={styles.summaryLabel}>Egresos</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue} style={{ color: '#3b82f6' }}>
                  +{formatCurrency(metrics.resultadoNeto)}
                </span>
                <span className={styles.summaryLabel}>Resultado Neto</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.chartCard}>
          <CardContent>
            <div className={styles.chartHeader}>
              <h3>Ingresos Mensuales</h3>
            </div>
            <div className={styles.lineChartContainer}>
              <MiniChart 
                data={metrics.monthlyData.map(m => m.value)} 
                color="primary" 
                height={150} 
              />
            </div>
            <div className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#8b5cf6' }} />
                Depto contratados
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#ef4444' }} />
                Egresos
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#10b981' }} />
                Resultado Neto
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Owners Table */}
      <DataTableReport
        title="Ingresos Detallados - Últimos 12 meses"
        showAvatar
        columns={[
          { key: 'name', header: 'Propietario' },
          { key: 'email', header: 'Email' },
          { key: 'propiedades', header: 'Propiedades', align: 'center' },
          { key: 'ingresos', header: 'Ingresos', align: 'right', render: (item) => (
            <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(Number(item.ingresos))}</span>
          )},
          { key: 'egresos', header: 'Egresos', align: 'right', render: (item) => (
            <span style={{ color: '#ef4444' }}>{formatCurrency(Number(item.egresos))}</span>
          )},
          { key: 'action', header: '', render: (item) => (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push(`/reports/estado-cuenta/${item.id}`)}
            >
              Ver Detalle →
            </Button>
          )},
        ]}
        data={metrics.ownerData as unknown as Record<string, unknown>[]}
        totals={{
          propiedades: metrics.ownerData.reduce((s, o) => s + o.propiedades, 0),
          ingresos: metrics.ownerData.reduce((s, o) => s + o.ingresos, 0),
          egresos: metrics.ownerData.reduce((s, o) => s + o.egresos, 0),
        }}
        pageSize={10}
      />
    </DashboardLayout>
  )
}
