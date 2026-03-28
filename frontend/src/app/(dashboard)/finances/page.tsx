'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Wallet, Calculator, PiggyBank, TrendingUp, ArrowLeftRight, Users } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Tabs } from '@/components/ui'
import SettlementsContent from './settlements-content'
import AccountingContent from './accounting-content'
import CashFlowContent from './cashflow-content'
import CommissionsContent from './commissions-content'

type TabType = 'accounting' | 'settlements' | 'cashflow' | 'commissions'

const VALID_TABS: TabType[] = ['accounting', 'settlements', 'cashflow', 'commissions']

function FinancesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab') as TabType | null
  const [activeTab, setActiveTab] = useState<TabType>(tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'cashflow')

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabType)
    if (tab === 'cashflow') {
      router.replace('/finances', { scroll: false })
    } else {
      router.replace(`/finances?tab=${tab}`, { scroll: false })
    }
  }, [router])

  const tabs = [
    { id: 'cashflow', label: 'Flujo de Caja', icon: <ArrowLeftRight size={16} /> },
    { id: 'accounting', label: 'Contabilidad', icon: <Calculator size={16} /> },
    { id: 'settlements', label: 'Liquidaciones', icon: <PiggyBank size={16} /> },
    { id: 'commissions', label: 'Comisiones Vendedores', icon: <Users size={16} /> },
  ]

  return (
    <>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} variant="underline" />

      <div style={{ marginTop: 'var(--spacing-2xl)' }}>
        {activeTab === 'cashflow' && <CashFlowContent />}
        {activeTab === 'settlements' && <SettlementsContent />}
        {activeTab === 'accounting' && <AccountingContent />}
        {activeTab === 'commissions' && <CommissionsContent />}
      </div>
    </>
  )
}

export default function FinancesPage() {
  return (
    <DashboardLayout title="Finanzas" subtitle="Flujo de caja, contabilidad y liquidaciones">
      <Suspense fallback={<div>Cargando...</div>}>
        <FinancesPageContent />
      </Suspense>
    </DashboardLayout>
  )
}
