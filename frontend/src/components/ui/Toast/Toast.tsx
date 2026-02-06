'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import styles from './Toast.module.css'

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  onClose?: () => void
}

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    { variant = 'info', title, description, onClose, className = '', ...props },
    ref
  ) => {
    const icons = {
      success: <CheckCircle size={20} />,
      error: <AlertCircle size={20} />,
      warning: <AlertTriangle size={20} />,
      info: <Info size={20} />,
    }

    return (
      <div
        ref={ref}
        className={`${styles.toast} ${styles[variant]} ${className}`}
        {...props}
      >
        <span className={styles.icon}>{icons[variant]}</span>
        <div className={styles.content}>
          <span className={styles.title}>{title}</span>
          {description && <span className={styles.description}>{description}</span>}
        </div>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose}>
            <X size={16} />
          </button>
        )}
      </div>
    )
  }
)

Toast.displayName = 'Toast'
