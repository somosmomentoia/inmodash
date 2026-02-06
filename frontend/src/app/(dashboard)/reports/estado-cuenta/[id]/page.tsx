'use client'

import { useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  DollarSign,
  ArrowLeft,
  Download,
  FileText,
  Printer,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Badge,
  StatCard,
  SummaryPanel,
  DataTableReport,
  EntityHeader,
  PeriodSelector,
} from '@/components/ui'
import { useOwners } from '@/hooks/useOwners'
import { useObligations } from '@/hooks/useObligations'
import styles from './page.module.css'

export default function EstadoCuentaPage() {
  const router = useRouter()
  const params = useParams()
  const ownerId = Number(params.id)
  const [period, setPeriod] = useState('current-month')
  
  const { owners, loading: ownersLoading } = useOwners()
  const { obligations, loading: obligationsLoading } = useObligations()

  const loading = ownersLoading || obligationsLoading

  const owner = owners.find(o => o.id === ownerId)

  const metrics = useMemo(() => {
    if (!owner) return null

    const paidObligations = obligations.filter(o => {
      const apartment = o.apartment
      return o.status === 'paid' && apartment && apartment.ownerId === ownerId
    })

    const cobrado = paidObligations
      .filter(o => o.ownerImpact > 0)
      .reduce((sum, o) => sum + o.ownerImpact, 0)

    const ajustes = paidObligations
      .filter(o => o.ownerImpact < 0)
      .reduce((sum, o) => sum + Math.abs(o.ownerImpact), 0)

    const comision = paidObligations
      .filter(o => o.type === 'rent')
      .reduce((sum, o) => sum + (o.commissionAmount || 0), 0)

    const saldoALiquidar = cobrado - ajustes - comision

    const movimientos = paidObligations.map(o => ({
      id: o.id,
      tipo: o.type,
      fecha: new Date(o.updatedAt).toLocaleDateString('es-AR'),
      concepto: o.description,
      cobrado: o.ownerImpact > 0 ? o.ownerImpact : 0,
      ajustes: o.ownerImpact < 0 ? o.ownerImpact : 0,
      comision: o.type === 'rent' ? -(o.commissionAmount || 0) : 0,
      neto: o.ownerImpact - (o.type === 'rent' ? (o.commissionAmount || 0) : 0),
    }))

    return {
      cobrado,
      ajustes,
      comision,
      saldoALiquidar,
      registros: paidObligations.length,
      movimientos,
    }
  }, [owner, obligations, ownerId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <DashboardLayout title="Estado de Cuenta" subtitle="Cargando...">
        <div className={styles.loading}>Cargando datos...</div>
      </DashboardLayout>
    )
  }

  if (!owner || !metrics) {
    return (
      <DashboardLayout title="Estado de Cuenta" subtitle="Propietario no encontrado">
        <div className={styles.loading}>
          <p>No se encontró el propietario</p>
          <Button onClick={() => router.push('/reports/liquidaciones')}>
            Volver a Liquidaciones
          </Button>
        </div>
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
        <button className={styles.backButton} onClick={() => router.push('/reports/liquidaciones')}>
          Liquidaciones
        </button>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>Estado de Cuenta - {owner.name}</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <PeriodSelector
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'current-month', label: 'Abril 2024 (1 de abr. al 30 de abr.)' },
              { value: 'last-12-months', label: 'Últimos 12 meses (may. 2023 - abr. 2024)' },
            ]}
          />
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
          title="Cobrado"
          value={formatCurrency(metrics.cobrado)}
          icon={<TrendingUp size={18} />}
          variant="success"
        />
        <StatCard
          title="Registros"
          value={String(metrics.registros)}
          icon={<FileText size={18} />}
          variant="primary"
        />
        <StatCard
          title="Comisión"
          value={formatCurrency(-metrics.comision)}
          icon={<TrendingDown size={18} />}
          variant="warning"
        />
        <StatCard
          title="Mora Actual"
          value={formatCurrency(metrics.saldoALiquidar)}
          icon={<DollarSign size={18} />}
          variant="primary"
        />
      </div>

      {/* Owner Header */}
      <EntityHeader
        name={owner.name}
        email={owner.email || ''}
        phone={owner.phone || ''}
        balance={metrics.saldoALiquidar}
        status={metrics.saldoALiquidar > 0 ? 'pendiente' : 'liquidada'}
      />

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          {/* Cobrado Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Cobrado</h3>
              <span className={styles.sectionValue}>{formatCurrency(metrics.cobrado)}</span>
              <Badge variant="success">Liquidada</Badge>
              <span className={styles.sectionTotal}>{formatCurrency(metrics.cobrado)}</span>
            </div>
            <p className={styles.sectionSubtitle}>
              Período: Abril 2024 (1 de abr. al 30 de abr.)
            </p>
            <div className={styles.sectionAmount}>
              <span>{formatCurrency(metrics.saldoALiquidar)}</span>
            </div>
          </div>

          {/* Ajustes Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Ajustes</h3>
              <span className={styles.sectionValue} style={{ color: '#ef4444' }}>
                - {formatCurrency(metrics.ajustes)}
              </span>
            </div>
          </div>

          {/* Movimientos Table */}
          <DataTableReport
            title="Movimientos - Abril 2024"
            columns={[
              { key: 'tipo', header: 'Tipo', render: (item) => (
                <Badge variant={item.tipo === 'rent' ? 'success' : item.tipo === 'maintenance' ? 'warning' : 'info'}>
                  {item.tipo === 'rent' ? 'Renta' : item.tipo === 'maintenance' ? 'Mant.' : item.tipo === 'expenses' ? 'Expensas' : String(item.tipo)}
                </Badge>
              )},
              { key: 'fecha', header: 'Fecha' },
              { key: 'concepto', header: 'Concepto' },
              { key: 'cobrado', header: 'Cobrado', align: 'right', render: (item) => (
                <span style={{ color: '#10b981' }}>{formatCurrency(Number(item.cobrado))}</span>
              )},
              { key: 'ajustes', header: 'Ajustes', align: 'right', render: (item) => (
                <span style={{ color: '#ef4444' }}>{formatCurrency(Number(item.ajustes))}</span>
              )},
              { key: 'comision', header: 'Comisión', align: 'right', render: (item) => (
                <span style={{ color: '#f59e0b' }}>{formatCurrency(Number(item.comision))}</span>
              )},
              { key: 'neto', header: 'Neto', align: 'right', render: (item) => (
                <span style={{ color: '#3b82f6', fontWeight: 600 }}>{formatCurrency(Number(item.neto))}</span>
              )},
            ]}
            data={metrics.movimientos as unknown as Record<string, unknown>[]}
            totals={{
              cobrado: metrics.cobrado,
              ajustes: -metrics.ajustes,
              comision: -metrics.comision,
              neto: metrics.saldoALiquidar,
            }}
            pageSize={10}
          />
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightColumn}>
          <SummaryPanel
            title="Resumen Abril 2024"
            items={[
              { label: 'Cobrado', value: metrics.cobrado, color: 'success' },
              { label: 'Ajustes', value: -metrics.ajustes, color: 'error' },
              { label: 'Comisión', value: -metrics.comision, color: 'warning' },
            ]}
            total={{ label: 'Saldo a Liquidar', value: metrics.saldoALiquidar }}
            actions={{
              customAction: {
                label: 'Registrar Pago al Propietario',
                icon: <DollarSign size={16} />,
                onClick: () => console.log('Registrar pago'),
              },
              onExportPDF: () => console.log('Export PDF'),
              onExportCSV: () => console.log('Export CSV'),
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
