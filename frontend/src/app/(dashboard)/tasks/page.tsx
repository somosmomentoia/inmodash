'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckSquare, Users } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { TasksContent } from './tasks-content'
import { ContactsContent } from './contacts-content'
import styles from './page.module.css'

type TabType = 'tasks' | 'contacts'

function TasksPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab') as TabType | null
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'tasks')

  // React to URL changes
  useEffect(() => {
    if (tabParam && (tabParam === 'tasks' || tabParam === 'contacts')) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Handle tab change - update URL to keep it in sync
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
    // Update URL without full navigation
    if (tab === 'tasks') {
      router.replace('/tasks', { scroll: false })
    } else {
      router.replace(`/tasks?tab=${tab}`, { scroll: false })
    }
  }, [router])

  return (
    <>
      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'tasks' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('tasks')}
        >
          <CheckSquare size={18} />
          Tareas
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'contacts' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('contacts')}
        >
          <Users size={18} />
          Contactos
        </button>
      </div>

      {/* Content */}
      {activeTab === 'tasks' ? <TasksContent /> : <ContactsContent />}
    </>
  )
}

export default function TasksPage() {
  return (
    <DashboardLayout title="Tareas" subtitle="Gestiona tus tareas y contactos">
      <Suspense fallback={<div className={styles.loading}>Cargando...</div>}>
        <TasksPageContent />
      </Suspense>
    </DashboardLayout>
  )
}
