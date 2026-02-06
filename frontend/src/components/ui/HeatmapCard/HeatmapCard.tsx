'use client'

import { HTMLAttributes, forwardRef, useState } from 'react'
import styles from './HeatmapCard.module.css'

export interface HeatmapCell {
  row: string
  col: string
  value: number
  label?: string
}

export interface HeatmapCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  data: HeatmapCell[]
  rows: string[]
  cols: string[]
  colorScale?: 'blue' | 'green' | 'purple' | 'orange' | 'diverging'
  showValues?: boolean
  animated?: boolean
}

export const HeatmapCard = forwardRef<HTMLDivElement, HeatmapCardProps>(
  (
    {
      title,
      subtitle,
      data,
      rows,
      cols,
      colorScale = 'blue',
      showValues = false,
      animated = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const [hoveredCell, setHoveredCell] = useState<string | null>(null)
    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null)

    const values = data.map((d) => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue || 1

    const getColor = (value: number) => {
      const intensity = (value - minValue) / range

      const scales = {
        blue: [`rgba(239, 246, 255, ${0.3 + intensity * 0.7})`, `rgba(59, 130, 246, ${0.3 + intensity * 0.7})`],
        green: [`rgba(236, 253, 245, ${0.3 + intensity * 0.7})`, `rgba(16, 185, 129, ${0.3 + intensity * 0.7})`],
        purple: [`rgba(245, 243, 255, ${0.3 + intensity * 0.7})`, `rgba(139, 92, 246, ${0.3 + intensity * 0.7})`],
        orange: [`rgba(255, 251, 235, ${0.3 + intensity * 0.7})`, `rgba(245, 158, 11, ${0.3 + intensity * 0.7})`],
        diverging: intensity < 0.5
          ? [`rgba(239, 68, 68, ${0.3 + (0.5 - intensity) * 1.4})`, `rgba(239, 68, 68, ${0.3 + (0.5 - intensity) * 1.4})`]
          : [`rgba(16, 185, 129, ${0.3 + (intensity - 0.5) * 1.4})`, `rgba(16, 185, 129, ${0.3 + (intensity - 0.5) * 1.4})`],
      }

      return intensity > 0.5 ? scales[colorScale][1] : scales[colorScale][0]
    }

    const getCellValue = (row: string, col: string) => {
      const cell = data.find((d) => d.row === row && d.col === col)
      return cell?.value ?? 0
    }

    const getCellLabel = (row: string, col: string) => {
      const cell = data.find((d) => d.row === row && d.col === col)
      return cell?.label
    }

    const handleMouseEnter = (e: React.MouseEvent, row: string, col: string) => {
      const value = getCellValue(row, col)
      const label = getCellLabel(row, col)
      setHoveredCell(`${row}-${col}`)
      setTooltip({
        x: e.clientX,
        y: e.clientY,
        content: label || `${row} × ${col}: ${value}`,
      })
    }

    const handleMouseLeave = () => {
      setHoveredCell(null)
      setTooltip(null)
    }

    return (
      <div ref={ref} className={`${styles.card} ${className}`} {...props}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>{title}</h3>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <div className={styles.legend}>
            <span className={styles.legendLabel}>Bajo</span>
            <div className={`${styles.legendGradient} ${styles[colorScale]}`} />
            <span className={styles.legendLabel}>Alto</span>
          </div>
        </div>

        <div className={styles.heatmapContainer}>
          <div className={styles.colHeaders}>
            <div className={styles.cornerCell} />
            {cols.map((col) => (
              <div key={col} className={styles.colHeader}>
                {col}
              </div>
            ))}
          </div>

          <div className={styles.grid}>
            {rows.map((row, rowIndex) => (
              <div key={row} className={styles.row}>
                <div className={styles.rowHeader}>{row}</div>
                {cols.map((col, colIndex) => {
                  const value = getCellValue(row, col)
                  const isHovered = hoveredCell === `${row}-${col}`
                  return (
                    <div
                      key={col}
                      className={`${styles.cell} ${isHovered ? styles.cellHovered : ''}`}
                      style={{
                        backgroundColor: getColor(value),
                        animationDelay: animated ? `${(rowIndex * cols.length + colIndex) * 0.02}s` : undefined,
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, row, col)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {showValues && <span className={styles.cellValue}>{value}</span>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {tooltip && (
          <div
            className={styles.tooltip}
            style={{
              left: tooltip.x + 10,
              top: tooltip.y - 30,
            }}
          >
            {tooltip.content}
          </div>
        )}
      </div>
    )
  }
)

HeatmapCard.displayName = 'HeatmapCard'
