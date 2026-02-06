'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import styles from './PeriodSelector.module.css'

export interface PeriodSelectorProps {
  value: string
  onChange: (value: string) => void
  options?: { value: string; label: string }[]
  showIcon?: boolean
}

const defaultOptions = [
  { value: 'current-month', label: 'Este mes' },
  { value: 'last-month', label: 'Mes anterior' },
  { value: 'last-3-months', label: 'Últimos 3 meses' },
  { value: 'last-6-months', label: 'Últimos 6 meses' },
  { value: 'last-12-months', label: 'Últimos 12 meses' },
  { value: 'this-year', label: 'Este año' },
  { value: 'custom', label: 'Personalizado...' },
]

export function PeriodSelector({
  value,
  onChange,
  options = defaultOptions,
  showIcon = true,
}: PeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const selectedOption = options.find(o => o.value === value)
  const displayLabel = selectedOption?.label || 'Seleccionar período'

  return (
    <div className={styles.container}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        {showIcon && <Calendar size={16} className={styles.icon} />}
        <span className={styles.label}>{displayLabel}</span>
        <ChevronDown size={16} className={`${styles.arrow} ${isOpen ? styles.open : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
          <div className={styles.dropdown}>
            {options.map((option) => (
              <button
                key={option.value}
                className={`${styles.option} ${value === option.value ? styles.selected : ''}`}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
