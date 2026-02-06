'use client'

import { HTMLAttributes, forwardRef, useState, useEffect, useRef } from 'react'
import styles from './TrendCard.module.css'

export interface TrendCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  value: number
  previousValue: number
  format?: 'currency' | 'percentage' | 'number'
  currency?: string
  data: number[]
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'cyan'
  animated?: boolean
  showPulse?: boolean
}

export const TrendCard = forwardRef<HTMLDivElement, TrendCardProps>(
  (
    {
      title,
      value,
      previousValue,
      format = 'number',
      currency = '$',
      data,
      color = 'blue',
      animated = true,
      showPulse = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState(animated ? 0 : value)
    const [isVisible, setIsVisible] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    const change = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0
    const isPositive = change >= 0

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        },
        { threshold: 0.1 }
      )

      if (cardRef.current) {
        observer.observe(cardRef.current)
      }

      return () => observer.disconnect()
    }, [])

    useEffect(() => {
      if (!animated || !isVisible) return

      const duration = 1500
      const steps = 60
      const stepValue = value / steps
      let current = 0

      const timer = setInterval(() => {
        current += stepValue
        if (current >= value) {
          setDisplayValue(value)
          clearInterval(timer)
        } else {
          setDisplayValue(current)
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }, [value, animated, isVisible])

    const formatValue = (val: number) => {
      if (format === 'currency') {
        return `${currency}${val.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
      }
      if (format === 'percentage') {
        return `${val.toFixed(1)}%`
      }
      return val.toLocaleString('es-AR', { maximumFractionDigits: 0 })
    }

    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    return (
      <div
        ref={(node) => {
          cardRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        className={`${styles.card} ${styles[color]} ${isVisible ? styles.visible : ''} ${className}`}
        {...props}
      >
        {showPulse && <div className={styles.pulse} />}
        <div className={styles.background}>
          <svg viewBox={`0 0 200 80`} preserveAspectRatio="none" className={styles.bgChart}>
            <defs>
              <linearGradient id={`trendGrad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={generateAreaPath(data, 200, 80, min, range)}
              fill={`url(#trendGrad-${color})`}
              className={styles.areaPath}
            />
            <path
              d={generateLinePath(data, 200, 80, min, range)}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.linePath}
            />
          </svg>
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.title}>{title}</span>
            <div className={`${styles.badge} ${isPositive ? styles.positive : styles.negative}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                {isPositive ? (
                  <path d="M12 19V5M5 12l7-7 7 7" />
                ) : (
                  <path d="M12 5v14M5 12l7 7 7-7" />
                )}
              </svg>
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          </div>

          <div className={styles.valueContainer}>
            <span className={styles.value}>{formatValue(displayValue)}</span>
            <span className={styles.previousValue}>
              vs {formatValue(previousValue)} anterior
            </span>
          </div>
        </div>

        <div className={styles.dots}>
          {data.slice(-5).map((_, i) => (
            <span
              key={i}
              className={styles.dot}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    )
  }
)

function generateLinePath(data: number[], width: number, height: number, min: number, range: number): string {
  const padding = 8
  return data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding
      const y = height - ((val - min) / range) * (height - padding * 2) - padding
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

function generateAreaPath(data: number[], width: number, height: number, min: number, range: number): string {
  const line = generateLinePath(data, width, height, min, range)
  const padding = 8
  const lastX = (1) * (width - padding * 2) + padding
  return `${line} L ${lastX} ${height} L ${padding} ${height} Z`
}

TrendCard.displayName = 'TrendCard'
