export interface Building {
  id: number
  name: string
  address: string
  province: string
  city: string
  owner: string
  ownerId?: number | null
  ownerRelation?: Owner | null
  floors: number
  totalArea: number
  createdAt: Date
  updatedAt: Date
  floorConfiguration: FloorConfiguration[]
  apartments: Apartment[]
  floorPlans?: FloorPlan[]
}

export interface FloorConfiguration {
  floor: number
  apartmentsCount: number
}

export interface RentalHistory {
  id: number
  contractId: number
  tenantId: number
  tenantName: string
  startDate: Date
  endDate: Date
  initialAmount: number
  finalAmount?: number // Último monto pagado
}

export interface Owner {
  id: number
  name: string
  dniOrCuit: string
  phone: string
  email: string
  address: string
  bankAccount?: string
  commissionPercentage?: number // Porcentaje de comisión de la inmobiliaria
  createdAt: Date
  updatedAt: Date
  apartments?: Apartment[]
}

export interface Apartment {
  id: number
  uniqueId: string // Generated ID like N13C100001
  // Campos de edificio (opcionales para departamentos independientes)
  buildingId?: number
  building?: Building
  floor?: number
  apartmentLetter?: string
  nomenclature: string
  // Campos para departamentos independientes
  fullAddress?: string
  city?: string
  province?: string
  // Propietario
  ownerId?: number
  owner?: Owner
  // Tipo de propiedad
  propertyType: PropertyType
  // Información general
  area: number // in square meters
  rooms: number
  areaPercentage: number // Calculated automatically
  roomPercentage: number // Calculated automatically
  status: ApartmentStatus
  saleStatus: SaleStatus
  // Especificaciones adicionales
  specifications?: string // JSON string
  createdAt: Date
  updatedAt: Date
  floorPlans?: FloorPlan[]
  rentalHistory?: RentalHistory[] // Historial de alquileres
}

export interface FloorPlan {
  id: number
  name: string
  fileName: string
  fileUrl: string
  fileSize: number
  uploadedAt: Date
  buildingId?: number
  apartmentId?: number
}

export enum ApartmentStatus {
  RENTED = 'alquilado',
  AVAILABLE = 'disponible',
  UNDER_RENOVATION = 'en_refaccion',
  PERSONAL_USE = 'uso_propio'
}

export enum SaleStatus {
  FOR_SALE = 'en_venta',
  NOT_FOR_SALE = 'no_esta_en_venta'
}

export enum PropertyType {
  APARTMENT = 'departamento',
  HOUSE = 'casa',
  DUPLEX = 'duplex',
  PH = 'ph',
  OFFICE = 'oficina',
  COMMERCIAL = 'local_comercial',
  PARKING = 'cochera',
  WAREHOUSE = 'deposito',
  LAND = 'terreno'
}

// Form types
export interface BuildingFormData {
  name: string
  address: string
  province: string
  city: string
  owner: string
  floors: number
  floorConfiguration: FloorConfiguration[]
  totalArea: number
}

