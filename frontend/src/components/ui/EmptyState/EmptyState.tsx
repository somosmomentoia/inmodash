'use client'

import { HTMLAttributes, forwardRef } from 'react'
import styles from './EmptyState.module.css'

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={`${styles.container} ${className}`} {...props}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
        {action && <div className={styles.action}>{action}</div>}
      </div>
    )
  }
)

EmptyState.displayName = 'EmptyState'
