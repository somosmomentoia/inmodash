'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Home,
  Users,
  AlertTriangle,
  Clock,
  TrendingUp,
  RefreshCw,
  Settings,
  BarChart3,
  CalendarClock,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  CounterCard,
  Table,
  Badge,
  Tabs,
  EmptyState,
  InsightCard,
  WidgetCard,
} from '@/components/ui'
import { useContracts } from '@/hooks/useContracts'
import { useApartments } from '@/hooks/useApartments'
import { useTenants } from '@/hooks/useTenants'
import styles from './contracts.module.css'

type ContractFilter = 'all' | 'active' | 'expiring' | 'expired'

export default function ContractsContent() {
  const router = useRouter()
  const { contracts, loading: contractsLoading } = useContracts()
  const { apartments } = useApartments()
  const { tenants } = useTenants()
  const [activeTab, setActiveTab] = useState<ContractFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const loading = contractsLoading

  const today = new Date()
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

  const getApartmentName = (apartmentId: number) => {
    const apartment = apartments.find((a) => a.id === apartmentId)
    return apartment?.nomenclature || apartment?.fullAddress || 'Sin asignar'
  }

  const getTenantName = (tenantId: number) => {
    const tenant = tenants.find((t) => t.id === tenantId)
    return tenant?.nameOrBusiness || 'Sin asignar'
  }

  const getContractStatus = (contract: { startDate: Date | string; endDate: Date | string }) => {
    const endDate = new Date(contract.endDate)
    const startDate = new Date(contract.startDate)

    if (endDate < today) return 'expired'
    if (startDate > today) return 'future'
    if (endDate <= thirtyDaysFromNow) return 'expiring'
    return 'active'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Vigente</Badge>
      case 'expiring':
        return <Badge variant="warning">Por Vencer</Badge>
      case 'expired':
        return <Badge variant="error">Vencido</Badge>
      case 'future':
        return <Badge variant="info">Futuro</Badge>
      default:
        return <Badge>Desconocido</Badge>
    }
  }

  const filteredContracts = contracts.filter((contract) => {
    const status = getContractStatus(contract)
    
    if (activeTab === 'active' && status !== 'active') return false
    if (activeTab === 'expiring' && status !== 'expiring') return false
    if (activeTab === 'expired' && status !== 'expired') return false

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const apartmentName = getApartmentName(contract.apartmentId).toLowerCase()
      const tenantName = getTenantName(contract.tenantId).toLowerCase()
      return apartmentName.includes(search) || tenantName.includes(search)
    }

    return true
  })

  const activeCount = contracts.filter((c) => getContractStatus(c) === 'active').length
  const expiringCount = contracts.filter((c) => getContractStatus(c) === 'expiring').length
  const expiredCount = contracts.filter((c) => getContractStatus(c) === 'expired').length

  const filterTabs = [
    { id: 'all', label: 'Todos', badge: contracts.length },
    { id: 'active', label: 'Vigentes', badge: activeCount },
    { id: 'expiring', label: 'Por Vencer', badge: expiringCount },
    { id: 'expired', label: 'Vencidos', badge: expiredCount },
  ]

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando contratos...</p>
      </div>
    )
  }

  return (
    <>
      {/* Stats - Contadores animados */}
      <div className={styles.statsGrid}>
        <CounterCard
          title="Total Contratos"
          value={contracts.length}
          icon={<FileText size={24} />}
          color="blue"
          size="sm"
        />
        <CounterCard
          title="Vigentes"
          value={activeCount}
          icon={<TrendingUp size={24} />}
          color="green"
          size="sm"
        />
        <CounterCard
          title="Por Vencer"
          value={expiringCount}
          icon={<Clock size={24} />}
          color="orange"
          size="sm"
          glowing={expiringCount > 0}
        />
        <CounterCard
          title="Vencidos"
          value={expiredCount}
          icon={<AlertTriangle size={24} />}
          color="purple"
          size="sm"
        />
      </div>

      {/* Acciones Rápidas */}
      <WidgetCard
        title="Acciones Rápidas"
        columns={4}
        variant="compact"
        items={[
          {
            id: 'new-contract',
            icon: <Plus />,
            label: 'Nuevo Contrato',
            color: 'blue',
            onClick: () => router.push('/contracts/new'),
          },
          {
            id: 'commissions',
            icon: <Settings />,
            label: 'Configurar Comisiones',
            color: 'purple',
            onClick: () => router.push('/settings'),
          },
          {
            id: 'reports',
            icon: <BarChart3 />,
            label: 'Generar Reportes',
            color: 'green',
            onClick: () => console.log('Generar reportes'),
          },
          {
            id: 'expirations',
            icon: <CalendarClock />,
            label: 'Ver Vencimientos',
            color: 'orange',
            badge: expiringCount > 0 ? expiringCount : undefined,
            onClick: () => setActiveTab('expiring'),
          },
        ]}
      />

      {/* Alertas de contratos */}
      {(expiringCount > 0 || expiredCount > 0) && (
        <div className={styles.alertsRow}>
          {expiringCount > 0 && (
            <InsightCard
              variant="warning"
              icon={<Clock size={18} />}
              title={`${expiringCount} contrato${expiringCount > 1 ? 's' : ''} por vencer`}
              description="En los próximos 30 días"
              action={{ label: 'Ver contratos', onClick: () => setActiveTab('expiring') }}
            />
          )}
          {expiredCount > 0 && (
            <InsightCard
              variant="error"
              icon={<RefreshCw size={18} />}
              title={`${expiredCount} contrato${expiredCount > 1 ? 's' : ''} vencido${expiredCount > 1 ? 's' : ''}`}
              description="Requieren renovación"
              action={{ label: 'Gestionar', onClick: () => setActiveTab('expired') }}
            />
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <Tabs
        tabs={filterTabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as ContractFilter)}
        variant="underline"
      />

      {/* Search */}
      <div className={styles.toolbar}>
        <Input
          placeholder="Buscar contrato..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search size={18} />}
          className={styles.searchInput}
        />
      </div>

      {/* Contracts List */}
      {filteredContracts.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<FileText />}
              title="No hay contratos"
              description="Comienza creando tu primer contrato de alquiler."
              action={
                <Link href="/contracts/new">
                  <Button leftIcon={<Plus size={16} />}>Crear Contrato</Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Table
              columns={[
                {
                  key: 'apartment',
                  header: 'Propiedad',
                  render: (contract) => (
                    <div className={styles.contractCell}>
                      <Home size={16} className={styles.cellIcon} />
                      <span className={styles.cellText}>
                        {getApartmentName(contract.apartmentId as number)}
                      </span>
                    </div>
                  ),
                },
                {
                  key: 'tenant',
                  header: 'Inquilino',
                  render: (contract) => (
                    <div className={styles.contractCell}>
                      <Users size={16} className={styles.cellIcon} />
                      <span className={styles.cellText}>
                        {getTenantName(contract.tenantId as number)}
                      </span>
                    </div>
                  ),
                },
                {
                  key: 'dates',
                  header: 'Período',
                  render: (contract) => (
                    <span className={styles.dateText}>
                      {formatDate(contract.startDate as Date)} -{' '}
                      {formatDate(contract.endDate as Date)}
                    </span>
                  ),
                },
                {
                  key: 'amount',
                  header: 'Monto',
                  align: 'right',
                  render: (contract) => (
                    <span className={styles.amountText}>
                      {formatCurrency(contract.initialAmount as number)}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Estado',
                  align: 'center',
                  render: (contract) =>
                    getStatusBadge(
                      getContractStatus(contract as { startDate: Date; endDate: Date })
                    ),
                },
              ]}
              data={filteredContracts as unknown as Record<string, unknown>[]}
              onRowClick={(contract) => router.push(`/contracts/${contract.id}`)}
            />
          </CardContent>
        </Card>
      )}
    </>
  )
}
