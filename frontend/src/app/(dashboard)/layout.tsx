'use client'

import { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { useRequireAuth } from '@/hooks/useAuth'
import styles from './dashboard-layout.module.css'

interface DashboardLayoutProps {
  children: ReactNode
}

function DashboardContent({ children }: DashboardLayoutProps) {
  const { isReady, isLoading } = useRequireAuth('/login')
  const { isExpanded, isPinned } = useSidebar()

  // Show loading state while checking authentication
  if (isLoading || !isReady) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Verificando sesión...</p>
      </div>
    )
  }

  // Solo aplicar efecto cuando está expandido pero NO fijado (hover temporal)
  const showOverlay = isExpanded && !isPinned

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={`${styles.mainArea} ${showOverlay ? styles.mainAreaBlurred : ''}`}>
        {children}
      </div>
      <div className={`${styles.overlay} ${showOverlay ? styles.overlayVisible : ''}`} />
    </div>
  )
}

export default function DashboardGroupLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  )
}
