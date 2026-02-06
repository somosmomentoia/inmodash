'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { FileText, Users, Shield } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Tabs } from '@/components/ui'
import ContractsContent from './contracts-content'
import ClientsContent from './clients-content'
import GuarantorsContent from './guarantors-content'

type TabType = 'contracts' | 'clients' | 'guarantors'

function ContractsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab') as TabType | null
  const [activeTab, setActiveTab] = useState<TabType>(tabParam && ['contracts', 'clients', 'guarantors'].includes(tabParam) ? tabParam : 'contracts')

  useEffect(() => {
    if (tabParam && ['contracts', 'clients', 'guarantors'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabType)
    if (tab === 'contracts') {
      router.replace('/contracts', { scroll: false })
    } else {
      router.replace(`/contracts?tab=${tab}`, { scroll: false })
    }
  }, [router])

  const tabs = [
    { id: 'contracts', label: 'Contratos', icon: <FileText size={16} /> },
    { id: 'clients', label: 'Inquilinos', icon: <Users size={16} /> },
    { id: 'guarantors', label: 'Garantes', icon: <Shield size={16} /> },
  ]

  return (
    <>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} variant="underline" />

      <div style={{ marginTop: 'var(--spacing-2xl)' }}>
        {activeTab === 'contracts' && <ContractsContent />}
        {activeTab === 'clients' && <ClientsContent />}
        {activeTab === 'guarantors' && <GuarantorsContent />}
      </div>
    </>
  )
}

export default function ContractsPage() {
  return (
    <DashboardLayout title="Contratos" subtitle="Gestión de contratos, inquilinos y garantes">
      <Suspense fallback={<div>Cargando...</div>}>
        <ContractsPageContent />
      </Suspense>
    </DashboardLayout>
  )
}
