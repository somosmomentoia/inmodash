'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function TenantLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tenant/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Error al iniciar sesión')
        return
      }

      router.push('/tenant')
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tp-auth-page">
      <div className="tp-auth-card">
        <div className="tp-auth-logo">
          <div className="tp-auth-logo-icon">
            <Building2 size={24} />
          </div>
          <h1 className="tp-auth-title">Portal del Inquilino</h1>
          <p className="tp-auth-subtitle">Ingresa a tu cuenta para ver tu estado de cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="tp-space-y-4">
          {error && (
            <div className="tp-alert error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="tp-form-group">
            <label className="tp-label">Email</label>
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
          </div>

          <div className="tp-form-group">
            <label className="tp-label">Contraseña</label>
            <div className="tp-input-icon">
              <Lock size={18} className="icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
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

          <button type="submit" disabled={loading} className="tp-btn tp-btn-primary tp-w-full tp-mt-4">
            {loading ? (
              <>
                <div className="tp-spinner" style={{ width: '20px', height: '20px' }} />
                Ingresando...
              </>
            ) : (
              'Ingresar'
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
