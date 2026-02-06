'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/services/api'

export interface NotificationPreferences {
  contractExpiring: boolean
  paymentOverdue: boolean
  taskDue: boolean
  whatsappMessage: boolean
  weeklySummary: boolean
}

export interface UserPreferences {
  dashboardWidgets?: string[]
  notifications?: NotificationPreferences
  [key: string]: unknown
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch preferences on mount
  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/auth/preferences`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences || {})
      }
    } catch (err) {
      console.error('Error fetching preferences:', err)
      setError('Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  // Update preferences
  const updatePreferences = useCallback(async (newPrefs: Partial<UserPreferences>) => {
    try {
      console.log('[usePreferences] Saving preferences:', newPrefs)
      const response = await fetch(`${API_URL}/api/auth/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ preferences: newPrefs }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[usePreferences] Saved successfully:', data.preferences)
        setPreferences(data.preferences)
        return true
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('[usePreferences] Save failed:', response.status, errorData)
      }
      return false
    } catch (err) {
      console.error('[usePreferences] Error updating preferences:', err)
      return false
    }
  }, [])

  // Specific helper for dashboard widgets
  const setDashboardWidgets = useCallback(async (widgets: string[]) => {
    return updatePreferences({ dashboardWidgets: widgets })
  }, [updatePreferences])

  // Specific helper for notification preferences
  const setNotificationPreferences = useCallback(async (notifPrefs: Partial<NotificationPreferences>) => {
    const currentNotifs = preferences.notifications || {
      contractExpiring: true,
      paymentOverdue: true,
      taskDue: true,
      whatsappMessage: true,
      weeklySummary: false,
    }
    return updatePreferences({ 
      notifications: { ...currentNotifs, ...notifPrefs } 
    })
  }, [updatePreferences, preferences.notifications])

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    setDashboardWidgets,
    setNotificationPreferences,
    refetch: fetchPreferences,
  }
}