export interface ApartmentFormData {
  buildingId: number
  floor: number
  apartmentLetter: string
  area: number
  rooms: number
  status: ApartmentStatus
  saleStatus: SaleStatus
  nomenclature: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Payment & contract types
export type UpdateRuleType = 'fijo' | 'indice' | 'porcentaje'
export type UpdateFrequency = 'mensual' | 'trimestral' | 'cuatrimestral' | 'semestral' | 'anual'
export type InterestFrequency = 'diario' | 'semanal' | 'mensual'

export interface UpdatePeriod {
  date: Date // Fecha de actualización
  type: UpdateRuleType
  value?: number // Porcentaje o valor fijo según el tipo
  indexName?: string // Nombre del índice si type es 'indice'
}

export interface LateInterestConfig {
  percent: number // Porcentaje de interés
  frequency: InterestFrequency // Frecuencia de aplicación
}

export interface PaymentUpdateRule {
  updatePeriods: UpdatePeriod[] // Períodos de actualización
  updateFrequency: UpdateFrequency // Frecuencia de actualización (mensual, trimestral, etc.)
  monthlyCoefficient?: number // Coeficiente x mes (si aplica)
  lateInterest?: LateInterestConfig // Configuración de interés por mora
}

export interface PaymentPlan {
  initialAmount: number
  updateRule: PaymentUpdateRule
}

export interface Payment {
  id: number
  contractId: number
  month: Date
  amount: number
  commissionAmount: number
  ownerAmount: number
  paymentDate?: Date
  status: PaymentStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
  contract?: Contract
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue'
}

// Dashboard statistics
export interface DashboardStats {
  totalBuildings: number
  totalApartments: number
  availableApartments: number
  rentedApartments: number
  apartmentsForSale: number
  totalArea: number
  totalTenants: number
  totalOwners: number
  activeContracts: number
  independentApartments: number
  totalPayments: number
  pendingPayments: number
  overduePayments: number
  paidThisMonth: number
  totalRevenue: number
  totalCommissions: number
  pendingAmount: number
}

// People & document types
export interface ContactPerson {
  name: string
  phone: string
  email: string
  address: string
}

export type DocumentType = 'dni' | 'recibo_sueldo' | 'contrato' | 'garantia' | 'otro'

export interface Document {
  id: number
  type: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  description?: string
  uploadedAt: Date
  tenantId?: number
  ownerId?: number
  contractId?: number
  apartmentId?: number
  tenant?: Tenant
  owner?: Owner
  contract?: Contract
  apartment?: Apartment
}

export interface Tenant {
  id: number
  nameOrBusiness: string // Nombre o razón social
  dniOrCuit: string // DNI / CUIT
  address: string // Dirección del cliente
  contactName: string // Persona de contacto - nombre
  contactPhone: string // Persona de contacto - teléfono
  contactEmail: string // Persona de contacto - email
  contactAddress: string // Persona de contacto - dirección
  createdAt: Date
  updatedAt: Date
  documents?: Document[]
  guarantors?: Guarantor[] // Garantes asociados a este cliente específico
}

export interface Guarantor {
  id: number
  tenantId: number // ID del cliente al que pertenece este garante
  name: string
  dni: string
  address: string
  email: string
  phone: string
  createdAt: Date
  updatedAt: Date
  documents?: Document[]
}

export interface Contract {
  id: number
  apartmentId: number
  tenantId: number
  startDate: Date
  endDate: Date
  initialAmount: number
  commissionType?: CommissionType
  commissionValue?: number
  vendorId?: number
  vendorCommissionPct?: number
  signupFeeAmount?: number
  contractExpenses?: number
  createdAt: Date
  updatedAt: Date
  apartment?: Apartment
  tenant?: Tenant
  updateRule?: UpdateRule
  guarantors?: ContractGuarantor[]
  documents?: Document[] // Contrato y anexos
  vendor?: Vendor
}

export interface UpdateRule {
  id: number
  contractId: number
  updateFrequency: UpdateFrequency
  monthlyCoefficient?: number
  lateInterestPercent?: number
  lateInterestFrequency?: InterestFrequency
  updatePeriods: UpdatePeriod[]
}

export interface ContractGuarantor {
  contractId: number
  guarantorId: number
  contract?: Contract
  guarantor?: Guarantor
}

// ============================================================================
// VENDORS & COMMISSIONS
// ============================================================================

export interface Vendor {
  id: number
  userId: number
  name: string
  email?: string
  phone?: string
  isActive: boolean
  defaultCommissionType?: string // "percentage" | "fixed"
  defaultCommissionPct?: number
  defaultCommissionFixed?: number
  createdAt: Date
  updatedAt: Date
  _count?: { contracts: number; commissions: number }
}

export interface VendorCommission {
  id: number
  userId: number
  vendorId: number
  contractId: number
  amount: number
  status: 'pending' | 'paid'
  paidAt?: Date
  paymentMethod?: string
  reference?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  vendor?: Vendor
  contract?: Contract
}

// ============================================================================
// OBLIGATIONS & PAYMENTS (NEW SYSTEM)
// ============================================================================

export type ObligationType = 'rent' | 'expenses' | 'service' | 'tax' | 'insurance' | 'maintenance' | 'debt' | 'income_other' | 'expense_other'
export type ObligationStatus = 'pending' | 'partial' | 'paid' | 'overdue'
export type PaymentMethod = 'cash' | 'transfer' | 'check' | 'card' | 'other'
export type PaidBy = 'tenant' | 'owner' | 'agency'
export type ChargeTo = 'tenant' | 'owner' | 'agency'
export type ObligationOrigin = 'tenant_ledger' | 'cashflow' | 'liquidation_manual' | 'contract_auto'
export type CommissionType = 'percentage' | 'fixed'

export interface Obligation {
  id: number
  userId: number
  contractId?: number
  apartmentId?: number
  type: ObligationType
  category?: string
  description: string
  period: Date
  dueDate: Date
  amount: number
  paidAmount: number
  // Distribución de dinero
  paidBy: PaidBy
  chargeTo: ChargeTo
  // Trazabilidad
  origin?: ObligationOrigin
  ownerImpact: number
  agencyImpact: number
  // Legacy fields
  commissionAmount: number
  ownerAmount: number
  status: ObligationStatus
  isAutoGenerated: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
  // Relations
  contract?: Contract
  apartment?: Apartment
  obligationPayments?: ObligationPayment[]
}

export interface ObligationPayment {
  id: number
  userId: number
  obligationId: number
  amount: number
  paymentDate: Date
  method?: PaymentMethod
  reference?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  // Relations
  obligation?: Obligation
}

export interface CreateObligationDto {
  contractId?: number
  apartmentId?: number
  type: ObligationType
  category?: string
  description: string
  period: string | Date
  dueDate: string | Date
  amount: number
  // Quién paga la obligación (afecta distribución de dinero)
  paidBy?: PaidBy
  // A quién se le carga esta obligación
  chargeTo?: ChargeTo
  // Impacto en saldos (calculado automáticamente por backend si no se especifica)
  ownerImpact?: number
  agencyImpact?: number
  // Trazabilidad
  origin?: ObligationOrigin
  // Legacy fields
  commissionAmount?: number
  ownerAmount?: number
  // Para crear obligaciones ya pagadas (ajustes/créditos)
  status?: ObligationStatus
  paidAmount?: number
  notes?: string
}

export interface UpdateObligationDto {
  description?: string
  dueDate?: string | Date
  amount?: number
  notes?: string
}

export interface CreateObligationPaymentDto {
  obligationId: number
  amount: number
  paymentDate: string | Date
  method?: PaymentMethod
  reference?: string
  notes?: string
}

export interface UpdateObligationPaymentDto {
  amount?: number
  paymentDate?: string | Date
  method?: PaymentMethod
  reference?: string
  notes?: string
}

// Task Types
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: number
  userId: number
  title: string
  description?: string
  dueDate?: Date | string
  completedAt?: Date | string
  status: TaskStatus
  priority: TaskPriority
  contractId?: number
  apartmentId?: number
  ownerId?: number
  tenantId?: number
  obligationId?: number
  contactId?: number
  createdAt: Date | string
  updatedAt: Date | string
  // Relations
  contract?: {
    id: number
    apartment?: { nomenclature: string }
    tenant?: { nameOrBusiness: string }
  }
  apartment?: { id: number; nomenclature: string; fullAddress?: string }
  owner?: { id: number; name: string; email?: string; phone?: string }
  tenant?: { id: number; nameOrBusiness: string; contactEmail?: string; contactPhone?: string }
  obligation?: { id: number; description: string; type: string; amount?: number; status?: string; dueDate?: Date }
  contact?: { id: number; name: string; category?: string; email?: string; phone?: string }
}

