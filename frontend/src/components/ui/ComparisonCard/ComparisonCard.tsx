'use client'

import { HTMLAttributes, forwardRef, useState } from 'react'
import styles from './ComparisonCard.module.css'

export interface ComparisonCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  periods: { id: string; label: string }[]
  defaultPeriod?: string
  onPeriodChange?: (period: string) => void
  current: {
    value: string | number
    label: string
  }
  previous: {
    value: string | number
    label: string
  }
  change: {
    value: number
    isPositive: boolean
  }
  chart?: number[]
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'cyan'
}

export const ComparisonCard = forwardRef<HTMLDivElement, ComparisonCardProps>(
  (
    {
      title,
      periods,
      defaultPeriod,
      onPeriodChange,
      current,
      previous,
      change,
      chart,
      color = 'blue',
      className = '',
      ...props
    },
    ref
  ) => {
    const [activePeriod, setActivePeriod] = useState(defaultPeriod || periods[0]?.id || '')

    const handlePeriodChange = (period: string) => {
      setActivePeriod(period)
      onPeriodChange?.(period)
    }

    return (
      <div ref={ref} className={`${styles.card} ${styles[color]} ${className}`} {...props}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {periods.length > 0 && (
            <div className={styles.periodSwitch}>
              {periods.map((period) => (
                <button
                  key={period.id}
                  className={`${styles.periodButton} ${activePeriod === period.id ? styles.periodActive : ''}`}
                  onClick={() => handlePeriodChange(period.id)}
                >
                  {period.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.comparison}>
          <div className={styles.currentPeriod}>
            <span className={styles.currentValue}>{current.value}</span>
            <span className={styles.currentLabel}>{current.label}</span>
          </div>

          <div className={styles.changeIndicator}>
            <div className={`${styles.changeBadge} ${change.isPositive ? styles.positive : styles.negative}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                {change.isPositive ? (
                  <path d="M12 19V5M5 12l7-7 7 7" />
                ) : (
                  <path d="M12 5v14M5 12l7 7 7-7" />
                )}
              </svg>
              <span>{Math.abs(change.value)}%</span>
            </div>
            <span className={styles.vsLabel}>vs período anterior</span>
          </div>

          <div className={styles.previousPeriod}>
            <span className={styles.previousValue}>{previous.value}</span>
            <span className={styles.previousLabel}>{previous.label}</span>
          </div>
        </div>

        {chart && chart.length > 0 && (
          <div className={styles.chartContainer}>
            <svg viewBox={`0 0 ${chart.length * 20} 60`} className={styles.chart} preserveAspectRatio="none">
              <defs>
                <linearGradient id={`compGradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={generateAreaPath(chart, chart.length * 20, 60)}
                fill={`url(#compGradient-${color})`}
              />
              <path
                d={generateLinePath(chart, chart.length * 20, 60)}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    )
  }
)

function generateLinePath(data: number[], width: number, height: number): string {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const padding = 4
  
  return data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding
      const y = height - ((val - min) / range) * (height - padding * 2) - padding
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

function generateAreaPath(data: number[], width: number, height: number): string {
  const line = generateLinePath(data, width, height)
  const padding = 4
  const lastX = (1) * (width - padding * 2) + padding
  return `${line} L ${lastX} ${height} L ${padding} ${height} Z`
}

ComparisonCard.displayName = 'ComparisonCard'
