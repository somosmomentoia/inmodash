'use client'

import { HTMLAttributes, forwardRef, ReactNode } from 'react'
import styles from './TimelineCard.module.css'

export interface TimelineEvent {
  id: string
  icon?: ReactNode
  title: string
  description?: string
  time: string
  status?: 'completed' | 'current' | 'upcoming'
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'cyan' | 'red'
}

export interface TimelineCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  events: TimelineEvent[]
  variant?: 'default' | 'compact' | 'detailed'
  animated?: boolean
}

export const TimelineCard = forwardRef<HTMLDivElement, TimelineCardProps>(
  (
    {
      title,
      events,
      variant = 'default',
      animated = true,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={`${styles.card} ${styles[variant]} ${className}`} {...props}>
        {title && <h3 className={styles.title}>{title}</h3>}
        
        <div className={styles.timeline}>
          {events.map((event, index) => (
            <div
              key={event.id}
              className={`${styles.event} ${styles[event.status || 'upcoming']} ${event.color ? styles[event.color] : ''}`}
              style={animated ? { animationDelay: `${index * 0.1}s` } : undefined}
            >
              <div className={styles.connector}>
                <div className={styles.line} />
                <div className={styles.dot}>
                  {event.icon || (
                    event.status === 'completed' ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : event.status === 'current' ? (
                      <div className={styles.currentDot} />
                    ) : null
                  )}
                </div>
              </div>
              
              <div className={styles.content}>
                <div className={styles.eventHeader}>
                  <span className={styles.eventTitle}>{event.title}</span>
                  <span className={styles.eventTime}>{event.time}</span>
                </div>
                {event.description && (
                  <p className={styles.eventDescription}>{event.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

TimelineCard.displayName = 'TimelineCard'
