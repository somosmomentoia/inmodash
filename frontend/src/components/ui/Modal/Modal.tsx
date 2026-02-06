'use client'

import { HTMLAttributes, forwardRef, useEffect } from 'react'
import { X } from 'lucide-react'
import styles from './Modal.module.css'

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      subtitle,
      size = 'md',
      showCloseButton = true,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
      return () => {
        document.body.style.overflow = ''
      }
    }, [isOpen])

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      if (isOpen) {
        document.addEventListener('keydown', handleEscape)
      }
      return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
      <div className={styles.overlay} onClick={onClose}>
        <div
          ref={ref}
          className={`${styles.modal} ${styles[size]} ${className}`}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {(title || showCloseButton) && (
            <div className={styles.header}>
              <div className={styles.headerContent}>
                {title && <h2 className={styles.title}>{title}</h2>}
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
              </div>
              {showCloseButton && (
                <button className={styles.closeButton} onClick={onClose}>
                  <X size={20} />
                </button>
              )}
            </div>
          )}
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    )
  }
)

Modal.displayName = 'Modal'

export const ModalFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={`${styles.footer} ${className}`} {...props}>
    {children}
  </div>
))

ModalFooter.displayName = 'ModalFooter'
