'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  Download,
  Printer,
  Percent,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  AlertTriangle,
  RefreshCw,
  SkipForward,
  Unlock,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Modal,
  ModalFooter,
  Input,
  Select,
} from '@/components/ui'
import { useOwners } from '@/hooks/useOwners'
import { useObligations } from '@/hooks/useObligations'
import { settlementsService, Settlement as SettlementFromDB } from '@/services/settlements.service'
import { Obligation } from '@/types'
import styles from './settlement-detail.module.css'

interface Movement {
  id: number
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  date: Date
  property?: string
  obligationId?: number
}

// Helper to get obligation type label
const getObligationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    rent: 'Alquiler',
    expenses: 'Expensas',
    service: 'Servicio',
    tax: 'Impuesto',
    insurance: 'Seguro',
    maintenance: 'Mantenimiento',
    debt: 'Ajuste/Deuda',
    income_other: 'Otro Ingreso',
    expense_other: 'Otro Egreso',
  }
  return labels[type] || type
}

// Get initials from name
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function SettlementDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const ownerId = Number(params.id)
  const period = searchParams.get('period') || ''

  const { owners, loading: ownersLoading } = useOwners()
  const { obligations, loading: obligationsLoading } = useObligations()
  const owner = owners.find((o) => o.id === ownerId)

  const [showSettleModal, setShowSettleModal] = useState(false)
  const [settleForm, setSettleForm] = useState({
    paymentMethod: 'transfer',
    reference: '',
    notes: '',
  })
  const [settling, setSettling] = useState(false)

  // Estado de la liquidación desde la BD
  const [existingSettlement, setExistingSettlement] = useState<SettlementFromDB | null>(null)
  const [loadingSettlement, setLoadingSettlement] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const loadSettlement = async () => {
    if (!period || !ownerId) return
    setLoadingSettlement(true)
    try {
      const allSettlements = await settlementsService.getAll()
      const [year, month] = period.split('-').map(Number)
      const found = allSettlements.find(s => {
        const sPeriod = new Date(s.period)
        return s.ownerId === ownerId && 
               sPeriod.getUTCFullYear() === year && 
               sPeriod.getUTCMonth() + 1 === month
      })
      setExistingSettlement(found || null)
    } catch (error) {
      console.error('Error loading settlement:', error)
    } finally {
      setLoadingSettlement(false)
    }
  }

  // Cargar liquidación existente de la BD
  useEffect(() => {
    loadSettlement()
  }, [period, ownerId])

  // Calculate settlement from real obligations data
  const settlement = useMemo(() => {
    if (!owner || !period) return null

    const [year, month] = period.split('-').map(Number)
    const periodStart = new Date(Date.UTC(year, month - 1, 1))

    // Filter obligations for this owner and period
    const ownerObligations: Obligation[] = obligations.filter((ob) => {
      const obligationDate = new Date(ob.period)
      const obYear = obligationDate.getUTCFullYear()
      const obMonth = obligationDate.getUTCMonth() + 1
      
      if (obYear !== year || obMonth !== month) return false

      const apartment = ob.apartment || ob.contract?.apartment
      const obOwnerId = apartment?.ownerId || apartment?.owner?.id
      
      return obOwnerId === ownerId
    })

    // Calculate movements from obligations
    const movements: Movement[] = []
    let totalIncome = 0
    let totalExpenses = 0
    let commissionAmount = 0

    const apartmentIds = new Set<number>()

    ownerObligations.forEach((ob) => {
      if (ob.apartmentId) apartmentIds.add(ob.apartmentId)
      
      const apartment = ob.apartment || ob.contract?.apartment
      const propertyName = apartment?.nomenclature || apartment?.fullAddress || 'Sin propiedad'

      if (ob.status !== 'paid') return

      if (ob.ownerImpact > 0) {
        const grossAmount = ob.agencyImpact > 0 ? ob.ownerImpact + ob.agencyImpact : ob.ownerImpact
        totalIncome += grossAmount
        movements.push({
          id: ob.id,
          type: 'income',
          category: getObligationTypeLabel(ob.type),
          description: ob.description,
          amount: grossAmount,
          date: new Date(ob.period),
          property: propertyName,
          obligationId: ob.id,
        })
        if (ob.agencyImpact > 0) {
          commissionAmount += ob.agencyImpact
        }
      } else if (ob.ownerImpact < 0) {
        totalExpenses += Math.abs(ob.ownerImpact)
        movements.push({
          id: ob.id,
          type: 'expense',
          category: getObligationTypeLabel(ob.type),
          description: ob.description,
          amount: Math.abs(ob.ownerImpact),
          date: new Date(ob.period),
          property: propertyName,
          obligationId: ob.id,
        })
      }
    })

    const netAmount = totalIncome - totalExpenses - commissionAmount
    const commissionRate = owner.commissionPercentage ? owner.commissionPercentage / 100 : 0.10

    return {
      id: ownerId,
      ownerId,
      ownerName: owner.name,
      period: periodStart,
      totalIncome,
      totalExpenses,
      netAmount,
      commissionAmount,
      commissionRate,
      status: (existingSettlement?.status as 'draft' | 'settled' | 'stale') || 'draft',
      settledAt: existingSettlement?.settledAt,
      paymentMethod: existingSettlement?.paymentMethod,
      movements,
      propertyCount: apartmentIds.size || 0,
    }
  }, [owner, obligations, ownerId, period, existingSettlement])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatPeriod = () => {
    if (!period) return ''
    const [year, month] = period.split('-')
    const date = new Date(Number(year), Number(month) - 1)
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  }

  const formatPeriodShort = () => {
    if (!period) return ''
    const [year, month] = period.split('-')
    const date = new Date(Number(year), Number(month) - 1)
    const str = date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const handleSettle = async () => {
    if (!settlement) return
    
    setSettling(true)
    try {
      const created = await settlementsService.create({
        ownerId: settlement.ownerId,
        period: period,
        totalCollected: settlement.totalIncome,
        ownerAmount: settlement.netAmount,
        commissionAmount: settlement.commissionAmount,
        deductions: settlement.totalExpenses,
        notes: settleForm.notes || undefined,
      })

      const settled = await settlementsService.markAsSettled(created.id, {
        paymentMethod: settleForm.paymentMethod,
        reference: settleForm.reference || undefined,
        notes: settleForm.notes || undefined,
      })

      await loadSettlement()
      setShowSettleModal(false)
    } catch (error) {
      console.error('Error al liquidar:', error)
      alert('Error al registrar la liquidación')
    } finally {
      setSettling(false)
    }
  }

  const handleRecalculate = async () => {
    if (!existingSettlement) return
    setActionLoading(true)
    try {
      await settlementsService.recalculate(existingSettlement.id)
      await loadSettlement()
    } catch (error) {
      console.error('Error al recalcular:', error)
      alert('Error al recalcular la liquidación')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDismissStale = async () => {
    if (!existingSettlement) return
    setActionLoading(true)
    try {
      const result = await settlementsService.dismissStale(existingSettlement.id)
      alert(`Se movieron ${result.movedObligations} obligaciones al próximo período.`)
      await loadSettlement()
    } catch (error) {
      console.error('Error al ignorar:', error)
      alert('Error al procesar')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReopen = async () => {
    if (!existingSettlement) return
    if (!confirm('¿Reabrir esta liquidación? Volverá a estado borrador y podrás recalcularla.')) return
    setActionLoading(true)
    try {
      await settlementsService.markAsPending(existingSettlement.id)
      await loadSettlement()
    } catch (error) {
      console.error('Error al reabrir:', error)
      alert('Error al reabrir la liquidación')
    } finally {
      setActionLoading(false)
    }
  }

  if (ownersLoading || obligationsLoading || loadingSettlement) {
    return (
      <DashboardLayout title="Liquidación" subtitle="">
        <div className={styles.notFound}>
          <p>Cargando liquidación...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!owner || !settlement) {
    return (
      <DashboardLayout title="Liquidación" subtitle="">
        <div className={styles.notFound}>
          <p>Propietario no encontrado</p>
          <Link href="/finances">
            <Button variant="secondary">Volver a Finanzas</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const incomeMovements = settlement.movements.filter((m) => m.type === 'income')
  const expenseMovements = settlement.movements.filter((m) => m.type === 'expense')

  // Waterfall percentages for visual bar
  const waterfallTotal = settlement.totalIncome || 1
  const expensePct = (settlement.totalExpenses / waterfallTotal) * 100
  const commissionPct = (settlement.commissionAmount / waterfallTotal) * 100
  const netPct = Math.max(0, 100 - expensePct - commissionPct)

  return (
    <DashboardLayout title={`Liquidación - ${formatPeriod()}`} subtitle={owner.name}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <Link href="/finances" className={styles.backLink}>
            <ArrowLeft size={16} />
            Volver a Liquidaciones
          </Link>

          <div className={styles.headerActions}>
            <Button variant="secondary" leftIcon={<Printer size={16} />} size="sm">
              Imprimir
            </Button>
            <Button variant="secondary" leftIcon={<Download size={16} />} size="sm">
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Hero Section */}
        <div className={styles.heroSection}>
          {/* Dark header with owner info */}
          <div className={styles.heroTop}>
            <div className={styles.heroOwner}>
              <div className={styles.heroAvatar}>
                {getInitials(owner.name)}
              </div>
              <div className={styles.heroOwnerInfo}>
                <h1 className={styles.heroOwnerName}>{owner.name}</h1>
                <div className={styles.heroOwnerMeta}>
                  <span><Building2 size={14} /> {settlement.propertyCount} {settlement.propertyCount === 1 ? 'propiedad' : 'propiedades'}</span>
                  <span><Calendar size={14} /> {formatPeriodShort()}</span>
                </div>
              </div>
            </div>
            <div className={styles.heroStatus}>
              {settlement.status === 'draft' && (
                <div className={styles.statusBadgePending}>
                  <span className={styles.statusDot} />
                  Pendiente de liquidar
                </div>
              )}
              {settlement.status === 'settled' && (
                <div className={styles.statusBadgeSettled}>
                  <CheckCircle size={14} />
                  Liquidado
                </div>
              )}
              {settlement.status === 'stale' && (
                <div className={styles.statusBadgePending} style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
                  <AlertTriangle size={14} />
                  Desactualizada
                </div>
              )}
            </div>
          </div>

          {/* Metrics bar */}
          <div className={styles.metricsBar}>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Ingresos Cobrados</span>
              <span className={`${styles.metricValue} ${styles.metricValueGreen}`}>
                {formatCurrency(settlement.totalIncome)}
              </span>
              <span className={styles.metricSubtext}>{incomeMovements.length} movimiento{incomeMovements.length !== 1 ? 's' : ''}</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Deducciones</span>
              <span className={`${styles.metricValue} ${styles.metricValueRed}`}>
                -{formatCurrency(settlement.totalExpenses)}
              </span>
              <span className={styles.metricSubtext}>{expenseMovements.length} gasto{expenseMovements.length !== 1 ? 's' : ''}</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Honorarios ({(settlement.commissionRate * 100).toFixed(0)}%)</span>
              <span className={`${styles.metricValue} ${styles.metricValueBlue}`}>
                -{formatCurrency(settlement.commissionAmount)}
              </span>
              <span className={styles.metricSubtext}>Comisión inmobiliaria</span>
            </div>
            <div className={`${styles.metricItem} ${styles.metricItemNet}`}>
              <span className={styles.metricLabel}>Neto a Liquidar</span>
              <span className={styles.metricValueNet}>
                {formatCurrency(settlement.netAmount)}
              </span>
              <span className={styles.metricSubtext}>Para el propietario</span>
            </div>
          </div>
        </div>

        {/* Content Grid: Blocks + Sidebar */}
        <div className={styles.contentGrid}>
          {/* Left: Movement blocks */}
          <div className={styles.blocksContainer}>
            {/* Ingresos Cobrados */}
            {incomeMovements.length > 0 && (
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderLeft}>
                    <div className={`${styles.sectionIcon} ${styles.sectionIconGreen}`}>
                      <ArrowUpRight size={18} />
                    </div>
                    <div className={styles.sectionTitleGroup}>
                      <h3 className={styles.sectionTitle}>Ingresos Cobrados</h3>
                      <span className={styles.sectionSubtitle}>{incomeMovements.length} movimiento{incomeMovements.length !== 1 ? 's' : ''} en el período</span>
                    </div>
                  </div>
                  <span className={`${styles.sectionTotal} ${styles.sectionTotalGreen}`}>
                    +{formatCurrency(settlement.totalIncome)}
                  </span>
                </div>
                <div className={styles.movementsList}>
                  {incomeMovements.map((movement) => (
                    <div key={movement.id} className={styles.movementItem}>
                      <div className={styles.movementLeft}>
                        <div className={`${styles.movementDot} ${styles.movementDotGreen}`} />
                        <div className={styles.movementInfo}>
                          <span className={styles.movementDescription}>{movement.description}</span>
                          <div className={styles.movementMeta}>
                            <span className={`${styles.movementCategory} ${styles.movementCategoryGreen}`}>
                              {movement.category}
                            </span>
                            {movement.property && (
                              <span><Building2 size={11} /> {movement.property}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`${styles.movementAmount} ${styles.movementAmountGreen}`}>
                        +{formatCurrency(movement.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gastos Imputados */}
            {expenseMovements.length > 0 && (
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderLeft}>
                    <div className={`${styles.sectionIcon} ${styles.sectionIconRed}`}>
                      <ArrowDownRight size={18} />
                    </div>
                    <div className={styles.sectionTitleGroup}>
                      <h3 className={styles.sectionTitle}>Gastos Imputados</h3>
                      <span className={styles.sectionSubtitle}>{expenseMovements.length} deducción{expenseMovements.length !== 1 ? 'es' : ''} del propietario</span>
                    </div>
                  </div>
                  <span className={`${styles.sectionTotal} ${styles.sectionTotalRed}`}>
                    -{formatCurrency(settlement.totalExpenses)}
                  </span>
                </div>
                <div className={styles.movementsList}>
                  {expenseMovements.map((movement) => (
                    <div key={movement.id} className={styles.movementItem}>
                      <div className={styles.movementLeft}>
                        <div className={`${styles.movementDot} ${styles.movementDotRed}`} />
                        <div className={styles.movementInfo}>
                          <span className={styles.movementDescription}>{movement.description}</span>
                          <div className={styles.movementMeta}>
                            <span className={`${styles.movementCategory} ${styles.movementCategoryRed}`}>
                              {movement.category}
                            </span>
                            {movement.property && (
                              <span><Building2 size={11} /> {movement.property}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`${styles.movementAmount} ${styles.movementAmountRed}`}>
                        -{formatCurrency(movement.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Honorarios */}
            {settlement.commissionAmount > 0 && (
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderLeft}>
                    <div className={`${styles.sectionIcon} ${styles.sectionIconBlue}`}>
                      <Percent size={18} />
                    </div>
                    <div className={styles.sectionTitleGroup}>
                      <h3 className={styles.sectionTitle}>Honorarios Inmobiliarios</h3>
                      <span className={styles.sectionSubtitle}>Comisión sobre alquileres cobrados</span>
                    </div>
                  </div>
                  <span className={`${styles.sectionTotal} ${styles.sectionTotalBlue}`}>
                    -{formatCurrency(settlement.commissionAmount)}
                  </span>
                </div>
                <div className={styles.movementsList}>
                  <div className={styles.movementItem}>
                    <div className={styles.movementLeft}>
                      <div className={`${styles.movementDot} ${styles.movementDotBlue}`} />
                      <div className={styles.movementInfo}>
                        <span className={styles.movementDescription}>
                          Comisión {(settlement.commissionRate * 100).toFixed(0)}% sobre {formatCurrency(settlement.totalIncome)}
                        </span>
                        <div className={styles.movementMeta}>
                          <span className={`${styles.movementCategory} ${styles.movementCategoryBlue}`}>
                            Comisión
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`${styles.movementAmount} ${styles.movementAmountBlue}`}>
                      -{formatCurrency(settlement.commissionAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className={styles.sidebar}>
            {/* Net Amount Card */}
            <div className={styles.netCard}>
              <div className={styles.netCardLabel}>Neto a Liquidar</div>
              <div className={styles.netCardAmount}>{formatCurrency(settlement.netAmount)}</div>
              {settlement.status === 'draft' && (
                <div className={styles.netCardAction}>
                  <button onClick={() => setShowSettleModal(true)}>
                    <Wallet size={16} />
                    Registrar Liquidación
                  </button>
                </div>
              )}
              {settlement.status === 'settled' && (
                <>
                  <div className={styles.netCardSettled}>
                    <CheckCircle size={14} />
                    Liquidado {settlement.paymentMethod === 'transfer' ? 'por transferencia' : settlement.paymentMethod === 'cash' ? 'en efectivo' : settlement.paymentMethod === 'check' ? 'con cheque' : ''}
                  </div>
                  <div style={{ marginTop: 'var(--spacing-sm)' }}>
                    <Button size="sm" variant="secondary" onClick={handleReopen} loading={actionLoading} leftIcon={<Unlock size={14} />}>
                      Reabrir
                    </Button>
                  </div>
                </>
              )}
              {settlement.status === 'stale' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--error)', fontSize: 'var(--font-size-sm)' }}>
                    <AlertTriangle size={14} />
                    Hay cobros nuevos desde el cierre
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Button size="sm" onClick={handleRecalculate} loading={actionLoading} leftIcon={<RefreshCw size={14} />}>
                      Recalcular
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleDismissStale} loading={actionLoading} leftIcon={<SkipForward size={14} />}>
                      Ignorar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Breakdown Card */}
            <div className={styles.breakdownCard}>
              <h4 className={styles.breakdownTitle}>Desglose</h4>
              
              {/* Waterfall bar */}
              <div className={styles.waterfallBar}>
                <div className={styles.waterfallTrack}>
                  <div className={`${styles.waterfallSegment} ${styles.waterfallGreen}`} style={{ width: `${netPct}%` }} />
                  <div className={`${styles.waterfallSegment} ${styles.waterfallRed}`} style={{ width: `${expensePct}%` }} />
                  <div className={`${styles.waterfallSegment} ${styles.waterfallBlue}`} style={{ width: `${commissionPct}%` }} />
                </div>
              </div>

              <div className={styles.breakdownList}>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownRowLabel}>
                    <span className={styles.breakdownDot} style={{ background: 'var(--success)' }} />
                    Ingresos cobrados
                  </span>
                  <span className={styles.breakdownRowValue} style={{ color: 'var(--success)' }}>
                    +{formatCurrency(settlement.totalIncome)}
                  </span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownRowLabel}>
                    <span className={styles.breakdownDot} style={{ background: 'var(--error)' }} />
                    Gastos imputados
                  </span>
                  <span className={styles.breakdownRowValue} style={{ color: 'var(--error)' }}>
                    -{formatCurrency(settlement.totalExpenses)}
                  </span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownRowLabel}>
                    <span className={styles.breakdownDot} style={{ background: 'var(--accent-primary)' }} />
                    Honorarios ({(settlement.commissionRate * 100).toFixed(0)}%)
                  </span>
                  <span className={styles.breakdownRowValue} style={{ color: 'var(--accent-primary)' }}>
                    -{formatCurrency(settlement.commissionAmount)}
                  </span>
                </div>
                <div className={styles.breakdownDivider} />
                <div className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}>
                  <span className={styles.breakdownRowLabel}>Neto a liquidar</span>
                  <span className={styles.breakdownRowValue}>{formatCurrency(settlement.netAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settle Modal */}
        <Modal
          isOpen={showSettleModal}
          onClose={() => setShowSettleModal(false)}
          title="Registrar Liquidación"
          subtitle={owner.name}
          size="md"
        >
          <div className={styles.settleModalSummary}>
            <div className={styles.settleModalRow}>
              <span>Neto a Liquidar:</span>
              <span className={styles.settleModalAmount}>{formatCurrency(settlement.netAmount)}</span>
            </div>
          </div>

          <div className={styles.settleModalForm}>
            <Select
              label="Método de Pago"
              options={[
                { value: 'transfer', label: 'Transferencia' },
                { value: 'cash', label: 'Efectivo' },
                { value: 'check', label: 'Cheque' },
              ]}
              value={settleForm.paymentMethod}
              onChange={(e) => setSettleForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              fullWidth
            />
            <Input
              label="Referencia / Comprobante"
              value={settleForm.reference}
              onChange={(e) => setSettleForm((prev) => ({ ...prev, reference: e.target.value }))}
              placeholder="Nro. de transferencia"
              fullWidth
            />
          </div>

          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowSettleModal(false)} disabled={settling}>
              Cancelar
            </Button>
            <Button onClick={handleSettle} loading={settling} disabled={settling}>
              Confirmar Liquidación
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
