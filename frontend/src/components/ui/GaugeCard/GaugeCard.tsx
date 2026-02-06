'use client'

import { HTMLAttributes, forwardRef, useState, useEffect, useRef } from 'react'
import styles from './GaugeCard.module.css'

export interface GaugeCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  value: number
  maxValue?: number
  unit?: string
  segments?: { value: number; color: string; label: string }[]
  thresholds?: { warning: number; danger: number }
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

export const GaugeCard = forwardRef<HTMLDivElement, GaugeCardProps>(
  (
    {
      title,
      value,
      maxValue = 100,
      unit = '%',
      segments,
      thresholds = { warning: 70, danger: 90 },
      size = 'md',
      animated = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState(animated ? 0 : value)
    const [isVisible, setIsVisible] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    const percentage = Math.min((value / maxValue) * 100, 100)
    const displayPercentage = Math.min((displayValue / maxValue) * 100, 100)

    const getColor = () => {
      if (percentage >= thresholds.danger) return '#EF4444'
      if (percentage >= thresholds.warning) return '#F59E0B'
      return '#10B981'
    }

    const getStatus = () => {
      if (percentage >= thresholds.danger) return 'Crítico'
      if (percentage >= thresholds.warning) return 'Atención'
      return 'Normal'
    }

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setIsVisible(true)
        },
        { threshold: 0.1 }
      )

      if (cardRef.current) observer.observe(cardRef.current)
      return () => observer.disconnect()
    }, [])

    useEffect(() => {
      if (!animated || !isVisible) return

      const duration = 1200
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

    const sizes = {
      sm: { size: 120, stroke: 10, fontSize: '1.5rem' },
      md: { size: 160, stroke: 12, fontSize: '2rem' },
      lg: { size: 200, stroke: 14, fontSize: '2.5rem' },
    }

    const { size: svgSize, stroke, fontSize } = sizes[size]
    const radius = (svgSize - stroke) / 2
    const circumference = radius * Math.PI
    const offset = circumference - (displayPercentage / 100) * circumference

    return (
      <div
        ref={(node) => {
          cardRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        className={`${styles.card} ${isVisible ? styles.visible : ''} ${className}`}
        {...props}
      >
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <span className={styles.status} style={{ color: getColor() }}>
            {getStatus()}
          </span>
        </div>

        <div className={styles.gaugeContainer}>
          <svg
            width={svgSize}
            height={svgSize / 2 + stroke}
            viewBox={`0 0 ${svgSize} ${svgSize / 2 + stroke}`}
            className={styles.gauge}
          >
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
              <filter id="gaugeShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={getColor()} floodOpacity="0.3" />
              </filter>
            </defs>

            <path
              d={describeArc(svgSize / 2, svgSize / 2 + stroke / 2, radius, 180, 360)}
              fill="none"
              stroke="var(--bg-tertiary)"
              strokeWidth={stroke}
              strokeLinecap="round"
            />

            <path
              d={describeArc(svgSize / 2, svgSize / 2 + stroke / 2, radius, 180, 360)}
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              filter="url(#gaugeShadow)"
              className={styles.gaugeFill}
            />

            <circle
              cx={svgSize / 2 + radius * Math.cos((180 + displayPercentage * 1.8) * Math.PI / 180)}
              cy={svgSize / 2 + stroke / 2 + radius * Math.sin((180 + displayPercentage * 1.8) * Math.PI / 180)}
              r={stroke / 2 + 2}
              fill="white"
              stroke={getColor()}
              strokeWidth="3"
              className={styles.needle}
            />
          </svg>

          <div className={styles.valueContainer}>
            <span className={styles.value} style={{ fontSize }}>
              {displayValue.toFixed(0)}
              <span className={styles.unit}>{unit}</span>
            </span>
          </div>
        </div>

        {segments && (
          <div className={styles.segments}>
            {segments.map((segment, i) => (
              <div key={i} className={styles.segment}>
                <span className={styles.segmentDot} style={{ background: segment.color }} />
                <span className={styles.segmentLabel}>{segment.label}</span>
                <span className={styles.segmentValue}>{segment.value}{unit}</span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.scale}>
          <span>0</span>
          <span>{maxValue / 2}</span>
          <span>{maxValue}</span>
        </div>
      </div>
    )
  }
)

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

GaugeCard.displayName = 'GaugeCard'
