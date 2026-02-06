'use client'

import { ReactNode } from 'react'
import { Header } from '../Header'
import styles from './DashboardLayout.module.css'

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <>
      <Header title={title} subtitle={subtitle} userName="Usuario" />
      <main className={styles.content}>
        {children}
      </main>
    </>
  )
}
