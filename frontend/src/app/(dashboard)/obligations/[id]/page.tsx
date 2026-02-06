'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  FileText,
  User,
  Home,
  RefreshCw,
  Edit2,
  Briefcase,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardHeader, CardContent, Button } from '@/components/ui'
import { RegisterPaymentModal } from '@/components/obligations'
import { useObligation } from '@/hooks/useObligations'
import styles from './obligation-detail.module.css'

const OBLIGATION_TYPE_LABELS: Record<string, string> = {
  rent: 'Alquiler',
  expenses: 'Expensas',
  service: 'Servicio',
  tax: 'Impuesto',
  insurance: 'Seguro',
  maintenance: 'Mantenimiento',
  debt: 'Deuda'
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Pago Parcial',
  paid: 'Pagado',
  overdue: 'Vencido'
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  partial: 'bg-blue-500/20 text-blue-300',
  paid: 'bg-green-500/20 text-green-300',
  overdue: 'bg-red-500/20 text-red-300'
}

const OBLIGATION_TYPE_COLORS: Record<string, string> = {
  rent: 'bg-purple-500/20 text-purple-300',
  expenses: 'bg-orange-500/20 text-orange-300',
  service: 'bg-cyan-500/20 text-cyan-300',
  tax: 'bg-red-500/20 text-red-300',
  insurance: 'bg-blue-500/20 text-blue-300',
  maintenance: 'bg-yellow-500/20 text-yellow-300',
  debt: 'bg-gray-500/20 text-gray-300'
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  check: 'Cheque',
  card: 'Tarjeta',
  other: 'Otro'
}

