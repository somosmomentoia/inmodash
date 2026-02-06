'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Building2, Home, User, Key } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Tabs } from '@/components/ui'
import OwnersContent from './owners-content'
import BuildingsContent from './buildings-content'
import UnitsContent from './units-content'
import RentalsContent from './rentals-content'

type TabType = 'rentals' | 'owners' | 'buildings' | 'units'

function PropertiesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab') as TabType | null
  const [activeTab, setActiveTab] = useState<TabType>(tabParam && ['rentals', 'owners', 'buildings', 'units'].includes(tabParam) ? tabParam : 'rentals')

  useEffect(() => {
    if (tabParam && ['rentals', 'owners', 'buildings', 'units'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabType)
    if (tab === 'rentals') {
      router.replace('/properties', { scroll: false })
    } else {
      router.replace(`/properties?tab=${tab}`, { scroll: false })
    }
  }, [router])

  const tabs = [
    { id: 'rentals', label: 'Propiedades en Alquiler', icon: <Key size={16} /> },
    { id: 'owners', label: 'Propietarios', icon: <User size={16} /> },
    { id: 'buildings', label: 'Edificios', icon: <Building2 size={16} /> },
    { id: 'units', label: 'Unidades', icon: <Home size={16} /> },
  ]

  return (
    <>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} variant="underline" />

      <div style={{ marginTop: 'var(--spacing-2xl)' }}>
        {activeTab === 'rentals' && <RentalsContent />}
        {activeTab === 'owners' && <OwnersContent />}
        {activeTab === 'buildings' && <BuildingsContent />}
        {activeTab === 'units' && <UnitsContent />}
      </div>
    </>
  )
}

export default function PropertiesPage() {
  return (
    <DashboardLayout title="Alquileres" subtitle="Gestión de propiedades, propietarios, edificios y unidades">
      <Suspense fallback={<div>Cargando...</div>}>
        <PropertiesPageContent />
      </Suspense>
    </DashboardLayout>
  )
}
