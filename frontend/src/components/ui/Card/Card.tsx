'use client'

import { HTMLAttributes, forwardRef } from 'react'
import styles from './Card.module.css'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'gradient'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hoverable = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.card,
      styles[variant],
      styles[`padding-${padding}`],
      hoverable ? styles.hoverable : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classNames} {...props}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

/* Card Header */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: React.ReactNode
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, children, className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={`${styles.header} ${className}`} {...props}>
        {children || (
          <>
            <div className={styles.headerContent}>
              {title && <h3 className={styles.title}>{title}</h3>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            {action && <div className={styles.headerAction}>{action}</div>}
          </>
        )}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

/* Card Content */
export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ children, className = '', ...props }, ref) => {
  return (
    <div ref={ref} className={`${styles.content} ${className}`} {...props}>
      {children}
    </div>
  )
})

CardContent.displayName = 'CardContent'

/* Card Footer */
export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ children, className = '', ...props }, ref) => {
  return (
    <div ref={ref} className={`${styles.footer} ${className}`} {...props}>
      {children}
    </div>
  )
})

CardFooter.displayName = 'CardFooter'
