'use client'

import { useState, useEffect } from 'react'
import { Link2, Check, Clock, AlertCircle, RefreshCw, UserCheck } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { apiClient } from '@/services/api'
import { TenantInviteModal } from './TenantInviteModal'

interface TenantPortalStatusProps {
  tenantId: number
  tenantName: string
}

interface InviteStatus {
  success: boolean
  status: 'none' | 'pending' | 'expired' | 'used' | 'active'
  invite?: {
    expiresAt: string
    createdAt: string
  }
  user?: {
    email: string
    name: string
    lastLoginAt: string | null
  }
}

export function TenantPortalStatus({
  tenantId,
  tenantName
}: TenantPortalStatusProps) {
  const [status, setStatus] = useState<InviteStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get<InviteStatus>(`/api/tenants/${tenantId}/invite/status`)
      setStatus(response)
    } catch (err: any) {
      // Si el endpoint no existe o hay error, mostrar estado inicial
      setStatus({ success: true, status: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [tenantId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-white/5 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-white/10 rounded w-2/3"></div>
      </div>
    )
  }

  return (
    <>
      <div className="p-4 rounded-xl bg-white/5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-white/80">Portal del Inquilino</h4>
          {status?.status === 'active' ? (
            <Badge variant="success" className="flex items-center gap-1">
              <UserCheck size={12} />
              Activo
            </Badge>
          ) : status?.status === 'pending' ? (
            <Badge variant="warning" className="flex items-center gap-1">
              <Clock size={12} />
              Link activo
            </Badge>
          ) : status?.status === 'expired' ? (
            <Badge variant="error" className="flex items-center gap-1">
              <AlertCircle size={12} />
              Expirado
            </Badge>
          ) : (
            <Badge variant="default" className="flex items-center gap-1">
              Sin invitación
            </Badge>
          )}
        </div>

        {status?.status === 'active' && status.user && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Email:</span>
              <span className="text-white">{status.user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Último acceso:</span>
              <span className="text-white">{formatDateTime(status.user.lastLoginAt)}</span>
            </div>
          </div>
        )}

        {status?.status === 'pending' && status.invite && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Expira:</span>
              <span className="text-yellow-400">{formatDate(status.invite.expiresAt)}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              leftIcon={<RefreshCw size={14} />}
              onClick={() => setShowInviteModal(true)}
              className="mt-3"
            >
              Regenerar Link
            </Button>
          </div>
        )}

        {status?.status === 'expired' && (
          <div className="space-y-2">
            <p className="text-sm text-white/60">
              El link de invitación ha expirado.
            </p>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              leftIcon={<Link2 size={14} />}
              onClick={() => setShowInviteModal(true)}
            >
              Generar Nuevo Link
            </Button>
          </div>
        )}

        {(status?.status === 'none' || status?.status === 'used') && (
          <div className="space-y-2">
            <p className="text-sm text-white/60">
              Invita al inquilino para que pueda ver su estado de cuenta y pagar online.
            </p>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              leftIcon={<Link2 size={14} />}
              onClick={() => setShowInviteModal(true)}
            >
              Generar Link de Invitación
            </Button>
          </div>
        )}
      </div>

      <TenantInviteModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false)
          fetchStatus()
        }}
        tenantId={tenantId}
        tenantName={tenantName}
      />
    </>
  )
}
