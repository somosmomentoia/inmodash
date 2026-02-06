'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Wallet, Calculator, PiggyBank, TrendingUp } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Tabs } from '@/components/ui'
import SettlementsContent from './settlements-content'
import AccountingContent from './accounting-content'

type TabType = 'accounting' | 'settlements'

function FinancesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab') as TabType | null
  const [activeTab, setActiveTab] = useState<TabType>(tabParam && ['accounting', 'settlements'].includes(tabParam) ? tabParam : 'accounting')

  useEffect(() => {
    if (tabParam && ['accounting', 'settlements'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabType)
    if (tab === 'accounting') {
      router.replace('/finances', { scroll: false })
    } else {
      router.replace(`/finances?tab=${tab}`, { scroll: false })
    }
  }, [router])

  const tabs = [
    { id: 'accounting', label: 'Contabilidad', icon: <Calculator size={16} /> },
    { id: 'settlements', label: 'Liquidaciones', icon: <PiggyBank size={16} /> },
  ]

  return (
    <>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} variant="underline" />

      <div style={{ marginTop: 'var(--spacing-2xl)' }}>
        {activeTab === 'settlements' && <SettlementsContent />}
        {activeTab === 'accounting' && <AccountingContent />}
      </div>
    </>
  )
}

export default function FinancesPage() {
  return (
    <DashboardLayout title="Finanzas" subtitle="Liquidaciones y contabilidad">
      <Suspense fallback={<div>Cargando...</div>}>
        <FinancesPageContent />
      </Suspense>
    </DashboardLayout>
  )
}
