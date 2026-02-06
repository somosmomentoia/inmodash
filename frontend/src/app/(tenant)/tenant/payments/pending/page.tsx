'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Clock, Home, FileText, Loader2, AlertCircle, Bell } from 'lucide-react'

function PendingContent() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('payment_id')

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
      {/* Pending Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', 
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
          <Clock size={48} style={{ color: 'white' }} />
        </div>
        <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Pago en Proceso
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>
          Tu pago está siendo verificado
        </p>
      </div>

      {/* Details Card */}
      <div className="tp-card" style={{ borderRadius: '0', borderTop: 'none' }}>
        {/* Info Message */}
        <div style={{ 
          padding: '1.5rem', 
          background: 'rgba(234, 179, 8, 0.1)', 
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <Loader2 size={32} className="animate-spin" style={{ color: '#eab308', margin: '0 auto 0.5rem' }} />
          <p style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
            Procesando tu pago...
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Esto puede tomar algunos minutos. Te notificaremos cuando se confirme.
          </p>
        </div>

        {/* Warning */}
        <div style={{ 
          padding: '1rem', 
          background: 'rgba(234, 179, 8, 0.1)', 
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <AlertCircle size={20} style={{ color: '#eab308', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ color: '#eab308', fontSize: '0.875rem' }}>
              No realices otro pago hasta que este se confirme o rechace.
            </p>
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
          <Bell size={16} style={{ color: '#eab308' }} />
          <span style={{ color: '#eab308', fontSize: '0.75rem', fontWeight: '500' }}>Recibirás una notificación</span>
        </div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
          Te avisaremos cuando el pago sea confirmado o rechazado.
        </p>
      </div>
    </div>
  )
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
      </div>
    }>
      <PendingContent />
    </Suspense>
  )
}
