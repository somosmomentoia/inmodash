'use client'

import { HTMLAttributes, forwardRef, useState } from 'react'
import styles from './AnalyticsCard.module.css'

export interface AnalyticsCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  modes?: { id: string; label: string }[]
  defaultMode?: string
  onModeChange?: (mode: string) => void
  data: { label: string; value: number; color?: string }[]
  type?: 'bar' | 'donut' | 'line'
  showLegend?: boolean
  height?: number
}

export const AnalyticsCard = forwardRef<HTMLDivElement, AnalyticsCardProps>(
  (
    {
      title,
      subtitle,
      modes,
      defaultMode,
      onModeChange,
      data,
      type = 'bar',
      showLegend = true,
      height = 200,
      className = '',
      ...props
    },
    ref
  ) => {
    const [activeMode, setActiveMode] = useState(defaultMode || modes?.[0]?.id || '')
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    const handleModeChange = (mode: string) => {
      setActiveMode(mode)
      onModeChange?.(mode)
    }

    const total = data.reduce((sum, item) => sum + item.value, 0)
    const maxValue = Math.max(...data.map((d) => d.value))

    const defaultColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#06B6D4', '#EC4899']

    return (
      <div ref={ref} className={`${styles.card} ${className}`} {...props}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h3 className={styles.title}>{title}</h3>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {modes && modes.length > 0 && (
            <div className={styles.modeSwitch}>
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  className={`${styles.modeButton} ${activeMode === mode.id ? styles.modeActive : ''}`}
                  onClick={() => handleModeChange(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.chartContainer} style={{ height }}>
          {type === 'bar' && (
            <div className={styles.barChart}>
              {data.map((item, index) => {
                const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0
                const color = item.color || defaultColors[index % defaultColors.length]
                return (
                  <div
                    key={index}
                    className={`${styles.barItem} ${hoveredIndex === index ? styles.barHovered : ''}`}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className={styles.barLabel}>{item.label}</div>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${percentage}%`,
                          background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
                        }}
                      />
                    </div>
                    <div className={styles.barValue}>{item.value.toLocaleString()}</div>
                  </div>
                )
              })}
            </div>
          )}

          {type === 'donut' && (
            <div className={styles.donutChart}>
              <svg viewBox="0 0 100 100" className={styles.donutSvg}>
                {renderDonutSegments(data, defaultColors, hoveredIndex)}
              </svg>
              <div className={styles.donutCenter}>
                <span className={styles.donutTotal}>{total.toLocaleString()}</span>
                <span className={styles.donutLabel}>Total</span>
              </div>
            </div>
          )}

          {type === 'line' && (
            <svg viewBox={`0 0 ${data.length * 50} ${height}`} className={styles.lineChart} preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={generateAreaPath(data.map((d) => d.value), data.length * 50, height)}
                fill="url(#lineGradient)"
              />
              <path
                d={generateLinePath(data.map((d) => d.value), data.length * 50, height)}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {data.map((item, index) => {
                const x = (index / (data.length - 1)) * (data.length * 50 - 20) + 10
                const y = height - ((item.value - Math.min(...data.map((d) => d.value))) / (maxValue - Math.min(...data.map((d) => d.value)) || 1)) * (height - 20) - 10
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r={hoveredIndex === index ? 6 : 4}
                    fill="#3B82F6"
                    stroke="white"
                    strokeWidth="2"
                    className={styles.linePoint}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                )
              })}
            </svg>
          )}
        </div>

        {showLegend && (
          <div className={styles.legend}>
            {data.map((item, index) => {
              const color = item.color || defaultColors[index % defaultColors.length]
              return (
                <div
                  key={index}
                  className={`${styles.legendItem} ${hoveredIndex === index ? styles.legendHovered : ''}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <span className={styles.legendDot} style={{ background: color }} />
                  <span className={styles.legendLabel}>{item.label}</span>
                  <span className={styles.legendValue}>{item.value.toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
)

function renderDonutSegments(
  data: { label: string; value: number; color?: string }[],
  defaultColors: string[],
  hoveredIndex: number | null
) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = -90

  return data.map((item, index) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0
    const angle = (percentage / 100) * 360
    const color = item.color || defaultColors[index % defaultColors.length]
    
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = 50 + 35 * Math.cos(startRad)
    const y1 = 50 + 35 * Math.sin(startRad)
    const x2 = 50 + 35 * Math.cos(endRad)
    const y2 = 50 + 35 * Math.sin(endRad)

    const largeArc = angle > 180 ? 1 : 0

    const d = `M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`

    return (
      <path
        key={index}
        d={d}
        fill={color}
        opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.5}
        style={{
          transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
          transformOrigin: '50px 50px',
          transition: 'all 0.2s ease',
        }}
      />
    )
  })
}

function generateLinePath(data: number[], width: number, height: number): string {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  return data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * (width - 20) + 10
      const y = height - ((val - min) / range) * (height - 20) - 10
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

function generateAreaPath(data: number[], width: number, height: number): string {
  const line = generateLinePath(data, width, height)
  const lastX = (1) * (width - 20) + 10
  return `${line} L ${lastX} ${height} L 10 ${height} Z`
}

AnalyticsCard.displayName = 'AnalyticsCard'
