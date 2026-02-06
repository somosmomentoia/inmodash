'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle,
  CreditCard,
  Filter,
  Loader2,
  ShoppingCart,
  X
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

export default function TenantObligationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    const fetchObligations = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/tenant/obligations`,
          { credentials: 'include' }
        )

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/tenant/login')
            return
          }
          throw new Error('Error al cargar obligaciones')
        }

        const data = await response.json()
        setObligations(data.obligations || [])
      } catch (err) {
        // Mock data for development
        setObligations([
          {
            id: 1,
            type: 'rent',
            category: null,
            description: 'Alquiler Enero 2026',
            period: '2026-01-01',
            dueDate: '2026-01-10',
            amount: 450000,
            paidAmount: 450000,
            status: 'paid'
          },
          {
            id: 2,
            type: 'expenses',
            category: 'expensas',
            description: 'Expensas Enero 2026',
            period: '2026-01-01',
            dueDate: '2026-01-15',
            amount: 35000,
            paidAmount: 0,
            status: 'pending'
          },
          {
            id: 3,
            type: 'service',
            category: 'luz',
            description: 'Luz Diciembre 2025',
            period: '2025-12-01',
            dueDate: '2026-01-05',
            amount: 12500,
            paidAmount: 0,
            status: 'overdue'
          },
          {
            id: 4,
            type: 'rent',
            category: null,
            description: 'Alquiler Febrero 2026',
            period: '2026-02-01',
            dueDate: '2026-02-10',
            amount: 450000,
            paidAmount: 0,
            status: 'pending'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchObligations()
  }, [router])

  const filteredObligations = useMemo(() => {
    if (statusFilter === 'all') return obligations
    if (statusFilter === 'unpaid') return obligations.filter(o => o.status !== 'paid')
    return obligations.filter(o => o.status === statusFilter)
  }, [obligations, statusFilter])

  const selectedObligations = useMemo(() => {
    return obligations.filter(o => selectedIds.has(o.id))
  }, [obligations, selectedIds])

  const totalSelected = useMemo(() => {
    return selectedObligations.reduce((sum, o) => sum + (o.amount - o.paidAmount), 0)
  }, [selectedObligations])

  const toggleSelection = (id: number) => {
    const obligation = obligations.find(o => o.id === id)
    if (!obligation || obligation.status === 'paid') return

    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAllUnpaid = () => {
    const unpaidIds = obligations
      .filter(o => o.status !== 'paid')
      .map(o => o.id)
    setSelectedIds(new Set(unpaidIds))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const handlePaySelected = async () => {
    if (selectedIds.size === 0) return

    setProcessingPayment(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tenant/obligations/pay`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            obligationIds: Array.from(selectedIds)
          })
        }
      )

      if (!response.ok) {
        throw new Error('Error al procesar pago')
      }

      const data = await response.json()
      
      // Redirect to MercadoPago checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (err) {
      alert('Error al procesar el pago. Intenta nuevamente.')
    } finally {
      setProcessingPayment(false)
    }
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
      month: 'short',
      year: 'numeric'
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
      case 'paid': return 'Pagado'
      case 'pending': return 'Pendiente'
      case 'overdue': return 'Vencido'
      case 'partial': return 'Parcial'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success'
      case 'pending': return 'warning'
      case 'overdue': return 'error'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <div className="tp-loading">
        <div className="tp-spinner" />
      </div>
    )
  }

  return (
    <div className="tp-space-y-6">
      {/* Header */}
      <div className="tp-page-header">
        <h1 className="tp-page-title">Mis Obligaciones</h1>
        
        {/* Filter */}
        <div className="tp-flex tp-items-center tp-gap-2">
          <Filter size={16} style={{ color: 'var(--tp-text-tertiary)' }} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="tp-select"
          >
            <option value="all">Todas</option>
            <option value="unpaid">Sin pagar</option>
            <option value="pending">Pendientes</option>
            <option value="overdue">Vencidas</option>
            <option value="paid">Pagadas</option>
          </select>
        </div>
      </div>

      {/* Selection Actions */}
      {obligations.some(o => o.status !== 'paid') && (
        <div className="tp-flex tp-items-center tp-gap-4">
          <button onClick={selectAllUnpaid} className="tp-link">
            Seleccionar todas las pendientes
          </button>
          {selectedIds.size > 0 && (
            <button onClick={clearSelection} className="tp-link-muted">
              Limpiar selección
            </button>
          )}
        </div>
      )}

      {/* Obligations List */}
      <div className="tp-card">
        {filteredObligations.length === 0 ? (
          <div className="tp-empty">
            <p>No hay obligaciones para mostrar</p>
          </div>
        ) : (
          <div>
            {filteredObligations.map(obligation => {
              const isSelected = selectedIds.has(obligation.id)
              const isPaid = obligation.status === 'paid'
              const amountDue = obligation.amount - obligation.paidAmount

              return (
                <div
                  key={obligation.id}
                  onClick={() => !isPaid && toggleSelection(obligation.id)}
                  className={`tp-list-item ${isPaid ? 'tp-list-item-disabled' : ''} ${isSelected ? 'tp-list-item-selected' : ''}`}
                  style={{ cursor: isPaid ? 'default' : 'pointer' }}
                >
                  {/* Checkbox */}
                  <div className={`tp-checkbox-box ${isPaid ? 'disabled' : ''} ${isSelected ? 'checked' : ''}`}>
                    {(isSelected || isPaid) && (
                      <CheckCircle size={14} />
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className={`tp-status-icon ${getStatusColor(obligation.status)}`}>
                    {getStatusIcon(obligation.status)}
                  </div>

                  {/* Info */}
                  <div className="tp-list-item-content" style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{obligation.description}</h4>
                    <p>Vence: {formatDate(obligation.dueDate)}</p>
                  </div>

                  {/* Amount & Status */}
                  <div className="tp-list-item-right">
                    <p className="tp-list-item-amount">{formatCurrency(amountDue)}</p>
                    <span className={`tp-badge ${getStatusColor(obligation.status)}`}>
                      {getStatusLabel(obligation.status)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Payment Cart (Fixed Bottom) */}
      {selectedIds.size > 0 && (
        <div className="tp-cart-bar">
          <div className="tp-cart-content">
            <div className="tp-cart-left">
              <div className="tp-cart-info">
                <ShoppingCart size={20} />
                <span>{selectedIds.size} seleccionadas</span>
              </div>
              <button onClick={clearSelection} className="tp-cart-clear">
                <X size={18} />
              </button>
            </div>

            <div className="tp-cart-right">
              <div className="tp-cart-total">
                <span className="tp-cart-total-label">Total a pagar</span>
                <span className="tp-cart-total-amount">{formatCurrency(totalSelected)}</span>
              </div>
              <button
                onClick={handlePaySelected}
                disabled={processingPayment}
                className="tp-btn tp-btn-primary"
              >
                {processingPayment ? (
                  <>
                    <div className="tp-spinner" style={{ width: '20px', height: '20px' }} />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Pagar con MercadoPago
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed cart */}
      {selectedIds.size > 0 && <div style={{ height: '96px' }} />}
    </div>
  )
}
