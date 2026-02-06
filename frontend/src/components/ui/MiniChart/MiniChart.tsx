'use client'

import { HTMLAttributes, forwardRef } from 'react'
import styles from './MiniChart.module.css'

export interface MiniChartProps extends HTMLAttributes<HTMLDivElement> {
  data: number[]
  color?: 'primary' | 'success' | 'warning' | 'error'
  height?: number
  showArea?: boolean
}

export const MiniChart = forwardRef<HTMLDivElement, MiniChartProps>(
  (
    {
      data,
      color = 'primary',
      height = 60,
      showArea = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return `${x},${y}`
    })
    
    const linePath = `M ${points.join(' L ')}`
    const areaPath = `M 0,100 L ${points.join(' L ')} L 100,100 Z`

    const classNames = [styles.container, className].filter(Boolean).join(' ')

    return (
      <div ref={ref} className={classNames} style={{ height }} {...props}>
        <svg
          className={styles.chart}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {showArea && (
            <path
              className={`${styles.area} ${styles[color]}`}
              d={areaPath}
            />
          )}
          <path
            className={`${styles.line} ${styles[`${color}Line`]}`}
            d={linePath}
            fill="none"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    )
  }
)

MiniChart.displayName = 'MiniChart'
