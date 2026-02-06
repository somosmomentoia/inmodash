'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  FileText,
  User,
  Home,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Building2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { usePayment } from '@/hooks/usePayments'
import { useContracts } from '@/hooks/useContracts'
import { useTenants } from '@/hooks/useTenants'
import { useApartments } from '@/hooks/useApartments'
import { useBuildings } from '@/hooks/useBuildings'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  paid: { label: 'Pagado', color: 'bg-green-500/20 text-green-300', icon: CheckCircle },
  pending: { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-300', icon: Clock },
  overdue: { label: 'Vencido', color: 'bg-red-500/20 text-red-300', icon: AlertCircle },
}

export default function PaymentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const paymentId = Number(params.id)
  
  const { payment, loading, error } = usePayment(paymentId)
  const { contracts } = useContracts()
  const { tenants } = useTenants()
  const { apartments } = useApartments()
  const { buildings } = useBuildings()

  const contract = payment ? contracts.find(c => c.id === payment.contractId) : null
  const tenant = contract ? tenants.find(t => t.id === contract.tenantId) : null
  const apartment = contract ? apartments.find(a => a.id === contract.apartmentId) : null
  const building = apartment?.buildingId ? buildings.find(b => b.id === Number(apartment.buildingId)) : null

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de eliminar este pago?')) {
      // TODO: Implement delete
      router.push('/payments')
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Cargando..." subtitle="">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-white/60">Cargando pago...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !payment) {
    return (
      <DashboardLayout title="Error" subtitle="">
        <div className="space-y-6">
          <Link href="/payments">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition">
              <ArrowLeft className="h-4 w-4" />
              Volver a Pagos
            </button>
          </Link>
          <div className="rounded-2xl bg-white/5 backdrop-blur-sm shadow-lg p-12 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {error || 'Pago no encontrado'}
            </h3>
            <p className="text-white/60 mb-6">
              No se pudo cargar la información del pago.
            </p>
            <button 
              onClick={() => router.push('/payments')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Volver al Listado
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const statusConfig = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending
  const StatusIcon = statusConfig.icon

  return (
    <DashboardLayout 
      title={`Pago #${payment.id}`} 
      subtitle={`${new Date(payment.month).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`}
    >
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/payments">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Detalle del Pago</h1>
            <p className="text-white/60 mt-1">
              Pago #{payment.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/payments/${payment.id}/edit`)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            <Edit className="h-4 w-4" />
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span className={`${statusConfig.color} px-4 py-2 rounded-lg text-base font-medium flex items-center gap-2`}>
          <StatusIcon className="h-5 w-5" />
          {statusConfig.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Details */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-sm shadow-lg p-6 hover:bg-white/10 transition-all duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="font-semibold text-white text-lg">Información del Pago</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-white/60">Período</p>
                <p className="text-lg font-semibold text-white mt-1">
                  {new Date(payment.month).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60">Monto Total</p>
                <p className="text-lg font-semibold text-white mt-1">
                  ${payment.amount.toLocaleString('es-AR')}
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 mt-6 pt-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-white/60">Comisión</p>
                  <p className="text-base font-medium text-white mt-1">
                    ${payment.commissionAmount.toLocaleString('es-AR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Monto Propietario</p>
                  <p className="text-base font-medium text-white mt-1">
                    ${payment.ownerAmount.toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            </div>

            {payment.paymentDate && (
              <div className="border-t border-white/10 mt-6 pt-6">
                <p className="text-sm text-white/60">Fecha de Pago</p>
                <p className="text-base font-medium text-white flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-white/40" />
                  {new Date(payment.paymentDate).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}

            {payment.notes && (
              <div className="border-t border-white/10 mt-6 pt-6">
                <p className="text-sm text-white/60">Notas</p>
                <p className="text-base text-white/80 mt-1">{payment.notes}</p>
              </div>
            )}

            <div className="border-t border-white/10 mt-6 pt-6">
              <div className="grid grid-cols-2 gap-4 text-xs text-white/40">
                <div>
                  <span>Creado: </span>
                  {new Date(payment.createdAt).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div>
                  <span>Actualizado: </span>
                  {new Date(payment.updatedAt).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Contract Info */}
          {contract && (
            <div className="rounded-2xl bg-white/5 backdrop-blur-sm shadow-lg p-6 hover:bg-white/10 transition-all duration-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white text-lg">Contrato Asociado</h3>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-white/60">Contrato ID</p>
                  <p className="text-base font-medium text-white">#{contract.id}</p>
                </div>
                <Link href={`/contracts/${contract.id}`}>
                  <button className="px-3 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition text-sm">
                    Ver Contrato
                  </button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/60">Fecha Inicio</p>
                  <p className="text-base text-white">
                    {new Date(contract.startDate).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Fecha Fin</p>
                  <p className="text-base text-white">
                    {new Date(contract.endDate).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-white/60">Monto Inicial</p>
                <p className="text-base font-medium text-white">
                  ${Number(contract.initialAmount).toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tenant Info */}
          {tenant && (
            <div className="rounded-2xl bg-white/5 backdrop-blur-sm shadow-lg p-6 hover:bg-white/10 transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-green-400" />
                </div>
                <h3 className="font-semibold text-white">Inquilino</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/60">Nombre</p>
                  <p className="text-sm font-medium text-white">{tenant.nameOrBusiness}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">DNI/CUIT</p>
                  <p className="text-sm text-white/80 font-mono">{tenant.dniOrCuit}</p>
                </div>
                {tenant.contactPhone && (
                  <div>
                    <p className="text-xs text-white/60">Teléfono</p>
                    <p className="text-sm text-white/80">{tenant.contactPhone}</p>
                  </div>
                )}
                {tenant.contactEmail && (
                  <div>
                    <p className="text-xs text-white/60">Email</p>
                    <p className="text-sm text-white/80">{tenant.contactEmail}</p>
                  </div>
                )}
                <Link href={`/clients/${tenant.id}`}>
                  <button className="w-full mt-2 px-3 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition text-sm">
                    Ver Perfil
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Apartment Info */}
          {apartment && (
            <div className="rounded-2xl bg-white/5 backdrop-blur-sm shadow-lg p-6 hover:bg-white/10 transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Home className="h-4 w-4 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white">Propiedad</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/60">Nomenclatura</p>
                  <p className="text-sm font-medium text-white">{apartment.nomenclature}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">ID Único</p>
                  <p className="text-sm text-white/80 font-mono">{apartment.uniqueId}</p>
                </div>
                {building && (
                  <div>
                    <p className="text-xs text-white/60">Edificio</p>
                    <p className="text-sm text-white/80">{building.name}</p>
                  </div>
                )}
                {apartment.fullAddress && (
                  <div>
                    <p className="text-xs text-white/60">Dirección</p>
                    <p className="text-sm text-white/80">{apartment.fullAddress}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-white/60">Área</p>
                    <p className="text-sm text-white/80">{apartment.area}m²</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Ambientes</p>
                    <p className="text-sm text-white/80">{apartment.rooms}</p>
                  </div>
                </div>
                <Link href={`/apartments/${apartment.id}`}>
                  <button className="w-full mt-2 px-3 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition text-sm">
                    Ver Propiedad
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {payment.status === 'pending' && (
            <div className="rounded-2xl bg-white/5 backdrop-blur-sm shadow-lg p-6 hover:bg-white/10 transition-all duration-200">
              <h3 className="font-semibold text-white mb-4">Acciones Rápidas</h3>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Marcar como Pagado
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </DashboardLayout>
  )
}
