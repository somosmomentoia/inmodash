'use client'

import { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { useRequireAuth } from '@/hooks/useAuth'
import styles from './dashboard-layout.module.css'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardGroupLayout({ children }: DashboardLayoutProps) {
  const { isReady, isLoading } = useRequireAuth('/login')

  // Show loading state while checking authentication
  if (isLoading || !isReady) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Verificando sesión...</p>
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.mainArea}>
        {children}
      </div>
    </div>
  )
}
