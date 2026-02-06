'use client'

import { ReactNode } from 'react'
import { Download, FileText } from 'lucide-react'
import { Button } from '../Button'
import styles from './SummaryPanel.module.css'

export interface SummaryItem {
  label: string
  value: string | number
  color?: 'default' | 'success' | 'warning' | 'error'
  bold?: boolean
}

export interface SummaryPanelProps {
  title: string
  items: SummaryItem[]
  total?: {
    label: string
    value: string | number
  }
  actions?: {
    onExportPDF?: () => void
    onExportCSV?: () => void
    customAction?: {
      label: string
      icon?: ReactNode
      onClick: () => void
      variant?: 'primary' | 'secondary'
    }
  }
  className?: string
}

export function SummaryPanel({
  title,
  items,
  total,
  actions,
  className = '',
}: SummaryPanelProps) {
  const formatValue = (value: string | number) => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(value)
    }
    return value
  }

  return (
    <div className={`${styles.panel} ${className}`}>
      <h3 className={styles.title}>{title}</h3>
      
      <div className={styles.items}>
        {items.map((item, index) => (
          <div key={index} className={styles.item}>
            <span className={styles.label}>{item.label}</span>
            <span className={`${styles.value} ${item.color ? styles[item.color] : ''} ${item.bold ? styles.bold : ''}`}>
              {formatValue(item.value)}
            </span>
          </div>
        ))}
      </div>

      {total && (
        <div className={styles.total}>
          <span className={styles.totalLabel}>{total.label}</span>
          <span className={styles.totalValue}>{formatValue(total.value)}</span>
        </div>
      )}

      {actions && (
        <div className={styles.actions}>
          {actions.customAction && (
            <Button
              variant={actions.customAction.variant === 'secondary' ? 'secondary' : 'primary'}
              leftIcon={actions.customAction.icon}
              onClick={actions.customAction.onClick}
              fullWidth
            >
              {actions.customAction.label}
            </Button>
          )}
          {(actions.onExportPDF || actions.onExportCSV) && (
            <div className={styles.exportButtons}>
              {actions.onExportPDF && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<FileText size={16} />}
                  onClick={actions.onExportPDF}
                >
                  Guardar PDF
                </Button>
              )}
              {actions.onExportCSV && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Download size={16} />}
                  onClick={actions.onExportCSV}
                >
                  Exportar CSV
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