export default function ObligationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const obligationId = Number(params.id)
  
  const { obligation, loading, error, refresh } = useObligation(obligationId)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  const handlePaymentSuccess = async () => {
    setPaymentModalOpen(false)
    await refresh()
  }

  if (loading) {
    return (
      <DashboardLayout title="Cargando..." subtitle="">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Cargando obligación...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !obligation) {
    return (
      <DashboardLayout title="Error" subtitle="">
        <div className={styles.container}>
          <div className={styles.errorCard}>
            <p className={styles.errorText}>Error: {error || 'Obligación no encontrada'}</p>
          </div>
          <Link href="/obligations" className={styles.backLink}>
            <ArrowLeft size={16} />
            Volver a Cuenta Corriente
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const percentage = (obligation.paidAmount / obligation.amount) * 100
  const remaining = obligation.amount - obligation.paidAmount

  const getTypeBadgeClass = (type: string) => {
    const classes: Record<string, string> = {
      rent: styles.badgeRent,
      expenses: styles.badgeExpenses,
      service: styles.badgeService,
      tax: styles.badgeTax,
      insurance: styles.badgeInsurance,
      maintenance: styles.badgeMaintenance,
      debt: styles.badgeDebt
    }
    return classes[type] || styles.badgeDefault
  }

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      pending: styles.badgePending,
      partial: styles.badgePartial,
      paid: styles.badgePaid,
      overdue: styles.badgeOverdue
    }
    return classes[status] || styles.badgeDefault
  }

  return (
    <DashboardLayout title={obligation.description} subtitle="Detalle de Obligación">
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/obligations" className={styles.backLink}>
            <ArrowLeft size={16} />
            Volver a Cuenta Corriente
          </Link>
          <h1 className={styles.title}>{obligation.description}</h1>
          <div className={styles.badges}>
            <span className={`${styles.badge} ${getTypeBadgeClass(obligation.type)}`}>
              {OBLIGATION_TYPE_LABELS[obligation.type] || obligation.type}
            </span>
            <span className={`${styles.badge} ${getStatusBadgeClass(obligation.status)}`}>
              {STATUS_LABELS[obligation.status] || obligation.status}
            </span>
            {(obligation as any).recurringObligationId ? (
              <span className={`${styles.badge} ${styles.badgeRecurring}`}>
                <RefreshCw size={12} />
                Recurrente
              </span>
            ) : (
              <span className={`${styles.badge} ${styles.badgeManual}`}>
                <Edit2 size={12} />
                Manual
              </span>
            )}
          </div>
        </div>
        {obligation.status !== 'paid' && (
          <button onClick={() => setPaymentModalOpen(true)} className={styles.payButton}>
            💰 Registrar Pago
          </button>
        )}
      </div>

      {/* Resumen Principal */}
      <Card>
        <CardHeader title="Resumen Financiero" />
        <CardContent>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Monto Total</div>
            <div className={styles.summaryValue}>
              ${obligation.amount.toLocaleString('es-AR')}
            </div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Pagado</div>
            <div className={`${styles.summaryValue} ${styles.summaryValueGreen}`}>
              ${obligation.paidAmount.toLocaleString('es-AR')}
            </div>
            <div className={styles.summarySubtext}>
              {percentage.toFixed(1)}% del total
            </div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Pendiente</div>
            <div className={`${styles.summaryValue} ${styles.summaryValueRed}`}>
              ${remaining.toLocaleString('es-AR')}
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${
                percentage === 100 ? styles.progressFillComplete : 
                percentage > 0 ? styles.progressFillPartial : styles.progressFillEmpty
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Información adicional */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Fecha de Vencimiento</div>
            <div className={styles.infoValue}>
              {new Date(obligation.dueDate).toLocaleDateString('es-AR')}
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Período</div>
            <div className={styles.infoValue}>
              {new Date(obligation.period).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          {obligation.type === 'rent' && (
            <>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Comisión Inmobiliaria</div>
                <div className={styles.infoValue}>
                  ${obligation.commissionAmount.toLocaleString('es-AR')}
                </div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Monto Propietario</div>
                <div className={styles.infoValue}>
                  ${obligation.ownerAmount.toLocaleString('es-AR')}
                </div>
              </div>
            </>
          )}
        </div>

        {obligation.notes && (
          <div className={styles.notesSection}>
            <div className={styles.notesLabel}>Notas</div>
            <div className={styles.notesContent}>
              {obligation.notes}
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Historial de Pagos */}
      <Card>
        <CardHeader title={`Historial de Pagos (${obligation.obligationPayments?.length || 0})`} />
        <CardContent>
        {!obligation.obligationPayments || obligation.obligationPayments.length === 0 ? (
          <div className={styles.emptyPayments}>
            No hay pagos registrados para esta obligación
          </div>
        ) : (
          <div className={styles.paymentsList}>
            {obligation.obligationPayments.map((payment: any) => (
              <div key={payment.id} className={styles.paymentItem}>
                <div className={styles.paymentInfo}>
                  <div className={styles.paymentIcon}>
                    <DollarSign size={20} />
                  </div>
                  <div className={styles.paymentDetails}>
                    <div className={styles.paymentAmount}>
                      ${payment.amount.toLocaleString('es-AR')}
                    </div>
                    <div className={styles.paymentDate}>
                      {new Date(payment.paymentDate).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {payment.method && (
                    <span className={styles.paymentMethod}>
                      {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                    </span>
                  )}
                  {payment.reference && (
                    <span className={styles.paymentReference}>
                      Ref: {payment.reference}
                    </span>
                  )}
                </div>
                {payment.notes && (
                  <div className={styles.paymentNotes}>
                    {payment.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </CardContent>
      </Card>

      {/* Información Relacionada */}
      <Card>
        <CardHeader title="Información Relacionada" />
        <CardContent>
        <div className={styles.relatedList}>
          {/* Origen de la Obligación */}
          <div className={styles.relatedItem}>
            <div className={styles.relatedInfo}>
              <div className={`${styles.relatedIcon} ${(obligation as any).recurringObligationId ? styles.relatedIconPurple : styles.relatedIconGray}`}>
                {(obligation as any).recurringObligationId ? <RefreshCw size={20} /> : <Edit2 size={20} />}
              </div>
              <div className={styles.originInfo}>
                <div className={styles.relatedLabel}>Origen de la Obligación</div>
                <div className={`${styles.originTitle} ${(obligation as any).recurringObligationId ? styles.originTitlePurple : styles.originTitleGray}`}>
                  {(obligation as any).recurringObligationId ? 'Generada Automáticamente' : 'Creada Manualmente'}
                </div>
                <div className={styles.originDesc}>
                  {(obligation as any).recurringObligationId 
                    ? 'Esta obligación fue creada automáticamente por el sistema de recurrencias.'
                    : 'Esta obligación fue creada manualmente por un usuario.'}
                </div>
              </div>
            </div>
          </div>
          
          {obligation.contract && (
            <div className={styles.relatedItem}>
              <div className={styles.relatedInfo}>
                <div className={`${styles.relatedIcon} ${styles.relatedIconBlue}`}>
                  <FileText size={20} />
                </div>
                <div className={styles.relatedDetails}>
                  <div className={styles.relatedLabel}>Contrato</div>
                  <div className={styles.relatedValue}>Contrato #{obligation.contract.id}</div>
                  <div className={styles.relatedSubtext}>
                    {new Date(obligation.contract.startDate).toLocaleDateString('es-AR')} - {new Date(obligation.contract.endDate).toLocaleDateString('es-AR')}
                  </div>
                </div>
              </div>
              <Link href={`/contracts/${obligation.contract.id}`} className={styles.relatedLink}>
                Ver Contrato →
              </Link>
            </div>
          )}

          {obligation.contract?.tenant && (
            <div className={styles.relatedItem}>
              <div className={styles.relatedInfo}>
                <div className={`${styles.relatedIcon} ${styles.relatedIconGreen}`}>
                  <User size={20} />
                </div>
                <div className={styles.relatedDetails}>
                  <div className={styles.relatedLabel}>Inquilino</div>
                  <div className={styles.relatedValue}>{obligation.contract.tenant.nameOrBusiness}</div>
                  <div className={styles.relatedSubtext}>{obligation.contract.tenant.contactPhone}</div>
                </div>
              </div>
              <Link href={`/clients/${obligation.contract.tenant.id}`} className={styles.relatedLink}>
                Ver Perfil →
              </Link>
            </div>
          )}

          {/* Propiedad - puede venir del contrato o directamente de la obligación */}
          {(obligation.contract?.apartment || (obligation as any).apartment) && (() => {
            const apt = obligation.contract?.apartment || (obligation as any).apartment
            return (
              <div className={styles.relatedItem}>
                <div className={styles.relatedInfo}>
                  <div className={`${styles.relatedIcon} ${styles.relatedIconPurple}`}>
                    <Home size={20} />
                  </div>
                  <div className={styles.relatedDetails}>
                    <div className={styles.relatedLabel}>Propiedad</div>
                    <div className={styles.relatedValue}>{apt.nomenclature}</div>
                    <div className={styles.relatedSubtext}>
                      {apt.fullAddress || 
                       (apt.building ? `${apt.building.name} - Piso ${apt.floor}` : '')}
                    </div>
                  </div>
                </div>
                <Link href={`/apartments/${apt.id}`} className={styles.relatedLink}>
                  Ver Propiedad →
                </Link>
              </div>
            )
          })()}

          {/* Propietario - puede venir del apartment directo */}
          {(obligation as any).apartment?.owner && !obligation.contract && (
            <div className={styles.relatedItem}>
              <div className={styles.relatedInfo}>
                <div className={`${styles.relatedIcon} ${styles.relatedIconOrange}`}>
                  <Briefcase size={20} />
                </div>
                <div className={styles.relatedDetails}>
                  <div className={styles.relatedLabel}>Propietario</div>
                  <div className={styles.relatedValue}>{(obligation as any).apartment.owner.name}</div>
                  <div className={styles.relatedSubtext}>{(obligation as any).apartment.owner.phone || (obligation as any).apartment.owner.email}</div>
                </div>
              </div>
              <Link href={`/owners/${(obligation as any).apartment.owner.id}`} className={styles.relatedLink}>
                Ver Propietario →
              </Link>
            </div>
          )}
        </div>
        </CardContent>
      </Card>

      {/* Modal de Registro de Pago */}
      <RegisterPaymentModal
        obligation={obligation}
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
    </DashboardLayout>
  )
}
