'use client'

import { HTMLAttributes, forwardRef } from 'react'
import styles from './InsightCard.module.css'

export interface InsightCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error' | 'tip'
  icon?: React.ReactNode
  title: string
  description?: string
  metric?: {
    value: string | number
    label: string
  }
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
  onDismiss?: () => void
}

export const InsightCard = forwardRef<HTMLDivElement, InsightCardProps>(
  (
    {
      variant = 'info',
      icon,
      title,
      description,
      metric,
      action,
      dismissible = false,
      onDismiss,
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = [styles.card, styles[variant], className]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classNames} {...props}>
        <div className={styles.accent} />
        <div className={styles.content}>
          <div className={styles.header}>
            {icon && <div className={styles.icon}>{icon}</div>}
            <div className={styles.text}>
              <h4 className={styles.title}>{title}</h4>
              {description && <p className={styles.description}>{description}</p>}
            </div>
            {dismissible && (
              <button className={styles.dismiss} onClick={onDismiss}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {(metric || action) && (
            <div className={styles.footer}>
              {metric && (
                <div className={styles.metric}>
                  <span className={styles.metricValue}>{metric.value}</span>
                  <span className={styles.metricLabel}>{metric.label}</span>
                </div>
              )}
              {action && (
                <button className={styles.action} onClick={action.onClick}>
                  {action.label}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)

InsightCard.displayName = 'InsightCard'
