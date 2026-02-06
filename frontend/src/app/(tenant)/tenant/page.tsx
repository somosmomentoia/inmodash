'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Loader2
} from 'lucide-react'

interface Obligation {
  id: number
  type: string
  category: string | null
  description: string
  period: string
  dueDate: string
  amount: number
  paidAmount: number
  status: 'pending' | 'partial' | 'paid' | 'overdue'
}

interface AccountSummary {
  success: boolean
  period: string
  obligations: Obligation[]
  summary: {
    totalObligations: number
    totalPaid: number
    balance: number
    accumulatedBalance: number
  }
}

export default function TenantAccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AccountSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const fetchAccountSummary = async (period: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tenant/account/summary?period=${period}`,
        { credentials: 'include' }
      )

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/tenant/login')
          return
        }
        throw new Error('Error al cargar datos')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Error fetching account summary:', err)
      setError('Error al cargar el estado de cuenta. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccountSummary(currentPeriod)
  }, [currentPeriod])

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const [year, month] = currentPeriod.split('-').map(Number)
    let newYear = year
    let newMonth = month

    if (direction === 'prev') {
      newMonth--
      if (newMonth < 1) {
        newMonth = 12
        newYear--
      }
    } else {
      newMonth++
      if (newMonth > 12) {
        newMonth = 1
        newYear++
      }
    }

    setCurrentPeriod(`${newYear}-${String(newMonth).padStart(2, '0')}`)
  }

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-')
    const date = new Date(Number(year), Number(month) - 1)
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={18} className="text-green-400" />
      case 'pending':
        return <Clock size={18} className="text-yellow-400" />
      case 'overdue':
        return <AlertCircle size={18} className="text-red-400" />
      default:
        return <Clock size={18} className="text-white/40" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagado'
      case 'pending':
        return 'Pendiente'
      case 'overdue':
        return 'Vencido'
      case 'partial':
        return 'Parcial'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'overdue':
        return 'error'
      default:
        return 'default'
    }
  }

  const pendingObligations = data?.obligations.filter(o => o.status !== 'paid') || []
  const overdueObligations = data?.obligations.filter(o => o.status === 'overdue') || []
  const paidObligations = data?.obligations.filter(o => o.status === 'paid') || []
  
  // Calcular situación del cliente
  const getClientStatus = () => {
    const accumulatedBalance = data?.summary.accumulatedBalance || 0
    const overdueCount = overdueObligations.length
    const pendingCount = pendingObligations.length
    
    if (accumulatedBalance === 0 && pendingCount === 0) {
      return {
        type: 'excellent',
        icon: <CheckCircle size={24} />,
        title: '¡Estás al día!',
        message: 'No tienes obligaciones pendientes. ¡Excelente!',
        color: '#22c55e',
        bgColor: 'rgba(34, 197, 94, 0.1)'
      }
    }
    
    if (overdueCount > 0) {
      return {
        type: 'overdue',
        icon: <AlertCircle size={24} />,
        title: 'Tienes obligaciones vencidas',
        message: `Tienes ${overdueCount} obligación${overdueCount > 1 ? 'es' : ''} vencida${overdueCount > 1 ? 's' : ''} por un total de ${formatCurrency(overdueObligations.reduce((sum, o) => sum + (o.amount - o.paidAmount), 0))}`,
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.1)'
      }
    }
    
    if (pendingCount > 0) {
      return {
        type: 'pending',
        icon: <Clock size={24} />,
        title: 'Tienes pagos pendientes',
        message: `Tienes ${pendingCount} obligación${pendingCount > 1 ? 'es' : ''} pendiente${pendingCount > 1 ? 's' : ''} por ${formatCurrency(pendingObligations.reduce((sum, o) => sum + (o.amount - o.paidAmount), 0))}`,
        color: '#eab308',
        bgColor: 'rgba(234, 179, 8, 0.1)'
      }
    }
    
    return {
      type: 'ok',
      icon: <CheckCircle size={24} />,
      title: 'Sin novedades',
      message: 'No hay obligaciones registradas para este período.',
      color: 'var(--text-secondary)',
      bgColor: 'var(--bg-secondary)'
    }
  }
  
  const clientStatus = data ? getClientStatus() : null

  if (loading) {
    return (
      <div className="tp-loading">
        <div className="tp-spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="tp-space-y-6">
        <div className="tp-page-header">
          <h1 className="tp-page-title">Estado de Cuenta</h1>
        </div>
        <div className="tp-card">
          <div className="tp-empty">
            <AlertCircle size={48} className="tp-text-error" />
            <p>{error}</p>
            <button 
              onClick={() => fetchAccountSummary(currentPeriod)} 
              className="tp-btn tp-btn-primary"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="tp-space-y-6">
      {/* Period Navigator */}
      <div className="tp-page-header">
        <h1 className="tp-page-title">Estado de Cuenta</h1>
        <div className="tp-period-nav">
          <button onClick={() => navigatePeriod('prev')} className="tp-period-btn">
            <ChevronLeft size={20} />
          </button>
          <span className="tp-period-display">
            {formatPeriod(currentPeriod)}
          </span>
          <button onClick={() => navigatePeriod('next')} className="tp-period-btn">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="tp-stats-grid">
        <div className="tp-stat-card">
          <div className="tp-stat-header">
            <div className="tp-stat-icon blue">
              <TrendingUp size={20} />
            </div>
            <span className="tp-stat-label">Total Obligaciones</span>
          </div>
          <p className="tp-stat-value">
            {formatCurrency(data?.summary.totalObligations || 0)}
          </p>
        </div>

        <div className="tp-stat-card">
          <div className="tp-stat-header">
            <div className="tp-stat-icon green">
              <CheckCircle size={20} />
            </div>
            <span className="tp-stat-label">Total Pagado</span>
          </div>
          <p className="tp-stat-value">
            {formatCurrency(data?.summary.totalPaid || 0)}
          </p>
        </div>

        <div className="tp-stat-card">
          <div className="tp-stat-header">
            <div className="tp-stat-icon yellow">
              <Clock size={20} />
            </div>
            <span className="tp-stat-label">Saldo del Mes</span>
          </div>
          <p className="tp-stat-value">
            {formatCurrency(data?.summary.balance || 0)}
          </p>
        </div>

        <div className="tp-stat-card">
          <div className="tp-stat-header">
            <div className="tp-stat-icon red">
              <TrendingDown size={20} />
            </div>
            <span className="tp-stat-label">Saldo Acumulado</span>
          </div>
          <p className="tp-stat-value">
            {formatCurrency(data?.summary.accumulatedBalance || 0)}
          </p>
        </div>
      </div>

      {/* Client Status Banner */}
      {clientStatus && (
        <div 
          className="tp-status-banner"
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem 1.25rem',
            background: clientStatus.bgColor,
            borderRadius: '0.75rem',
            borderLeft: `4px solid ${clientStatus.color}`
          }}
        >
          <div style={{ color: clientStatus.color, flexShrink: 0 }}>
            {clientStatus.icon}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              color: clientStatus.color, 
              fontWeight: '600', 
              fontSize: '0.9375rem',
              marginBottom: '0.125rem'
            }}>
              {clientStatus.title}
            </h3>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '0.875rem',
              margin: 0
            }}>
              {clientStatus.message}
            </p>
          </div>
          {(clientStatus.type === 'overdue' || clientStatus.type === 'pending') && (
            <Link 
              href="/tenant/obligations" 
              className="tp-btn tp-btn-sm"
              style={{
                background: clientStatus.color,
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.8125rem',
                fontWeight: '500',
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              Pagar ahora
            </Link>
          )}
        </div>
      )}

      {/* Obligations List */}
      <div className="tp-card">
        <div className="tp-card-header">
          <h2 className="tp-card-title">Obligaciones del Mes</h2>
        </div>

        {data?.obligations.length === 0 ? (
          <div className="tp-empty">
            <p>No hay obligaciones para este período</p>
          </div>
        ) : (
          <div>
            {data?.obligations.map(obligation => (
              <div key={obligation.id} className="tp-list-item">
                <div className="tp-list-item-left">
                  {getStatusIcon(obligation.status)}
                  <div className="tp-list-item-content">
                    <h4>{obligation.description}</h4>
                    <p>Vence: {formatDate(obligation.dueDate)}</p>
                  </div>
                </div>
                <div className="tp-list-item-right">
                  <p className="tp-list-item-amount">{formatCurrency(obligation.amount)}</p>
                  <span className={`tp-badge ${getStatusColor(obligation.status)}`}>
                    {getStatusLabel(obligation.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pay Button */}
      {pendingObligations.length > 0 && (
        <div className="tp-text-center">
          <Link href="/tenant/obligations" className="tp-btn tp-btn-primary tp-btn-lg">
            <CreditCard size={20} />
            Pagar Obligaciones Pendientes ({pendingObligations.length})
          </Link>
        </div>
      )}
    </div>
  )
}
