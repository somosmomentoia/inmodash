import { usePermissions } from './usePermissions'

/**
 * Hook para filtrar elementos según permisos
 * Útil para filtrar arrays de acciones, botones, etc.
 */
export function usePermissionFilter() {
  const { hasPermission } = usePermissions()

  /**
   * Filtra un array de items que tienen permisos requeridos
   */
  const filterByPermission = <T extends { permission?: { module: string; action: string } }>(
    items: T[]
  ): T[] => {
    return items.filter(item => {
      if (!item.permission) return true // Si no tiene permiso definido, se muestra siempre
      return hasPermission(item.permission.module, item.permission.action)
    })
  }

  /**
   * Verifica si se puede mostrar un botón de acción
   */
  const canShowAction = (module: string, action: string): boolean => {
    return hasPermission(module, action)
  }

  return {
    filterByPermission,
    canShowAction,
    hasPermission,
  }
}
