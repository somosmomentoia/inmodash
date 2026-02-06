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
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Badge,
  Avatar,
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
  }
  return labels[type] || type
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

  // Cargar liquidación existente de la BD
  useEffect(() => {
    const loadSettlement = async () => {
      if (!period || !ownerId) return
      setLoadingSettlement(true)
      try {
        const allSettlements = await settlementsService.getAll()
        const [year, month] = period.split('-').map(Number)
        const found = allSettlements.find(s => {
          const sPeriod = new Date(s.period)
          // Usar UTC para evitar problemas de timezone
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
    loadSettlement()
  }, [period, ownerId])

  // Calculate settlement from real obligations data
  const settlement = useMemo(() => {
    if (!owner || !period) return null

    const [year, month] = period.split('-').map(Number)
    const periodStart = new Date(Date.UTC(year, month - 1, 1))

    // Filter obligations for this owner and period
    const ownerObligations: Obligation[] = obligations.filter((ob) => {
      // Check if obligation is in the selected period using UTC to avoid timezone issues
      const obligationDate = new Date(ob.period)
      const obYear = obligationDate.getUTCFullYear()
      const obMonth = obligationDate.getUTCMonth() + 1
      
      if (obYear !== year || obMonth !== month) return false

      // Get owner ID from apartment (direct or via contract)
      const apartment = ob.apartment || ob.contract?.apartment
      const obOwnerId = apartment?.ownerId || apartment?.owner?.id
      
      return obOwnerId === ownerId
    })

    // Calculate movements from obligations
    const movements: Movement[] = []
    let totalIncome = 0
    let totalExpenses = 0
    let commissionAmount = 0

    // Get unique apartments for this owner
    const apartmentIds = new Set<number>()

    ownerObligations.forEach((ob) => {
      if (ob.apartmentId) apartmentIds.add(ob.apartmentId)
      
      // Get property name
      const apartment = ob.apartment || ob.contract?.apartment
      const propertyName = apartment?.nomenclature || apartment?.fullAddress || 'Sin propiedad'

      // Only count PAID obligations in settlements
      if (ob.status !== 'paid') return

      // ownerImpact > 0 means income for owner (rent payments, credits)
      // ownerImpact < 0 means expense for owner (taxes, maintenance, etc.)
      if (ob.ownerImpact > 0) {
        totalIncome += ob.ownerImpact
        movements.push({
          id: ob.id,
          type: 'income',
          category: getObligationTypeLabel(ob.type),
          description: ob.description,
          amount: ob.ownerImpact,
          date: new Date(ob.period),
          property: propertyName,
          obligationId: ob.id,
        })
        // Commission is calculated on rent income only
        if (ob.type === 'rent') {
          commissionAmount += ob.commissionAmount || 0
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
      // Usar el estado de la BD si existe, sino 'pending'
      status: existingSettlement?.status || 'pending',
      settledAt: existingSettlement?.settledAt,
      paymentMethod: existingSettlement?.paymentMethod,
      movements,
      propertyCount: apartmentIds.size || 0,
      balance: owner.balance || 0,
    }
  }, [owner, obligations, ownerId, period, existingSettlement])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatPeriod = () => {
    if (!period) return ''
    const [year, month] = period.split('-')
    const date = new Date(Number(year), Number(month) - 1)
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  }

  const handleSettle = async () => {
    if (!settlement) return
    
    setSettling(true)
    try {
      // 1. Crear/actualizar la liquidación en la BD
      const created = await settlementsService.create({
        ownerId: settlement.ownerId,
        period: period,
        totalCollected: settlement.totalIncome,
        ownerAmount: settlement.netAmount,
        commissionAmount: settlement.commissionAmount,
        notes: settleForm.notes || undefined,
      })

      // 2. Marcar como liquidada
      const settled = await settlementsService.markAsSettled(created.id, {
        paymentMethod: settleForm.paymentMethod,
        reference: settleForm.reference || undefined,
        notes: settleForm.notes || undefined,
      })

      // 3. Actualizar el estado local
      setExistingSettlement(settled)
      setShowSettleModal(false)
    } catch (error) {
      console.error('Error al liquidar:', error)
      alert('Error al registrar la liquidación')
    } finally {
      setSettling(false)
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
            <Button variant="secondary" leftIcon={<Printer size={16} />}>
              Imprimir
            </Button>
            <Button variant="secondary" leftIcon={<Download size={16} />}>
              Exportar PDF
            </Button>
            {settlement.status === 'pending' && (
              <Button onClick={() => setShowSettleModal(true)}>
                Registrar Liquidación
              </Button>
            )}
          </div>
        </div>

        {/* Owner Info + Summary */}
        <div className={styles.topSection}>
          <div className={styles.ownerCard}>
            <Avatar name={owner.name} size="lg" />
            <div className={styles.ownerInfo}>
              <h2 className={styles.ownerName}>{owner.name}</h2>
              <div className={styles.ownerMeta}>
                <span><Building2 size={14} /> {settlement.propertyCount} propiedades</span>
                <span><Calendar size={14} /> {formatPeriod()}</span>
              </div>
              {settlement.status === 'pending' ? (
                <Badge variant="warning">Pendiente de liquidar</Badge>
              ) : (
                <Badge variant="success">Liquidado</Badge>
              )}
            </div>
          </div>

          <div className={styles.summaryCards}>
            <div className={`${styles.summaryCard} ${styles.summaryCardGreen}`}>
              <TrendingUp size={20} />
              <div>
                <span className={styles.summaryLabel}>Total Ingresos</span>
                <span className={styles.summaryAmount}>{formatCurrency(settlement.totalIncome)}</span>
              </div>
            </div>
            <div className={`${styles.summaryCard} ${styles.summaryCardRed}`}>
              <TrendingDown size={20} />
              <div>
                <span className={styles.summaryLabel}>Total Gastos</span>
                <span className={styles.summaryAmount}>{formatCurrency(settlement.totalExpenses)}</span>
              </div>
            </div>
            <div className={`${styles.summaryCard} ${styles.summaryCardBlue}`}>
              <DollarSign size={20} />
              <div>
                <span className={styles.summaryLabel}>Comisión ({(settlement.commissionRate * 100).toFixed(0)}%)</span>
                <span className={styles.summaryAmount}>{formatCurrency(settlement.commissionAmount)}</span>
              </div>
            </div>
            <div className={`${styles.summaryCard} ${styles.summaryCardPrimary}`}>
              <CheckCircle size={20} />
              <div>
                <span className={styles.summaryLabel}>Neto a Liquidar</span>
                <span className={styles.summaryAmount}>{formatCurrency(settlement.netAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Saldo del propietario */}
        {settlement.balance !== 0 && (
          <div className={styles.balanceAlert}>
            <DollarSign size={18} />
            <span>
              Saldo acumulado del propietario: <strong>{formatCurrency(settlement.balance)}</strong>
              {settlement.balance > 0 && ' (a favor del propietario)'}
              {settlement.balance < 0 && ' (a favor de la inmobiliaria)'}
            </span>
          </div>
        )}

        {/* Movements */}
        <div className={styles.movementsGrid}>
          {/* Ingresos */}
          <Card>
            <CardHeader
              title="Ingresos"
              subtitle={`${incomeMovements.length} movimientos`}
              action={
                <span className={styles.totalBadgeGreen}>
                  +{formatCurrency(settlement.totalIncome)}
                </span>
              }
            />
            <CardContent>
              <div className={styles.movementsList}>
                {incomeMovements.map((movement) => (
                  <div key={movement.id} className={styles.movementItem}>
                    <div className={styles.movementInfo}>
                      <span className={styles.movementCategory}>{movement.category}</span>
                      <span className={styles.movementDescription}>{movement.description}</span>
                      {movement.property && (
                        <span className={styles.movementProperty}>
                          <Building2 size={12} /> {movement.property}
                        </span>
                      )}
                    </div>
                    <div className={styles.movementRight}>
                      <span className={`${styles.movementAmount} ${styles.movementAmountGreen}`}>
                        +{formatCurrency(movement.amount)}
                      </span>
                      <span className={styles.movementDate}>{formatDate(movement.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gastos */}
          <Card>
            <CardHeader
              title="Gastos y Deducciones"
              subtitle={`${expenseMovements.length} movimientos`}
              action={
                <span className={styles.totalBadgeRed}>
                  -{formatCurrency(settlement.totalExpenses)}
                </span>
              }
            />
            <CardContent>
              <div className={styles.movementsList}>
                {expenseMovements.map((movement) => (
                  <div key={movement.id} className={styles.movementItem}>
                    <div className={styles.movementInfo}>
                      <span className={styles.movementCategory}>{movement.category}</span>
                      <span className={styles.movementDescription}>{movement.description}</span>
                      {movement.property && (
                        <span className={styles.movementProperty}>
                          <Building2 size={12} /> {movement.property}
                        </span>
                      )}
                    </div>
                    <div className={styles.movementRight}>
                      <span className={`${styles.movementAmount} ${movement.amount < 0 ? styles.movementAmountGreen : styles.movementAmountRed}`}>
                        {movement.amount < 0 ? '+' : '-'}{formatCurrency(Math.abs(movement.amount))}
                      </span>
                      <span className={styles.movementDate}>{formatDate(movement.date)}</span>
                    </div>
                  </div>
                ))}

                {/* Comisión como item */}
                <div className={`${styles.movementItem} ${styles.movementItemCommission}`}>
                  <div className={styles.movementInfo}>
                    <span className={styles.movementCategory}>Comisión</span>
                    <span className={styles.movementDescription}>
                      Comisión inmobiliaria ({(settlement.commissionRate * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className={styles.movementRight}>
                    <span className={`${styles.movementAmount} ${styles.movementAmountBlue}`}>
                      -{formatCurrency(settlement.commissionAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumen Final */}
        <Card>
          <CardContent>
            <div className={styles.finalSummary}>
              <div className={styles.finalSummaryRow}>
                <span>Total Ingresos</span>
                <span className={styles.finalSummaryValueGreen}>+{formatCurrency(settlement.totalIncome)}</span>
              </div>
              <div className={styles.finalSummaryRow}>
                <span>Total Gastos</span>
                <span className={styles.finalSummaryValueRed}>-{formatCurrency(settlement.totalExpenses)}</span>
              </div>
              <div className={styles.finalSummaryRow}>
                <span>Comisión Inmobiliaria</span>
                <span className={styles.finalSummaryValueBlue}>-{formatCurrency(settlement.commissionAmount)}</span>
              </div>
              <div className={styles.finalSummaryDivider} />
              <div className={`${styles.finalSummaryRow} ${styles.finalSummaryRowTotal}`}>
                <span>Neto a Liquidar</span>
                <span>{formatCurrency(settlement.netAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

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
