'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Home, FileText, Loader2, Receipt, ArrowRight, Shield } from 'lucide-react'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(10)
  const hasRedirected = useRef(false)

  const paymentId = searchParams.get('payment_id')
  const groupId = searchParams.get('group_id')

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Separate effect for redirect to avoid setState during render
  useEffect(() => {
    if (countdown === 0 && !hasRedirected.current) {
      hasRedirected.current = true
      router.push('/tenant')
    }
  }, [countdown, router])

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
      {/* Success Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
        borderRadius: '1rem 1rem 0 0', 
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          background: 'rgba(255,255,255,0.2)', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 1rem'
        }}>
          <CheckCircle size={48} style={{ color: 'white' }} />
        </div>
        <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          ¡Pago Exitoso!
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>
          Tu pago ha sido procesado correctamente
        </p>
      </div>

      {/* Details Card */}
      <div className="tp-card" style={{ borderRadius: '0', borderTop: 'none' }}>
        {/* Success Message */}
        <div style={{ 
          padding: '1.5rem', 
          background: 'rgba(34, 197, 94, 0.1)', 
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <Receipt size={32} style={{ color: '#22c55e', margin: '0 auto 0.5rem' }} />
          <p style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
            Las obligaciones han sido marcadas como pagadas
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Puedes ver el detalle en tu historial de pagos
          </p>
        </div>

        {/* Payment Reference */}
        <div style={{ 
          padding: '1rem', 
          background: 'var(--bg-secondary)', 
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Referencia de Pago</span>
            <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
              {paymentId || 'N/A'}
            </span>
          </div>
          {groupId && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Grupo de Pago</span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {groupId.substring(0, 8)}...
              </span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Fecha</span>
            <span style={{ color: 'var(--text-primary)' }}>
              {new Date().toLocaleDateString('es-AR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link
            href="/tenant"
            className="tp-btn tp-btn-primary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              padding: '1rem',
              textDecoration: 'none'
            }}
          >
            <Home size={20} />
            Ir al Estado de Cuenta
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/tenant/payments"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              padding: '1rem',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            <FileText size={20} />
            Ver Historial de Pagos
          </Link>

          <Link
            href="/tenant/obligations"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              padding: '0.75rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.875rem'
            }}
          >
            Ver Obligaciones Pendientes
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        background: 'var(--bg-secondary)', 
        borderRadius: '0 0 1rem 1rem', 
        padding: '1rem',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Shield size={16} style={{ color: '#22c55e' }} />
          <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: '500' }}>Pago verificado</span>
        </div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
          Redirigiendo al estado de cuenta en {countdown} segundos...
        </p>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
