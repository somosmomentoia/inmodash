'use client'

import { HTMLAttributes, forwardRef } from 'react'
import styles from './ProgressRing.module.css'

export interface ProgressRingProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'success' | 'warning' | 'error'
  label?: string
  showValue?: boolean
}

export const ProgressRing = forwardRef<HTMLDivElement, ProgressRingProps>(
  (
    {
      value,
      max = 100,
      size = 'md',
      color = 'primary',
      label,
      showValue = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    const sizes = {
      sm: { size: 80, stroke: 6 },
      md: { size: 120, stroke: 8 },
      lg: { size: 160, stroke: 10 },
    }
    
    const { size: svgSize, stroke } = sizes[size]
    const radius = (svgSize - stroke) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    const classNames = [styles.container, styles[size], className]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classNames} {...props}>
        <svg
          className={styles.ring}
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
        >
          <circle
            className={styles.background}
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            strokeWidth={stroke}
          />
          <circle
            className={`${styles.progress} ${styles[color]}`}
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
          />
        </svg>
        <div className={styles.content}>
          {showValue && (
            <span className={styles.value}>{Math.round(percentage)}%</span>
          )}
          {label && <span className={styles.label}>{label}</span>}
        </div>
      </div>
    )
  }
)

ProgressRing.displayName = 'ProgressRing'
