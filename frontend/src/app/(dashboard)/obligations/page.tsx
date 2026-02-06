'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DollarSign, Receipt } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Tabs } from '@/components/ui'
import ObligationsContent from './obligations-content'
import PaymentsContent from './payments-content'

type TabType = 'obligations' | 'payments'

function ObligationsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab') as TabType | null
  const [activeTab, setActiveTab] = useState<TabType>(tabParam && ['obligations', 'payments'].includes(tabParam) ? tabParam : 'obligations')

  // Get filter params from URL
  const statusFilter = searchParams.get('status') || undefined
  const typeFilter = searchParams.get('type') || undefined
  const paidByFilter = searchParams.get('paidBy') || undefined

  useEffect(() => {
    if (tabParam && ['obligations', 'payments'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabType)
    if (tab === 'obligations') {
      router.replace('/obligations', { scroll: false })
    } else {
      router.replace(`/obligations?tab=${tab}`, { scroll: false })
    }
  }, [router])

  const tabs = [
    { id: 'obligations', label: 'Obligaciones', icon: <DollarSign size={16} /> },
    { id: 'payments', label: 'Pagos Registrados', icon: <Receipt size={16} /> },
  ]

  return (
    <>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} variant="underline" />

      <div style={{ marginTop: 'var(--spacing-2xl)' }}>
        {activeTab === 'obligations' && (
          <ObligationsContent 
            initialStatus={statusFilter} 
            initialType={typeFilter}
            initialPaidBy={paidByFilter}
          />
        )}
        {activeTab === 'payments' && <PaymentsContent />}
      </div>
    </>
  )
}

export default function ObligationsPage() {
  return (
    <DashboardLayout title="Cuenta Corriente" subtitle="Gestión de obligaciones y pagos">
      <Suspense fallback={<div>Cargando...</div>}>
        <ObligationsPageContent />
      </Suspense>
    </DashboardLayout>
  )
}
