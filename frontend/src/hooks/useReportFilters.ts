'use client'

import { useState, useMemo, useCallback } from 'react'
import { Obligation } from '@/types'

export type PeriodType = 
  | 'current-month' 
  | 'last-month' 
  | 'last-3-months' 
  | 'last-6-months'
  | 'last-12-months'
  | 'this-year' 
  | 'last-year'
  | 'all'
  | 'custom'

interface DateRange {
  start: Date
  end: Date
}

interface PeriodOption {
  value: PeriodType
  label: string
}

export function getDateRangeForPeriod(period: PeriodType, customRange?: DateRange): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (period) {
    case 'current-month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
      return { start, end }
    }
    case 'last-month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59)
      return { start, end }
    }
    case 'last-3-months': {
      const start = new Date(today.getFullYear(), today.getMonth() - 2, 1)
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
      return { start, end }
    }
    case 'last-6-months': {
      const start = new Date(today.getFullYear(), today.getMonth() - 5, 1)
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
      return { start, end }
    }
    case 'last-12-months': {
      const start = new Date(today.getFullYear(), today.getMonth() - 11, 1)
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
      return { start, end }
    }
    case 'this-year': {
      const start = new Date(today.getFullYear(), 0, 1)
      const end = new Date(today.getFullYear(), 11, 31, 23, 59, 59)
      return { start, end }
    }
    case 'last-year': {
      const start = new Date(today.getFullYear() - 1, 0, 1)
      const end = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59)
      return { start, end }
    }
    case 'custom':
      return customRange || { start: today, end: today }
    case 'all':
    default:
      return { 
        start: new Date(2020, 0, 1), 
        end: new Date(today.getFullYear() + 1, 11, 31, 23, 59, 59) 
      }
  }
}

export function formatPeriodLabel(period: PeriodType): string {
  const range = getDateRangeForPeriod(period)
  const formatDate = (d: Date) => d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  const formatMonth = (d: Date) => d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  
  switch (period) {
    case 'current-month':
      return `${formatMonth(range.start)} (${formatDate(range.start)} al ${formatDate(range.end)})`
    case 'last-month':
      return formatMonth(range.start)
    case 'last-3-months':
      return 'Últimos 3 meses'
    case 'last-6-months':
      return 'Últimos 6 meses'
    case 'last-12-months':
      return 'Últimos 12 meses'
    case 'this-year':
      return `Año ${range.start.getFullYear()}`
    case 'last-year':
      return `Año ${range.start.getFullYear()}`
    case 'all':
      return 'Todo el período'
    default:
      return 'Período personalizado'
  }
}

export function getPeriodOptions(includeAll = true): PeriodOption[] {
  const options: PeriodOption[] = [
    { value: 'current-month', label: formatPeriodLabel('current-month') },
    { value: 'last-month', label: formatPeriodLabel('last-month') },
    { value: 'last-3-months', label: formatPeriodLabel('last-3-months') },
    { value: 'last-6-months', label: formatPeriodLabel('last-6-months') },
    { value: 'last-12-months', label: formatPeriodLabel('last-12-months') },
    { value: 'this-year', label: formatPeriodLabel('this-year') },
    { value: 'last-year', label: formatPeriodLabel('last-year') },
  ]
  
  if (includeAll) {
    options.push({ value: 'all', label: 'Todo el período' })
  }
  
  return options
}

export function useReportFilters<T extends { dueDate?: Date | string; updatedAt?: Date | string; period?: Date | string }>(
  data: T[],
  dateField: 'dueDate' | 'updatedAt' | 'period' = 'dueDate'
) {
  const [period, setPeriod] = useState<PeriodType>('current-month')
  const [ownerId, setOwnerId] = useState<number | null>(null)
  const [propertyId, setPropertyId] = useState<number | null>(null)
  const [contractId, setContractId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const dateRange = useMemo(() => getDateRangeForPeriod(period), [period])

  const periodLabel = useMemo(() => {
    const range = dateRange
    return range.start.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  }, [dateRange])

  const filteredByPeriod = useMemo(() => {
    return data.filter(item => {
      const dateValue = item[dateField]
      if (!dateValue) return false
      
      const itemDate = new Date(dateValue)
      return itemDate >= dateRange.start && itemDate <= dateRange.end
    })
  }, [data, dateRange, dateField])

  const filterByOwner = useCallback((items: T[], ownerIdFilter: number | null) => {
    if (!ownerIdFilter) return items
    return items.filter((item: any) => {
      const apartment = item.apartment
      return apartment && apartment.ownerId === ownerIdFilter
    })
  }, [])

  const filterByProperty = useCallback((items: T[], propertyIdFilter: number | null) => {
    if (!propertyIdFilter) return items
    return items.filter((item: any) => item.apartmentId === propertyIdFilter)
  }, [])

  const filterByContract = useCallback((items: T[], contractIdFilter: number | null) => {
    if (!contractIdFilter) return items
    return items.filter((item: any) => item.contractId === contractIdFilter)
  }, [])

  const filteredData = useMemo(() => {
    let result = filteredByPeriod
    result = filterByOwner(result, ownerId)
    result = filterByProperty(result, propertyId)
    result = filterByContract(result, contractId)
    return result
  }, [filteredByPeriod, ownerId, propertyId, contractId, filterByOwner, filterByProperty, filterByContract])

  const periodOptions = useMemo(() => getPeriodOptions(), [])

  return {
    // State
    period,
    setPeriod,
    ownerId,
    setOwnerId,
    propertyId,
    setPropertyId,
    contractId,
    setContractId,
    searchQuery,
    setSearchQuery,
    
    // Computed
    dateRange,
    periodLabel,
    periodOptions,
    filteredData,
    
    // Helpers
    getDateRangeForPeriod,
    formatPeriodLabel,
  }
}

// Helper to filter obligations by period
export function filterObligationsByPeriod(
  obligations: Obligation[], 
  period: PeriodType,
  dateField: 'dueDate' | 'updatedAt' | 'period' = 'dueDate'
): Obligation[] {
  const range = getDateRangeForPeriod(period)
  
  return obligations.filter(o => {
    const dateValue = o[dateField]
    if (!dateValue) return false
    
    const itemDate = new Date(dateValue)
    return itemDate >= range.start && itemDate <= range.end
  })
}
