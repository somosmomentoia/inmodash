'use client'

import { HTMLAttributes, forwardRef } from 'react'
import styles from './Avatar.module.css'

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'busy' | 'away'
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, name = '', size = 'md', status, className = '', ...props }, ref) => {
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const classNames = [styles.avatar, styles[size], className]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classNames} {...props}>
        {src ? (
          <img src={src} alt={name} className={styles.image} />
        ) : (
          <span className={styles.initials}>{initials || '?'}</span>
        )}
        {status && <span className={`${styles.status} ${styles[status]}`} />}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  max?: number
  children: React.ReactNode
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ max = 4, children, className = '', ...props }, ref) => {
    const childArray = Array.isArray(children) ? children : [children]
    const visibleChildren = childArray.slice(0, max)
    const remainingCount = childArray.length - max

    return (
      <div ref={ref} className={`${styles.group} ${className}`} {...props}>
        {visibleChildren}
        {remainingCount > 0 && (
          <div className={`${styles.avatar} ${styles.md} ${styles.remaining}`}>
            <span className={styles.initials}>+{remainingCount}</span>
          </div>
        )}
      </div>
    )
  }
)

AvatarGroup.displayName = 'AvatarGroup'
