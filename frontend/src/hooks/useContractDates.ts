import { useMemo } from 'react'
import { getMonthsBetween } from '@/lib/utils'

/**
 * Hook para calcular información de fechas de contratos
 */
export function useContractDates(startDate: Date, endDate: Date) {
  const monthsRemaining = useMemo(() => {
    return getMonthsBetween(new Date(), endDate)
  }, [endDate])
  
  const totalMonths = useMemo(() => {
    return getMonthsBetween(startDate, endDate)
  }, [startDate, endDate])
  
  const isActive = useMemo(() => {
    const now = new Date()
    return now >= startDate && now <= endDate
  }, [startDate, endDate])
  
  const isExpired = useMemo(() => {
    return new Date() > endDate
  }, [endDate])
  
  return {
    monthsRemaining,
    totalMonths,
    isActive,
    isExpired
  }
}
