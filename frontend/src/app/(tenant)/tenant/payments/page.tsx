'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, 
  CreditCard,
  Download,
  Loader2,
  Calendar,
  Receipt
} from 'lucide-react'

interface Payment {
  id: number
  obligationId: number
  amount: number
  paymentDate: string
  method: string
  reference: string | null
  obligation: {
    description: string
    type: string
  }
}

export default function TenantPaymentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/tenant/payments`,
          { credentials: 'include' }
        )

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/tenant/login')
            return
          }
          throw new Error('Error al cargar pagos')
        }

        const data = await response.json()
        setPayments(data.payments || [])
      } catch (err) {
        // Mock data for development
        setPayments([
          {
            id: 1,
            obligationId: 1,
            amount: 450000,
            paymentDate: '2026-01-10T14:30:00Z',
            method: 'mercadopago',
            reference: 'MP-123456789',
            obligation: {
              description: 'Alquiler Enero 2026',
              type: 'rent'
            }
          },
          {
            id: 2,
            obligationId: 5,
            amount: 32000,
            paymentDate: '2026-01-05T10:15:00Z',
            method: 'transfer',
            reference: null,
            obligation: {
              description: 'Expensas Diciembre 2025',
              type: 'expenses'
            }
          },
          {
            id: 3,
            obligationId: 8,
            amount: 450000,
            paymentDate: '2025-12-10T16:45:00Z',
            method: 'mercadopago',
            reference: 'MP-987654321',
            obligation: {
              description: 'Alquiler Diciembre 2025',
              type: 'rent'
            }
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [router])

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
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'mercadopago': return 'MercadoPago'
      case 'transfer': return 'Transferencia'
      case 'cash': return 'Efectivo'
      case 'card': return 'Tarjeta'
      default: return method
    }
  }

  const handleDownloadReceipt = async (paymentId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tenant/payments/${paymentId}/receipt`,
        { credentials: 'include' }
      )

      if (!response.ok) throw new Error('Error al descargar')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `comprobante-${paymentId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert('Error al descargar el comprobante')
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
      <div>
        <h1 className="tp-page-title">Mis Pagos</h1>
        <p style={{ color: 'var(--tp-text-secondary)', marginTop: '4px' }}>Historial de pagos realizados</p>
      </div>

      {/* Payments List */}
      <div className="tp-card">
        {payments.length === 0 ? (
          <div className="tp-empty">
            <Receipt size={48} style={{ color: 'var(--tp-text-tertiary)', margin: '0 auto 16px' }} />
            <p>No hay pagos registrados</p>
          </div>
        ) : (
          <div>
            {payments.map(payment => (
              <div key={payment.id} className="tp-list-item">
                <div className="tp-list-item-left">
                  <div className="tp-stat-icon green">
                    <CheckCircle size={20} />
                  </div>
                  <div className="tp-list-item-content">
                    <h4>{payment.obligation.description}</h4>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} />
                        {formatDate(payment.paymentDate)} · {formatTime(payment.paymentDate)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CreditCard size={14} />
                        {getMethodLabel(payment.method)}
                      </span>
                    </p>
                    {payment.reference && (
                      <p style={{ fontSize: '11px', color: 'var(--tp-text-tertiary)', marginTop: '4px' }}>
                        Ref: {payment.reference}
                      </p>
                    )}
                  </div>
                </div>

                <div className="tp-list-item-right">
                  <p className="tp-list-item-amount" style={{ fontSize: '17px' }}>
                    {formatCurrency(payment.amount)}
                  </p>
                  <button
                    onClick={() => handleDownloadReceipt(payment.id)}
                    className="tp-link"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}
                  >
                    <Download size={14} />
                    Comprobante
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
