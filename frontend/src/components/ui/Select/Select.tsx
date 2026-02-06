'use client'

import { SelectHTMLAttributes, forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
      size = 'md',
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const selectId = id || generatedId

    const wrapperClasses = [
      styles.wrapper,
      fullWidth ? styles.fullWidth : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const selectWrapperClasses = [
      styles.selectWrapper,
      styles[size],
      error ? styles.hasError : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={selectWrapperClasses}>
          <select ref={ref} id={selectId} className={styles.select} {...props}>
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className={styles.icon} />
        </div>
        {error && <span className={styles.error}>{error}</span>}
        {hint && !error && <span className={styles.hint}>{hint}</span>}
      </div>
    )
  }
)

Select.displayName = 'Select'
