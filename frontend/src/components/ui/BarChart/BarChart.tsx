'use client'

import { HTMLAttributes, forwardRef } from 'react'
import styles from './BarChart.module.css'

export interface BarChartData {
  label: string
  value: number
  color?: 'primary' | 'success' | 'warning' | 'error'
}

export interface BarChartProps extends HTMLAttributes<HTMLDivElement> {
  data: BarChartData[]
  maxValue?: number
  showValues?: boolean
  horizontal?: boolean
}

export const BarChart = forwardRef<HTMLDivElement, BarChartProps>(
  (
    {
      data,
      maxValue,
      showValues = true,
      horizontal = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const max = maxValue || Math.max(...data.map((d) => d.value))

    const classNames = [
      styles.container,
      horizontal ? styles.horizontal : styles.vertical,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classNames} {...props}>
        {data.map((item, index) => {
          const percentage = (item.value / max) * 100
          const color = item.color || 'primary'

          return (
            <div key={index} className={styles.barGroup}>
              <span className={styles.label}>{item.label}</span>
              <div className={styles.barWrapper}>
                <div
                  className={`${styles.bar} ${styles[color]}`}
                  style={{
                    [horizontal ? 'width' : 'height']: `${percentage}%`,
                  }}
                />
              </div>
              {showValues && (
                <span className={styles.value}>{item.value.toLocaleString()}</span>
              )}
            </div>
          )
        })}
      </div>
    )
  }
)

BarChart.displayName = 'BarChart'
