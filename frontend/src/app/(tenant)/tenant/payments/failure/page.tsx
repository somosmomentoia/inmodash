'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { XCircle, RefreshCw, Home, Loader2, AlertTriangle, Phone } from 'lucide-react'

function FailureContent() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('payment_id')

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
      {/* Error Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
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
          <XCircle size={48} style={{ color: 'white' }} />
        </div>
        <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Pago No Completado
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>
          No pudimos procesar tu pago
        </p>
      </div>

      {/* Details Card */}
      <div className="tp-card" style={{ borderRadius: '0', borderTop: 'none' }}>
        {/* Error Message */}
        <div style={{ 
          padding: '1.5rem', 
          background: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <AlertTriangle size={24} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ color: 'var(--text-primary)', fontWeight: '500', marginBottom: '0.25rem' }}>
                El pago fue rechazado o cancelado
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Esto puede deberse a fondos insuficientes, tarjeta rechazada, o cancelación del proceso de pago.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Reference */}
        {paymentId && (
          <div style={{ 
            padding: '1rem', 
            background: 'var(--bg-secondary)', 
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Referencia</span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                {paymentId}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link
            href="/tenant/obligations"
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
            <RefreshCw size={20} />
            Intentar Nuevamente
          </Link>

          <Link
            href="/tenant"
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
            <Home size={20} />
            Volver al Inicio
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
          <Phone size={16} style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>¿Necesitas ayuda?</span>
        </div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
          Si el problema persiste, contacta a tu inmobiliaria.
        </p>
      </div>
    </div>
  )
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
      </div>
    }>
      <FailureContent />
    </Suspense>
  )
}
