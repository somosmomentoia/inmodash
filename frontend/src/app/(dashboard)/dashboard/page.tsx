'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, Button, Badge, StatCard, Modal, ModalFooter } from '@/components/ui'
import { 
  FileText, DollarSign, ChevronRight, ChevronDown, Clock, Check, Plus, X,
  AlertTriangle, Settings, Percent, Activity, Calendar, Home,
  CreditCard, Receipt, FileSpreadsheet, Download, Building2,
  BarChart3, TrendingUp, TrendingDown
} from 'lucide-react'
import { useObligations } from '@/hooks/useObligations'
import { useContracts } from '@/hooks/useContracts'
import { useUpcomingTasks, useTaskStats } from '@/hooks/useTasks'
import { usePreferences } from '@/hooks/usePreferences'
import { Task, Obligation } from '@/types'
import RegisterPaymentModal from '@/components/obligations/RegisterPaymentModal'
import styles from './page.module.css'

interface WidgetConfig {
  id: string
  title: string
  icon: string
  enabled: boolean
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'quick-actions', title: 'Acciones Rápidas', icon: 'zap', enabled: true },
  { id: 'tasks', title: 'Tareas', icon: 'file-text', enabled: true },
  { id: 'overdue', title: 'Obligaciones Vencidas', icon: 'alert-triangle', enabled: true },
  { id: 'pending-rent', title: 'Alquileres Pendientes', icon: 'home', enabled: true },
  { id: 'recent-payments', title: 'Últimos Pagos', icon: 'credit-card', enabled: true },
  { id: 'cashflow', title: 'Flujo de Caja', icon: 'bar-chart', enabled: true },
  { id: 'agency-expenses', title: 'Gastos Inmobiliaria', icon: 'building', enabled: true },
  { id: 'commissions', title: 'Comisiones', icon: 'percent', enabled: true },
  { id: 'activity', title: 'Actividad Reciente', icon: 'activity', enabled: true },
  { id: 'calendar', title: 'Calendario', icon: 'calendar', enabled: true },
]

