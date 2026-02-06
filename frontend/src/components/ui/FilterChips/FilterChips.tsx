'use client'

import { ReactNode } from 'react'
import { X, ChevronDown } from 'lucide-react'
import styles from './FilterChips.module.css'

export interface FilterChip {
  id: string
  label: string
  icon?: ReactNode
  value?: string
  removable?: boolean
  hasDropdown?: boolean
}

export interface FilterChipsProps {
  chips: FilterChip[]
  onRemove?: (id: string) => void
  onClick?: (id: string) => void
  variant?: 'default' | 'outline'
}

export function FilterChips({
  chips,
  onRemove,
  onClick,
  variant = 'default',
}: FilterChipsProps) {
  return (
    <div className={styles.container}>
      {chips.map((chip) => (
        <button
          key={chip.id}
          className={`${styles.chip} ${styles[variant]}`}
          onClick={() => onClick?.(chip.id)}
        >
          {chip.icon && <span className={styles.icon}>{chip.icon}</span>}
          <span className={styles.label}>{chip.label}</span>
          {chip.value && <span className={styles.value}>{chip.value}</span>}
          {chip.hasDropdown && <ChevronDown size={14} className={styles.dropdown} />}
          {chip.removable && onRemove && (
            <button
              className={styles.remove}
              onClick={(e) => {
                e.stopPropagation()
                onRemove(chip.id)
              }}
            >
              <X size={14} />
            </button>
          )}
        </button>
      ))}
    </div>
  )
}
