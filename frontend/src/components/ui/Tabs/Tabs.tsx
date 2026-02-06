'use client'

import { HTMLAttributes, forwardRef, useState } from 'react'
import styles from './Tabs.module.css'

export interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  variant?: 'underline' | 'pills'
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      tabs,
      activeTab,
      onTabChange,
      variant = 'underline',
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = [styles.tabs, styles[variant], className]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classNames} {...props}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
            <span className={styles.label}>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={styles.badge}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
    )
  }
)

Tabs.displayName = 'Tabs'