export default function DashboardPage() {
  const router = useRouter()
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS)
  const [showWidgetManager, setShowWidgetManager] = useState(false)
  const { preferences, updatePreferences, loading: prefsLoading } = usePreferences()

  // Load widget preferences from server
  useEffect(() => {
    if (!prefsLoading) {
      // If user has saved widget preferences, apply them
      if (preferences.dashboardWidgets && Array.isArray(preferences.dashboardWidgets)) {
        const savedWidgetIds = preferences.dashboardWidgets as string[]
        setWidgets(prev => prev.map(w => ({
          ...w,
          enabled: savedWidgetIds.includes(w.id)
        })))
      }
      // If no preferences saved yet, keep defaults (all enabled)
    }
  }, [preferences, prefsLoading])

  // Save widget preferences when they change
  const handleToggleWidget = useCallback(async (widgetId: string) => {
    setWidgets(prev => {
      const updated = prev.map(w => 
        w.id === widgetId ? { ...w, enabled: !w.enabled } : w
      )
      // Save to server
      const enabledIds = updated.filter(w => w.enabled).map(w => w.id)
      updatePreferences({ dashboardWidgets: enabledIds })
      return updated
    })
  }, [updatePreferences])
  
  const { obligations, fetchObligations } = useObligations()
  const { contracts } = useContracts()
  const { tasks: upcomingTasks, completedTasks, toggleTask } = useUpcomingTasks(5)
  const [showCompletedTasks, setShowCompletedTasks] = useState(false)
  const { stats: taskStats } = useTaskStats()
  
  // Modal state for selecting obligation to pay
  const [showSelectObligationModal, setShowSelectObligationModal] = useState(false)
  const [selectedObligationForPayment, setSelectedObligationForPayment] = useState<Obligation | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  
  // Get unpaid obligations (pending, partial, overdue)
  const unpaidObligations = useMemo(() => 
    obligations.filter(o => o.status === 'pending' || o.status === 'partial' || o.status === 'overdue'),
    [obligations]
  )

  const metrics = useMemo(() => {
    const now = new Date()
    const overdueObligations = obligations.filter(o => 
      o.status === 'overdue' || (o.status === 'pending' && new Date(o.dueDate) < now)
    )
    const overdueTotal = overdueObligations.reduce((sum, o) => sum + (o.amount - o.paidAmount), 0)
    const pendingRent = obligations.filter(o => o.type === 'rent' && o.status !== 'paid')
    const pendingRentTotal = pendingRent.reduce((sum, o) => sum + (o.amount - o.paidAmount), 0)
    const paidRent = obligations.filter(o => o.type === 'rent' && o.status === 'paid')
    const totalCommissions = paidRent.reduce((sum, o) => sum + (o.commissionAmount || 0), 0)
    const pendingCommissions = pendingRent.reduce((sum, o) => sum + (o.commissionAmount || 0), 0)
    const activeContracts = contracts.filter(c => new Date(c.endDate) > now).length
    const recentActivity = [...obligations]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
    const agencyExpenses = obligations.filter(o => o.paidBy === 'agency' && o.status !== 'paid')
    const agencyExpensesTotal = agencyExpenses.reduce((sum, o) => sum + (o.amount - o.paidAmount), 0)
    const agencyExpensesPaid = obligations.filter(o => o.paidBy === 'agency' && o.status === 'paid')
    const agencyExpensesPaidTotal = agencyExpensesPaid.reduce((sum, o) => sum + o.amount, 0)
    // Recent payments (last 5 paid obligations)
    const recentPayments = [...obligations]
      .filter(o => o.status === 'paid')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
    
    // Cashflow by month (last 6 months)
    const cashflowData = (() => {
      const months: { month: string, income: number, expenses: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = date.toLocaleDateString('es-AR', { month: 'short' })
        const year = date.getFullYear()
        const month = date.getMonth()
        
        const monthObligations = obligations.filter(o => {
          const oDate = new Date(o.updatedAt || o.dueDate)
          return oDate.getMonth() === month && oDate.getFullYear() === year && o.status === 'paid'
        })
        
        const income = monthObligations
          .filter(o => o.agencyImpact > 0)
          .reduce((sum, o) => sum + o.agencyImpact, 0)
        
        const expenses = monthObligations
          .filter(o => o.agencyImpact < 0)
          .reduce((sum, o) => sum + Math.abs(o.agencyImpact), 0)
        
        months.push({ month: monthKey, income, expenses })
      }
      return months
    })()
    
    const maxCashflow = Math.max(...cashflowData.map(d => Math.max(d.income, d.expenses)), 1)

    return { overdueObligations, overdueTotal, overdueCount: overdueObligations.length,
      pendingRent, pendingRentTotal, pendingRentCount: pendingRent.length,
      totalCommissions, pendingCommissions, activeContracts, recentActivity,
      agencyExpenses, agencyExpensesTotal, agencyExpensesPaid, agencyExpensesPaidTotal,
      recentPayments, cashflowData, maxCashflow }
  }, [obligations, contracts])

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0
  }).format(amount)

  const formatDate = (date: Date | string) => new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short'
  })


  const removeWidget = useCallback((id: string) => {
    setWidgets(prev => {
      const updated = prev.map(w => w.id === id ? { ...w, enabled: false } : w)
      const enabledIds = updated.filter(w => w.enabled).map(w => w.id)
      updatePreferences({ dashboardWidgets: enabledIds })
      return updated
    })
  }, [updatePreferences])

  const getWidgetIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'zap': <CreditCard size={18} className={styles.iconBlue} />,
      'file-text': <FileText size={18} className={styles.iconBlue} />,
      'alert-triangle': <AlertTriangle size={18} className={styles.iconRed} />,
      'home': <Home size={18} className={styles.iconYellow} />,
      'building': <Building2 size={18} className={styles.iconPurple} />,
      'percent': <Percent size={18} className={styles.iconGreen} />,
      'activity': <Activity size={18} className={styles.iconBlue} />,
      'calendar': <Calendar size={18} className={styles.iconPurple} />,
      'credit-card': <CreditCard size={18} className={styles.iconGreen} />,
      'bar-chart': <BarChart3 size={18} className={styles.iconBlue} />,
    }
    return icons[iconName] || <FileText size={18} />
  }

  const handleToggleTask = async (task: Task) => { await toggleTask(task.id) }

  const isTaskOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'completed') return false
    return new Date(task.dueDate) < new Date()
  }

  const calendarData = useMemo(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const offset = firstDay === 0 ? 6 : firstDay - 1
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    
    // Collect events for each day
    const events: Record<number, Array<{ type: 'task' | 'obligation', id: number, title: string, color: string }>> = {}
    
    // Add tasks with due dates
    upcomingTasks.forEach(task => {
      if (task.dueDate) {
        const taskDate = new Date(task.dueDate)
        if (taskDate.getMonth() === month && taskDate.getFullYear() === year) {
          const day = taskDate.getDate()
          if (!events[day]) events[day] = []
          events[day].push({
            type: 'task',
            id: task.id,
            title: task.title,
            color: task.priority === 'urgent' ? 'red' : task.priority === 'high' ? 'orange' : 'blue'
          })
        }
      }
    })
    
    // Add obligations with due dates
    obligations.forEach(o => {
      if (o.dueDate && o.status !== 'paid') {
        const obDate = new Date(o.dueDate)
        if (obDate.getMonth() === month && obDate.getFullYear() === year) {
          const day = obDate.getDate()
          if (!events[day]) events[day] = []
          events[day].push({
            type: 'obligation',
            id: o.id,
            title: o.description,
            color: o.status === 'overdue' ? 'red' : 'yellow'
          })
        }
      }
    })
    
    return { days, offset, today: today.getDate(), events, month, year }
  }, [upcomingTasks, obligations])

  const enabledWidgets = widgets.filter(w => w.enabled)

  return (
    <DashboardLayout title="Dashboard" subtitle="Bienvenido de vuelta">
      {/* Stats Row */}
      <div className={styles.statsRow}>
        <StatCard title="Contratos Activos" value={String(metrics.activeContracts)} icon={<FileText size={18} />} variant="primary" />
        <StatCard title="Comisiones Cobradas" value={formatCurrency(metrics.totalCommissions)} icon={<DollarSign size={18} />} variant="success" />
        <StatCard title="Tareas Pendientes" value={String(taskStats?.pending || 0)} icon={<Clock size={18} />} variant="warning" />
        <StatCard title="Obligaciones Vencidas" value={String(metrics.overdueCount)} icon={<AlertTriangle size={18} />} variant="error" />
      </div>

      {/* Widget Manager Toggle */}
      <div className={styles.widgetManagerRow}>
        <Button variant="secondary" size="sm" leftIcon={<Settings size={14} />} onClick={() => setShowWidgetManager(true)}>
          Personalizar Dashboard
        </Button>
      </div>

      {/* Widget Manager Modal */}
      {showWidgetManager && (
        <div className={styles.modalOverlay} onClick={() => setShowWidgetManager(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Personalizar Dashboard</h2>
              <button className={styles.modalClose} onClick={() => setShowWidgetManager(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalContent}>
              <p className={styles.modalSubtitle}>Selecciona los widgets que deseas mostrar en tu dashboard</p>
              <div className={styles.widgetPreviewGrid}>
                {widgets.map((w) => (
                  <div 
                    key={w.id} 
                    className={`${styles.widgetPreviewCard} ${w.enabled ? styles.widgetPreviewActive : ''}`}
                    onClick={() => handleToggleWidget(w.id)}
                  >
                    <div className={styles.widgetPreviewIcon}>
                      {getWidgetIcon(w.icon)}
                    </div>
                    <span className={styles.widgetPreviewTitle}>{w.title}</span>
                    <div className={styles.widgetPreviewCheck}>
                      {w.enabled && <Check size={16} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <Button variant="secondary" onClick={() => setShowWidgetManager(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Widget - Full Width */}
      {enabledWidgets.find(w => w.id === 'quick-actions') && (
        <div className={styles.quickActionsWidget}>
          <div className={styles.quickActionsHeader}>
            <div className={styles.widgetTitle}>
              <CreditCard size={18} className={styles.iconBlue} />
              <span>Acciones Rápidas</span>
            </div>
            <button className={styles.widgetClose} onClick={() => removeWidget('quick-actions')}>
              <X size={16} />
            </button>
          </div>
          <div className={styles.quickActionsContent}>
            <button className={styles.quickActionBtn} onClick={() => setShowSelectObligationModal(true)}>
              <div className={styles.quickActionIcon}><CreditCard size={20} /></div>
              <span>Registrar Pago</span>
              {unpaidObligations.length > 0 && (
                <Badge variant="error" size="sm" className={styles.quickActionBadge}>
                  {unpaidObligations.length}
                </Badge>
              )}
            </button>
            <button className={styles.quickActionBtn} onClick={() => router.push('/obligations/new')}>
              <div className={styles.quickActionIcon}><Receipt size={20} /></div>
              <span>Nueva Obligación</span>
            </button>
            <button className={styles.quickActionBtn} onClick={() => router.push('/contracts/new')}>
              <div className={styles.quickActionIcon}><FileText size={20} /></div>
              <span>Nuevo Contrato</span>
            </button>
            <button className={styles.quickActionBtn} onClick={() => router.push('/tasks')}>
              <div className={styles.quickActionIcon}><Check size={20} /></div>
              <span>Nueva Tarea</span>
            </button>
            <button className={styles.quickActionBtn} onClick={() => router.push('/finances?tab=settlements')}>
              <div className={styles.quickActionIcon}><FileSpreadsheet size={20} /></div>
              <span>Liquidaciones</span>
            </button>
            <button className={styles.quickActionBtn} onClick={() => router.push('/properties')}>
              <div className={styles.quickActionIcon}><Home size={20} /></div>
              <span>Propiedades</span>
            </button>
            <button className={styles.quickActionBtn} onClick={() => router.push('/reports')}>
              <div className={styles.quickActionIcon}><Download size={20} /></div>
              <span>Reportes</span>
            </button>
            <button className={styles.quickActionBtn} onClick={() => router.push('/finances?tab=accounting')}>
              <div className={styles.quickActionIcon}><DollarSign size={20} /></div>
              <span>Contabilidad</span>
            </button>
          </div>
        </div>
      )}

      {/* Widgets Grid */}
      <div className={styles.widgetsGrid}>
        {/* Tasks Widget */}
        {enabledWidgets.find(w => w.id === 'tasks') && (
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitle}>
                <FileText size={18} className={styles.iconBlue} />
                <span>Tareas</span>
              </div>
              <div className={styles.widgetActions}>
                <button className={styles.widgetAction} onClick={() => router.push('/tasks')}>
                  <ChevronRight size={18} />
                </button>
                <button className={styles.widgetClose} onClick={() => removeWidget('tasks')}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className={styles.widgetContent}>
              {upcomingTasks.length === 0 && completedTasks.length === 0 ? (
                <div className={styles.emptyWidget}>
                  <p>No hay tareas pendientes</p>
                  <Button size="sm" onClick={() => router.push('/tasks')}><Plus size={14} /> Nueva Tarea</Button>
                </div>
              ) : (
                <>
                  {upcomingTasks.length > 0 && (
                    <div className={styles.tasksList}>
                      {upcomingTasks.map((task) => (
                        <div key={task.id} className={`${styles.taskItem} ${isTaskOverdue(task) ? styles.taskOverdue : ''}`}>
                          <button 
                            className={styles.taskCheckbox}
                            onClick={() => handleToggleTask(task)}
                          >
                          </button>
                          <div className={styles.taskContent}>
                            <span className={styles.taskTitle}>{task.title}</span>
                            {task.dueDate && (
                              <span className={styles.taskDate}>
                                <Clock size={10} /> {formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                          {isTaskOverdue(task) && <Badge variant="error">Vencida</Badge>}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {completedTasks.length > 0 && (
                    <div className={styles.completedSection}>
                      <button 
                        className={styles.completedToggle}
                        onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                      >
                        <ChevronDown 
                          size={16} 
                          className={`${styles.completedChevron} ${showCompletedTasks ? styles.completedChevronOpen : ''}`} 
                        />
                        <Check size={14} className={styles.completedIcon} />
                        <span>Completadas ({completedTasks.length})</span>
                      </button>
                      
                      {showCompletedTasks && (
                        <div className={styles.completedList}>
                          {completedTasks.map((task) => (
                            <div key={task.id} className={`${styles.taskItem} ${styles.taskCompleted}`}>
                              <button 
                                className={`${styles.taskCheckbox} ${styles.taskChecked}`}
                                onClick={() => handleToggleTask(task)}
                              >
                                <Check size={12} />
                              </button>
                              <div className={styles.taskContent}>
                                <span className={`${styles.taskTitle} ${styles.taskTitleCompleted}`}>{task.title}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              <Button variant="secondary" className={styles.widgetButton} onClick={() => router.push('/tasks')}>Ver todas las tareas</Button>
            </div>
          </div>
        )}

        {/* Overdue Obligations Widget */}
        {enabledWidgets.find(w => w.id === 'overdue') && (
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitle}>
                <AlertTriangle size={18} className={styles.iconRed} />
                <span>Obligaciones Vencidas</span>
              </div>
              <div className={styles.widgetActions}>
                <button className={styles.widgetAction} onClick={() => router.push('/obligations?status=overdue')}>
                  <ChevronRight size={18} />
                </button>
                <button className={styles.widgetClose} onClick={() => removeWidget('overdue')}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className={styles.widgetContent}>
              <div className={styles.widgetStat}>
                <span className={styles.widgetStatValue}>{metrics.overdueCount}</span>
                <span className={styles.widgetStatLabel}>obligaciones vencidas</span>
              </div>
              <div className={styles.widgetStatSecondary}>
                <span>Total pendiente:</span>
                <span className={styles.amountRed}>{formatCurrency(metrics.overdueTotal)}</span>
              </div>
              {metrics.overdueObligations.slice(0, 3).map((o) => (
                <div key={o.id} className={styles.obligationItem}>
                  <div className={styles.obligationInfo}>
                    <span className={styles.obligationDesc}>{o.description}</span>
                    <span className={styles.obligationDate}>{formatDate(o.dueDate)}</span>
                  </div>
                  <span className={styles.obligationAmount}>{formatCurrency(o.amount - o.paidAmount)}</span>
                </div>
              ))}
              <Button variant="secondary" className={styles.widgetButton} onClick={() => router.push('/obligations?status=overdue')}>Ver todas</Button>
            </div>
          </div>
        )}

        {/* Pending Rent Widget */}
        {enabledWidgets.find(w => w.id === 'pending-rent') && (
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitle}>
                <Home size={18} className={styles.iconYellow} />
                <span>Alquileres Pendientes</span>
              </div>
              <div className={styles.widgetActions}>
                <button className={styles.widgetAction} onClick={() => router.push('/obligations?type=rent&status=pending')}>
                  <ChevronRight size={18} />
                </button>
                <button className={styles.widgetClose} onClick={() => removeWidget('pending-rent')}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className={styles.widgetContent}>
              <div className={styles.widgetStat}>
                <span className={styles.widgetStatValue}>{metrics.pendingRentCount}</span>
                <span className={styles.widgetStatLabel}>alquileres por cobrar</span>
              </div>
              <div className={styles.widgetStatSecondary}>
                <span>Total:</span>
                <span className={styles.amountYellow}>{formatCurrency(metrics.pendingRentTotal)}</span>
              </div>
              {metrics.pendingRent.slice(0, 3).map((o) => (
                <div key={o.id} className={styles.obligationItem}>
                  <div className={styles.obligationInfo}>
                    <span className={styles.obligationDesc}>{o.description}</span>
                    <span className={styles.obligationDate}>{formatDate(o.dueDate)}</span>
                  </div>
                  <span className={styles.obligationAmount}>{formatCurrency(o.amount - o.paidAmount)}</span>
                </div>
              ))}
              <Button variant="secondary" className={styles.widgetButton} onClick={() => router.push('/obligations?type=rent&status=pending')}>Ver todos</Button>
            </div>
          </div>
        )}

        {/* Recent Payments Widget */}
        {enabledWidgets.find(w => w.id === 'recent-payments') && (
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitle}>
                <CreditCard size={18} className={styles.iconGreen} />
                <span>Últimos Pagos</span>
              </div>
              <div className={styles.widgetActions}>
                <button className={styles.widgetAction} onClick={() => router.push('/payments-received')}>
                  <ChevronRight size={18} />
                </button>
                <button className={styles.widgetClose} onClick={() => removeWidget('recent-payments')}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className={styles.widgetContent}>
              {metrics.recentPayments.length === 0 ? (
                <div className={styles.emptyState}>No hay pagos registrados</div>
              ) : (
                <div className={styles.paymentsList}>
                  {metrics.recentPayments.map((o) => (
                    <div key={o.id} className={styles.paymentItem} onClick={() => router.push(`/obligations/${o.id}`)}>
                      <div className={styles.paymentIcon}>
                        <Check size={14} />
                      </div>
                      <div className={styles.paymentInfo}>
                        <span className={styles.paymentDesc}>
                          {o.description || 'Pago'}
                        </span>
                        <span className={styles.paymentDate}>{formatDate(o.updatedAt)}</span>
                      </div>
                      <span className={styles.paymentAmount}>{formatCurrency(o.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="secondary" className={styles.widgetButton} onClick={() => router.push('/obligations?status=paid')}>Ver todos los pagos</Button>
            </div>
          </div>
        )}

        {/* Cashflow Chart Widget */}
        {enabledWidgets.find(w => w.id === 'cashflow') && (
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitle}>
                <BarChart3 size={18} className={styles.iconBlue} />
                <span>Flujo de Caja</span>
              </div>
              <div className={styles.widgetActions}>
                <button className={styles.widgetAction} onClick={() => router.push('/finances?tab=accounting')}>
                  <ChevronRight size={18} />
                </button>
                <button className={styles.widgetClose} onClick={() => removeWidget('cashflow')}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className={styles.widgetContent}>
              <div className={styles.cashflowLegend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: 'var(--success)' }} />
                  <span>Ingresos</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: 'var(--error)' }} />
                  <span>Egresos</span>
                </div>
              </div>
              <div className={styles.cashflowChart}>
                {metrics.cashflowData.map((data, idx) => (
                  <div key={idx} className={styles.cashflowBar}>
                    <div className={styles.barContainer}>
                      <div 
                        className={styles.barIncome} 
                        style={{ height: `${(data.income / metrics.maxCashflow) * 100}%` }}
                        title={`Ingresos: ${formatCurrency(data.income)}`}
                      />
                      <div 
                        className={styles.barExpense} 
                        style={{ height: `${(data.expenses / metrics.maxCashflow) * 100}%` }}
                        title={`Egresos: ${formatCurrency(data.expenses)}`}
                      />
                    </div>
                    <span className={styles.barLabel}>{data.month}</span>
                  </div>
                ))}
              </div>
              <div className={styles.cashflowSummary}>
                <div className={styles.cashflowStat}>
                  <TrendingUp size={16} className={styles.iconGreen} />
                  <span>Total Ingresos:</span>
                  <span className={styles.amountGreen}>
                    {formatCurrency(metrics.cashflowData.reduce((sum, d) => sum + d.income, 0))}
                  </span>
                </div>
                <div className={styles.cashflowStat}>
                  <TrendingDown size={16} className={styles.iconRed} />
                  <span>Total Egresos:</span>
                  <span className={styles.amountRed}>
                    {formatCurrency(metrics.cashflowData.reduce((sum, d) => sum + d.expenses, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agency Expenses Widget */}
        {enabledWidgets.find(w => w.id === 'agency-expenses') && (
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitle}>
                <Building2 size={18} className={styles.iconPurple} />
                <span>Gastos Inmobiliaria</span>
              </div>
              <div className={styles.widgetActions}>
                <button className={styles.widgetAction} onClick={() => router.push('/obligations?paidBy=agency')}>
                  <ChevronRight size={18} />
                </button>
                <button className={styles.widgetClose} onClick={() => removeWidget('agency-expenses')}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className={styles.widgetContent}>
              <div className={styles.commissionsGrid}>
                <div className={styles.commissionBox}>
                  <span className={styles.commissionLabel}>Pendientes</span>
                  <span className={`${styles.commissionValue} ${styles.textRed}`}>{formatCurrency(metrics.agencyExpensesTotal)}</span>
                </div>
                <div className={styles.commissionBox}>
                  <span className={styles.commissionLabel}>Pagados</span>
                  <span className={`${styles.commissionValue} ${styles.textGreen}`}>{formatCurrency(metrics.agencyExpensesPaidTotal)}</span>
                </div>
              </div>
              {metrics.agencyExpenses.slice(0, 3).map((o) => (
                <div key={o.id} className={styles.obligationItem}>
                  <div className={styles.obligationInfo}>
                    <span className={styles.obligationDesc}>{o.description}</span>
                    <span className={styles.obligationDate}>{formatDate(o.dueDate)}</span>
                  </div>
                  <span className={styles.obligationAmount}>{formatCurrency(o.amount - o.paidAmount)}</span>
                </div>
              ))}
              <Button variant="secondary" className={styles.widgetButton} onClick={() => router.push('/obligations?paidBy=agency')}>Ver todos</Button>
            </div>
          </div>
        )}

        {/* Commissions Widget */}
        {enabledWidgets.find(w => w.id === 'commissions') && (
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitle}>
                <Percent size={18} className={styles.iconGreen} />
                <span>Comisiones</span>
              </div>
              <div className={styles.widgetActions}>
                <button className={styles.widgetAction} onClick={() => router.push('/reports/comisiones')}>
                  <ChevronRight size={18} />
                </button>
                <button className={styles.widgetClose} onClick={() => removeWidget('commissions')}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className={styles.widgetContent}>
              <div className={styles.commissionsGrid}>
                <div className={styles.commissionBox}>
                  <span className={styles.commissionLabel}>Cobradas</span>
                  <span className={`${styles.commissionValue} ${styles.textGreen}`}>{formatCurrency(metrics.totalCommissions)}</span>
                </div>
                <div className={styles.commissionBox}>
                  <span className={styles.commissionLabel}>Pendientes</span>
                  <span className={`${styles.commissionValue} ${styles.textYellow}`}>{formatCurrency(metrics.pendingCommissions)}</span>
                </div>
              </div>
              <Button variant="secondary" className={styles.widgetButton} onClick={() => router.push('/reports/comisiones')}>Ver reporte</Button>
            </div>
          </div>
        )}

        {/* Activity Widget */}
        {enabledWidgets.find(w => w.id === 'activity') && (
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitle}>
                <Activity size={18} className={styles.iconBlue} />
                <span>Actividad Reciente</span>
              </div>
              <button className={styles.widgetClose} onClick={() => removeWidget('activity')}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.widgetContent}>
              <div className={styles.activityList}>
                {metrics.recentActivity.map((o) => (
                  <div key={o.id} className={styles.activityItem}>
                    <div className={`${styles.activityDot} ${o.status === 'paid' ? styles.dotGreen : o.status === 'overdue' ? styles.dotRed : styles.dotYellow}`} />
                    <div className={styles.activityContent}>
                      <span className={styles.activityDesc}>{o.description}</span>
                      <span className={styles.activityMeta}>
                        {o.status === 'paid' ? 'Pagado' : o.status === 'overdue' ? 'Vencido' : 'Pendiente'} • {formatDate(o.updatedAt)}
                      </span>
                    </div>
                    <span className={styles.activityAmount}>{formatCurrency(o.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Calendar Widget */}
        {enabledWidgets.find(w => w.id === 'calendar') && (
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitle}>
                <Calendar size={18} className={styles.iconPurple} />
                <span>{new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</span>
              </div>
              <button className={styles.widgetClose} onClick={() => removeWidget('calendar')}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.widgetContent}>
              <div className={styles.calendarGrid}>
                <div className={styles.calendarHeader}>
                  <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
                </div>
                <div className={styles.calendarDays}>
                  {Array.from({ length: calendarData.offset }).map((_, i) => <span key={`empty-${i}`} className={styles.calendarDay} />)}
                  {calendarData.days.map((day: number) => {
                    const dayEvents = calendarData.events[day] || []
                    const hasEvents = dayEvents.length > 0
                    return (
                      <div 
                        key={day} 
                        className={`${styles.calendarDay} ${day === calendarData.today ? styles.calendarToday : ''} ${hasEvents ? styles.calendarHasEvents : ''}`}
                        onClick={() => hasEvents && router.push(dayEvents[0].type === 'task' ? `/tasks/${dayEvents[0].id}` : `/obligations/${dayEvents[0].id}`)}
                        title={hasEvents ? dayEvents.map(e => e.title).join(', ') : undefined}
                      >
                        {day}
                        {hasEvents && (
                          <div className={styles.calendarEventDots}>
                            {dayEvents.slice(0, 3).map((event, idx) => (
                              <span key={idx} className={`${styles.calendarEventDot} ${styles[`dot${event.color.charAt(0).toUpperCase() + event.color.slice(1)}`]}`} />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para seleccionar obligación a pagar */}
      <Modal
        isOpen={showSelectObligationModal}
        onClose={() => setShowSelectObligationModal(false)}
        title="Seleccionar Obligación a Pagar"
        size="md"
      >
        <div className={styles.selectObligationList}>
          {unpaidObligations.length === 0 ? (
            <div className={styles.emptyObligations}>
              <Check size={32} />
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
                    <span>{ob.type === 'rent' ? 'Alquiler' : ob.type === 'expenses' ? 'Expensas' : ob.type}</span>
                    <span>•</span>
                    <span>{new Date(ob.period).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className={styles.selectObligationAmount}>
                  <span className={styles.selectObligationPending}>
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(ob.amount - ob.paidAmount)}
                  </span>
                  <span className={styles.selectObligationTotal}>
                    de {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(ob.amount)}
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
    </DashboardLayout>
  )
}
