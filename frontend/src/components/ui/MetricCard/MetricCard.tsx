'use client'

import { HTMLAttributes, forwardRef, useState } from 'react'
import styles from './MetricCard.module.css'

export interface MetricCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'blue' | 'purple' | 'green' | 'orange' | 'cyan'
  icon?: React.ReactNode
  value: string | number
  label: string
  subtitle?: string
  sparkline?: number[]
  trend?: {
    value: number
    isPositive: boolean
  }
  interactive?: boolean
  onClick?: () => void
}

export const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      variant = 'blue',
      icon,
      value,
      label,
      subtitle,
      sparkline,
      trend,
      interactive = false,
      onClick,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = useState(false)

    const classNames = [
      styles.card,
      styles[variant],
      interactive && styles.interactive,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div
        ref={ref}
        className={classNames}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        <div className={styles.glow} />
        <div className={styles.header}>
          {icon && <div className={styles.iconWrapper}>{icon}</div>}
          {trend && (
            <span className={`${styles.trend} ${trend.isPositive ? styles.trendUp : styles.trendDown}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        <div className={styles.content}>
          <span className={styles.value}>{value}</span>
          <span className={styles.label}>{label}</span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        {sparkline && sparkline.length > 0 && (
          <div className={styles.sparkline}>
            <svg viewBox={`0 0 ${sparkline.length * 10} 40`} preserveAspectRatio="none">
              <defs>
                <linearGradient id={`gradient-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={generateSparklinePath(sparkline, sparkline.length * 10, 40)}
                fill={`url(#gradient-${variant})`}
                className={styles.sparklineArea}
              />
              <path
                d={generateSparklineLine(sparkline, sparkline.length * 10, 40)}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={styles.sparklineLine}
              />
            </svg>
          </div>
        )}
        {interactive && (
          <div className={styles.arrow}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    )
  }
)

function generateSparklineLine(data: number[], width: number, height: number): string {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)
  
  return data
    .map((val, i) => {
      const x = i * stepX
      const y = height - ((val - min) / range) * (height - 4) - 2
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

function generateSparklinePath(data: number[], width: number, height: number): string {
  const line = generateSparklineLine(data, width, height)
  return `${line} L ${width} ${height} L 0 ${height} Z`
}

MetricCard.displayName = 'MetricCard'
