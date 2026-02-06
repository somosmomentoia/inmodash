'use client'

import { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import styles from './ReportCard.module.css'

export interface ReportCardProps {
  icon: ReactNode
  iconColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan'
  title: string
  description: string
  format?: string
  onClick?: () => void
  disabled?: boolean
}

export function ReportCard({
  icon,
  iconColor = 'blue',
  title,
  description,
  format,
  onClick,
  disabled = false,
}: ReportCardProps) {
  return (
    <button
      className={`${styles.card} ${disabled ? styles.disabled : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className={`${styles.iconWrapper} ${styles[iconColor]}`}>
        {icon}
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        {format && (
          <span className={styles.format}>{format}</span>
        )}
      </div>
      <ChevronRight size={20} className={styles.arrow} />
    </button>
  )
}
