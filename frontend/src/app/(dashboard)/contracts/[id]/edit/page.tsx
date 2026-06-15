'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Save,
  FileText,
  Percent,
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
import { useContract, useContracts } from '@/hooks/useContracts'
import { useTenants } from '@/hooks/useTenants'
import { useApartments } from '@/hooks/useApartments'
import { useVendors } from '@/hooks/useVendors'
import styles from './edit-contract.module.css'

export default function EditContractPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = Number(params.id)

  const { contract, loading: contractLoading } = useContract(contractId)
  const { updateContract } = useContracts()
  const { tenants, loading: tenantsLoading } = useTenants()
  const { apartments, loading: apartmentsLoading } = useApartments()
  const { vendors } = useVendors()
  
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    initialAmount: '',
    tenantId: '',
    apartmentId: '',
    commissionType: '' as '' | 'percentage' | 'fixed',
    commissionValue: '',
    vendorId: '',
    vendorCommissionPct: '',
    signupFeeAmount: '',
    contractExpenses: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const loading = contractLoading || tenantsLoading || apartmentsLoading

  // Populate form when contract loads
  useEffect(() => {
    if (contract) {
      setFormData({
        startDate: new Date(contract.startDate).toISOString().split('T')[0],
        endDate: new Date(contract.endDate).toISOString().split('T')[0],
        initialAmount: contract.initialAmount.toString(),
        tenantId: contract.tenantId.toString(),
        apartmentId: contract.apartmentId.toString(),
        commissionType: (contract.commissionType as '' | 'percentage' | 'fixed') || '',
        commissionValue: contract.commissionValue?.toString() || '',
        vendorId: contract.vendorId?.toString() || '',
        vendorCommissionPct: contract.vendorCommissionPct?.toString() || '',
        signupFeeAmount: contract.signupFeeAmount?.toString() || '',
        contractExpenses: contract.contractExpenses?.toString() || '',
      })
    }
  }, [contract])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.startDate || !formData.endDate || !formData.initialAmount || !formData.tenantId || !formData.apartmentId) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        initialAmount: parseFloat(formData.initialAmount),
        tenantId: parseInt(formData.tenantId),
        apartmentId: parseInt(formData.apartmentId),
        commissionType: formData.commissionType || null,
        commissionValue: formData.commissionValue ? parseFloat(formData.commissionValue) : null,
        vendorId: formData.vendorId ? parseInt(formData.vendorId) : null,
        vendorCommissionPct: formData.vendorCommissionPct ? parseFloat(formData.vendorCommissionPct) : null,
        signupFeeAmount: formData.signupFeeAmount ? parseFloat(formData.signupFeeAmount) : null,
        contractExpenses: formData.contractExpenses ? parseFloat(formData.contractExpenses) : null,
      }

      await updateContract(contractId, payload)
      router.push(`/contracts/${contractId}`)
    } catch (error) {
      console.error('Error updating contract:', error)
      alert('Error al actualizar el contrato. Por favor intente nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Cargando..." subtitle="Obteniendo información del contrato">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Cargando contrato...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!contract) {
    return (
      <DashboardLayout title="Contrato no encontrado" subtitle="">
        <Card>
          <CardContent>
            <EmptyState
              icon={<FileText />}
              title="Contrato no encontrado"
              description="El contrato que buscas no existe o fue eliminado."
              action={
                <Link href="/contracts">
                  <Button leftIcon={<ArrowLeft size={16} />}>
                    Volver a Contratos
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="Editar Contrato" 
      subtitle={`Contrato #${contract.id}`}
    >
      {/* Back Button */}
      <div className={styles.header}>
        <Link href={`/contracts/${contractId}`}>
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
            Volver al Contrato
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.formContainer}>
          {/* Partes del Contrato */}
          <Card>
            <CardHeader 
              title="Partes del Contrato"
              subtitle="Inquilino y propiedad asociados"
            />
            <CardContent>
              <div className={styles.formGrid}>
                <Select
                  label="Inquilino *"
                  value={formData.tenantId}
                  onChange={(e) => setFormData(prev => ({ ...prev, tenantId: e.target.value }))}
                  options={tenants.map(t => ({ value: t.id.toString(), label: t.nameOrBusiness }))}
                  fullWidth
                />
                <Select
                  label="Propiedad *"
                  value={formData.apartmentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, apartmentId: e.target.value }))}
                  options={apartments.map(a => ({ value: a.id.toString(), label: a.fullAddress || a.nomenclature || `Unidad ${a.id}` }))}
                  fullWidth
                />
              </div>
            </CardContent>
          </Card>

          {/* Fechas y Monto */}
          <Card>
            <CardHeader 
              title="Fechas y Monto"
              subtitle="Fechas del contrato y monto inicial del alquiler"
            />
            <CardContent>
              <div className={styles.formGrid}>
                <Input
                  label="Fecha de Inicio *"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  leftIcon={<Calendar size={18} />}
                  fullWidth
                />
                <Input
                  label="Fecha de Fin *"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  leftIcon={<Calendar size={18} />}
                  fullWidth
                />
              </div>
              <Input
                label="Monto Inicial del Alquiler *"
                type="number"
                value={formData.initialAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, initialAmount: e.target.value }))}
                placeholder="0"
                leftIcon={<DollarSign size={18} />}
                hint="Monto base del primer mes de alquiler"
                fullWidth
              />
            </CardContent>
          </Card>

          {/* Comisión de la Inmobiliaria */}
          <Card>
            <CardHeader 
              title="Comisión de la Inmobiliaria"
              subtitle="Porcentaje o monto fijo que se cobra sobre cada alquiler"
            />
            <CardContent>
              <div className={styles.formGrid}>
                <Select
                  label="Tipo de Comisión"
                  value={formData.commissionType}
                  onChange={(e) => setFormData(prev => ({ ...prev, commissionType: e.target.value as '' | 'percentage' | 'fixed', commissionValue: '' }))}
                  options={[
                    { value: '', label: 'Sin comisión' },
                    { value: 'percentage', label: 'Porcentaje del alquiler' },
                    { value: 'fixed', label: 'Monto fijo' },
                  ]}
                  fullWidth
                />
                {formData.commissionType && (
                  <Input
                    label={formData.commissionType === 'percentage' ? 'Porcentaje (%)' : 'Monto Fijo (ARS)'}
                    type="number"
                    step={formData.commissionType === 'percentage' ? '0.1' : '1'}
                    value={formData.commissionValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, commissionValue: e.target.value }))}
                    leftIcon={formData.commissionType === 'percentage' ? <Percent size={18} /> : <DollarSign size={18} />}
                    placeholder={formData.commissionType === 'percentage' ? '10' : '15000'}
                    fullWidth
                  />
                )}
              </div>
              {formData.commissionType === 'percentage' && formData.initialAmount && formData.commissionValue && (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', marginTop: 'var(--spacing-sm)' }}>
                  Comisión estimada: ${(parseFloat(formData.initialAmount) * (parseFloat(formData.commissionValue) / 100)).toLocaleString('es-AR')} por mes
                </p>
              )}
            </CardContent>
          </Card>

          {/* Vendedor y Comisiones Contractuales */}
          <Card>
            <CardHeader 
              title="Vendedor y Comisiones"
              subtitle="Vendedor asignado, comisión de alta y gastos de contrato"
            />
            <CardContent>
              <div className={styles.formGrid}>
                <Select
                  label="Vendedor"
                  value={formData.vendorId}
                  onChange={(e) => {
                    const vid = e.target.value
                    const vendor = vendors.find(v => v.id.toString() === vid)
                    let pct = formData.vendorCommissionPct
                    if (vendor?.defaultCommissionType === 'percentage' && vendor.defaultCommissionPct) {
                      pct = vendor.defaultCommissionPct.toString()
                    }
                    setFormData(prev => ({ ...prev, vendorId: vid, vendorCommissionPct: vid ? pct : '' }))
                  }}
                  options={[
                    { value: '', label: 'Sin vendedor asignado' },
                    ...vendors.filter(v => v.isActive).map(v => ({
                      value: v.id.toString(),
                      label: v.name,
                    })),
                  ]}
                  fullWidth
                />
                {formData.vendorId && (
                  <Input
                    label="% Comisión Vendedor"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.vendorCommissionPct}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendorCommissionPct: e.target.value }))}
                    leftIcon={<Percent size={18} />}
                    placeholder="10"
                    hint="Porcentaje sobre la comisión de alta para el vendedor"
                    fullWidth
                  />
                )}
              </div>
              <div className={styles.formGrid} style={{ marginTop: 'var(--spacing-lg)' }}>
                <Input
                  label="Comisión de Alta (ARS)"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.signupFeeAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, signupFeeAmount: e.target.value }))}
                  leftIcon={<DollarSign size={18} />}
                  placeholder="0"
                  hint="Monto que paga el inquilino al firmar"
                  fullWidth
                />
                <Input
                  label="Gastos de Contrato (ARS)"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.contractExpenses}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractExpenses: e.target.value }))}
                  leftIcon={<DollarSign size={18} />}
                  placeholder="0"
                  hint="Sellados, escribanía, etc."
                  fullWidth
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/contracts/${contractId}`)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              leftIcon={<Save size={16} />}
              loading={submitting}
              disabled={!formData.startDate || !formData.endDate || !formData.initialAmount || !formData.tenantId || !formData.apartmentId}
            >
              Guardar Cambios
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  )
}
