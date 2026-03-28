'use client'

import { useState, useMemo } from 'react'
import { Users, DollarSign, Clock, CheckCircle, CreditCard, ChevronDown, Building2 } from 'lucide-react'
import { Badge, Modal, ModalFooter, Button, Input, Select } from '@/components/ui'
import { useVendorCommissions } from '@/hooks/useVendorCommissions'
import { VendorCommission } from '@/types'
import styles from './commissions.module.css'

interface VendorGroup {
  vendorId: number
  vendorName: string
  commissions: VendorCommission[]
  pendingAmount: number
  paidAmount: number
  pendingCount: number
  paidCount: number
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount)

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

export default function CommissionsContent() {
  const { commissions, stats, loading, markAsPaid, fetchAll } = useVendorCommissions()
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')
  const [expandedVendors, setExpandedVendors] = useState<Set<number>>(new Set())

  // Pay modal state — supports single or batch
  const [showPayModal, setShowPayModal] = useState(false)
  const [payTarget, setPayTarget] = useState<{ vendorName: string; commissions: VendorCommission[] }>({ vendorName: '', commissions: [] })
  const [payForm, setPayForm] = useState({ paymentMethod: 'transfer', reference: '', notes: '' })
  const [paying, setPaying] = useState(false)

  // Group commissions by vendor
  const vendorGroups: VendorGroup[] = useMemo(() => {
    const map = new Map<number, VendorGroup>()

    commissions.forEach(c => {
      const vid = c.vendorId
      if (!map.has(vid)) {
        map.set(vid, {
          vendorId: vid,
          vendorName: c.vendor?.name || 'Vendedor',
          commissions: [],
          pendingAmount: 0,
          paidAmount: 0,
          pendingCount: 0,
          paidCount: 0,
        })
      }
      const group = map.get(vid)!
      group.commissions.push(c)
      if (c.status === 'pending') {
        group.pendingAmount += c.amount
        group.pendingCount++
      } else {
        group.paidAmount += c.amount
        group.paidCount++
      }
    })

    // Sort: vendors with pending first, then by pending amount desc
    return Array.from(map.values()).sort((a, b) => {
      if (a.pendingCount > 0 && b.pendingCount === 0) return -1
      if (a.pendingCount === 0 && b.pendingCount > 0) return 1
      return b.pendingAmount - a.pendingAmount
    })
  }, [commissions])

  // Filter vendor groups
  const filteredGroups = useMemo(() => {
    if (filter === 'all') return vendorGroups
    return vendorGroups
      .map(g => ({
        ...g,
        commissions: g.commissions.filter(c => c.status === filter),
      }))
      .filter(g => g.commissions.length > 0)
  }, [vendorGroups, filter])

  const toggleVendor = (vendorId: number) => {
    setExpandedVendors(prev => {
      const next = new Set(prev)
      if (next.has(vendorId)) next.delete(vendorId)
      else next.add(vendorId)
      return next
    })
  }

  // Open pay modal for a single commission
  const handlePaySingle = (commission: VendorCommission) => {
    setPayTarget({ vendorName: commission.vendor?.name || 'Vendedor', commissions: [commission] })
    setPayForm({ paymentMethod: 'transfer', reference: '', notes: '' })
    setShowPayModal(true)
  }

  // Open pay modal for all pending commissions of a vendor
  const handlePayVendor = (group: VendorGroup) => {
    const pending = group.commissions.filter(c => c.status === 'pending')
    if (pending.length === 0) return
    setPayTarget({ vendorName: group.vendorName, commissions: pending })
    setPayForm({ paymentMethod: 'transfer', reference: '', notes: '' })
    setShowPayModal(true)
  }

  const handleConfirmPay = async () => {
    if (payTarget.commissions.length === 0) return
    setPaying(true)
    try {
      for (const c of payTarget.commissions) {
        await markAsPaid(c.id, payForm)
      }
      setShowPayModal(false)
      setPayTarget({ vendorName: '', commissions: [] })
      await fetchAll()
    } catch (error: any) {
      alert(error.message || 'Error al procesar el pago')
    } finally {
      setPaying(false)
    }
  }

  const payTotalAmount = payTarget.commissions.reduce((sum, c) => sum + c.amount, 0)

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border-light)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div>
      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statCardGlow} ${styles.statCardGlowWarning}`} />
          <div className={styles.statIconRow}>
            <div className={`${styles.statIcon} ${styles.statIconWarning}`}>
              <Clock size={24} />
            </div>
          </div>
          <div className={styles.statLabel}>Pendientes</div>
          <div className={styles.statValue}>{formatCurrency(stats?.pendingAmount || 0)}</div>
          <div className={styles.statMeta}>{stats?.pendingCount || 0} comisiones</div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statCardGlow} ${styles.statCardGlowSuccess}`} />
          <div className={styles.statIconRow}>
            <div className={`${styles.statIcon} ${styles.statIconSuccess}`}>
              <CheckCircle size={24} />
            </div>
          </div>
          <div className={styles.statLabel}>Pagadas</div>
          <div className={styles.statValue}>{formatCurrency(stats?.paidAmount || 0)}</div>
          <div className={styles.statMeta}>{stats?.paidCount || 0} comisiones</div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statCardGlow} ${styles.statCardGlowInfo}`} />
          <div className={styles.statIconRow}>
            <div className={`${styles.statIcon} ${styles.statIconInfo}`}>
              <DollarSign size={24} />
            </div>
          </div>
          <div className={styles.statLabel}>Total</div>
          <div className={styles.statValue}>{formatCurrency((stats?.pendingAmount || 0) + (stats?.paidAmount || 0))}</div>
          <div className={styles.statMeta}>{(stats?.pendingCount || 0) + (stats?.paidCount || 0)} total</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {(['all', 'pending', 'paid'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
          >
            {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : 'Pagadas'}
          </button>
        ))}
      </div>

      {/* Vendor Groups */}
      {filteredGroups.length === 0 ? (
        <div className={styles.vendorCard}>
          <div className={styles.emptyState}>
            <Users size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>Sin comisiones</h3>
            <p className={styles.emptyText}>
              Las comisiones se generan automáticamente al crear contratos con vendedor asignado.
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.vendorList}>
          {filteredGroups.map(group => {
            const isExpanded = expandedVendors.has(group.vendorId)
            const hasPending = group.pendingCount > 0

            return (
              <div key={group.vendorId} className={styles.vendorCard}>
                {/* Vendor Header */}
                <div className={styles.vendorCardHeader} onClick={() => toggleVendor(group.vendorId)}>
                  <div className={styles.vendorHeaderLeft}>
                    <div className={styles.vendorAvatar}>
                      {getInitials(group.vendorName)}
                    </div>
                    <div className={styles.vendorInfo}>
                      <div className={styles.vendorName}>{group.vendorName}</div>
                      <div className={styles.vendorMeta}>
                        <span>{group.commissions.length} comisiones</span>
                        <span className={styles.vendorMetaDot} />
                        <span>{group.pendingCount} pendientes</span>
                        <span className={styles.vendorMetaDot} />
                        <span>{group.paidCount} pagadas</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.vendorHeaderRight}>
                    <div className={styles.vendorTotals}>
                      {group.pendingAmount > 0 && (
                        <div className={styles.vendorTotal}>
                          <div className={styles.vendorTotalLabel}>Pendiente</div>
                          <div className={`${styles.vendorTotalValue} ${styles.vendorTotalPending}`}>
                            {formatCurrency(group.pendingAmount)}
                          </div>
                        </div>
                      )}
                      {group.paidAmount > 0 && (
                        <div className={styles.vendorTotal}>
                          <div className={styles.vendorTotalLabel}>Pagado</div>
                          <div className={`${styles.vendorTotalValue} ${styles.vendorTotalPaid}`}>
                            {formatCurrency(group.paidAmount)}
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronDown
                      size={20}
                      className={`${styles.vendorChevron} ${isExpanded ? styles.vendorChevronOpen : ''}`}
                    />
                  </div>
                </div>

                {/* Vendor Body (expandable) */}
                {isExpanded && (
                  <div className={styles.vendorBody}>
                    {/* Table Header */}
                    <div className={styles.tableHeader}>
                      <span>Propiedad</span>
                      <span>Inquilino</span>
                      <span>Monto</span>
                      <span>Fecha</span>
                      <span>Estado</span>
                      <span></span>
                    </div>

                    {/* Commission Rows */}
                    {group.commissions.map(c => {
                      const apt = c.contract?.apartment
                      const propertyName = apt
                        ? `${apt.building?.name || ''} ${apt.nomenclature || ''}`.trim()
                        : `Contrato #${c.contractId}`
                      const tenantName = c.contract?.tenant?.nameOrBusiness || '-'

                      return (
                        <div key={c.id} className={styles.tableRow}>
                          <div className={styles.colProperty}>
                            <span className={styles.colPropertyName}>{propertyName}</span>
                            {c.notes && <span className={styles.colPropertySub}>{c.notes}</span>}
                          </div>
                          <span className={styles.colTenant}>{tenantName}</span>
                          <span className={styles.colAmount}>{formatCurrency(c.amount)}</span>
                          <span className={styles.colDate}>
                            {c.status === 'paid' && c.paidAt
                              ? formatDate(c.paidAt)
                              : formatDate(c.createdAt)}
                          </span>
                          <span className={styles.colStatus}>
                            <Badge variant={c.status === 'paid' ? 'success' : 'warning'} size="sm">
                              {c.status === 'paid' ? 'Pagada' : 'Pendiente'}
                            </Badge>
                          </span>
                          <span className={styles.colAction}>
                            {c.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => { e.stopPropagation(); handlePaySingle(c) }}
                                leftIcon={<CreditCard size={14} />}
                              >
                                Pagar
                              </Button>
                            )}
                          </span>
                        </div>
                      )
                    })}

                    {/* Vendor Footer */}
                    {hasPending && (
                      <div className={styles.vendorFooter}>
                        <div className={styles.vendorFooterInfo}>
                          <span className={styles.vendorFooterTotal}>
                            Total a liquidar: {formatCurrency(group.pendingAmount)}
                          </span>
                          <span className={styles.vendorFooterCount}>
                            {group.pendingCount} {group.pendingCount === 1 ? 'comisión pendiente' : 'comisiones pendientes'}
                          </span>
                        </div>
                        <Button
                          onClick={() => handlePayVendor(group)}
                          leftIcon={<CreditCard size={16} />}
                        >
                          Liquidar Todo
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pay Modal */}
      <Modal
        isOpen={showPayModal}
        onClose={() => { setShowPayModal(false); setPayTarget({ vendorName: '', commissions: [] }) }}
        title={payTarget.commissions.length > 1 ? 'Liquidar Comisiones' : 'Pagar Comisión'}
        subtitle={payTarget.vendorName}
        size="md"
      >
        <div className={styles.payModalBody}>
          {/* Summary of what's being paid */}
          <div className={styles.payModalSummary}>
            {payTarget.commissions.map(c => {
              const apt = c.contract?.apartment
              const label = apt
                ? `${apt.building?.name || ''} ${apt.nomenclature || ''}`.trim()
                : `Contrato #${c.contractId}`
              return (
                <div key={c.id} className={styles.payModalSummaryRow}>
                  <span>{label}</span>
                  <span>{formatCurrency(c.amount)}</span>
                </div>
              )
            })}
            {payTarget.commissions.length > 1 && (
              <div className={styles.payModalSummaryTotal}>
                <span>Total a pagar</span>
                <span>{formatCurrency(payTotalAmount)}</span>
              </div>
            )}
          </div>

          <Select
            label="Método de Pago"
            options={[
              { value: 'transfer', label: 'Transferencia' },
              { value: 'cash', label: 'Efectivo' },
              { value: 'check', label: 'Cheque' },
              { value: 'other', label: 'Otro' },
            ]}
            value={payForm.paymentMethod}
            onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
            fullWidth
          />
          <Input
            label="Referencia / Comprobante"
            value={payForm.reference}
            onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
            placeholder="Nro. de transferencia, cheque, etc."
            fullWidth
          />
          <Input
            label="Notas"
            value={payForm.notes}
            onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
            placeholder="Notas adicionales..."
            fullWidth
          />
          <div className={styles.payModalWarning}>
            Al confirmar, se {payTarget.commissions.length > 1 ? `crearán ${payTarget.commissions.length} egresos` : 'creará un egreso'} en Flujo de Caja y Contabilidad por {formatCurrency(payTotalAmount)}.
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setShowPayModal(false); setPayTarget({ vendorName: '', commissions: [] }) }}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmPay} loading={paying} leftIcon={<CheckCircle size={16} />}>
            {payTarget.commissions.length > 1 ? `Liquidar ${payTarget.commissions.length} comisiones` : 'Confirmar Pago'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
