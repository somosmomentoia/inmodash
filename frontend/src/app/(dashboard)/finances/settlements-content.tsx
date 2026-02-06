'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  DollarSign,
  CheckCircle,
  Clock,
  Download,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  X,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  Badge,
  Modal,
  ModalFooter,
  EmptyState,
  Avatar,
} from '@/components/ui'
import { useOwners } from '@/hooks/useOwners'
import { useObligations } from '@/hooks/useObligations'
import { settlementsService } from '@/services/settlements.service'
import { Obligation } from '@/types'
import styles from './settlements.module.css'

interface SettlementMovement {
  id: number
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  date: Date
  obligationId?: number
}

interface Settlement {
  id: number
  ownerId: number
  ownerName: string
  ownerBalance: number
  period: Date
  totalIncome: number
  totalExpenses: number
  netAmount: number
  commissionAmount: number
  status: 'pending' | 'settled'
  settledAt?: Date
  paymentMethod?: string
  reference?: string
  movements: SettlementMovement[]
  propertyCount: number
}

type FilterStatus = 'all' | 'pending' | 'settled' | 'positive' | 'negative'

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

export default function SettlementsContent() {
  const router = useRouter()
  const { owners, loading: ownersLoading } = useOwners()
  const { obligations, loading: obligationsLoading } = useObligations()
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [activeFilters, setActiveFilters] = useState<FilterStatus[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showSettleModal, setShowSettleModal] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null)
  const [settleForm, setSettleForm] = useState({
    paymentMethod: 'transfer',
    reference: '',
    notes: '',
  })

  // Cargar liquidaciones existentes de la BD
  const [existingSettlements, setExistingSettlements] = useState<Map<string, { status: 'pending' | 'settled', settledAt?: Date, paymentMethod?: string }>>(new Map())
  const [loadingSettlements, setLoadingSettlements] = useState(true)

  useEffect(() => {
    const loadExistingSettlements = async () => {
      setLoadingSettlements(true)
      try {
        const allSettlements = await settlementsService.getAll()
        const map = new Map<string, { status: 'pending' | 'settled', settledAt?: Date, paymentMethod?: string }>()
        allSettlements.forEach(s => {
          // Clave: ownerId-period (YYYY-MM) - usar UTC para evitar problemas de timezone
          const periodDate = new Date(s.period)
          const periodKey = `${s.ownerId}-${periodDate.getUTCFullYear()}-${String(periodDate.getUTCMonth() + 1).padStart(2, '0')}`
          map.set(periodKey, { 
            status: s.status, 
            settledAt: s.settledAt ? new Date(s.settledAt) : undefined,
            paymentMethod: s.paymentMethod 
          })
        })
        setExistingSettlements(map)
      } catch (error) {
        console.error('Error loading settlements:', error)
      } finally {
        setLoadingSettlements(false)
      }
    }
    loadExistingSettlements()
  }, [])

  // Calculate settlements from real obligations data
  const settlements: Settlement[] = useMemo(() => {
    // Filter obligations for the selected month
    const [year, month] = selectedMonth.split('-').map(Number)
    const periodStart = new Date(Date.UTC(year, month - 1, 1))

    // Group obligations by owner (via apartment.ownerId)
    const ownerObligations = new Map<number, Obligation[]>()

    obligations.forEach((obligation) => {
      // Check if obligation is in the selected period using UTC to avoid timezone issues
      const obligationDate = new Date(obligation.period)
      const obYear = obligationDate.getUTCFullYear()
      const obMonth = obligationDate.getUTCMonth() + 1
      
      if (obYear === year && obMonth === month) {
        // Get owner ID from apartment (direct or via contract)
        // Priority: direct apartment > contract's apartment
        const apartment = obligation.apartment || obligation.contract?.apartment
        const ownerId = apartment?.ownerId || apartment?.owner?.id
        
        if (ownerId) {
          const existing = ownerObligations.get(ownerId) || []
          existing.push(obligation)
          ownerObligations.set(ownerId, existing)
        }
      }
    })

    // Build settlements for each owner
    return owners.map((owner) => {
      const ownerObs = ownerObligations.get(owner.id) || []

      // Calculate movements from obligations
      const movements: SettlementMovement[] = []
      let totalIncome = 0
      let totalExpenses = 0
      let commissionAmount = 0

      // Get unique apartments for this owner
      const apartmentIds = new Set<number>()

      ownerObs.forEach((ob) => {
        if (ob.apartmentId) apartmentIds.add(ob.apartmentId)

        // Only count PAID obligations in settlements
        // Pending obligations don't affect the settlement yet
        if (ob.status !== 'paid') return

        // ownerImpact > 0 means income for owner (rent payments, credits)
        // ownerImpact < 0 means expense for owner (taxes, maintenance, etc.)
        // ownerImpact = 0 means no impact (tenant-paid obligations)
        if (ob.ownerImpact > 0) {
          // Income: rent payments, debt credits, etc.
          totalIncome += ob.ownerImpact
          movements.push({
            id: ob.id,
            type: 'income',
            category: getObligationTypeLabel(ob.type),
            description: ob.description,
            amount: ob.ownerImpact,
            date: new Date(ob.period),
            obligationId: ob.id,
          })
          // Commission is calculated on rent income only
          if (ob.type === 'rent') {
            commissionAmount += ob.commissionAmount || 0
          }
        } else if (ob.ownerImpact < 0) {
          // Expense: taxes, maintenance, services paid by owner
          totalExpenses += Math.abs(ob.ownerImpact)
          movements.push({
            id: ob.id,
            type: 'expense',
            category: getObligationTypeLabel(ob.type),
            description: ob.description,
            amount: Math.abs(ob.ownerImpact),
            date: new Date(ob.period),
            obligationId: ob.id,
          })
        }
        // If ownerImpact = 0, it doesn't affect the settlement (tenant pays)
      })

      const netAmount = totalIncome - totalExpenses - commissionAmount

      // Solo incluir si hay movimientos (ingresos o egresos)
      if (totalIncome === 0 && totalExpenses === 0) {
        return null
      }

      // Verificar si ya existe una liquidación en la BD para este propietario y período
      const settlementKey = `${owner.id}-${selectedMonth}`
      const existingSettlement = existingSettlements.get(settlementKey)

      return {
        id: owner.id,
        ownerId: owner.id,
        ownerName: owner.name,
        ownerBalance: owner.balance || 0,
        period: periodStart,
        totalIncome,
        totalExpenses,
        netAmount,
        commissionAmount,
        status: existingSettlement?.status || 'pending',
        settledAt: existingSettlement?.settledAt,
        paymentMethod: existingSettlement?.paymentMethod,
        propertyCount: apartmentIds.size || 1,
        movements,
      }
    }).filter((s): s is NonNullable<typeof s> => s !== null) as Settlement[]
  }, [owners, obligations, selectedMonth, existingSettlements])

  // Filter logic
  const filteredSettlements = useMemo(() => {
    return settlements.filter((settlement) => {
      // Search filter
      if (searchTerm && !settlement.ownerName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // No active filters = show all
      if (activeFilters.length === 0) return true

      // Check each active filter
      for (const filter of activeFilters) {
        if (filter === 'pending' && settlement.status === 'pending') return true
        if (filter === 'settled' && settlement.status === 'settled') return true
        if (filter === 'positive' && settlement.netAmount > 0) return true
        if (filter === 'negative' && settlement.netAmount < 0) return true
      }

      return false
    })
  }, [settlements, searchTerm, activeFilters])

  // Stats
  const stats = useMemo(() => {
    const pending = settlements.filter((s) => s.status === 'pending')
    const settled = settlements.filter((s) => s.status === 'settled')
    return {
      pendingCount: pending.length,
      settledCount: settled.length,
      totalPending: pending.reduce((sum, s) => sum + s.netAmount, 0),
      totalCommissions: settlements.reduce((sum, s) => sum + s.commissionAmount, 0),
      totalIncome: settlements.reduce((sum, s) => sum + s.totalIncome, 0),
    }
  }, [settlements])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatMonth = (dateStr: string) => {
    const [year, month] = dateStr.split('-')
    const date = new Date(Number(year), Number(month) - 1)
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  }

  const getMonthOptions = () => {
    const options = []
    const now = new Date()
    // Include 3 months ahead and 12 months back
    for (let i = -3; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
    }
    return options
  }

  const toggleFilter = (filter: FilterStatus) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    )
  }

  const clearFilters = () => {
    setActiveFilters([])
    setSearchTerm('')
  }

  const openSettleModal = (settlement: Settlement) => {
    setSelectedSettlement(settlement)
    setSettleForm({ paymentMethod: 'transfer', reference: '', notes: '' })
    setShowSettleModal(true)
  }

  const [settling, setSettling] = useState(false)

  const handleSettle = async () => {
    if (!selectedSettlement) return
    
    setSettling(true)
    try {
      // 1. Crear/actualizar la liquidación en la BD
      const created = await settlementsService.create({
        ownerId: selectedSettlement.ownerId,
        period: selectedMonth,
        totalCollected: selectedSettlement.totalIncome,
        ownerAmount: selectedSettlement.netAmount,
        commissionAmount: selectedSettlement.commissionAmount,
        notes: settleForm.notes || undefined,
      })

      // 2. Marcar como liquidada
      const settled = await settlementsService.markAsSettled(created.id, {
        paymentMethod: settleForm.paymentMethod,
        reference: settleForm.reference || undefined,
        notes: settleForm.notes || undefined,
      })

      // 3. Actualizar el estado local inmediatamente
      const settlementKey = `${selectedSettlement.ownerId}-${selectedMonth}`
      setExistingSettlements(prev => {
        const newMap = new Map(prev)
        newMap.set(settlementKey, {
          status: 'settled',
          settledAt: settled.settledAt ? new Date(settled.settledAt) : new Date(),
          paymentMethod: settleForm.paymentMethod
        })
        return newMap
      })

      setShowSettleModal(false)
      setSelectedSettlement(null)
    } catch (error) {
      console.error('Error al liquidar:', error)
      alert('Error al registrar la liquidación')
    } finally {
      setSettling(false)
    }
  }

  const goToDetail = (settlement: Settlement) => {
    router.push(`/finances/settlements/${settlement.id}?period=${selectedMonth}`)
  }

  if (ownersLoading || obligationsLoading || loadingSettlements) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando liquidaciones...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Search & Filter Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar propietario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className={styles.clearSearch}>
              <X size={16} />
            </button>
          )}
        </div>

        <Select
          options={getMonthOptions()}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          size="sm"
        />

        <Button leftIcon={<Download size={16} />} variant="secondary" size="sm">
          Exportar
        </Button>
      </div>

      {/* Filter Pills */}
      <div className={styles.filterPills}>
        <span className={styles.filterLabel}>Filtros:</span>
        <button
          onClick={() => toggleFilter('pending')}
          className={`${styles.pill} ${activeFilters.includes('pending') ? styles.pillActive : ''} ${styles.pillOrange}`}
        >
          <Clock size={14} />
          Pendientes ({stats.pendingCount})
        </button>
        <button
          onClick={() => toggleFilter('settled')}
          className={`${styles.pill} ${activeFilters.includes('settled') ? styles.pillActive : ''} ${styles.pillGreen}`}
        >
          <CheckCircle size={14} />
          Liquidados ({stats.settledCount})
        </button>
        <button
          onClick={() => toggleFilter('positive')}
          className={`${styles.pill} ${activeFilters.includes('positive') ? styles.pillActive : ''} ${styles.pillBlue}`}
        >
          <TrendingUp size={14} />
          Saldo positivo
        </button>
        <button
          onClick={() => toggleFilter('negative')}
          className={`${styles.pill} ${activeFilters.includes('negative') ? styles.pillActive : ''} ${styles.pillRed}`}
        >
          <TrendingDown size={14} />
          Saldo negativo
        </button>
        {(activeFilters.length > 0 || searchTerm) && (
          <button onClick={clearFilters} className={styles.clearFilters}>
            <X size={14} />
            Limpiar
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Período</span>
          <span className={styles.summaryValue}>{formatMonth(selectedMonth)}</span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Ingresos</span>
          <span className={`${styles.summaryValue} ${styles.summaryValueGreen}`}>
            {formatCurrency(stats.totalIncome)}
          </span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Comisiones</span>
          <span className={`${styles.summaryValue} ${styles.summaryValueBlue}`}>
            {formatCurrency(stats.totalCommissions)}
          </span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Pendiente a liquidar</span>
          <span className={`${styles.summaryValue} ${styles.summaryValueOrange}`}>
            {formatCurrency(stats.totalPending)}
          </span>
        </div>
      </div>

      {/* Settlements List */}
      <div className={styles.settlementsList}>
        {filteredSettlements.length === 0 ? (
          <EmptyState
            icon={<DollarSign />}
            title="No hay liquidaciones"
            description={
              activeFilters.length > 0 || searchTerm
                ? 'No se encontraron liquidaciones con los filtros aplicados.'
                : 'No hay liquidaciones para este período.'
            }
            action={
              activeFilters.length > 0 || searchTerm ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : undefined
            }
          />
        ) : (
          filteredSettlements.map((settlement) => (
            <div
              key={settlement.id}
              className={styles.settlementCard}
              onClick={() => goToDetail(settlement)}
            >
              <div className={styles.settlementMain}>
                <div className={styles.settlementOwner}>
                  <Avatar name={settlement.ownerName} size="md" />
                  <div className={styles.settlementOwnerInfo}>
                    <span className={styles.settlementOwnerName}>{settlement.ownerName}</span>
                    <span className={styles.settlementOwnerMeta}>
                      <Building2 size={12} />
                      {settlement.propertyCount} {settlement.propertyCount === 1 ? 'propiedad' : 'propiedades'}
                    </span>
                  </div>
                </div>

                <div className={styles.settlementAmounts}>
                  <div className={styles.amountItem}>
                    <span className={styles.amountLabel}>Ingresos</span>
                    <span className={`${styles.amountValue} ${styles.amountValueGreen}`}>
                      +{formatCurrency(settlement.totalIncome)}
                    </span>
                  </div>
                  <div className={styles.amountItem}>
                    <span className={styles.amountLabel}>Gastos</span>
                    <span className={`${styles.amountValue} ${styles.amountValueRed}`}>
                      -{formatCurrency(settlement.totalExpenses)}
                    </span>
                  </div>
                  <div className={styles.amountItem}>
                    <span className={styles.amountLabel}>Comisión</span>
                    <span className={`${styles.amountValue} ${styles.amountValueBlue}`}>
                      -{formatCurrency(settlement.commissionAmount)}
                    </span>
                  </div>
                  <div className={`${styles.amountItem} ${styles.amountItemNet}`}>
                    <span className={styles.amountLabel}>Neto</span>
                    <span className={`${styles.amountValue} ${settlement.netAmount >= 0 ? styles.amountValueGreen : styles.amountValueRed}`}>
                      {formatCurrency(settlement.netAmount)}
                    </span>
                  </div>
                </div>

                <div className={styles.settlementActions}>
                  {settlement.status === 'pending' ? (
                    <>
                      <Badge variant="warning">Pendiente</Badge>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openSettleModal(settlement)
                        }}
                      >
                        Liquidar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge variant="success">Liquidado</Badge>
                      <span className={styles.settledMethod}>
                        {settlement.paymentMethod === 'transfer' ? 'Transferencia' : settlement.paymentMethod || '-'}
                      </span>
                    </>
                  )}
                  <ChevronRight size={20} className={styles.chevron} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Settle Modal */}
      <Modal
        isOpen={showSettleModal}
        onClose={() => {
          setShowSettleModal(false)
          setSelectedSettlement(null)
        }}
        title="Registrar Liquidación"
        subtitle={selectedSettlement?.ownerName}
        size="md"
      >
        {selectedSettlement && (
          <>
            <div className={styles.settleSummary}>
              <div className={styles.summaryRow}>
                <span>Total Ingresos:</span>
                <span className={styles.incomeText}>+{formatCurrency(selectedSettlement.totalIncome)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Total Gastos:</span>
                <span className={styles.expenseText}>-{formatCurrency(selectedSettlement.totalExpenses)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Comisión:</span>
                <span className={styles.commissionText}>-{formatCurrency(selectedSettlement.commissionAmount)}</span>
              </div>
              <div className={styles.summaryRowTotal}>
                <span>Neto a Liquidar:</span>
                <span>{formatCurrency(selectedSettlement.netAmount)}</span>
              </div>
            </div>

            <div className={styles.formGrid}>
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
          </>
        )}
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowSettleModal(false)
              setSelectedSettlement(null)
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleSettle} loading={settling} disabled={settling}>Confirmar Liquidación</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
