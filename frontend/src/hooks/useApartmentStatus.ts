import { ApartmentStatus } from '@/types'
import { APARTMENT_STATUS_CONFIG } from '@/lib/constants'

/**
 * Hook para obtener información de estado de un departamento
 */
export function useApartmentStatus(status: ApartmentStatus) {
  const config = APARTMENT_STATUS_CONFIG[status]
  
  return {
    label: config.label,
    color: config.color,
    badgeVariant: config.badgeVariant,
    icon: config.icon
  }
}
