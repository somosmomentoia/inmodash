import { ReactNode } from 'react'
import { usePermissions } from '@/hooks/usePermissions'

interface PermissionGuardProps {
  module: string
  action: string
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGuard({ module, action, children, fallback = null }: PermissionGuardProps) {
  const { hasPermission, loading } = usePermissions()

  if (loading) {
    return <>{fallback}</>
  }

  if (!hasPermission(module, action)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface ModuleGuardProps {
  module: string
  children: ReactNode
  fallback?: ReactNode
}

export function ModuleGuard({ module, children, fallback = null }: ModuleGuardProps) {
  const { canViewModule, loading } = usePermissions()

  if (loading) {
    return <>{fallback}</>
  }

  if (!canViewModule(module)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
