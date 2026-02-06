'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  FileText, 
  DollarSign, 
  Calendar,
  MessageSquare,
  Info,
  Clock,
  Filter
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { useNotifications, Notification, NotificationType } from '@/hooks/useNotifications'
import styles from './notifications.module.css'

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'contract_expiring':
    case 'contract_expired':
      return <FileText size={20} />
    case 'payment_due':
    case 'payment_overdue':
    case 'payment_received':
      return <DollarSign size={20} />
    case 'task_due':
    case 'task_overdue':
    case 'task_assigned':
      return <Calendar size={20} />
    case 'whatsapp_message':
      return <MessageSquare size={20} />
    case 'reminder':
      return <Clock size={20} />
    case 'system':
    default:
      return <Info size={20} />
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

const getTypeLabel = (type: NotificationType): string => {
  const labels: Record<NotificationType, string> = {
    contract_expiring: 'Contrato por vencer',
    contract_expired: 'Contrato vencido',
    payment_due: 'Pago próximo',
    payment_overdue: 'Pago vencido',
    payment_received: 'Pago recibido',
    task_due: 'Tarea próxima',
    task_overdue: 'Tarea vencida',
    task_assigned: 'Tarea asignada',
    whatsapp_message: 'WhatsApp',
    system: 'Sistema',
    reminder: 'Recordatorio',
  }
  return labels[type] || type
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora mismo'
  if (diffMins < 60) return `Hace ${diffMins} minutos`
  if (diffHours < 24) return `Hace ${diffHours} horas`
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  
  return date.toLocaleDateString('es-AR', { 
    day: 'numeric', 
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

type FilterType = 'all' | 'unread' | NotificationType

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterType>('all')
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications()

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.read
    return n.type === filter
  })

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  const notificationTypes: NotificationType[] = [
    'contract_expiring',
    'contract_expired',
    'payment_due',
    'payment_overdue',
    'payment_received',
    'task_due',
    'task_overdue',
    'task_assigned',
    'whatsapp_message',
    'system',
    'reminder',
  ]

  return (
    <DashboardLayout title="Notificaciones" subtitle={`${unreadCount} sin leer`}>
      <div className={styles.container}>
        {/* Header Actions */}
        <div className={styles.header}>
          <div className={styles.filters}>
            <button 
              className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
              onClick={() => setFilter('all')}
            >
              Todas
            </button>
            <button 
              className={`${styles.filterBtn} ${filter === 'unread' ? styles.active : ''}`}
              onClick={() => setFilter('unread')}
            >
              Sin leer ({unreadCount})
            </button>
            <div className={styles.filterDropdown}>
              <button className={styles.filterBtn}>
                <Filter size={16} />
                Tipo
              </button>
              <div className={styles.dropdownContent}>
                {notificationTypes.map(type => (
                  <button 
                    key={type}
                    className={styles.dropdownItem}
                    onClick={() => setFilter(type)}
                  >
                    {getTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {unreadCount > 0 && (
            <button className={styles.markAllBtn} onClick={markAllAsRead}>
              <CheckCheck size={16} />
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className={styles.list}>
          {loading && notifications.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.spinner} />
              <span>Cargando notificaciones...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className={styles.empty}>
              <Bell size={48} className={styles.emptyIcon} />
              <h3>No hay notificaciones</h3>
              <p>
                {filter === 'unread' 
                  ? 'No tenés notificaciones sin leer' 
                  : filter !== 'all'
                    ? `No hay notificaciones de tipo "${getTypeLabel(filter as NotificationType)}"`
                    : 'Cuando haya novedades, aparecerán aquí'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
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
                    <div className={styles.itemHeader}>
                      <span className={styles.typeLabel}>{getTypeLabel(notification.type)}</span>
                      <span className={styles.time}>{formatDate(notification.createdAt)}</span>
                    </div>
                    <h4 className={styles.itemTitle}>{notification.title}</h4>
                    <p className={styles.message}>{notification.message}</p>
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
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
