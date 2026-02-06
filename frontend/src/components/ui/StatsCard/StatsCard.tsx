'use client'

import { HTMLAttributes, forwardRef } from 'react'
import styles from './StatsCard.module.css'

export interface StatsCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient'
  icon?: React.ReactNode
  value: string | number
  label: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(
  (
    {
      variant = 'default',
      icon,
      value,
      label,
      trend,
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
        {icon && <div className={styles.iconWrapper}>{icon}</div>}
        <div className={styles.content}>
          <span className={styles.value}>{value}</span>
          <span className={styles.label}>{label}</span>
          {trend && (
            <span
              className={`${styles.trend} ${
                trend.isPositive ? styles.trendPositive : styles.trendNegative
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
    )
  }
)

StatsCard.displayName = 'StatsCard'
