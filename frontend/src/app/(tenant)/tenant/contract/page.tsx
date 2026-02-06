'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Home,
  Calendar,
  DollarSign,
  FileText,
  MapPin,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface Contract {
  id: number
  startDate: string
  endDate: string
  initialAmount: number
  apartment: {
    nomenclature: string
    fullAddress: string | null
    city: string | null
    province: string | null
    propertyType: string
  }
  nextObligation?: {
    description: string
    dueDate: string
    amount: number
  }
}

export default function TenantContractPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [contract, setContract] = useState<Contract | null>(null)

  useEffect(() => {
    const fetchContract = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/tenant/contracts`,
          { credentials: 'include' }
        )

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/tenant/login')
            return
          }
          throw new Error('Error al cargar contrato')
        }

        const data = await response.json()
        // Get first active contract
        if (data.contracts?.length > 0) {
          setContract(data.contracts[0])
        }
      } catch (err) {
        // Mock data for development
        setContract({
          id: 1,
          startDate: '2024-03-15',
          endDate: '2027-03-15',
          initialAmount: 450000,
          apartment: {
            nomenclature: 'Depto 5B',
            fullAddress: 'Av. Corrientes 1234',
            city: 'CABA',
            province: 'Buenos Aires',
            propertyType: 'departamento'
          },
          nextObligation: {
            description: 'Alquiler Febrero 2026',
            dueDate: '2026-02-10',
            amount: 450000
          }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchContract()
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

  const getContractStatus = () => {
    if (!contract) return null
    const now = new Date()
    const end = new Date(contract.endDate)
    const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysRemaining < 0) {
      return { label: 'Vencido', color: 'bg-red-500/20 text-red-400' }
    } else if (daysRemaining < 90) {
      return { label: 'Próximo a vencer', color: 'bg-yellow-500/20 text-yellow-400' }
    } else {
      return { label: 'Vigente', color: 'bg-green-500/20 text-green-400' }
    }
  }

  const getDaysRemaining = () => {
    if (!contract) return 0
    const now = new Date()
    const end = new Date(contract.endDate)
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getStatusBadge = () => {
    if (!contract) return 'default'
    const now = new Date()
    const end = new Date(contract.endDate)
    const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysRemaining < 0) return 'error'
    if (daysRemaining < 90) return 'warning'
    return 'success'
  }

  if (loading) {
    return (
      <div className="tp-loading">
        <div className="tp-spinner" />
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="tp-empty">
        <FileText size={48} style={{ color: 'var(--tp-text-tertiary)', margin: '0 auto 16px' }} />
        <p>No se encontró información del contrato</p>
      </div>
    )
  }

  const status = getContractStatus()
  const daysRemaining = getDaysRemaining()

  return (
    <div className="tp-space-y-6">
      {/* Header */}
      <div>
        <h1 className="tp-page-title">Mi Contrato</h1>
        <p style={{ color: 'var(--tp-text-secondary)', marginTop: '4px' }}>Información de tu contrato de alquiler</p>
      </div>

      {/* Contract Status Card */}
      <div className="tp-card tp-card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <span className={`tp-badge ${getStatusBadge()}`}>
              {status?.label}
            </span>
            <h2 style={{ fontSize: '19px', fontWeight: 600, color: 'var(--tp-text-primary)', marginTop: '12px' }}>
              Contrato #{contract.id}
            </h2>
          </div>
          {daysRemaining > 0 && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '13px', color: 'var(--tp-text-tertiary)' }}>Días restantes</p>
              <p style={{ fontSize: '28px', fontWeight: 600, color: 'var(--tp-text-primary)' }}>{daysRemaining}</p>
            </div>
          )}
        </div>
      </div>

      {/* Property Info */}
      <div className="tp-card">
        <div className="tp-card-header">
          <h3 className="tp-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Home size={20} style={{ color: 'var(--tp-accent)' }} />
            Propiedad
          </h3>
        </div>
        <div className="tp-card-body tp-space-y-4">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <MapPin size={18} style={{ color: 'var(--tp-text-tertiary)', marginTop: '2px' }} />
            <div>
              <p style={{ fontWeight: 500, color: 'var(--tp-text-primary)' }}>{contract.apartment.nomenclature}</p>
              <p style={{ color: 'var(--tp-text-secondary)' }}>
                {contract.apartment.fullAddress}
                {contract.apartment.city && `, ${contract.apartment.city}`}
                {contract.apartment.province && `, ${contract.apartment.province}`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={18} style={{ color: 'var(--tp-text-tertiary)' }} />
            <p style={{ color: 'var(--tp-text-secondary)', textTransform: 'capitalize' }}>{contract.apartment.propertyType}</p>
          </div>
        </div>
      </div>

      {/* Contract Details */}
      <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="tp-stat-card">
          <div className="tp-stat-header">
            <div className="tp-stat-icon blue">
              <Calendar size={20} />
            </div>
            <span className="tp-stat-label">Vigencia</span>
          </div>
          <div className="tp-space-y-4" style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--tp-text-tertiary)' }}>Inicio</span>
              <span style={{ color: 'var(--tp-text-primary)' }}>{formatDate(contract.startDate)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--tp-text-tertiary)' }}>Fin</span>
              <span style={{ color: 'var(--tp-text-primary)' }}>{formatDate(contract.endDate)}</span>
            </div>
          </div>
        </div>

        <div className="tp-stat-card">
          <div className="tp-stat-header">
            <div className="tp-stat-icon green">
              <DollarSign size={20} />
            </div>
            <span className="tp-stat-label">Monto Actual</span>
          </div>
          <p className="tp-stat-value">
            {formatCurrency(contract.initialAmount)}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--tp-text-tertiary)' }}>por mes</p>
        </div>
      </div>

      {/* Next Obligation */}
      {contract.nextObligation && (
        <div className="tp-alert warning" style={{ padding: '16px' }}>
          <div className="tp-stat-icon yellow" style={{ flexShrink: 0 }}>
            <Clock size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontWeight: 500, color: 'var(--tp-text-primary)' }}>Próximo Vencimiento</h4>
            <p style={{ fontWeight: 600, color: 'var(--tp-warning)', marginTop: '4px' }}>
              {contract.nextObligation.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ color: 'var(--tp-text-secondary)' }}>
                Vence: {formatDate(contract.nextObligation.dueDate)}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--tp-text-primary)' }}>
                {formatCurrency(contract.nextObligation.amount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
