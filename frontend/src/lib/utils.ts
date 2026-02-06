import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a unique apartment ID based on building name, floor, apartment letter, rooms, and sequence
 * Format: N13C100001 (Neuen 1, 3rd floor, apt C, 1 room, sequence 00001)
 */
export function generateApartmentId(
  buildingName: string,
  floor: number,
  apartmentLetter: string,
  rooms: number,
  sequence: number
): string {
  // Extract first letter and number from building name
  const buildingCode = buildingName
    .replace(/\s+/g, '')
    .substring(0, 2)
    .toUpperCase()
  
  // Format: BuildingCode + Floor + ApartmentLetter + Rooms + Sequence(5 digits)
  const sequenceFormatted = sequence.toString().padStart(5, '0')
  
  return `${buildingCode}${floor}${apartmentLetter.toUpperCase()}${rooms}${sequenceFormatted}`
}

/**
 * Calculates percentage of area relative to total building area
 */
export function calculateAreaPercentage(apartmentArea: number, totalBuildingArea: number): number {
  if (totalBuildingArea === 0) return 0
  return Math.round((apartmentArea / totalBuildingArea) * 100 * 100) / 100 // Round to 2 decimals
}

/**
 * Calculates percentage of rooms relative to total building rooms
 */
export function calculateRoomPercentage(apartmentRooms: number, totalBuildingRooms: number): number {
  if (totalBuildingRooms === 0) return 0
  return Math.round((apartmentRooms / totalBuildingRooms) * 100 * 100) / 100 // Round to 2 decimals
}

/**
 * Formats area in square meters
 */
export function formatArea(area: number): string {
  return `${area} m²`
}

/**
 * Formats room count
 */
export function formatRooms(rooms: number): string {
  return rooms === 1 ? '1 ambiente' : `${rooms} ambientes`
}

/**
 * Formats currency in ARS
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Formats date in Spanish locale
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'long') {
    return dateObj.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  return dateObj.toLocaleDateString('es-AR')
}

/**
 * Calculates months between two dates
 */
export function getMonthsBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = end.getTime() - start.getTime()
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
  return Math.max(0, diffMonths)
}

/**
 * Truncates text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Capitalizes first letter of each word
 */
export function capitalize(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
