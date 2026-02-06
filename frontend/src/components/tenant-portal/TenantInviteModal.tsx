'use client'

import { useState, useEffect } from 'react'
import { Copy, MessageCircle, Link2, Check, AlertCircle } from 'lucide-react'
import { Modal, ModalFooter, Button } from '@/components/ui'
import { apiClient } from '@/services/api'

interface TenantInviteModalProps {
  isOpen: boolean
  onClose: () => void
  tenantId: number
  tenantName: string
}

interface InviteResponse {
  success: boolean
  invite: {
    id: number
    tenantName: string
    expiresAt: string
    activationLink: string
    whatsappLink: string
  }
}

export function TenantInviteModal({
  isOpen,
  onClose,
  tenantId,
  tenantName
}: TenantInviteModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteData, setInviteData] = useState<InviteResponse['invite'] | null>(null)
  const [copied, setCopied] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  // Generar link automáticamente al abrir el modal (solo una vez)
  useEffect(() => {
    if (isOpen && !hasGenerated) {
      setHasGenerated(true)
      generateLink()
    }
  }, [isOpen, hasGenerated])

  // Reset cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setHasGenerated(false)
      setInviteData(null)
      setError(null)
      setCopied(false)
    }
  }, [isOpen])

  const generateLink = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.post<InviteResponse>(`/api/tenants/${tenantId}/invite`, {})
      setInviteData(response.invite)
    } catch (err: any) {
      setError(err.message || 'Error al generar el link de invitación')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateLink = () => {
    setHasGenerated(true)
    generateLink()
  }

  const handleCopyLink = async () => {
    if (!inviteData) return

    try {
      await navigator.clipboard.writeText(inviteData.activationLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  const handleShareWhatsApp = () => {
    if (!inviteData) return
    window.open(inviteData.whatsappLink, '_blank')
  }

  const handleClose = () => {
    onClose()
  }

  const formatExpiryDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Estado de carga inicial
  if (loading && !inviteData) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Generando Link..." size="md">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
          <p className="text-white/60 text-sm">Generando link de invitación...</p>
        </div>
      </Modal>
    )
  }

  // Error al generar
  if (error && !inviteData) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Error" size="md">
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cerrar
          </Button>
          <Button onClick={handleGenerateLink} leftIcon={<Link2 size={16} />}>
            Reintentar
          </Button>
        </ModalFooter>
      </Modal>
    )
  }

  // Link generado exitosamente
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Link de Invitación Generado" size="md">
      {inviteData && (
        <>
          <div className="space-y-4">
            <p className="text-white/60 text-sm">
              Comparte este link con el inquilino para que pueda acceder al portal:
            </p>

            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="text-sm text-blue-400 break-all">
                {inviteData.activationLink}
              </code>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-400 text-sm">
              <AlertCircle size={16} />
              Este link expira el {formatExpiryDate(inviteData.expiresAt)}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={handleCopyLink}
                leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
                fullWidth
              >
                {copied ? 'Copiado!' : 'Copiar Link'}
              </Button>
              <Button
                variant="primary"
                onClick={handleShareWhatsApp}
                leftIcon={<MessageCircle size={16} />}
                fullWidth
                className="bg-green-600 hover:bg-green-700"
              >
                WhatsApp
              </Button>
            </div>
          </div>

          <ModalFooter>
            <Button variant="secondary" onClick={handleClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  )
}