export interface CreateTaskDto {
  title: string
  description?: string
  dueDate?: Date | string
  priority?: TaskPriority
  contractId?: number
  apartmentId?: number
  ownerId?: number
  tenantId?: number
  obligationId?: number
  contactId?: number
  assignedToStaffId?: number
  relatedEntityType?: string
  relatedEntityId?: number
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  dueDate?: Date | string
  status?: TaskStatus
  priority?: TaskPriority
  contractId?: number
  apartmentId?: number
  ownerId?: number
  tenantId?: number
  obligationId?: number
  contactId?: number
  assignedToStaffId?: number
  relatedEntityType?: string
  relatedEntityId?: number
}

export interface TaskStats {
  total: number
  pending: number
  overdue: number
  completedThisWeek: number
}

// Contact types
export type ContactCategory = 'client' | 'provider' | 'agent' | 'lawyer' | 'accountant' | 'maintenance' | 'other'

export interface Contact {
  id: number
  userId: number
  name: string
  email?: string
  phone?: string
  company?: string
  position?: string
  notes?: string
  category: ContactCategory
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CreateContactDto {
  name: string
  email?: string
  phone?: string
  company?: string
  position?: string
  notes?: string
  category?: ContactCategory
}

export interface UpdateContactDto {
  name?: string
  email?: string
  phone?: string
  company?: string
  position?: string
  notes?: string
  category?: ContactCategory
}

// ============================================
// PROSPECT TYPES (Leasing Module)
// ============================================

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

export interface Prospect {
  id: number
  userId: number
  fullName: string
  phone: string
  email?: string
  dniOrCuit?: string
  apartmentId?: number
  apartment?: {
    id: number
    nomenclature: string
    fullAddress?: string
    propertyType: string
    status: string
    rentalPrice?: number
    owner?: {
      id: number
      name: string
    }
  }
  source: ProspectSource
  status: ProspectStatus
  notes?: string
  convertedToTenantId?: number
  convertedToContractId?: number
  convertedAt?: Date | string
  convertedToTenant?: {
    id: number
    nameOrBusiness: string
  }
  convertedToContract?: {
    id: number
    startDate: Date | string
    endDate: Date | string
  }
  activities?: ProspectActivity[]
  documents?: ProspectDocument[]
  _count?: {
    activities: number
    documents: number
  }
  createdAt: Date | string
  updatedAt: Date | string
}

export interface ProspectActivity {
  id: number
  prospectId: number
  type: ProspectActivityType
  description: string
  metadata?: Record<string, unknown>
  createdAt: Date | string
}

export interface ProspectDocument {
  id: number
  prospectId: number
  name: string
  type: string
  fileUrl: string
  fileSize?: number
  mimeType?: string
  createdAt: Date | string
}

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
  note?: string
}

