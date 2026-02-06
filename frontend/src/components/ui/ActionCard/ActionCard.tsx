'use client'

import { HTMLAttributes, forwardRef } from 'react'
import styles from './ActionCard.module.css'

export interface ActionCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'outlined'
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'cyan'
  icon?: React.ReactNode
  title: string
  description?: string
  badge?: string | number
  onClick?: () => void
}

export const ActionCard = forwardRef<HTMLDivElement, ActionCardProps>(
  (
    {
      variant = 'default',
      color = 'blue',
      icon,
      title,
      description,
      badge,
      onClick,
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.card,
      styles[variant],
      styles[color],
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classNames} onClick={onClick} {...props}>
        <div className={styles.iconWrapper}>
          {icon}
          {badge !== undefined && (
            <span className={styles.badge}>{badge}</span>
          )}
        </div>
        <div className={styles.content}>
          <span className={styles.title}>{title}</span>
          {description && <span className={styles.description}>{description}</span>}
        </div>
        <div className={styles.arrow}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    )
  }
)

ActionCard.displayName = 'ActionCard'
