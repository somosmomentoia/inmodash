'use client'

import { HTMLAttributes, forwardRef, ReactNode } from 'react'
import styles from './GlowCard.module.css'

export interface GlowCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'glass'
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'cyan' | 'multi'
  glow?: boolean
  animated?: boolean
  children: ReactNode
}

export const GlowCard = forwardRef<HTMLDivElement, GlowCardProps>(
  (
    {
      variant = 'default',
      color = 'blue',
      glow = true,
      animated = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.card,
      styles[variant],
      styles[color],
      glow && styles.glow,
      animated && styles.animated,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classNames} {...props}>
        <div className={styles.glowEffect} />
        <div className={styles.content}>{children}</div>
      </div>
    )
  }
)

GlowCard.displayName = 'GlowCard'
