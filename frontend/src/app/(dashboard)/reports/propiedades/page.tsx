'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Download,
  FileText,
  Building2,
  Users,
  Home,
  Search,
  MapPin,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Badge,
  StatCard,
  DataTableReport,
  PeriodSelector,
  FilterChips,
  Input,
} from '@/components/ui'
import { useApartments } from '@/hooks/useApartments'
import { useOwners } from '@/hooks/useOwners'
import { useContracts } from '@/hooks/useContracts'
import styles from './page.module.css'

export default function PropiedadesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { apartments, loading: apartmentsLoading } = useApartments()
  const { owners, loading: ownersLoading } = useOwners()
  const { contracts, loading: contractsLoading } = useContracts()

  const loading = apartmentsLoading || ownersLoading || contractsLoading

  const metrics = useMemo(() => {
    const now = new Date()
    
    // Count by status
    const alquiladas = apartments.filter(a => a.status === 'alquilado').length
    const disponibles = apartments.filter(a => a.status === 'disponible').length
    const enVenta = apartments.filter(a => a.saleStatus === 'en_venta').length
    const mantenimiento = apartments.filter(a => a.status === 'en_refaccion').length

    // Properties data
    const propiedadesData = apartments.map(a => {
      const owner = owners.find(o => o.id === a.ownerId)
      const contract = contracts.find(c => c.apartmentId === a.id && new Date(c.endDate) > now)
      
      return {
        id: a.id,
        nomenclature: a.nomenclature,
        propertyType: a.propertyType,
        status: a.status,
        owner: owner?.name || 'Sin propietario',
        ownerEmail: owner?.email || '',
        address: 'Sin dirección',
        rooms: a.rooms || 0,
        bathrooms: 0,
        surface: a.area || 0,
        rentAmount: contract?.initialAmount || 0,
        contractEnd: contract ? new Date(contract.endDate).toLocaleDateString('es-AR') : '-',
      }
    })

    // Filter by status
    const filteredByStatus = statusFilter === 'all' 
      ? propiedadesData 
      : propiedadesData.filter(p => p.status === statusFilter)

    // Filter by search
    const filteredData = searchQuery
      ? filteredByStatus.filter(p =>
          p.nomenclature.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.address.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : filteredByStatus

    return {
      total: apartments.length,
      alquiladas,
      disponibles,
      enVenta,
      mantenimiento,
      propiedadesData: filteredData,
    }
  }, [apartments, owners, contracts, searchQuery, statusFilter])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'alquilado': return <Badge variant="success">Alquilada</Badge>
      case 'disponible': return <Badge variant="info">Disponible</Badge>
      case 'en_venta': return <Badge variant="warning">En Venta</Badge>
      case 'en_refaccion': return <Badge variant="error">Mantenimiento</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const getPropertyType = (type: string) => {
    switch (type) {
      case 'departamento': return 'Depto'
      case 'casa': return 'Casa'
      case 'local': return 'Local'
      case 'ph': return 'PH'
      case 'oficina': return 'Oficina'
      default: return type
    }
  }

  const statusFilters = [
    { id: 'all', label: 'Todas' },
    { id: 'alquilado', label: 'Alquiladas' },
    { id: 'disponible', label: 'Disponibles' },
    { id: 'en_venta', label: 'En Venta' },
    { id: 'en_refaccion', label: 'Mantenimiento' },
  ]

  if (loading) {
    return (
      <DashboardLayout title="Listado de Propiedades" subtitle="Cargando...">
        <div className={styles.loading}>Cargando datos...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Reportes" subtitle="">
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <button className={styles.backButton} onClick={() => router.push('/reports')}>
          <ArrowLeft size={16} />
          Reportes
        </button>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>Listado de Propiedades</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <FilterChips
            chips={[
              { id: 'owners', label: 'Todos los propietarios', icon: <Users size={14} />, hasDropdown: true },
              { id: 'types', label: 'Todos los tipos', icon: <Building2 size={14} />, hasDropdown: true },
            ]}
            variant="outline"
          />
        </div>
        <div className={styles.headerRight}>
          <Button variant="secondary" leftIcon={<FileText size={16} />}>
            Guardar PDF
          </Button>
          <Button leftIcon={<Download size={16} />}>
            Exportar Excel / CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total Propiedades"
          value={String(metrics.total)}
          icon={<Building2 size={18} />}
          variant="primary"
        />
        <StatCard
          title="Alquiladas"
          value={String(metrics.alquiladas)}
          icon={<Home size={18} />}
          variant="success"
        />
        <StatCard
          title="Disponibles"
          value={String(metrics.disponibles)}
          icon={<MapPin size={18} />}
          variant="primary"
        />
        <StatCard
          title="En Venta"
          value={String(metrics.enVenta)}
          icon={<Building2 size={18} />}
          variant="warning"
        />
      </div>

      {/* Status Filters */}
      <div className={styles.statusFilters}>
        {statusFilters.map(filter => (
          <button
            key={filter.id}
            className={`${styles.statusFilter} ${statusFilter === filter.id ? styles.active : ''}`}
            onClick={() => setStatusFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className={styles.tableHeader}>
        <h3>Propiedades ({metrics.propiedadesData.length})</h3>
        <Input
          placeholder="Buscar propiedades..."
          leftIcon={<Search size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: 250 }}
        />
      </div>

      {/* Table */}
      <DataTableReport
        columns={[
          { key: 'nomenclature', header: 'Propiedad' },
          { key: 'propertyType', header: 'Tipo', render: (item) => getPropertyType(String(item.propertyType)) },
          { key: 'status', header: 'Estado', render: (item) => getStatusBadge(String(item.status)) },
          { key: 'owner', header: 'Propietario' },
          { key: 'address', header: 'Dirección' },
          { key: 'rooms', header: 'Amb.', align: 'center' },
          { key: 'surface', header: 'm²', align: 'center', render: (item) => `${item.surface} m²` },
          { key: 'rentAmount', header: 'Alquiler', align: 'right', render: (item) => (
            Number(item.rentAmount) > 0 
              ? <span style={{ fontWeight: 600 }}>{formatCurrency(Number(item.rentAmount))}</span>
              : '-'
          )},
          { key: 'contractEnd', header: 'Fin Contrato' },
          { key: 'action', header: '', render: (item) => (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push(`/apartments/${item.id}`)}
            >
              Ver →
            </Button>
          )},
        ]}
        data={metrics.propiedadesData as unknown as Record<string, unknown>[]}
        pageSize={15}
      />
    </DashboardLayout>
  )
}