export interface ConvertProspectDto {
  createNewTenant?: boolean
  existingTenantId?: number
  tenantData?: {
    nameOrBusiness: string
    dniOrCuit: string
    address: string
    contactName: string
    contactPhone: string
    contactEmail: string
    contactAddress: string
  }
  redirectToContractWizard?: boolean
}

export interface ProspectStats {
  total: number
  byStatus: Record<string, number>
  bySource: Record<string, number>
  recentActivity: ProspectActivity[]
}

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

export const PROSPECT_STATUS_COLORS: Record<ProspectStatus, string> = {
  new: 'info',
  contacted: 'primary',
  visited: 'warning',
  under_review: 'warning',
  approved: 'success',
  rejected: 'error',
  converted: 'success',
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

// ============================================
// STAFF USERS & PERMISSIONS
// ============================================

export enum StaffRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  ACCOUNTING = 'ACCOUNTING',
  COLLECTIONS = 'COLLECTIONS',
  LEASING = 'LEASING',
  MAINTENANCE = 'MAINTENANCE',
  READ_ONLY = 'READ_ONLY',
}

export interface StaffUser {
  id: number
  agencyId: number
  email: string
  name: string
  role: StaffRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserPermission {
  id: number
  staffUserId: number
  module: string
  action: string
  allowed: boolean
}

export interface PermissionTemplate {
  module: string
  action: string
  allowed: boolean
}

export interface CreateStaffUserDto {
  email: string
  password: string
  name: string
  role: StaffRole
}

export interface UpdateStaffUserDto {
  email?: string
  name?: string
  role?: StaffRole
  isActive?: boolean
}

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  ACCOUNTING: 'Contabilidad',
  COLLECTIONS: 'Cobranzas',
  LEASING: 'Alquileres',
  MAINTENANCE: 'Mantenimiento',
  READ_ONLY: 'Solo Lectura',
}

