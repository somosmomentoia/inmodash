'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, Mail } from 'lucide-react'

interface InviteValidation {
  success: boolean
  valid: boolean
  invite?: {
    tenantName: string
    agencyName: string
  }
}

function ActivateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [validating, setValidating] = useState(true)
  const [inviteData, setInviteData] = useState<InviteValidation['invite'] | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidationError('Link de invitación inválido')
        setValidating(false)
        return
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/tenant/activate/validate?token=${token}`
        )
        const data: InviteValidation = await response.json()

        if (!response.ok || !data.valid) {
          setValidationError(data.success === false ? 'Link inválido o expirado' : 'Error al validar el link')
          return
        }

        setInviteData(data.invite || null)
      } catch (err) {
        setValidationError('Error de conexión')
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tenant/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, email, name, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Error al activar la cuenta')
        return
      }

      setSuccess(true)

      // Redirect to portal after 2 seconds
      setTimeout(() => {
        router.push('/tenant')
      }, 2000)
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (validating) {
    return (
      <div className="tp-auth-page">
        <div className="tp-text-center">
          <div className="tp-spinner tp-mb-4" style={{ margin: '0 auto' }} />
          <p style={{ color: '#94A3B8' }}>Validando invitación...</p>
        </div>
      </div>
    )
  }

  // Invalid token
  if (validationError) {
    return (
      <div className="tp-auth-page">
        <div className="tp-auth-card tp-text-center">
          <div className="tp-stat-icon red" style={{ width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px' }}>
            <AlertCircle size={32} />
          </div>
          <h1 className="tp-auth-title">Link Inválido</h1>
          <p style={{ color: '#94A3B8', marginBottom: '24px' }}>{validationError}</p>
          <p style={{ fontSize: '13px', color: '#64748B' }}>
            Contacta a tu inmobiliaria para solicitar un nuevo link de invitación.
          </p>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="tp-auth-page">
        <div className="tp-auth-card tp-text-center">
          <div className="tp-stat-icon green" style={{ width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px' }}>
            <CheckCircle size={32} />
          </div>
          <h1 className="tp-auth-title">¡Cuenta Activada!</h1>
          <p style={{ color: '#94A3B8', marginBottom: '16px' }}>
            Tu cuenta ha sido creada exitosamente. Redirigiendo al portal...
          </p>
          <div className="tp-spinner" style={{ margin: '0 auto' }} />
        </div>
      </div>
    )
  }

  // Activation form
  return (
    <div className="tp-auth-page">
      <div className="tp-auth-card">
        <div className="tp-auth-logo">
          <div className="tp-auth-logo-icon">
            <Building2 size={24} />
          </div>
          <h1 className="tp-auth-title">Activa tu Cuenta</h1>
          <p className="tp-auth-subtitle">
            Bienvenido al Portal del Inquilino de <strong style={{ color: '#F8FAFC' }}>{inviteData?.agencyName}</strong>
          </p>
        </div>

        {/* Info Card */}
        <div className="tp-alert success tp-mb-6">
          <strong>Inquilino:</strong> {inviteData?.tenantName}
        </div>

        <form onSubmit={handleSubmit} className="tp-space-y-4">
          {error && (
            <div className="tp-alert error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="tp-form-group">
            <label className="tp-label">Tu Email</label>
            <div className="tp-input-icon">
              <Mail size={18} className="icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="tp-input"
                style={{ paddingLeft: '48px' }}
              />
            </div>
            <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Usarás este email para ingresar al portal</p>
          </div>

          <div className="tp-form-group">
            <label className="tp-label">Tu Nombre</label>
            <div className="tp-input-icon">
              <User size={18} className="icon" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                required
                className="tp-input"
                style={{ paddingLeft: '48px' }}
              />
            </div>
          </div>

          <div className="tp-form-group">
            <label className="tp-label">Contraseña</label>
            <div className="tp-input-icon">
              <Lock size={18} className="icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="tp-input"
                style={{ paddingLeft: '48px', paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="tp-form-group">
            <label className="tp-label">Confirmar Contraseña</label>
            <div className="tp-input-icon">
              <Lock size={18} className="icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
                className="tp-input"
                style={{ paddingLeft: '48px' }}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="tp-btn tp-btn-primary tp-w-full tp-mt-4">
            {loading ? (
              <>
                <div className="tp-spinner" style={{ width: '20px', height: '20px' }} />
                Activando...
              </>
            ) : (
              'Activar Cuenta'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#64748B', marginTop: '24px' }}>
          Portal del Inquilino · Powered by InmoDash
        </p>
      </div>
    </div>
  )
}

export default function TenantActivatePage() {
  return (
    <Suspense fallback={
      <div className="tp-auth-page">
        <div className="tp-text-center">
          <div className="tp-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#94A3B8' }}>Cargando...</p>
        </div>
      </div>
    }>
      <ActivateContent />
    </Suspense>
  )
}
