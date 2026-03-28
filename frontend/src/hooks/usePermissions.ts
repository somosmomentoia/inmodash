import { useState, useEffect } from 'react'
import { UserPermission } from '@/types'

export function usePermissions() {
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [isStaff, setIsStaff] = useState(false)

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = () => {
    try {
      setLoading(true)
      
      // Check if user is staff by checking if permissions exist in localStorage
      const storedPermissions = localStorage.getItem('user-permissions')
      
      if (storedPermissions) {
        // User is staff - has permissions stored
        const perms = JSON.parse(storedPermissions) as UserPermission[]
        setPermissions(perms)
        setIsStaff(true)
        console.log('📋 Loaded staff permissions:', perms.length)
      } else {
        // User is owner - no permissions needed (full access)
        setPermissions([])
        setIsStaff(false)
        console.log('👑 Owner user - full access')
      }
    } catch (err) {
      console.error('Error loading permissions:', err)
      setPermissions([])
      setIsStaff(false)
    } finally {
      setLoading(false)
    }
  }

  const hasPermission = (module: string, action: string): boolean => {
    // If not a staff user, they have full access (owner)
    if (!isStaff) return true

    // Check if permission exists and is allowed
    const permission = permissions.find(
      p => p.module === module && p.action === action
    )
    
    return permission?.allowed ?? false
  }

  const canViewModule = (module: string): boolean => {
    // If not a staff user, they can view everything (owner)
    if (!isStaff) return true

    // Check if user has any view-like permission for the module
    // (handles modules like finances that have view_cashflow, view_settlements, etc.)
    const viewPermission = permissions.find(
      p => p.module === module && p.action.startsWith('view') && p.allowed
    )
    if (viewPermission) return true

    // Fallback: check for generic 'view'
    return hasPermission(module, 'view')
  }

  return {
    permissions,
    loading,
    isStaff,
    hasPermission,
    canViewModule,
    refetch: loadPermissions,
  }
}
