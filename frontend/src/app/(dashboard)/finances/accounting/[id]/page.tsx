'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  User,
  FileText,
  Building2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Badge,
} from '@/components/ui'
import accountingService, { AccountingEntry } from '@/services/accountingService'
import styles from './accounting-detail.module.css'

export default function AccountingEntryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const entryId = Number(params.id)

  const [entry, setEntry] = useState<AccountingEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadEntry = async () => {
      setLoading(true)
      try {
        const data = await accountingService.getById(entryId)
        setEntry(data)
      } catch (err) {
        console.error('Error loading accounting entry:', err)
        setError('No se pudo cargar el asiento contable')
      } finally {
        setLoading(false)
      }
    }
    if (entryId) {
      loadEntry()
    }
  }, [entryId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      commission: 'Comisión por Alquiler',
      commission_service: 'Comisión por Servicio',
      expense: 'Gasto Operativo',
      income_other: 'Otro Ingreso',
      adjustment: 'Ajuste',
    }
    return labels[type] || type
  }

  const getTypeVariant = (type: string): 'success' | 'warning' | 'error' | 'default' => {
    if (type === 'commission' || type === 'commission_service' || type === 'income_other') {
      return 'success'
    }
    if (type === 'expense') {
      return 'error'
    }
    return 'default'
  }

  if (loading) {
    return (
      <DashboardLayout title="Asiento Contable" subtitle="">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Cargando asiento contable...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !entry) {
    return (
      <DashboardLayout title="Asiento Contable" subtitle="">
        <div className={styles.errorContainer}>
          <p>{error || 'Asiento contable no encontrado'}</p>
          <Link href="/finances?tab=accounting">
            <Button variant="secondary">Volver a Contabilidad</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Detalle de Asiento Contable" subtitle={getTypeLabel(entry.type)}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/finances?tab=accounting" className={styles.backLink}>
            <ArrowLeft size={16} />
            Volver a Contabilidad
          </Link>
        </div>

        <div className={styles.mainContent}>
          <Card>
            <CardHeader
              title="Información del Asiento"
              action={<Badge variant={getTypeVariant(entry.type)}>{getTypeLabel(entry.type)}</Badge>}
            />
            <CardContent>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>
                    <DollarSign size={16} /> Monto
                  </span>
                  <span className={styles.detailValue + ' ' + styles.amountValue}>
                    {formatCurrency(entry.amount)}
                  </span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>
                    <Calendar size={16} /> Fecha de Registro
                  </span>
                  <span className={styles.detailValue}>
                    {formatDate(entry.entryDate)}
                  </span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>
                    <Calendar size={16} /> Período
                  </span>
                  <span className={styles.detailValue}>
                    {formatDate(entry.period)}
                  </span>
                </div>

                <div className={styles.detailItemFull}>
                  <span className={styles.detailLabel}>
                    <FileText size={16} /> Descripción
                  </span>
                  <span className={styles.detailValue}>
                    {entry.description}
                  </span>
                </div>

                {entry.owner && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      <User size={16} /> Propietario
                    </span>
                    <span className={styles.detailValue}>
                      <Link href={`/owners/${entry.owner.id}`} className={styles.link}>
                        {entry.owner.name}
                      </Link>
                    </span>
                  </div>
                )}

                {entry.contract?.apartment && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      <Building2 size={16} /> Propiedad
                    </span>
                    <span className={styles.detailValue}>
                      <Link href={`/apartments/${entry.contract.apartment.id}`} className={styles.link}>
                        {entry.contract.apartment.nomenclature}
                      </Link>
                    </span>
                  </div>
                )}

                {entry.settlement && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      <FileText size={16} /> Liquidación
                    </span>
                    <span className={styles.detailValue}>
                      <Link 
                        href={`/finances/settlements/${entry.settlement.id}?period=${new Date(entry.settlement.period).toISOString().slice(0,7)}`} 
                        className={styles.link}
                      >
                        Ver liquidación
                      </Link>
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => router.back()}>
              Volver
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
