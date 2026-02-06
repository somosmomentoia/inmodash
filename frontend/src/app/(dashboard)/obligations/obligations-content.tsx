'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  CreditCard,
  TrendingUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  Badge,
  Tabs,
  EmptyState,
  WidgetCard,
  Modal,
  ModalFooter,
} from '@/components/ui'
import { useObligations } from '@/hooks/useObligations'
import { recurringObligationsService } from '@/services/recurring-obligations.service'
import RegisterPaymentModal from '@/components/obligations/RegisterPaymentModal'
import { ObligationType, ObligationStatus, Obligation } from '@/types'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, addMonths, subMonths, addYears, subYears } from 'date-fns'
import styles from './obligations.module.css'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

type PeriodType = 'month' | 'year' | 'all'

type ObligationFilter = 'all' | 'pending' | 'partial' | 'paid' | 'overdue'

interface ObligationsContentProps {
  initialStatus?: string
  initialType?: string
  initialPaidBy?: string
}

export default function ObligationsContent({ initialStatus, initialType, initialPaidBy }: ObligationsContentProps) {
  const router = useRouter()
  const { obligations, loading, fetchObligations } = useObligations()
  const [activeTab, setActiveTab] = useState<ObligationFilter>(
    (initialStatus as ObligationFilter) || 'all'
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>(initialType || 'all')
  const [paidByFilter, setPaidByFilter] = useState<string>(initialPaidBy || 'all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc') // desc = más recientes primero
  
  // Period navigation state
  const [periodType, setPeriodType] = useState<PeriodType>('month')
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Period navigation handlers
  const handlePrevPeriod = useCallback(() => {
    if (periodType === 'month') {
      setSelectedDate(prev => subMonths(prev, 1))
    } else if (periodType === 'year') {
      setSelectedDate(prev => subYears(prev, 1))
    }
  }, [periodType])

  const handleNextPeriod = useCallback(() => {
    if (periodType === 'month') {
      setSelectedDate(prev => addMonths(prev, 1))
    } else if (periodType === 'year') {
      setSelectedDate(prev => addYears(prev, 1))
    }
  }, [periodType])

  const handleToday = useCallback(() => {
    setSelectedDate(new Date())
  }, [])

  const getPeriodLabel = useCallback(() => {
    if (periodType === 'all') return 'Todos los períodos'
    if (periodType === 'year') return selectedDate.getFullYear().toString()
    return `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
  }, [periodType, selectedDate])

  const getPeriodRange = useCallback(() => {
    if (periodType === 'all') return null
    if (periodType === 'year') {
      return {
        start: startOfYear(selectedDate),
        end: endOfYear(selectedDate)
      }
    }
    return {
      start: startOfMonth(selectedDate),
      end: endOfMonth(selectedDate)
    }
  }, [periodType, selectedDate])
  
  // Modal state for generating recurring obligations
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generateMonth, setGenerateMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<{ success: boolean; message: string } | null>(null)
  
  // Modal state for selecting obligation to pay
  const [showSelectObligationModal, setShowSelectObligationModal] = useState(false)
  const [selectedObligationForPayment, setSelectedObligationForPayment] = useState<Obligation | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  
  // Get unpaid obligations (pending, partial, overdue)
  const unpaidObligations = obligations.filter(
    (o) => o.status === 'pending' || o.status === 'partial' || o.status === 'overdue'
  )
  
  // Update filters when URL params change
  useEffect(() => {
    if (initialStatus) setActiveTab(initialStatus as ObligationFilter)
    if (initialType) setTypeFilter(initialType)
    if (initialPaidBy) setPaidByFilter(initialPaidBy)
  }, [initialStatus, initialType, initialPaidBy])

  const getTypeLabel = (type: ObligationType) => {
    const labels: Record<ObligationType, string> = {
      rent: 'Alquiler',
      expenses: 'Expensas',
      service: 'Servicio',
      tax: 'Impuesto',
      insurance: 'Seguro',
      maintenance: 'Mantenimiento',
      debt: 'Deuda',
    }
    return labels[type] || type
  }

  const getStatusBadge = (status: ObligationStatus) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Pagado</Badge>
      case 'partial':
        return <Badge variant="warning">Parcial</Badge>
      case 'pending':
        return <Badge variant="info">Pendiente</Badge>
      case 'overdue':
        return <Badge variant="error">Vencido</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const filteredObligations = obligations
    .filter((obligation) => {
      // Period filter
      const periodRange = getPeriodRange()
      if (periodRange) {
        const dueDate = new Date(obligation.dueDate)
        if (!isWithinInterval(dueDate, { start: periodRange.start, end: periodRange.end })) {
          return false
        }
      }
      
      if (activeTab !== 'all' && obligation.status !== activeTab) return false
      if (typeFilter !== 'all' && obligation.type !== typeFilter) return false
      if (paidByFilter !== 'all' && obligation.paidBy !== paidByFilter) return false
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        return obligation.description.toLowerCase().includes(search)
      }
      return true
    })
    .sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime()
      const dateB = new Date(b.dueDate).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

  const pendingCount = obligations.filter((o) => o.status === 'pending').length
  const partialCount = obligations.filter((o) => o.status === 'partial').length
  const paidCount = obligations.filter((o) => o.status === 'paid').length
  const overdueCount = obligations.filter((o) => o.status === 'overdue').length

  const tabs = [
    { id: 'all', label: 'Todas', badge: obligations.length },
    { id: 'pending', label: 'Pendientes', badge: pendingCount },
    { id: 'partial', label: 'Parciales', badge: partialCount },
    { id: 'overdue', label: 'Vencidas', badge: overdueCount },
    { id: 'paid', label: 'Pagadas', badge: paidCount },
  ]

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando obligaciones...</p>
      </div>
    )
  }

  return (
    <div className={styles.content}>
      {/* Acciones Rápidas */}
      <WidgetCard
        title="Acciones Rápidas"
        columns={4}
        variant="compact"
        items={[
          {
            id: 'new-obligation',
            icon: <Plus />,
            label: 'Nueva Obligación',
            color: 'blue',
            onClick: () => router.push('/obligations/new'),
          },
          {
            id: 'update-recurring',
            icon: <RefreshCw />,
            label: 'Generar Recurrentes',
            color: 'purple',
            onClick: () => setShowGenerateModal(true),
          },
          {
            id: 'register-payment',
            icon: <CreditCard />,
            label: 'Registrar Pago',
            color: 'green',
            badge: unpaidObligations.length > 0 ? unpaidObligations.length : undefined,
            onClick: () => {
              if (unpaidObligations.length > 0) {
                setShowSelectObligationModal(true)
              }
            },
          },
          {
            id: 'analytics',
            icon: <TrendingUp />,
            label: 'Ver Analíticas',
            color: 'orange',
            badge: overdueCount > 0 ? overdueCount : undefined,
            onClick: () => router.push('/reports/analiticas'),
          },
        ]}
      />

      {/* Period Navigator + Status Pills */}
      <div className={styles.periodNavigator}>
        <div className={styles.periodTypeSelector}>
          <button
            className={`${styles.periodTypeBtn} ${periodType === 'month' ? styles.active : ''}`}
            onClick={() => setPeriodType('month')}
          >
            Mensual
          </button>
          <button
            className={`${styles.periodTypeBtn} ${periodType === 'year' ? styles.active : ''}`}
            onClick={() => setPeriodType('year')}
          >
            Anual
          </button>
          <button
            className={`${styles.periodTypeBtn} ${periodType === 'all' ? styles.active : ''}`}
            onClick={() => setPeriodType('all')}
          >
            Todo
          </button>
        </div>
        
        <div className={styles.periodSelector}>
          <button
            className={styles.periodNavBtn}
            onClick={handlePrevPeriod}
            disabled={periodType === 'all'}
            aria-label="Período anterior"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className={styles.periodDisplay}>
            <Calendar size={14} className={styles.periodIcon} />
            <span className={styles.periodLabel}>{getPeriodLabel()}</span>
          </div>
          
          <button
            className={styles.periodNavBtn}
            onClick={handleNextPeriod}
            disabled={periodType === 'all'}
            aria-label="Período siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button
          className={styles.todayBtn}
          onClick={handleToday}
          disabled={periodType === 'all'}
        >
          Hoy
        </button>

        <div className={styles.divider} />

        {/* Status Pills */}
        <div className={styles.statusPills}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.statusPill} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id as ObligationFilter)}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={styles.pillBadge}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <CardContent>
          <div className={styles.filtersGrid2}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Tipo</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Todos los tipos</option>
                <option value="rent">Alquiler</option>
                <option value="expenses">Expensas</option>
                <option value="service">Servicios</option>
                <option value="tax">Impuestos</option>
                <option value="insurance">Seguros</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="debt">Deudas</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Pagado por</label>
              <select
                value={paidByFilter}
                onChange={(e) => setPaidByFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Todos</option>
                <option value="tenant">Inquilino</option>
                <option value="owner">Propietario</option>
                <option value="agency">Inmobiliaria</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarInfo}>
          <span>{filteredObligations.length} obligación(es) encontrada(s)</span>
        </div>
        <button
          className={styles.sortButton}
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          title={sortOrder === 'desc' ? 'Más recientes primero' : 'Más antiguas primero'}
        >
          {sortOrder === 'desc' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
          <span>Fecha</span>
        </button>
      </div>

      {/* Obligations List */}
      {filteredObligations.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<DollarSign />}
              title="No hay obligaciones"
              description="No se encontraron obligaciones con los filtros seleccionados."
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <div className={styles.obligationsList}>
              {filteredObligations.map((obligation) => (
                <div
                  key={obligation.id}
                  className={styles.obligationItem}
                  onClick={() => router.push(`/obligations/${obligation.id}`)}
                >
                  <div className={styles.obligationIcon}>
                    {obligation.status === 'paid' ? (
                      <CheckCircle size={20} />
                    ) : obligation.status === 'overdue' ? (
                      <AlertTriangle size={20} />
                    ) : (
                      <Clock size={20} />
                    )}
                  </div>
                  <div className={styles.obligationInfo}>
                    <div className={styles.obligationHeader}>
                      <span className={styles.obligationDesc}>
                        {obligation.description}
                      </span>
                      {getStatusBadge(obligation.status)}
                    </div>
                    <div className={styles.obligationMeta}>
                      <span className={styles.obligationType}>
                        {getTypeLabel(obligation.type)}
                      </span>
                      <span>•</span>
                      <span>
                        <Calendar size={12} />
                        {formatDate(obligation.period)}
                      </span>
                      <span>•</span>
                      <span>Vence: {formatDate(obligation.dueDate)}</span>
                    </div>
                    <div className={styles.obligationAmounts}>
                      <span>
                        Total: <strong>{formatCurrency(obligation.amount)}</strong>
                      </span>
                      <span>
                        Pagado: <strong className={styles.paidAmount}>{formatCurrency(obligation.paidAmount)}</strong>
                      </span>
                      <span>
                        Pendiente: <strong className={styles.pendingAmount}>{formatCurrency(obligation.amount - obligation.paidAmount)}</strong>
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={20} className={styles.chevron} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para generar obligaciones recurrentes */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => {
          setShowGenerateModal(false)
          setGenerateResult(null)
        }}
        title="Generar Obligaciones Recurrentes"
        subtitle="Genera las obligaciones del mes seleccionado"
        size="sm"
      >
        {generateResult ? (
          <div className={styles.generateResult}>
            <div className={generateResult.success ? styles.generateSuccess : styles.generateError}>
              {generateResult.success ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
              <p>{generateResult.message}</p>
            </div>
          </div>
        ) : (
          <div className={styles.generateForm}>
            <Select
              label="Mes a generar"
              options={getMonthOptions()}
              value={generateMonth}
              onChange={(e) => setGenerateMonth(e.target.value)}
              fullWidth
            />
            <p className={styles.generateHint}>
              Se generarán las obligaciones configuradas como recurrentes para el mes seleccionado.
            </p>
          </div>
        )}
        <ModalFooter>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowGenerateModal(false)
              setGenerateResult(null)
            }}
          >
            {generateResult ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!generateResult && (
            <Button 
              onClick={handleGenerateRecurring}
              loading={generating}
              leftIcon={<RefreshCw size={16} />}
            >
              Generar
            </Button>
          )}
        </ModalFooter>
      </Modal>

      {/* Modal para seleccionar obligación a pagar */}
      <Modal
        isOpen={showSelectObligationModal}
        onClose={() => setShowSelectObligationModal(false)}
        title="Seleccionar Obligación"
        subtitle="Elige la obligación a la que deseas registrar un pago"
        size="md"
      >
        <div className={styles.selectObligationList}>
          {unpaidObligations.length === 0 ? (
            <div className={styles.emptyObligations}>
              <CheckCircle size={32} />
              <p>No hay obligaciones pendientes de pago</p>
            </div>
          ) : (
            unpaidObligations.map((ob) => (
              <div
                key={ob.id}
                className={styles.selectObligationItem}
                onClick={() => {
                  setSelectedObligationForPayment(ob)
                  setShowSelectObligationModal(false)
                  setShowPaymentModal(true)
                }}
              >
                <div className={styles.selectObligationInfo}>
                  <span className={styles.selectObligationDesc}>{ob.description}</span>
                  <div className={styles.selectObligationMeta}>
                    <Badge 
                      variant={ob.status === 'overdue' ? 'error' : ob.status === 'partial' ? 'warning' : 'info'}
                      size="sm"
                    >
                      {ob.status === 'overdue' ? 'Vencido' : ob.status === 'partial' ? 'Parcial' : 'Pendiente'}
                    </Badge>
                    <span>{getTypeLabel(ob.type)}</span>
                    <span>•</span>
                    <span>{formatDate(ob.period)}</span>
                  </div>
                </div>
                <div className={styles.selectObligationAmount}>
                  <span className={styles.selectObligationPending}>
                    {formatCurrency(ob.amount - ob.paidAmount)}
                  </span>
                  <span className={styles.selectObligationTotal}>
                    de {formatCurrency(ob.amount)}
                  </span>
                </div>
                <ChevronRight size={20} className={styles.chevron} />
              </div>
            ))
          )}
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowSelectObligationModal(false)}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal de registrar pago */}
      {selectedObligationForPayment && (
        <RegisterPaymentModal
          obligation={selectedObligationForPayment}
          open={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedObligationForPayment(null)
          }}
          onSuccess={() => {
            setShowPaymentModal(false)
            setSelectedObligationForPayment(null)
            fetchObligations()
          }}
        />
      )}
    </div>
  )

  // Helper function to get month options
  function getMonthOptions() {
    const options = []
    const now = new Date()
    for (let i = -1; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
    }
    return options
  }

  // Handler for generating recurring obligations
  async function handleGenerateRecurring() {
    setGenerating(true)
    try {
      const result = await recurringObligationsService.generateForMonth(generateMonth) as { 
        generated?: number
        skipped?: number
        errors?: string[]
      }
      const generated = result?.generated || 0
      const skipped = result?.skipped || 0
      
      let message = ''
      if (generated > 0) {
        message = `Se generaron ${generated} obligaciones correctamente.`
        if (skipped > 0) {
          message += ` (${skipped} ya existían)`
        }
      } else if (skipped > 0) {
        message = `Las ${skipped} obligaciones ya habían sido generadas previamente.`
      } else {
        message = 'No hay recurrencias configuradas para este período.'
      }
      
      setGenerateResult({
        success: generated > 0 || skipped > 0,
        message
      })
      // Refresh obligations list
      fetchObligations()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al generar obligaciones'
      setGenerateResult({
        success: false,
        message: errorMessage
      })
    } finally {
      setGenerating(false)
    }
  }
}
