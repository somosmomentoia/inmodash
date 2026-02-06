// Types for Prospect module

export type ProspectSource = 'whatsapp' | 'web' | 'referral' | 'walk_in' | 'phone' | 'social_media' | 'other'
export type ProspectStatus = 'new' | 'contacted' | 'visited' | 'under_review' | 'approved' | 'rejected' | 'converted'
export type ProspectActivityType = 
  | 'created' 
  | 'status_changed' 
  | 'note_added' 
  | 'document_uploaded' 
  | 'visit_scheduled' 
  | 'visit_completed' 
  | 'contact_attempt' 
  | 'converted' 
  | 'info_updated'

export interface CreateProspectDto {
  fullName: string
  phone: string
  email?: string
  dniOrCuit?: string
  apartmentId?: number
  source?: ProspectSource
  notes?: string
}

export interface UpdateProspectDto {
  fullName?: string
  phone?: string
  email?: string
  dniOrCuit?: string
  apartmentId?: number
  source?: ProspectSource
  notes?: string
}

export interface ChangeProspectStatusDto {
  status: ProspectStatus
  note?: string // Optional note explaining the status change
}

export interface AddProspectNoteDto {
  note: string
}

export interface ConvertProspectDto {
  // Tenant data (required if creating new tenant)
  createNewTenant?: boolean
  existingTenantId?: number
  
  // Tenant fields (used if createNewTenant is true)
  tenantData?: {
    nameOrBusiness: string
    dniOrCuit: string
    address: string
    contactName: string
    contactPhone: string
    contactEmail: string
    contactAddress: string
  }
  
  // Contract data - will be used to prefill the contract wizard
  // The actual contract creation happens in the frontend wizard
  redirectToContractWizard?: boolean
}

export interface ProspectFilters {
  status?: ProspectStatus
  source?: ProspectSource
  apartmentId?: number
  search?: string
  fromDate?: Date
  toDate?: Date
}

// Labels for UI
export const PROSPECT_SOURCE_LABELS: Record<ProspectSource, string> = {
  whatsapp: 'WhatsApp',
  web: 'Sitio Web',
  referral: 'Referido',
  walk_in: 'Visita Espontánea',
  phone: 'Teléfono',
  social_media: 'Redes Sociales',
  other: 'Otro',
}

export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  visited: 'Visitó',
  under_review: 'En Evaluación',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  converted: 'Convertido',
}

export const PROSPECT_ACTIVITY_LABELS: Record<ProspectActivityType, string> = {
  created: 'Prospecto creado',
  status_changed: 'Estado actualizado',
  note_added: 'Nota agregada',
  document_uploaded: 'Documento subido',
  visit_scheduled: 'Visita programada',
  visit_completed: 'Visita realizada',
  contact_attempt: 'Intento de contacto',
  converted: 'Convertido a contrato',
  info_updated: 'Información actualizada',
}
