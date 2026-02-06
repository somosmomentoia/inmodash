'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Home,
  Calendar,
  ChevronRight,
  UserCheck,
  UserX,
  Clock,
  Eye,
  FileCheck,
  MessageSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  Badge,
  Tabs,
  EmptyState,
  StatCard,
} from '@/components/ui'
import { DashboardLayout } from '@/components/layout'
import { prospectsService } from '@/services/prospects.service'
import {
  Prospect,
  ProspectStatus,
  ProspectSource,
  PROSPECT_STATUS_LABELS,
  PROSPECT_SOURCE_LABELS,
  PROSPECT_STATUS_COLORS,
} from '@/types'
import styles from './prospects.module.css'

type ProspectFilter = 'all' | ProspectStatus

export default function ProspectsPage() {
  const router = useRouter()
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ProspectFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  useEffect(() => {
    loadProspects()
  }, [])

  const loadProspects = async () => {
    try {
      setLoading(true)
      const data = await prospectsService.getAll()
      setProspects(data)
    } catch (error) {
      console.error('Error loading prospects:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProspects = useMemo(() => {
    return prospects
      .filter((prospect) => {
        if (activeTab !== 'all' && prospect.status !== activeTab) return false
        if (sourceFilter !== 'all' && prospect.source !== sourceFilter) return false
        if (searchTerm) {
          const search = searchTerm.toLowerCase()
          return (
            prospect.fullName.toLowerCase().includes(search) ||
            prospect.phone.toLowerCase().includes(search) ||
            prospect.email?.toLowerCase().includes(search) ||
            prospect.apartment?.nomenclature?.toLowerCase().includes(search)
          )
        }
        return true
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
      })
  }, [prospects, activeTab, sourceFilter, searchTerm, sortOrder])

  const stats = useMemo(() => {
    const newCount = prospects.filter((p) => p.status === 'new').length
    const contactedCount = prospects.filter((p) => p.status === 'contacted').length
    const visitedCount = prospects.filter((p) => p.status === 'visited').length
    const approvedCount = prospects.filter((p) => p.status === 'approved').length
    const convertedCount = prospects.filter((p) => p.status === 'converted').length

    return { newCount, contactedCount, visitedCount, approvedCount, convertedCount }
  }, [prospects])

  const tabs = [
    { id: 'all', label: 'Todos', badge: prospects.length },
    { id: 'new', label: 'Nuevos', badge: stats.newCount },
    { id: 'contacted', label: 'Contactados', badge: stats.contactedCount },
    { id: 'visited', label: 'Visitaron', badge: stats.visitedCount },
    { id: 'approved', label: 'Aprobados', badge: stats.approvedCount },
    { id: 'converted', label: 'Convertidos', badge: stats.convertedCount },
  ]

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusIcon = (status: ProspectStatus) => {
    switch (status) {
      case 'new':
        return <Clock size={16} />
      case 'contacted':
        return <MessageSquare size={16} />
      case 'visited':
        return <Eye size={16} />
      case 'under_review':
        return <FileCheck size={16} />
      case 'approved':
        return <UserCheck size={16} />
      case 'rejected':
        return <UserX size={16} />
      case 'converted':
        return <UserCheck size={16} />
      default:
        return <Users size={16} />
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Prospectos" subtitle="Gestiona los interesados en tus propiedades">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Cargando prospectos...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="Prospectos" 
      subtitle="Gestiona los interesados en tus propiedades"
    >
      {/* Action Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-xl)' }}>
        <Button
          onClick={() => router.push('/prospects/new')}
          leftIcon={<Plus size={18} />}
        >
          Nuevo Prospecto
        </Button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Nuevos"
          value={stats.newCount}
          icon={<Clock size={18} />}
          variant="primary"
        />
        <StatCard
          title="En Proceso"
          value={stats.contactedCount + stats.visitedCount}
          icon={<MessageSquare size={18} />}
          variant="warning"
        />
        <StatCard
          title="Aprobados"
          value={stats.approvedCount}
          icon={<UserCheck size={18} />}
          variant="success"
        />
        <StatCard
          title="Convertidos"
          value={stats.convertedCount}
          icon={<Users size={18} />}
          variant="primary"
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as ProspectFilter)}
        variant="underline"
      />

      {/* Filters */}
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <Input
            placeholder="Buscar prospecto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={18} />}
            className={styles.searchInput}
          />
          <Select
            options={[
              { value: 'all', label: 'Todos los orígenes' },
              ...Object.entries(PROSPECT_SOURCE_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            size="sm"
          />
          <button
            className={styles.sortButton}
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            title={sortOrder === 'desc' ? 'Más recientes primero' : 'Más antiguos primero'}
          >
            {sortOrder === 'desc' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
            <span>Fecha</span>
          </button>
        </div>
      </div>

      {/* Prospects List */}
      {filteredProspects.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Users />}
              title="No hay prospectos"
              description={
                activeTab === 'all'
                  ? 'Aún no tienes prospectos registrados. ¡Agrega el primero!'
                  : 'No se encontraron prospectos con los filtros seleccionados.'
              }
              action={
                activeTab === 'all' && (
                  <Button onClick={() => router.push('/prospects/new')} leftIcon={<Plus size={16} />}>
                    Nuevo Prospecto
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <div className={styles.prospectsList}>
              {filteredProspects.map((prospect) => (
                <div
                  key={prospect.id}
                  className={styles.prospectItem}
                  onClick={() => router.push(`/prospects/${prospect.id}`)}
                >
                  <div className={styles.prospectIcon}>
                    {getStatusIcon(prospect.status)}
                  </div>
                  <div className={styles.prospectInfo}>
                    <div className={styles.prospectHeader}>
                      <span className={styles.prospectName}>{prospect.fullName}</span>
                      <Badge variant={PROSPECT_STATUS_COLORS[prospect.status] as any}>
                        {PROSPECT_STATUS_LABELS[prospect.status]}
                      </Badge>
                    </div>
                    <div className={styles.prospectMeta}>
                      <span className={styles.prospectContact}>
                        <Phone size={12} />
                        {prospect.phone}
                      </span>
                      {prospect.email && (
                        <span className={styles.prospectContact}>
                          <Mail size={12} />
                          {prospect.email}
                        </span>
                      )}
                      {prospect.apartment && (
                        <span className={styles.prospectProperty}>
                          <Home size={12} />
                          {prospect.apartment.nomenclature}
                        </span>
                      )}
                    </div>
                    <div className={styles.prospectFooter}>
                      <span className={styles.prospectSource}>
                        {PROSPECT_SOURCE_LABELS[prospect.source]}
                      </span>
                      <span className={styles.prospectDate}>
                        <Calendar size={12} />
                        {formatDate(prospect.createdAt)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={20} className={styles.chevron} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  )
}
