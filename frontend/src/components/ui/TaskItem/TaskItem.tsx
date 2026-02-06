'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react'
import styles from './TaskItem.module.css'

export interface TaskItemProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'overdue'
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
  onClick?: () => void
}

export const TaskItem = forwardRef<HTMLDivElement, TaskItemProps>(
  (
    {
      title,
      subtitle,
      status = 'pending',
      dueDate,
      priority,
      onClick,
      className = '',
      ...props
    },
    ref
  ) => {
    const statusIcons = {
      pending: <Circle size={20} />,
      in_progress: <Clock size={20} />,
      completed: <CheckCircle size={20} />,
      overdue: <AlertCircle size={20} />,
    }

    const classNames = [
      styles.item,
      styles[status],
      priority ? styles[`priority-${priority}`] : '',
      onClick ? styles.clickable : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classNames} onClick={onClick} {...props}>
        <div className={styles.statusIcon}>{statusIcons[status]}</div>
        <div className={styles.content}>
          <span className={styles.title}>{title}</span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        {dueDate && <span className={styles.dueDate}>{dueDate}</span>}
        {priority && (
          <span className={`${styles.priorityBadge} ${styles[`priority-${priority}`]}`}>
            {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja'}
          </span>
        )}
      </div>
    )
  }
)

TaskItem.displayName = 'TaskItem'
