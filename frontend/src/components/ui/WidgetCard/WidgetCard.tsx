'use client'

import { HTMLAttributes, forwardRef, ReactNode } from 'react'
import styles from './WidgetCard.module.css'

export interface WidgetItem {
  id: string
  icon: ReactNode
  label: string
  value?: string | number
  badge?: string | number
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'cyan' | 'red'
  onClick?: () => void
}

export interface WidgetCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  items: WidgetItem[]
  columns?: 2 | 3 | 4
  variant?: 'default' | 'compact' | 'icon-only'
}

export const WidgetCard = forwardRef<HTMLDivElement, WidgetCardProps>(
  (
    {
      title,
      subtitle,
      items,
      columns = 4,
      variant = 'default',
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
        {(title || subtitle) && (
          <div className={styles.header}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        )}
        <div
          className={styles.grid}
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              className={`${styles.item} ${item.color ? styles[item.color] : styles.blue}`}
              onClick={item.onClick}
            >
              <div className={styles.iconWrapper}>
                {item.icon}
                {item.badge !== undefined && (
                  <span className={styles.badge}>{item.badge}</span>
                )}
              </div>
              {variant !== 'icon-only' && (
                <>
                  <span className={styles.label}>{item.label}</span>
                  {item.value !== undefined && variant === 'default' && (
                    <span className={styles.value}>{item.value}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }
)

WidgetCard.displayName = 'WidgetCard'
