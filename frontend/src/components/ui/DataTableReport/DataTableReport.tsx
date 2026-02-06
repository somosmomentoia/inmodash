'use client'

import { ReactNode, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar } from '../Avatar'
import { Badge } from '../Badge'
import styles from './DataTableReport.module.css'

export interface DataTableColumn<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (item: T, index: number) => ReactNode
}

export interface DataTableReportProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  title?: string
  subtitle?: string
  showAvatar?: boolean
  avatarKey?: string
  nameKey?: string
  emailKey?: string
  totals?: Record<string, string | number>
  pageSize?: number
  onRowClick?: (item: T) => void
  emptyMessage?: string
}

export function DataTableReport<T extends Record<string, unknown>>({
  columns,
  data,
  title,
  subtitle,
  showAvatar = false,
  avatarKey = 'name',
  nameKey = 'name',
  emailKey = 'email',
  totals,
  pageSize = 10,
  onRowClick,
  emptyMessage = 'No hay datos para mostrar',
}: DataTableReportProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(data.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentData = data.slice(startIndex, endIndex)

  const formatValue = (value: unknown): string => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
      }).format(value)
    }
    return String(value ?? '')
  }

  return (
    <div className={styles.container}>
      {(title || subtitle) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {showAvatar && <th style={{ width: '40px' }}></th>}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width, textAlign: col.align || 'left' }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (showAvatar ? 1 : 0)} className={styles.empty}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              currentData.map((item, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? styles.clickable : ''}
                >
                  {showAvatar && (
                    <td>
                      <Avatar
                        name={String(item[avatarKey] || '')}
                        size="sm"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ textAlign: col.align || 'left' }}
                    >
                      {col.render
                        ? col.render(item, startIndex + index)
                        : formatValue(item[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {totals && (
            <tfoot>
              <tr>
                {showAvatar && <td></td>}
                {columns.map((col, index) => (
                  <td
                    key={col.key}
                    style={{ textAlign: col.align || 'left' }}
                    className={styles.totalCell}
                  >
                    {index === 0 ? 'Total' : totals[col.key] ? formatValue(totals[col.key]) : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Mostrando {startIndex + 1} - {Math.min(endIndex, data.length)} de {data.length}
          </span>
          <div className={styles.pageControls}>
            <button
              className={styles.pageButton}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1
              if (totalPages > 5) {
                if (currentPage > 3) {
                  pageNum = currentPage - 2 + i
                }
                if (currentPage > totalPages - 2) {
                  pageNum = totalPages - 4 + i
                }
              }
              return (
                <button
                  key={pageNum}
                  className={`${styles.pageNumber} ${currentPage === pageNum ? styles.active : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              className={styles.pageButton}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
