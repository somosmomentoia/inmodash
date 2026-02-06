'use client'

import { HTMLAttributes, forwardRef } from 'react'
import styles from './QuickStatsCard.module.css'

export interface QuickStatItem {
  label: string
  value: string | number
  change?: number
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'cyan' | 'red'
}

export interface QuickStatsCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  stats: QuickStatItem[]
  columns?: 2 | 3 | 4
  compact?: boolean
}

export const QuickStatsCard = forwardRef<HTMLDivElement, QuickStatsCardProps>(
  (
    {
      title,
      stats,
      columns = 4,
      compact = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.card,
      compact && styles.compact,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classNames} {...props}>
        {title && <h3 className={styles.title}>{title}</h3>}
        <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {stats.map((stat, index) => (
            <div key={index} className={`${styles.stat} ${stat.color ? styles[stat.color] : ''}`}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
              {stat.change !== undefined && (
                <span className={`${styles.statChange} ${stat.change >= 0 ? styles.positive : styles.negative}`}>
                  {stat.change >= 0 ? '+' : ''}{stat.change}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
)

QuickStatsCard.displayName = 'QuickStatsCard'
