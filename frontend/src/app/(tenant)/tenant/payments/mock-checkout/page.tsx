'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, CheckCircle, XCircle, Clock, Loader2, Building2, Shield, Receipt, AlertCircle } from 'lucide-react'

interface ExternalReference {
  type: string
  paymentGroupId: string
  obligationIds: number[]
}

interface ObligationDetail {
  id: number
  description: string
  amount: number
  paidAmount: number
  type: string
  status: string
}

function MockCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [processing, setProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>('')
  const [externalRef, setExternalRef] = useState<ExternalReference | null>(null)
  const [obligations, setObligations] = useState<ObligationDetail[]>([])
  const [loadingObligations, setLoadingObligations] = useState(true)
  const [result, setResult] = useState<{ success: boolean; message: string; results?: any[] } | null>(null)

  const prefId = searchParams.get('pref')
  const refParam = searchParams.get('ref')

  useEffect(() => {
    if (refParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(refParam))
        setExternalRef(parsed)
      } catch (e) {
        console.error('Error parsing external reference:', e)
      }
    }
  }, [refParam])

  // Fetch obligation details
  useEffect(() => {
    const fetchObligations = async () => {
      if (!externalRef?.obligationIds?.length) {
        setLoadingObligations(false)
        return
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/tenant/obligations`,
          { credentials: 'include' }
        )

        if (response.ok) {
          const data = await response.json()
          const filtered = data.obligations?.filter((o: ObligationDetail) => 
            externalRef.obligationIds.includes(o.id)
          ) || []
          setObligations(filtered)
        }
      } catch (error) {
        console.error('Error fetching obligations:', error)
      } finally {
        setLoadingObligations(false)
      }
    }

    if (externalRef) {
      fetchObligations()
    }
  }, [externalRef])

  const totalAmount = obligations.reduce((sum, o) => sum + (o.amount - o.paidAmount), 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      rent: 'Alquiler',
      expenses: 'Expensas',
      service: 'Servicio',
      tax: 'Impuesto',
      maintenance: 'Mantenimiento',
      debt: 'Deuda/Ajuste'
    }
    return labels[type] || type
  }

  const simulatePayment = async (status: 'approved' | 'rejected' | 'pending') => {
    if (!externalRef) return

    setProcessing(true)
    setProcessingStatus(status === 'approved' ? 'Procesando pago...' : 
                        status === 'pending' ? 'Registrando pago pendiente...' : 
                        'Procesando rechazo...')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/mercadopago/tenant/mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentGroupId: externalRef.paymentGroupId,
          obligationIds: externalRef.obligationIds,
          status
        })
      })

      const data = await response.json()
      console.log('Mock payment result:', data)

      if (status === 'approved' && data.success) {
        setResult(data)
        setProcessingStatus('¡Pago registrado exitosamente!')
        
        // Wait a moment to show success, then redirect
        setTimeout(() => {
          const mockPaymentId = `MOCK_${Date.now()}`
          router.push(`/tenant/payments/success?payment_id=${mockPaymentId}&group_id=${externalRef.paymentGroupId}`)
        }, 1500)
      } else {
        // Redirect immediately for non-approved
        const mockPaymentId = `MOCK_${Date.now()}`
        switch (status) {
          case 'rejected':
            router.push(`/tenant/payments/failure?payment_id=${mockPaymentId}`)
            break
          case 'pending':
            router.push(`/tenant/payments/pending?payment_id=${mockPaymentId}`)
            break
        }
      }
    } catch (error) {
      console.error('Error simulating payment:', error)
      setProcessingStatus('Error al procesar el pago')
      setTimeout(() => {
        router.push('/tenant/payments/failure')
      }, 1500)
    }
  }

  if (!prefId || !externalRef) {
    return (
      <div className="tp-card" style={{ maxWidth: '400px', margin: '2rem auto', textAlign: 'center', padding: '3rem' }}>
        <XCircle size={64} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Datos de pago inválidos</h2>
        <p style={{ color: 'var(--text-secondary)' }}>No se encontró información de pago válida.</p>
        <button 
          onClick={() => router.push('/tenant/obligations')}
          className="tp-btn tp-btn-primary"
          style={{ marginTop: '1.5rem' }}
        >
          Volver a Obligaciones
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      {/* MercadoPago Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #009ee3 0%, #00b1ea 100%)', 
        borderRadius: '1rem 1rem 0 0', 
        padding: '1.5rem',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'white' }}>
          <CreditCard size={28} />
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>MercadoPago</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Simulador de Pago (Desarrollo)
        </p>
      </div>

      {/* Payment Details Card */}
      <div className="tp-card" style={{ borderRadius: '0', borderTop: 'none' }}>
        {/* Recipient */}
        <div style={{ textAlign: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Pagando a</p>
          <p style={{ color: 'var(--text-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <Building2 size={20} />
            InmoDash - Portal Inquilino
          </p>
        </div>

        {/* Obligations List */}
        <div style={{ padding: '1rem 0' }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            Obligaciones a pagar ({externalRef.obligationIds.length})
          </h3>
          
          {loadingObligations ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
            </div>
          ) : obligations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {obligations.map(obligation => (
                <div 
                  key={obligation.id}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '0.5rem'
                  }}
                >
                  <div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '500' }}>
                      {obligation.description}
                    </p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                      {getTypeLabel(obligation.type)}
                    </p>
                  </div>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                    {formatCurrency(obligation.amount - obligation.paidAmount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {externalRef.obligationIds.map(id => (
                <div 
                  key={id}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '0.5rem'
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Obligación #{id}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        {obligations.length > 0 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '1rem',
            background: 'var(--primary-color)',
            borderRadius: '0.5rem',
            marginBottom: '1rem'
          }}>
            <span style={{ color: 'white', fontWeight: '600' }}>Total a pagar</span>
            <span style={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>
              {formatCurrency(totalAmount)}
            </span>
          </div>
        )}

        {/* Reference Info */}
        <div style={{ 
          padding: '0.75rem', 
          background: 'var(--bg-secondary)', 
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>ID de Preferencia</span>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{prefId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Grupo de Pago</span>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              {externalRef.paymentGroupId.substring(0, 8)}...
            </span>
          </div>
        </div>

        {/* Processing State */}
        {processing && (
          <div style={{ 
            textAlign: 'center', 
            padding: '1.5rem',
            background: result?.success ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            marginBottom: '1rem'
          }}>
            {result?.success ? (
              <>
                <CheckCircle size={48} style={{ color: '#22c55e', margin: '0 auto 0.5rem' }} />
                <p style={{ color: '#22c55e', fontWeight: '600' }}>{processingStatus}</p>
                {result.results && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    {result.results.filter(r => r.status === 'paid').length} obligaciones pagadas
                  </p>
                )}
              </>
            ) : (
              <>
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-color)', margin: '0 auto 0.5rem' }} />
                <p style={{ color: 'var(--text-secondary)' }}>{processingStatus}</p>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {!processing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              Selecciona el resultado de la simulación:
            </p>

            <button
              onClick={() => simulatePayment('approved')}
              className="tp-btn"
              style={{ 
                width: '100%', 
                padding: '1rem',
                background: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <CheckCircle size={20} />
              Simular Pago Exitoso
            </button>

            <button
              onClick={() => simulatePayment('pending')}
              className="tp-btn"
              style={{ 
                width: '100%', 
                padding: '1rem',
                background: '#eab308',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <Clock size={20} />
              Simular Pago Pendiente
            </button>

            <button
              onClick={() => simulatePayment('rejected')}
              className="tp-btn"
              style={{ 
                width: '100%', 
                padding: '1rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <XCircle size={20} />
              Simular Pago Rechazado
            </button>

            <button
              onClick={() => router.push('/tenant/obligations')}
              className="tp-btn"
              style={{ 
                width: '100%', 
                padding: '0.75rem',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ 
        background: 'var(--bg-secondary)', 
        borderRadius: '0 0 1rem 1rem', 
        padding: '1rem',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Shield size={16} style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Conexión segura</span>
        </div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
          Este es un simulador para desarrollo. En producción, serás redirigido a MercadoPago.
        </p>
      </div>
    </div>
  )
}

export default function MockCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="text-blue-500 animate-spin" />
      </div>
    }>
      <MockCheckoutContent />
    </Suspense>
  )
}
