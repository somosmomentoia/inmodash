'use client'

import { HTMLAttributes, forwardRef } from 'react'
import styles from './Badge.module.css'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md'
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', className = '', ...props }, ref) => {
    const classNames = [styles.badge, styles[variant], styles[size], className]
      .filter(Boolean)
      .join(' ')

    return (
      <span ref={ref} className={classNames} {...props}>
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
