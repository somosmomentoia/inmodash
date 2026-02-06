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
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  EmptyState,
} from '@/components/ui'
import { useContract, useContracts } from '@/hooks/useContracts'
import { useTenants } from '@/hooks/useTenants'
import { useApartments } from '@/hooks/useApartments'
import styles from './edit-contract.module.css'

export default function EditContractPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = Number(params.id)

  const { contract, loading: contractLoading } = useContract(contractId)
  const { updateContract } = useContracts()
  const { tenants, loading: tenantsLoading } = useTenants()
  const { apartments, loading: apartmentsLoading } = useApartments()
  
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    initialAmount: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const loading = contractLoading || tenantsLoading || apartmentsLoading

  // Get tenant and apartment info
  const tenant = tenants.find(t => t.id === contract?.tenantId)
  const apartment = apartments.find(a => a.id === contract?.apartmentId)

  // Populate form when contract loads
  useEffect(() => {
    if (contract) {
      setFormData({
        startDate: new Date(contract.startDate).toISOString().split('T')[0],
        endDate: new Date(contract.endDate).toISOString().split('T')[0],
        initialAmount: contract.initialAmount.toString(),
      })
    }
  }, [contract])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.startDate || !formData.endDate || !formData.initialAmount) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    setSubmitting(true)
    try {
      await updateContract(contractId, {
        startDate: formData.startDate,
        endDate: formData.endDate,
        initialAmount: parseFloat(formData.initialAmount),
      })
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
          {/* Contract Info (Read-only) */}
          <Card>
            <CardHeader 
              title="Información del Contrato"
              subtitle="Datos asociados al contrato (no editables)"
            />
            <CardContent>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Inquilino</span>
                  <span className={styles.infoValue}>
                    {tenant?.nameOrBusiness || 'No disponible'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Propiedad</span>
                  <span className={styles.infoValue}>
                    {apartment?.nomenclature || 'No disponible'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable Fields */}
          <Card>
            <CardHeader 
              title="Fechas y Monto"
              subtitle="Modifique los datos del contrato"
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
                label="Monto Inicial *"
                type="number"
                value={formData.initialAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, initialAmount: e.target.value }))}
                placeholder="0"
                leftIcon={<DollarSign size={18} />}
                fullWidth
              />
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
              disabled={!formData.startDate || !formData.endDate || !formData.initialAmount}
            >
              Guardar Cambios
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  )
}
