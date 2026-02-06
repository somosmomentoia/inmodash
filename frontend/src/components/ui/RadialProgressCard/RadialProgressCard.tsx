'use client'

import { HTMLAttributes, forwardRef, useState, useEffect, useRef } from 'react'
import styles from './RadialProgressCard.module.css'

export interface RadialSegment {
  value: number
  color: string
  label: string
}

export interface RadialProgressCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  segments: RadialSegment[]
  centerValue?: string | number
  centerLabel?: string
  size?: 'sm' | 'md' | 'lg'
  thickness?: number
  animated?: boolean
  showLegend?: boolean
}

export const RadialProgressCard = forwardRef<HTMLDivElement, RadialProgressCardProps>(
  (
    {
      title,
      segments,
      centerValue,
      centerLabel,
      size = 'md',
      thickness = 12,
      animated = true,
      showLegend = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const cardRef = useRef<HTMLDivElement>(null)

    const total = segments.reduce((sum, s) => sum + s.value, 0)

    const sizes = {
      sm: 140,
      md: 180,
      lg: 220,
    }

    const svgSize = sizes[size]
    const radius = (svgSize - thickness) / 2
    const circumference = 2 * Math.PI * radius

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

    let accumulatedOffset = 0

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
        <h3 className={styles.title}>{title}</h3>

        <div className={styles.chartContainer}>
          <svg
            width={svgSize}
            height={svgSize}
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            className={styles.chart}
          >
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius}
              fill="none"
              stroke="var(--bg-tertiary)"
              strokeWidth={thickness}
            />

            {segments.map((segment, index) => {
              const percentage = total > 0 ? (segment.value / total) * 100 : 0
              const strokeLength = (percentage / 100) * circumference
              const offset = accumulatedOffset
              accumulatedOffset += strokeLength

              const isHovered = hoveredIndex === index

              return (
                <circle
                  key={index}
                  cx={svgSize / 2}
                  cy={svgSize / 2}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={isHovered ? thickness + 4 : thickness}
                  strokeDasharray={`${strokeLength} ${circumference}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
                  className={`${styles.segment} ${isVisible && animated ? styles.animatedSegment : ''}`}
                  style={{
                    animationDelay: `${index * 0.15}s`,
                    filter: isHovered ? `drop-shadow(0 0 8px ${segment.color})` : undefined,
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              )
            })}
          </svg>

          <div className={styles.center}>
            {centerValue !== undefined && (
              <span className={styles.centerValue}>{centerValue}</span>
            )}
            {centerLabel && <span className={styles.centerLabel}>{centerLabel}</span>}
          </div>
        </div>

        {showLegend && (
          <div className={styles.legend}>
            {segments.map((segment, index) => {
              const percentage = total > 0 ? ((segment.value / total) * 100).toFixed(1) : 0
              const isHovered = hoveredIndex === index

              return (
                <div
                  key={index}
                  className={`${styles.legendItem} ${isHovered ? styles.legendHovered : ''}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <span className={styles.legendDot} style={{ background: segment.color }} />
                  <span className={styles.legendLabel}>{segment.label}</span>
                  <span className={styles.legendValue}>{percentage}%</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
)

RadialProgressCard.displayName = 'RadialProgressCard'
