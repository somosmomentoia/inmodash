'use client'

import { HTMLAttributes, forwardRef, ReactNode } from 'react'
import styles from './StatusCard.module.css'

export interface StatusCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  status: 'online' | 'offline' | 'warning' | 'error' | 'maintenance'
  statusText?: string
  icon?: ReactNode
  metrics?: { label: string; value: string | number }[]
  lastUpdated?: string
  animated?: boolean
}

export const StatusCard = forwardRef<HTMLDivElement, StatusCardProps>(
  (
    {
      title,
      status,
      statusText,
      icon,
      metrics,
      lastUpdated,
      animated = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const statusLabels = {
      online: 'Operativo',
      offline: 'Sin conexión',
      warning: 'Atención',
      error: 'Error',
      maintenance: 'Mantenimiento',
    }

    return (
      <div ref={ref} className={`${styles.card} ${styles[status]} ${className}`} {...props}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            {icon && <div className={styles.icon}>{icon}</div>}
            <h3 className={styles.title}>{title}</h3>
          </div>
          <div className={`${styles.statusBadge} ${animated ? styles.animated : ''}`}>
            <span className={styles.statusDot} />
            <span className={styles.statusText}>{statusText || statusLabels[status]}</span>
          </div>
        </div>

        {metrics && metrics.length > 0 && (
          <div className={styles.metrics}>
            {metrics.map((metric, index) => (
              <div key={index} className={styles.metric}>
                <span className={styles.metricValue}>{metric.value}</span>
                <span className={styles.metricLabel}>{metric.label}</span>
              </div>
            ))}
          </div>
        )}

        {lastUpdated && (
          <div className={styles.footer}>
            <span className={styles.lastUpdated}>
              Última actualización: {lastUpdated}
            </span>
          </div>
        )}

        <div className={styles.pulseRing} />
      </div>
    )
  }
)

StatusCard.displayName = 'StatusCard'
