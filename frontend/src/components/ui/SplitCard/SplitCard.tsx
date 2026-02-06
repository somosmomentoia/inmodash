'use client'

import { HTMLAttributes, forwardRef, ReactNode, useState } from 'react'
import styles from './SplitCard.module.css'

export interface SplitCardProps extends HTMLAttributes<HTMLDivElement> {
  leftTitle: string
  rightTitle: string
  leftValue: string | number
  rightValue: string | number
  leftSubtitle?: string
  rightSubtitle?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  leftColor?: 'blue' | 'purple' | 'green' | 'orange' | 'cyan'
  rightColor?: 'blue' | 'purple' | 'green' | 'orange' | 'cyan'
  comparison?: {
    winner: 'left' | 'right' | 'tie'
    difference?: string
  }
  animated?: boolean
}

export const SplitCard = forwardRef<HTMLDivElement, SplitCardProps>(
  (
    {
      leftTitle,
      rightTitle,
      leftValue,
      rightValue,
      leftSubtitle,
      rightSubtitle,
      leftIcon,
      rightIcon,
      leftColor = 'blue',
      rightColor = 'purple',
      comparison,
      animated = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const [hoveredSide, setHoveredSide] = useState<'left' | 'right' | null>(null)

    return (
      <div ref={ref} className={`${styles.card} ${className}`} {...props}>
        <div
          className={`${styles.side} ${styles.left} ${styles[leftColor]} ${hoveredSide === 'left' ? styles.hovered : ''}`}
          onMouseEnter={() => setHoveredSide('left')}
          onMouseLeave={() => setHoveredSide(null)}
          style={animated ? { animationDelay: '0s' } : undefined}
        >
          {leftIcon && <div className={styles.icon}>{leftIcon}</div>}
          <span className={styles.title}>{leftTitle}</span>
          <span className={styles.value}>{leftValue}</span>
          {leftSubtitle && <span className={styles.subtitle}>{leftSubtitle}</span>}
          {comparison?.winner === 'left' && (
            <div className={styles.winnerBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
          )}
        </div>

        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <div className={styles.vsCircle}>
            <span>VS</span>
          </div>
          <div className={styles.dividerLine} />
        </div>

        <div
          className={`${styles.side} ${styles.right} ${styles[rightColor]} ${hoveredSide === 'right' ? styles.hovered : ''}`}
          onMouseEnter={() => setHoveredSide('right')}
          onMouseLeave={() => setHoveredSide(null)}
          style={animated ? { animationDelay: '0.1s' } : undefined}
        >
          {rightIcon && <div className={styles.icon}>{rightIcon}</div>}
          <span className={styles.title}>{rightTitle}</span>
          <span className={styles.value}>{rightValue}</span>
          {rightSubtitle && <span className={styles.subtitle}>{rightSubtitle}</span>}
          {comparison?.winner === 'right' && (
            <div className={styles.winnerBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
          )}
        </div>

        {comparison?.difference && (
          <div className={styles.differenceBar}>
            <span className={styles.differenceLabel}>Diferencia:</span>
            <span className={styles.differenceValue}>{comparison.difference}</span>
          </div>
        )}
      </div>
    )
  }
)

SplitCard.displayName = 'SplitCard'
