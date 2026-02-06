'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import styles from './StatCard.module.css'

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    label?: string
  }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      title,
      value,
      icon,
      trend,
      variant = 'default',
      size = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.statCard,
      styles[variant],
      styles[size],
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const isPositive = trend && trend.value >= 0

    return (
      <div ref={ref} className={classNames} {...props}>
        <div className={styles.header}>
          {icon && <div className={styles.icon}>{icon}</div>}
          <span className={styles.title}>{title}</span>
        </div>
        
        <div className={styles.valueRow}>
          <span className={styles.value}>{value}</span>
          {trend && (
            <div className={`${styles.trend} ${isPositive ? styles.trendUp : styles.trendDown}`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{isPositive ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>

        {trend?.label && (
          <span className={styles.trendLabel}>{trend.label}</span>
        )}
      </div>
    )
  }
)

StatCard.displayName = 'StatCard'