export const STAFF_ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  ADMIN: 'Acceso total al sistema',
  MANAGER: 'Gestión general (excepto usuarios y configuración)',
  ACCOUNTING: 'Contabilidad y finanzas',
  COLLECTIONS: 'Cobranzas y pagos',
  LEASING: 'Alquileres y contratos',
  MAINTENANCE: 'Mantenimiento y propiedades',
  READ_ONLY: 'Solo lectura en todos los módulos',
}

export const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  prospects: 'Prospectos',
  properties: 'Propiedades',
  contracts: 'Contratos',
  obligations: 'Cuenta Corriente',
  finances: 'Finanzas',
  tasks: 'Tareas',
  documents: 'Documentos',
  reports: 'Reportes',
  settings: 'Configuración',
  users: 'Usuarios',
  integrations: 'Integraciones',
}

export const MODULE_DESCRIPTIONS: Record<string, string> = {
  dashboard: '',
  prospects: '',
  properties: 'Unidades, Edificios y Propietarios',
  contracts: 'Contratos, Inquilinos y Garantes',
  obligations: 'Obligaciones y Pagos',
  finances: 'Flujo de Caja, Contabilidad, Liquidaciones y Comisiones',
  tasks: '',
  documents: '',
  reports: '',
  settings: '',
  users: '',
  integrations: '',
}

export interface ActionDefinition {
  key: string
  label: string
  description: string
}

