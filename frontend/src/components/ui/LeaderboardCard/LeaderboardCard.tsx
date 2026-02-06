'use client'

import { HTMLAttributes, forwardRef, useState, ReactNode } from 'react'
import styles from './LeaderboardCard.module.css'

export interface LeaderboardItem {
  id: string
  rank: number
  name: string
  value: string | number
  change?: number
  avatar?: ReactNode
  badge?: string
  highlighted?: boolean
}

export interface LeaderboardCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  items: LeaderboardItem[]
  valueLabel?: string
  showMedals?: boolean
  animated?: boolean
}

export const LeaderboardCard = forwardRef<HTMLDivElement, LeaderboardCardProps>(
  (
    {
      title,
      subtitle,
      items,
      valueLabel = 'Valor',
      showMedals = true,
      animated = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null)

    const getMedalColor = (rank: number) => {
      if (rank === 1) return '#FFD700'
      if (rank === 2) return '#C0C0C0'
      if (rank === 3) return '#CD7F32'
      return null
    }

    return (
      <div ref={ref} className={`${styles.card} ${className}`} {...props}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>{title}</h3>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <span className={styles.valueHeader}>{valueLabel}</span>
        </div>

        <div className={styles.list}>
          {items.map((item, index) => {
            const medalColor = showMedals ? getMedalColor(item.rank) : null
            const isHovered = hoveredId === item.id

            return (
              <div
                key={item.id}
                className={`${styles.item} ${item.highlighted ? styles.highlighted : ''} ${isHovered ? styles.hovered : ''}`}
                style={animated ? { animationDelay: `${index * 0.05}s` } : undefined}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className={styles.rankContainer}>
                  {medalColor ? (
                    <div className={styles.medal} style={{ background: medalColor }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </div>
                  ) : (
                    <span className={styles.rank}>{item.rank}</span>
                  )}
                </div>

                <div className={styles.info}>
                  {item.avatar && <div className={styles.avatar}>{item.avatar}</div>}
                  <div className={styles.nameContainer}>
                    <span className={styles.name}>{item.name}</span>
                    {item.badge && <span className={styles.badge}>{item.badge}</span>}
                  </div>
                </div>

                <div className={styles.valueContainer}>
                  <span className={styles.value}>{item.value}</span>
                  {item.change !== undefined && (
                    <span className={`${styles.change} ${item.change >= 0 ? styles.positive : styles.negative}`}>
                      {item.change >= 0 ? '↑' : '↓'} {Math.abs(item.change)}
                    </span>
                  )}
                </div>

                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${(typeof item.value === 'number' ? item.value / (items[0]?.value as number || 1) : 1) * 100}%`,
                      background: medalColor || 'var(--accent-primary)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)

LeaderboardCard.displayName = 'LeaderboardCard'
