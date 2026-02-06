'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  X, 
  FileText, 
  DollarSign, 
  AlertCircle,
  Calendar,
  MessageSquare,
  Info,
  Clock
} from 'lucide-react'
import { useNotifications, Notification, NotificationType } from '@/hooks/useNotifications'
import styles from './NotificationsDropdown.module.css'

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'contract_expiring':
    case 'contract_expired':
      return <FileText size={16} />
    case 'payment_due':
    case 'payment_overdue':
    case 'payment_received':
      return <DollarSign size={16} />
    case 'task_due':
    case 'task_overdue':
    case 'task_assigned':
      return <Calendar size={16} />
    case 'whatsapp_message':
      return <MessageSquare size={16} />
    case 'reminder':
      return <Clock size={16} />
    case 'system':
    default:
      return <Info size={16} />
  }
}

const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case 'contract_expired':
    case 'payment_overdue':
    case 'task_overdue':
      return 'red'
    case 'contract_expiring':
    case 'payment_due':
    case 'task_due':
      return 'yellow'
    case 'payment_received':
      return 'green'
    case 'whatsapp_message':
      return 'emerald'
    case 'task_assigned':
      return 'blue'
    default:
      return 'gray'
  }
}

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export function NotificationsDropdown() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
      setIsOpen(false)
    }
  }

  const handleDelete = (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation()
    deleteNotification(notificationId)
  }

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button 
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3 className={styles.title}>Notificaciones</h3>
            {unreadCount > 0 && (
              <button 
                className={styles.markAllRead}
                onClick={markAllAsRead}
                title="Marcar todas como leídas"
              >
                <CheckCheck size={16} />
                <span>Marcar todas</span>
              </button>
            )}
          </div>

          <div className={styles.list}>
            {loading && notifications.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.spinner} />
                <span>Cargando...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className={styles.empty}>
                <Bell size={32} className={styles.emptyIcon} />
                <span>No hay notificaciones</span>
              </div>
            ) : (
              notifications.map((notification) => {
                const color = getNotificationColor(notification.type)
                return (
                  <div
                    key={notification.id}
                    className={`${styles.item} ${!notification.read ? styles.unread : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={`${styles.iconWrapper} ${styles[`icon${color.charAt(0).toUpperCase() + color.slice(1)}`]}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className={styles.content}>
                      <p className={styles.itemTitle}>{notification.title}</p>
                      <p className={styles.message}>{notification.message}</p>
                      <span className={styles.time}>{formatTimeAgo(notification.createdAt)}</span>
                    </div>
                    <div className={styles.actions}>
                      {!notification.read && (
                        <button
                          className={styles.actionBtn}
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          title="Marcar como leída"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={(e) => handleDelete(e, notification.id)}
                        title="Eliminar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className={styles.footer}>
              <button 
                className={styles.viewAll}
                onClick={() => {
                  router.push('/notifications')
                  setIsOpen(false)
                }}
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
