'use client'

import { HTMLAttributes, forwardRef, ReactNode } from 'react'
import styles from './GradientBorderCard.module.css'

export interface GradientBorderCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  gradient?: 'blue-purple' | 'green-cyan' | 'orange-red' | 'rainbow' | 'custom'
  customGradient?: string
  animated?: boolean
  borderWidth?: number
  glowIntensity?: 'none' | 'subtle' | 'medium' | 'strong'
  hoverEffect?: 'lift' | 'glow' | 'scale' | 'none'
}

export const GradientBorderCard = forwardRef<HTMLDivElement, GradientBorderCardProps>(
  (
    {
      children,
      gradient = 'blue-purple',
      customGradient,
      animated = false,
      borderWidth = 2,
      glowIntensity = 'subtle',
      hoverEffect = 'lift',
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.card,
      styles[gradient],
      animated && styles.animated,
      styles[`glow-${glowIntensity}`],
      styles[`hover-${hoverEffect}`],
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div
        ref={ref}
        className={classNames}
        style={{
          '--border-width': `${borderWidth}px`,
          '--custom-gradient': customGradient,
        } as React.CSSProperties}
        {...props}
      >
        <div className={styles.borderGradient} />
        <div className={styles.content}>{children}</div>
      </div>
    )
  }
)

GradientBorderCard.displayName = 'GradientBorderCard'
