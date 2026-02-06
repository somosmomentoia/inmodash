import { ApartmentStatus } from '@/types'

export const APARTMENT_STATUS_CONFIG: Record<ApartmentStatus, {
  label: string
  color: string
  badgeVariant: 'success' | 'warning' | 'error' | 'info' | 'default'
  icon: string
}> = {
  [ApartmentStatus.AVAILABLE]: {
    label: 'Disponible',
    color: 'green',
    badgeVariant: 'success',
    icon: 'check-circle'
  },
  [ApartmentStatus.RENTED]: {
    label: 'Alquilado',
    color: 'blue',
    badgeVariant: 'info',
    icon: 'user'
  },
  [ApartmentStatus.UNDER_RENOVATION]: {
    label: 'En Refacción',
    color: 'yellow',
    badgeVariant: 'warning',
    icon: 'tool'
  },
  [ApartmentStatus.PERSONAL_USE]: {
    label: 'Uso Propio',
    color: 'purple',
    badgeVariant: 'default',
    icon: 'home'
  }
}
