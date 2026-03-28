import { useState, useEffect } from 'react'
import { staffService } from '@/services/staff.service'
import { StaffUser } from '@/types'

export function useStaff() {
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStaffUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await staffService.getAll()
      setStaffUsers(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios')
      console.error('Error fetching staff users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaffUsers()
  }, [])

  return {
    staffUsers,
    loading,
    error,
    refetch: fetchStaffUsers,
  }
}
