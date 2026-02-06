/**
 * Hooks personalizados para la aplicación
 */

// Hooks de utilidad
export { useApartmentStatus } from './useApartmentStatus'
export { useContractDates } from './useContractDates'

// Hooks de API
export { useBuildings, useBuilding } from './useBuildings'
export { useApartments, useApartment } from './useApartments'
export { useTenants, useTenant } from './useTenants'
export { useContracts, useContract, useContractsByApartment } from './useContracts'
export { useGuarantors, useGuarantor } from './useGuarantors'
export { useContractGuarantors } from './useContractGuarantors'
export { useDashboard } from './useDashboard'
export { useOwners, useOwner } from './useOwners'
export { usePayments, usePayment, useContractPayments, usePendingPayments, useOverduePayments } from './usePayments'