export const MODULE_ACTIONS: Record<string, ActionDefinition[]> = {
  dashboard: [
    { key: 'view', label: 'Ver', description: 'Acceder al dashboard' },
  ],
  prospects: [
    { key: 'view', label: 'Ver', description: 'Ver lista de prospectos' },
    { key: 'create', label: 'Crear', description: 'Crear nuevo prospecto' },
    { key: 'edit', label: 'Editar', description: 'Editar prospecto' },
    { key: 'delete', label: 'Eliminar', description: 'Eliminar prospecto' },
  ],
  properties: [
    { key: 'view', label: 'Ver', description: 'Ver propiedades, edificios y propietarios' },
    { key: 'create', label: 'Crear', description: 'Crear propiedad, edificio o propietario' },
    { key: 'edit', label: 'Editar', description: 'Editar propiedad, edificio o propietario' },
    { key: 'delete', label: 'Eliminar', description: 'Eliminar propiedad, edificio o propietario' },
  ],
  contracts: [
    { key: 'view', label: 'Ver', description: 'Ver contratos, inquilinos y garantes' },
    { key: 'create', label: 'Crear', description: 'Crear contrato, inquilino o garante' },
    { key: 'edit', label: 'Editar', description: 'Editar contrato, inquilino o garante' },
    { key: 'delete', label: 'Eliminar', description: 'Eliminar contrato, inquilino o garante' },
  ],
  obligations: [
    { key: 'view', label: 'Ver', description: 'Ver obligaciones y pagos' },
    { key: 'create', label: 'Crear', description: 'Crear obligación' },
    { key: 'edit', label: 'Editar', description: 'Editar obligación' },
    { key: 'delete', label: 'Eliminar', description: 'Eliminar obligación' },
    { key: 'register_payment', label: 'Registrar Pago', description: 'Registrar un pago contra una obligación' },
    { key: 'generate_recurring', label: 'Generar Recurrentes', description: 'Generar obligaciones recurrentes' },
  ],
  finances: [
    { key: 'view_cashflow', label: 'Ver Flujo de Caja', description: 'Ver movimientos de caja' },
    { key: 'create_movement', label: 'Registrar Movimiento', description: 'Registrar ingreso o egreso en flujo de caja' },
    { key: 'view_accounting', label: 'Ver Contabilidad', description: 'Ver asientos contables' },
    { key: 'view_settlements', label: 'Ver Liquidaciones', description: 'Ver liquidaciones de propietarios' },
    { key: 'settle_owners', label: 'Liquidar Propietarios', description: 'Ejecutar liquidación a propietarios' },
    { key: 'view_commissions', label: 'Ver Comisiones', description: 'Ver comisiones de vendedores' },
    { key: 'pay_commissions', label: 'Pagar Comisiones', description: 'Pagar comisiones a vendedores' },
    { key: 'export', label: 'Exportar', description: 'Exportar datos financieros' },
  ],
  tasks: [
    { key: 'view', label: 'Ver', description: 'Ver mis tareas' },
    { key: 'create', label: 'Crear', description: 'Crear nueva tarea' },
    { key: 'edit', label: 'Editar', description: 'Editar mis tareas' },
    { key: 'delete', label: 'Eliminar', description: 'Eliminar mis tareas' },
    { key: 'view_all', label: 'Ver Todas', description: 'Ver tareas de todos los usuarios' },
    { key: 'manage_all', label: 'Gestionar Todas', description: 'Editar y eliminar tareas de cualquier usuario' },
  ],
  documents: [
    { key: 'view', label: 'Ver', description: 'Ver documentos' },
    { key: 'upload', label: 'Subir', description: 'Subir nuevos documentos' },
    { key: 'download', label: 'Descargar', description: 'Descargar documentos' },
    { key: 'delete', label: 'Eliminar', description: 'Eliminar documentos' },
  ],
  reports: [
    { key: 'view', label: 'Ver', description: 'Ver reportes' },
    { key: 'export', label: 'Exportar', description: 'Exportar y descargar reportes' },
  ],
  settings: [
    { key: 'view', label: 'Ver', description: 'Ver configuración del sistema' },
    { key: 'edit', label: 'Editar', description: 'Modificar configuración' },
  ],
  users: [
    { key: 'view', label: 'Ver', description: 'Ver lista de usuarios' },
    { key: 'create', label: 'Crear', description: 'Crear nuevo usuario' },
    { key: 'edit', label: 'Editar', description: 'Editar datos y rol de usuario' },
    { key: 'deactivate', label: 'Activar/Desactivar', description: 'Activar o desactivar usuario' },
    { key: 'manage_permissions', label: 'Gestionar Permisos', description: 'Configurar permisos granulares' },
  ],
  integrations: [
    { key: 'view', label: 'Ver', description: 'Ver integraciones' },
    { key: 'configure', label: 'Configurar', description: 'Configurar integraciones' },
  ],
}

export const ACTION_LABELS: Record<string, string> = {
  view: 'Ver',
  create: 'Crear',
  edit: 'Editar',
  delete: 'Eliminar',
  export: 'Exportar',
  upload: 'Subir',
  download: 'Descargar',
  configure: 'Configurar',
  deactivate: 'Activar/Desactivar',
  manage_permissions: 'Gestionar Permisos',
  register_payment: 'Registrar Pago',
  generate_recurring: 'Generar Recurrentes',
  view_cashflow: 'Ver Flujo de Caja',
  create_movement: 'Registrar Movimiento',
  view_accounting: 'Ver Contabilidad',
  view_settlements: 'Ver Liquidaciones',
  settle_owners: 'Liquidar Propietarios',
  view_commissions: 'Ver Comisiones',
  pay_commissions: 'Pagar Comisiones',
  view_all: 'Ver Todas',
  manage_all: 'Gestionar Todas',
}
