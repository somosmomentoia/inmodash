'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  FileText,
  Search,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  Select,
  EmptyState,
} from '@/components/ui'
import { usePayments } from '@/hooks/usePayments'
import { useContracts } from '@/hooks/useContracts'
import { useTenants } from '@/hooks/useTenants'
import styles from './new-payment.module.css'

export default function NewPaymentPage() {
  const router = useRouter()
  const { createPayment } = usePayments()
  const { contracts, loading: contractsLoading } = useContracts()
  const { tenants, loading: tenantsLoading } = useTenants()
  
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    amount: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const loading = contractsLoading || tenantsLoading

  // Get active contracts only
  const activeContracts = useMemo(() => {
    const now = new Date()
    return contracts.filter(contract => 
      new Date(contract.startDate) <= now && new Date(contract.endDate) >= now
    )
  }, [contracts])

  // Filter contracts by search
  const filteredContracts = useMemo(() => {
    if (!searchTerm) return activeContracts
    
    return activeContracts.filter(contract => {
      const tenant = tenants.find(t => t.id === contract.tenantId)
      return (
        tenant?.nameOrBusiness.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.id.toString().includes(searchTerm)
      )
    })
  }, [activeContracts, tenants, searchTerm])

  // Get tenant name for a contract
  const getTenantName = (tenantId: number) => {
    const tenant = tenants.find(t => t.id === tenantId)
    return tenant?.nameOrBusiness || 'Inquilino desconocido'
  }

  // Get selected contract
  const selectedContract = useMemo(() => {
    return contracts.find(c => c.id === selectedContractId)
  }, [contracts, selectedContractId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedContractId || !formData.amount || !formData.month) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    setSubmitting(true)
    try {
      await createPayment({
        contractId: selectedContractId,
        amount: parseFloat(formData.amount),
        month: formData.month + '-01',
        notes: formData.notes || undefined,
      })
      router.push('/payments')
    } catch (error) {
      console.error('Error creating payment:', error)
      alert('Error al crear el pago. Por favor intente nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Nuevo Pago" subtitle="Registrar un nuevo pago">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Cargando contratos...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Nuevo Pago" subtitle="Registrar un nuevo pago de alquiler">
      {/* Back Button */}
      <div className={styles.header}>
        <Link href="/payments">
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
            Volver a Pagos
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          {/* Contract Selection */}
          <Card>
            <CardHeader 
              title="Seleccionar Contrato"
              subtitle="Elija el contrato para registrar el pago"
            />
            <CardContent>
              <Input
                placeholder="Buscar por inquilino o número de contrato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search size={18} />}
                className={styles.searchInput}
              />

              {filteredContracts.length === 0 ? (
                <EmptyState
                  icon={<FileText />}
                  title="No hay contratos activos"
                  description="No se encontraron contratos activos para registrar pagos."
                />
              ) : (
                <div className={styles.contractsList}>
                  {filteredContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className={`${styles.contractItem} ${selectedContractId === contract.id ? styles.selected : ''}`}
                      onClick={() => {
                        setSelectedContractId(contract.id)
                        setFormData(prev => ({
                          ...prev,
                          amount: contract.initialAmount.toString(),
                        }))
                      }}
                    >
                      <div className={styles.contractInfo}>
                        <span className={styles.contractTenant}>
                          {getTenantName(contract.tenantId)}
                        </span>
                        <span className={styles.contractId}>
                          Contrato #{contract.id}
                        </span>
                      </div>
                      <div className={styles.contractAmount}>
                        {formatCurrency(contract.initialAmount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader 
              title="Detalles del Pago"
              subtitle="Complete la información del pago"
            />
            <CardContent>
              {selectedContract ? (
                <div className={styles.paymentForm}>
                  <div className={styles.selectedContractInfo}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Inquilino:</span>
                      <span className={styles.infoValue}>
                        {getTenantName(selectedContract.tenantId)}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Contrato:</span>
                      <span className={styles.infoValue}>#{selectedContract.id}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Monto sugerido:</span>
                      <span className={styles.infoValue}>
                        {formatCurrency(selectedContract.initialAmount)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.formFields}>
                    <Input
                      label="Monto *"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0"
                      leftIcon={<DollarSign size={18} />}
                      fullWidth
                    />

                    <Input
                      label="Período (Mes) *"
                      type="month"
                      value={formData.month}
                      onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                      leftIcon={<Calendar size={18} />}
                      fullWidth
                    />

                    <Input
                      label="Notas (opcional)"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Observaciones adicionales..."
                      fullWidth
                    />
                  </div>

                  <div className={styles.formActions}>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => router.push('/payments')}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      loading={submitting}
                      disabled={!formData.amount || !formData.month}
                    >
                      Registrar Pago
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<DollarSign />}
                  title="Seleccione un contrato"
                  description="Elija un contrato de la lista para registrar el pago."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </DashboardLayout>
  )
}
