'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { Check } from 'lucide-react'
import styles from './Checkbox.module.css'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={`${styles.wrapper} ${className}`}>
        <label htmlFor={checkboxId} className={styles.label}>
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={styles.input}
            {...props}
          />
          <span className={`${styles.checkbox} ${error ? styles.hasError : ''}`}>
            <Check size={12} className={styles.icon} />
          </span>
          {label && <span className={styles.text}>{label}</span>}
        </label>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
