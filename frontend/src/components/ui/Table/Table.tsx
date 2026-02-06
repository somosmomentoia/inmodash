'use client'

import { HTMLAttributes, forwardRef, ReactNode } from 'react'
import styles from './Table.module.css'

export interface TableColumn<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (item: T, index: number) => ReactNode
}

export interface TableProps<T> extends HTMLAttributes<HTMLDivElement> {
  columns: TableColumn<T>[]
  data: T[]
  onRowClick?: (item: T, index: number) => void
  emptyMessage?: string
  loading?: boolean
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
  loading = false,
  className = '',
  ...props
}: TableProps<T>) {
  const classNames = [styles.container, className].filter(Boolean).join(' ')

  return (
    <div className={classNames} {...props}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={styles.th}
                style={{ width: col.width, textAlign: col.align || 'left' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className={styles.loading}>
                <span className={styles.spinner} />
                Cargando...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={index}
                className={`${styles.tr} ${onRowClick ? styles.clickable : ''}`}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={styles.td}
                    style={{ textAlign: col.align || 'left' }}
                  >
                    {col.render
                      ? col.render(item, index)
                      : (item[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
