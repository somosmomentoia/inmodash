'use client'

import { HTMLAttributes, forwardRef, useState, useEffect, useRef } from 'react'
import styles from './CounterCard.module.css'

export interface CounterCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'cyan'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  icon?: React.ReactNode
  subtitle?: string
  glowing?: boolean
}

export const CounterCard = forwardRef<HTMLDivElement, CounterCardProps>(
  (
    {
      title,
      value,
      prefix = '',
      suffix = '',
      decimals = 0,
      duration = 2000,
      color = 'blue',
      size = 'md',
      icon,
      subtitle,
      glowing = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

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
      if (!isVisible) return

      const startTime = Date.now()
      const startValue = 0

      const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = easeOutQuart(progress)
        const currentValue = startValue + (value - startValue) * easedProgress

        setDisplayValue(currentValue)

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }, [value, duration, isVisible])

    const formatValue = (val: number) => {
      return val.toLocaleString('es-AR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    }

    return (
      <div
        ref={(node) => {
          cardRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        className={`${styles.card} ${styles[color]} ${styles[size]} ${glowing ? styles.glowing : ''} ${isVisible ? styles.visible : ''} ${className}`}
        {...props}
      >
        {glowing && <div className={styles.glowEffect} />}
        
        <div className={styles.content}>
          {icon && <div className={styles.iconWrapper}>{icon}</div>}
          
          <div className={styles.textContent}>
            <span className={styles.title}>{title}</span>
            
            <div className={styles.valueWrapper}>
              {prefix && <span className={styles.prefix}>{prefix}</span>}
              <span className={styles.value}>{formatValue(displayValue)}</span>
              {suffix && <span className={styles.suffix}>{suffix}</span>}
            </div>
            
            {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          </div>
        </div>

        <div className={styles.particles}>
          {[...Array(6)].map((_, i) => (
            <span key={i} className={styles.particle} style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    )
  }
)

CounterCard.displayName = 'CounterCard'
