'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Search,
  Calendar,
  BarChart3,
} from 'lucide-react'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Select,
  Badge,
  EmptyState,
} from '@/components/ui'
import accountingService, { AccountingEntry as AccountingEntryFromDB } from '@/services/accountingService'
import styles from './accounting.module.css'

interface AccountingEntry {
  id: number
  date: Date
  description: string
  type: 'income' | 'expense'
  category: string
  amount: number
  balance: number
  isFromDB?: boolean
  dbEntryId?: number
  obligationId?: number
}

type PeriodType = 'monthly' | 'quarterly' | 'semester' | 'annual'

const PERIOD_LABELS: Record<PeriodType, string> = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  semester: 'Semestral',
  annual: 'Anual'
}

export default function AccountingContent() {
  const router = useRouter()
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Cargar asientos contables reales de la BD (comisiones registradas)
  const [dbEntries, setDbEntries] = useState<AccountingEntryFromDB[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)

  useEffect(() => {
    const loadEntries = async () => {
      setLoadingEntries(true)
      try {
        const entries = await accountingService.getAll()
        setDbEntries(entries)
      } catch (error) {
        console.error('Error loading accounting entries:', error)
      } finally {
        setLoadingEntries(false)
      }
    }
    loadEntries()
  }, [])

  // Get period date range based on period type and selected period
  const getPeriodRange = useMemo(() => {
    const [year, month] = selectedPeriod.split('-').map(Number)
    let startDate: Date
    let endDate: Date

    switch (periodType) {
      case 'monthly':
        startDate = new Date(year, month - 1, 1)
        endDate = new Date(year, month, 0) // Last day of month
        break
      case 'quarterly':
        // Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec
        const quarter = Math.ceil(month / 3)
        startDate = new Date(year, (quarter - 1) * 3, 1)
        endDate = new Date(year, quarter * 3, 0)
        break
      case 'semester':
        // S1: Jan-Jun, S2: Jul-Dec
        const semester = month <= 6 ? 1 : 2
        startDate = new Date(year, (semester - 1) * 6, 1)
        endDate = new Date(year, semester * 6, 0)
        break
      case 'annual':
        startDate = new Date(year, 0, 1)
        endDate = new Date(year, 11, 31)
        break
      default:
        startDate = new Date(year, month - 1, 1)
        endDate = new Date(year, month, 0)
    }

    return { startDate, endDate }
  }, [periodType, selectedPeriod])

  // Asientos contables reales de la BD (solo comisiones registradas por liquidaciones)
  const accountingEntries: AccountingEntry[] = useMemo(() => {
    const { startDate, endDate } = getPeriodRange
    
    const dbEntriesFiltered = dbEntries
      .filter((e) => {
        const entryDate = new Date(e.entryDate)
        return entryDate >= startDate && entryDate <= endDate
      })
      .map((e) => ({
        id: e.id,
        date: new Date(e.entryDate),
        description: e.description,
        type: (e.type === 'commission' || e.type === 'commission_service' || e.type === 'income_other' ? 'income' : 'expense') as 'income' | 'expense',
        category: e.type,
        amount: e.amount,
        balance: 0,
        isFromDB: true,
        dbEntryId: e.id,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    // Calculate running balance
    let runningBalance = 0
    dbEntriesFiltered.forEach((entry) => {
      if (entry.type === 'income') {
        runningBalance += entry.amount
      } else {
        runningBalance -= entry.amount
      }
      entry.balance = runningBalance
    })

    return dbEntriesFiltered
  }, [getPeriodRange, dbEntries])

  // Calculate totals
  const totalIncome = accountingEntries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0)

  const totalExpenses = accountingEntries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0)

  const netResult = totalIncome - totalExpenses

  // Generate chart data based on period type
  const chartData = useMemo(() => {
    const { startDate, endDate } = getPeriodRange
    const data: { label: string; income: number; expense: number }[] = []

    if (periodType === 'monthly') {
      // Group by day
      const daysInMonth = endDate.getDate()
      for (let day = 1; day <= daysInMonth; day++) {
        const dayEntries = accountingEntries.filter(e => e.date.getDate() === day)
        data.push({
          label: day.toString(),
          income: dayEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0),
          expense: dayEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0)
        })
      }
    } else {
      // Group by month
      const months = periodType === 'quarterly' ? 3 : periodType === 'semester' ? 6 : 12
      const startMonth = startDate.getMonth()
      const year = startDate.getFullYear()
      
      for (let i = 0; i < months; i++) {
        const monthDate = new Date(year, startMonth + i, 1)
        const monthEntries = accountingEntries.filter(e => 
          e.date.getMonth() === monthDate.getMonth() && e.date.getFullYear() === monthDate.getFullYear()
        )
        data.push({
          label: monthDate.toLocaleDateString('es-AR', { month: 'short' }),
          income: monthEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0),
          expense: monthEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0)
        })
      }
    }

    return data
  }, [accountingEntries, periodType, getPeriodRange])

  // Category labels helper
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      rent: 'Alquiler',
      expenses: 'Expensas',
      service: 'Servicio',
      tax: 'Impuesto',
      insurance: 'Seguro',
      maintenance: 'Mantenimiento',
      debt: 'Deuda',
      commission: 'Comisión',
      commission_service: 'Comisión Servicio',
      commission_pending: 'Comisión Pendiente',
      expense: 'Gasto',
      income_other: 'Otro Ingreso',
      adjustment: 'Ajuste',
    }
    return labels[category] || category
  }

  // Category breakdown for donut chart
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {}
    accountingEntries.forEach(entry => {
      const cat = entry.category
      if (!categories[cat]) categories[cat] = 0
      categories[cat] += entry.amount
    })
    
    const colors: Record<string, string> = {
      rent: '#10B981',
      expenses: '#F59E0B',
      service: '#06B6D4',
      tax: '#EF4444',
      insurance: '#8B5CF6',
      maintenance: '#EC4899',
      debt: '#6B7280'
    }

    return Object.entries(categories).map(([key, value]) => ({
      label: getCategoryLabel(key),
      value,
      color: colors[key] || '#3B82F6'
    }))
  }, [accountingEntries])

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
      month: 'short',
    })
  }

  const formatPeriodLabel = () => {
    const [year, month] = selectedPeriod.split('-').map(Number)
    const date = new Date(year, month - 1)
    
    switch (periodType) {
      case 'monthly':
        return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
      case 'quarterly':
        const quarter = Math.ceil(month / 3)
        return `${quarter}° Trimestre ${year}`
      case 'semester':
        const semester = month <= 6 ? 1 : 2
        return `${semester}° Semestre ${year}`
      case 'annual':
        return `Año ${year}`
      default:
        return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    }
  }

  const getPeriodOptions = () => {
    const options = []
    const now = new Date()

    switch (periodType) {
      case 'monthly':
        for (let i = -3; i < 12; i++) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          const label = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
          options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
        }
        break
      case 'quarterly':
        for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) {
          for (let q = 4; q >= 1; q--) {
            if (y === now.getFullYear() && q > Math.ceil((now.getMonth() + 1) / 3) + 1) continue
            const month = (q - 1) * 3 + 1
            options.push({ value: `${y}-${String(month).padStart(2, '0')}`, label: `${q}° Trimestre ${y}` })
          }
        }
        break
      case 'semester':
        for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) {
          for (let s = 2; s >= 1; s--) {
            if (y === now.getFullYear() && s > (now.getMonth() < 6 ? 1 : 2) + 1) continue
            const month = (s - 1) * 6 + 1
            options.push({ value: `${y}-${String(month).padStart(2, '0')}`, label: `${s}° Semestre ${y}` })
          }
        }
        break
      case 'annual':
        for (let y = now.getFullYear() + 1; y >= now.getFullYear() - 3; y--) {
          options.push({ value: `${y}-01`, label: `Año ${y}` })
        }
        break
    }

    return options
  }

  if (loadingEntries) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando contabilidad...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {/* Period Type Selector */}
          <div className={styles.periodTypeSelector}>
            {(Object.keys(PERIOD_LABELS) as PeriodType[]).map((type) => (
              <button
                key={type}
                className={`${styles.periodTypeBtn} ${periodType === type ? styles.periodTypeBtnActive : ''}`}
                onClick={() => setPeriodType(type)}
              >
                {PERIOD_LABELS[type]}
              </button>
            ))}
          </div>
          <Select
            options={getPeriodOptions()}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            size="sm"
          />
        </div>
        <Button leftIcon={<Download size={16} />} variant="secondary" size="sm">
          Exportar
        </Button>
      </div>

      {/* 1. Movements List (First) */}
      <Card>
        <CardHeader
          title="Libro de Movimientos"
          subtitle={`${formatPeriodLabel()} • ${accountingEntries.length} registros`}
        />
        <CardContent>
          {accountingEntries.length === 0 ? (
            <EmptyState
              icon={<Calculator />}
              title="Sin movimientos"
              description="No hay movimientos registrados para el período seleccionado."
            />
          ) : (
            <div className={styles.movementsList}>
              <div className={styles.movementsHeader}>
                <span className={styles.colDate}>Fecha</span>
                <span className={styles.colDescription}>Descripción</span>
                <span className={styles.colCategory}>Categoría</span>
                <span className={styles.colDebit}>Débito</span>
                <span className={styles.colCredit}>Crédito</span>
                <span className={styles.colBalance}>Saldo</span>
              </div>
              {accountingEntries.map((entry) => {
                // Determinar la ruta según el tipo de entry
                const handleClick = () => {
                  if (entry.isFromDB && entry.dbEntryId) {
                    // Entry de BD (comisión registrada) - ir a detalle de asiento contable
                    router.push(`/finances/accounting/${entry.dbEntryId}`)
                  } else if (entry.obligationId) {
                    // Comisión pendiente - ir a la obligación
                    router.push(`/obligations/${entry.obligationId}`)
                  }
                }
                
                return (
                <div 
                  key={entry.id} 
                  className={`${styles.movementRow} ${styles.movementRowClickable}`}
                  onClick={handleClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
                >
                  <span className={styles.colDate}>{formatDate(entry.date)}</span>
                  <span className={styles.colDescription}>{entry.description}</span>
                  <span className={styles.colCategory}>
                    <Badge variant="default" size="sm">{getCategoryLabel(entry.category)}</Badge>
                  </span>
                  <span className={styles.colDebit}>
                    {entry.type === 'expense' ? (
                      <span className={styles.debitAmount}>{formatCurrency(entry.amount)}</span>
                    ) : (
                      <span className={styles.emptyCell}>-</span>
                    )}
                  </span>
                  <span className={styles.colCredit}>
                    {entry.type === 'income' ? (
                      <span className={styles.creditAmount}>{formatCurrency(entry.amount)}</span>
                    ) : (
                      <span className={styles.emptyCell}>-</span>
                    )}
                  </span>
                  <span className={styles.colBalance}>
                    <span className={entry.balance >= 0 ? styles.positiveBalance : styles.negativeBalance}>
                      {formatCurrency(entry.balance)}
                    </span>
                  </span>
                </div>
              )})}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Result Summary (Totals for selected period) */}
      <div className={styles.resultSummary}>
        <div className={styles.resultCard}>
          <div className={styles.resultIcon + ' ' + styles.incomeIcon}>
            <TrendingUp size={20} />
          </div>
          <div className={styles.resultInfo}>
            <span className={styles.resultLabel}>Total Ingresos</span>
            <span className={styles.resultValue + ' ' + styles.incomeValue}>
              {formatCurrency(totalIncome)}
            </span>
          </div>
        </div>
        <div className={styles.resultDivider}>-</div>
        <div className={styles.resultCard}>
          <div className={styles.resultIcon + ' ' + styles.expenseIcon}>
            <TrendingDown size={20} />
          </div>
          <div className={styles.resultInfo}>
            <span className={styles.resultLabel}>Total Egresos</span>
            <span className={styles.resultValue + ' ' + styles.expenseValue}>
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>
        <div className={styles.resultDivider}>=</div>
        <div className={styles.resultCard + ' ' + styles.resultCardMain}>
          <div className={styles.resultIcon + ' ' + (netResult >= 0 ? styles.incomeIcon : styles.expenseIcon)}>
            <DollarSign size={20} />
          </div>
          <div className={styles.resultInfo}>
            <span className={styles.resultLabel}>Resultado {formatPeriodLabel()}</span>
            <span className={styles.resultValue + ' ' + (netResult >= 0 ? styles.incomeValue : styles.expenseValue)}>
              {formatCurrency(netResult)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Charts Section (Last) */}
      <div className={styles.chartsGrid}>
        {/* Income vs Expense Bar Chart */}
        <Card className={styles.chartCard}>
          <CardHeader
            title="Ingresos vs Egresos"
            subtitle={periodType === 'monthly' ? 'Por día del mes' : 'Por mes'}
          />
          <CardContent>
            <div className={styles.barChartContainer}>
              {chartData.length > 0 ? (
                <div className={styles.customBarChart}>
                  {chartData.map((item, index) => {
                    const maxVal = Math.max(...chartData.map(d => Math.max(d.income, d.expense))) || 1
                    const incomeHeight = (item.income / maxVal) * 100
                    const expenseHeight = (item.expense / maxVal) * 100
                    const showLabel = periodType === 'monthly' 
                      ? index % 5 === 0 || index === chartData.length - 1
                      : true
                    return (
                      <div key={index} className={styles.barGroup}>
                        <div className={styles.barsWrapper}>
                          <div 
                            className={styles.barIncome} 
                            style={{ height: `${incomeHeight}%` }}
                            title={`Ingresos: ${formatCurrency(item.income)}`}
                          />
                          <div 
                            className={styles.barExpense} 
                            style={{ height: `${expenseHeight}%` }}
                            title={`Egresos: ${formatCurrency(item.expense)}`}
                          />
                        </div>
                        {showLabel && <span className={styles.barLabel}>{item.label}</span>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className={styles.noData}>Sin datos para el período</div>
              )}
            </div>
            <div className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDotIncome} /> Ingresos
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDotExpense} /> Egresos
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Category Donut Chart - Premium Style */}
        <Card className={styles.chartCard}>
          <CardHeader
            title="Distribución por Categoría"
            subtitle={`${accountingEntries.length} movimientos`}
          />
          <CardContent>
            {categoryData.length > 0 ? (
              <div className={styles.donutChartWrapper}>
                <div className={styles.donutChart}>
                  <svg viewBox="0 0 200 200" className={styles.donutSvg}>
                    <defs>
                      {categoryData.map((item, index) => (
                        <filter key={`glow-${index}`} id={`glow-${index}`} x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      ))}
                    </defs>
                    {(() => {
                      const total = categoryData.reduce((sum, item) => sum + item.value, 0)
                      let currentAngle = -90
                      const gap = 4 // Gap between segments in degrees
                      
                      return categoryData.map((item, index) => {
                        const percentage = total > 0 ? (item.value / total) * 100 : 0
                        const angle = (percentage / 100) * 360 - gap
                        if (angle <= 0) return null
                        
                        const startAngle = currentAngle + gap / 2
                        const endAngle = startAngle + angle
                        currentAngle = endAngle + gap / 2
                        
                        const startRad = (startAngle * Math.PI) / 180
                        const endRad = (endAngle * Math.PI) / 180
                        
                        const outerRadius = 85
                        const innerRadius = 55
                        
                        const x1Outer = 100 + outerRadius * Math.cos(startRad)
                        const y1Outer = 100 + outerRadius * Math.sin(startRad)
                        const x2Outer = 100 + outerRadius * Math.cos(endRad)
                        const y2Outer = 100 + outerRadius * Math.sin(endRad)
                        const x1Inner = 100 + innerRadius * Math.cos(endRad)
                        const y1Inner = 100 + innerRadius * Math.sin(endRad)
                        const x2Inner = 100 + innerRadius * Math.cos(startRad)
                        const y2Inner = 100 + innerRadius * Math.sin(startRad)
                        
                        const largeArc = angle > 180 ? 1 : 0
                        
                        const d = `
                          M ${x1Outer} ${y1Outer}
                          A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}
                          L ${x1Inner} ${y1Inner}
                          A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}
                          Z
                        `
                        
                        return (
                          <path
                            key={index}
                            d={d}
                            fill={item.color}
                            filter={`url(#glow-${index})`}
                            className={styles.donutSegment}
                            style={{ 
                              opacity: 0.9,
                            }}
                          />
                        )
                      })
                    })()}
                  </svg>
                  <div className={styles.donutCenter}>
                    <span className={styles.donutTotal}>{formatCurrency(totalIncome + totalExpenses)}</span>
                    <span className={styles.donutLabel}>Total</span>
                  </div>
                </div>
                <div className={styles.donutLegend}>
                  {categoryData.map((item, index) => (
                    <div key={index} className={styles.donutLegendItem}>
                      <span className={styles.donutLegendDot} style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                      <span className={styles.donutLegendLabel}>{item.label}</span>
                      <span className={styles.donutLegendValue}>{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.noData}>Sin datos para el período</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
