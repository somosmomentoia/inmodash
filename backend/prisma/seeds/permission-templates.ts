/**
 * Permission Templates por Rol
 * Define los permisos base para cada StaffRole
 */

export type PermissionTemplate = {
  module: string
  action: string
}

export const MODULES = {
  DASHBOARD: 'dashboard',
  PROPERTIES: 'properties',
  CONTRACTS: 'contracts',
  CLIENTS: 'clients',
  GUARANTORS: 'guarantors',
  OBLIGATIONS: 'obligations',
  PAYMENTS: 'payments',
  FINANCES: 'finances',
  REPORTS: 'reports',
  TASKS: 'tasks',
  DOCUMENTS: 'documents',
  INTEGRATIONS: 'integrations',
  SETTINGS: 'settings',
  USERS: 'users',
} as const

export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  EXPORT: 'export',
  REGISTER_PAYMENT: 'register_payment',
  SETTLE: 'settle',
  ASSIGN_TASKS: 'assign_tasks',
  VIEW_ALL_TASKS: 'view_all_tasks',
  EDIT_ANY_TASK: 'edit_any_task',
  DELETE_ANY_TASK: 'delete_any_task',
} as const

/**
 * Templates de permisos por rol
 */
export const ROLE_PERMISSION_TEMPLATES: Record<string, PermissionTemplate[]> = {
  ADMIN: [
    // Acceso total a todo
    { module: MODULES.DASHBOARD, action: ACTIONS.VIEW },
    { module: MODULES.PROPERTIES, action: ACTIONS.VIEW },
    { module: MODULES.PROPERTIES, action: ACTIONS.CREATE },
    { module: MODULES.PROPERTIES, action: ACTIONS.EDIT },
    { module: MODULES.PROPERTIES, action: ACTIONS.DELETE },
    { module: MODULES.CONTRACTS, action: ACTIONS.VIEW },
    { module: MODULES.CONTRACTS, action: ACTIONS.CREATE },
    { module: MODULES.CONTRACTS, action: ACTIONS.EDIT },
    { module: MODULES.CONTRACTS, action: ACTIONS.DELETE },
    { module: MODULES.CLIENTS, action: ACTIONS.VIEW },
    { module: MODULES.CLIENTS, action: ACTIONS.CREATE },
    { module: MODULES.CLIENTS, action: ACTIONS.EDIT },
    { module: MODULES.CLIENTS, action: ACTIONS.DELETE },
    { module: MODULES.GUARANTORS, action: ACTIONS.VIEW },
    { module: MODULES.GUARANTORS, action: ACTIONS.CREATE },
    { module: MODULES.GUARANTORS, action: ACTIONS.EDIT },
    { module: MODULES.GUARANTORS, action: ACTIONS.DELETE },
    { module: MODULES.OBLIGATIONS, action: ACTIONS.VIEW },
    { module: MODULES.OBLIGATIONS, action: ACTIONS.CREATE },
    { module: MODULES.OBLIGATIONS, action: ACTIONS.EDIT },
    { module: MODULES.OBLIGATIONS, action: ACTIONS.DELETE },
    { module: MODULES.PAYMENTS, action: ACTIONS.VIEW },
    { module: MODULES.PAYMENTS, action: ACTIONS.REGISTER_PAYMENT },
    { module: MODULES.FINANCES, action: ACTIONS.VIEW },
    { module: MODULES.FINANCES, action: ACTIONS.SETTLE },
    { module: MODULES.FINANCES, action: ACTIONS.EXPORT },
    { module: MODULES.REPORTS, action: ACTIONS.VIEW },
    { module: MODULES.REPORTS, action: ACTIONS.EXPORT },
    { module: MODULES.TASKS, action: ACTIONS.VIEW },
    { module: MODULES.TASKS, action: ACTIONS.CREATE },
    { module: MODULES.TASKS, action: ACTIONS.EDIT },
    { module: MODULES.TASKS, action: ACTIONS.DELETE },
    { module: MODULES.TASKS, action: ACTIONS.ASSIGN_TASKS },
    { module: MODULES.TASKS, action: ACTIONS.VIEW_ALL_TASKS },
    { module: MODULES.TASKS, action: ACTIONS.EDIT_ANY_TASK },
    { module: MODULES.TASKS, action: ACTIONS.DELETE_ANY_TASK },
    { module: MODULES.DOCUMENTS, action: ACTIONS.VIEW },
    { module: MODULES.DOCUMENTS, action: ACTIONS.CREATE },
    { module: MODULES.DOCUMENTS, action: ACTIONS.EDIT },
    { module: MODULES.DOCUMENTS, action: ACTIONS.DELETE },
    { module: MODULES.INTEGRATIONS, action: ACTIONS.VIEW },
    { module: MODULES.INTEGRATIONS, action: ACTIONS.EDIT },
    { module: MODULES.SETTINGS, action: ACTIONS.VIEW },
    { module: MODULES.SETTINGS, action: ACTIONS.EDIT },
    { module: MODULES.USERS, action: ACTIONS.VIEW },
    { module: MODULES.USERS, action: ACTIONS.CREATE },
    { module: MODULES.USERS, action: ACTIONS.EDIT },
    { module: MODULES.USERS, action: ACTIONS.DELETE },
  ],

  MANAGER: [
    // Gestión general - casi todo excepto usuarios y settings críticos
    { module: MODULES.DASHBOARD, action: ACTIONS.VIEW },
    { module: MODULES.PROPERTIES, action: ACTIONS.VIEW },
    { module: MODULES.PROPERTIES, action: ACTIONS.CREATE },
    { module: MODULES.PROPERTIES, action: ACTIONS.EDIT },
    { module: MODULES.CONTRACTS, action: ACTIONS.VIEW },
    { module: MODULES.CONTRACTS, action: ACTIONS.CREATE },
    { module: MODULES.CONTRACTS, action: ACTIONS.EDIT },
    { module: MODULES.CLIENTS, action: ACTIONS.VIEW },
    { module: MODULES.CLIENTS, action: ACTIONS.CREATE },
    { module: MODULES.CLIENTS, action: ACTIONS.EDIT },
    { module: MODULES.GUARANTORS, action: ACTIONS.VIEW },
    { module: MODULES.GUARANTORS, action: ACTIONS.CREATE },
    { module: MODULES.GUARANTORS, action: ACTIONS.EDIT },
    { module: MODULES.OBLIGATIONS, action: ACTIONS.VIEW },
    { module: MODULES.OBLIGATIONS, action: ACTIONS.CREATE },
    { module: MODULES.OBLIGATIONS, action: ACTIONS.EDIT },
    { module: MODULES.PAYMENTS, action: ACTIONS.VIEW },
    { module: MODULES.PAYMENTS, action: ACTIONS.REGISTER_PAYMENT },
    { module: MODULES.FINANCES, action: ACTIONS.VIEW },
    { module: MODULES.FINANCES, action: ACTIONS.SETTLE },
    { module: MODULES.FINANCES, action: ACTIONS.EXPORT },
    { module: MODULES.REPORTS, action: ACTIONS.VIEW },
    { module: MODULES.REPORTS, action: ACTIONS.EXPORT },
    { module: MODULES.TASKS, action: ACTIONS.VIEW },
    { module: MODULES.TASKS, action: ACTIONS.CREATE },
    { module: MODULES.TASKS, action: ACTIONS.EDIT },
    { module: MODULES.TASKS, action: ACTIONS.ASSIGN_TASKS },
    { module: MODULES.TASKS, action: ACTIONS.VIEW_ALL_TASKS },
    { module: MODULES.TASKS, action: ACTIONS.EDIT_ANY_TASK },
    { module: MODULES.DOCUMENTS, action: ACTIONS.VIEW },
    { module: MODULES.DOCUMENTS, action: ACTIONS.CREATE },
    { module: MODULES.DOCUMENTS, action: ACTIONS.EDIT },
    { module: MODULES.USERS, action: ACTIONS.VIEW },
  ],

  ACCOUNTING: [
    // Contabilidad y finanzas
    { module: MODULES.DASHBOARD, action: ACTIONS.VIEW },
    { module: MODULES.OBLIGATIONS, action: ACTIONS.VIEW },
    { module: MODULES.OBLIGATIONS, action: ACTIONS.CREATE },
    { module: MODULES.OBLIGATIONS, action: ACTIONS.EDIT },
    { module: MODULES.PAYMENTS, action: ACTIONS.VIEW },
    { module: MODULES.PAYMENTS, action: ACTIONS.REGISTER_PAYMENT },
    { module: MODULES.FINANCES, action: ACTIONS.VIEW },
    { module: MODULES.FINANCES, action: ACTIONS.SETTLE },
    { module: MODULES.FINANCES, action: ACTIONS.EXPORT },
    { module: MODULES.REPORTS, action: ACTIONS.VIEW },
    { module: MODULES.REPORTS, action: ACTIONS.EXPORT },
    { module: MODULES.TASKS, action: ACTIONS.VIEW },
    { module: MODULES.TASKS, action: ACTIONS.CREATE },
    { module: MODULES.TASKS, action: ACTIONS.EDIT },
    { module: MODULES.DOCUMENTS, action: ACTIONS.VIEW },
    { module: MODULES.DOCUMENTS, action: ACTIONS.CREATE },
  ],

  COLLECTIONS: [
    // Cobranzas - enfocado en pagos y obligaciones
    { module: MODULES.DASHBOARD, action: ACTIONS.VIEW },
    { module: MODULES.CLIENTS, action: ACTIONS.VIEW },
    { module: MODULES.CONTRACTS, action: ACTIONS.VIEW },
    { module: MODULES.OBLIGATIONS, action: ACTIONS.VIEW },
    { module: MODULES.OBLIGATIONS, action: ACTIONS.CREATE },
    { module: MODULES.PAYMENTS, action: ACTIONS.VIEW },
    { module: MODULES.PAYMENTS, action: ACTIONS.REGISTER_PAYMENT },
    { module: MODULES.FINANCES, action: ACTIONS.VIEW },
    { module: MODULES.REPORTS, action: ACTIONS.VIEW },
    { module: MODULES.TASKS, action: ACTIONS.VIEW },
    { module: MODULES.TASKS, action: ACTIONS.CREATE },
    { module: MODULES.TASKS, action: ACTIONS.EDIT },
    { module: MODULES.DOCUMENTS, action: ACTIONS.VIEW },
  ],

  LEASING: [
    // Alquileres y contratos
    { module: MODULES.DASHBOARD, action: ACTIONS.VIEW },
    { module: MODULES.PROPERTIES, action: ACTIONS.VIEW },
    { module: MODULES.PROPERTIES, action: ACTIONS.CREATE },
    { module: MODULES.PROPERTIES, action: ACTIONS.EDIT },
    { module: MODULES.CONTRACTS, action: ACTIONS.VIEW },
    { module: MODULES.CONTRACTS, action: ACTIONS.CREATE },
    { module: MODULES.CONTRACTS, action: ACTIONS.EDIT },
    { module: MODULES.CLIENTS, action: ACTIONS.VIEW },
    { module: MODULES.CLIENTS, action: ACTIONS.CREATE },
    { module: MODULES.CLIENTS, action: ACTIONS.EDIT },
    { module: MODULES.GUARANTORS, action: ACTIONS.VIEW },
    { module: MODULES.GUARANTORS, action: ACTIONS.CREATE },
    { module: MODULES.GUARANTORS, action: ACTIONS.EDIT },
    { module: MODULES.OBLIGATIONS, action: ACTIONS.VIEW },
    { module: MODULES.REPORTS, action: ACTIONS.VIEW },
    { module: MODULES.TASKS, action: ACTIONS.VIEW },
    { module: MODULES.TASKS, action: ACTIONS.CREATE },
    { module: MODULES.TASKS, action: ACTIONS.EDIT },
    { module: MODULES.DOCUMENTS, action: ACTIONS.VIEW },
    { module: MODULES.DOCUMENTS, action: ACTIONS.CREATE },
    { module: MODULES.DOCUMENTS, action: ACTIONS.EDIT },
  ],

  MAINTENANCE: [
    // Mantenimiento - tareas y propiedades
    { module: MODULES.DASHBOARD, action: ACTIONS.VIEW },
    { module: MODULES.PROPERTIES, action: ACTIONS.VIEW },
    { module: MODULES.PROPERTIES, action: ACTIONS.EDIT },
    { module: MODULES.CONTRACTS, action: ACTIONS.VIEW },
    { module: MODULES.OBLIGATIONS, action: ACTIONS.VIEW },
    { module: MODULES.OBLIGATIONS, action: ACTIONS.CREATE },
    { module: MODULES.TASKS, action: ACTIONS.VIEW },
    { module: MODULES.TASKS, action: ACTIONS.CREATE },
    { module: MODULES.TASKS, action: ACTIONS.EDIT },
    { module: MODULES.DOCUMENTS, action: ACTIONS.VIEW },
    { module: MODULES.DOCUMENTS, action: ACTIONS.CREATE },
  ],

  READ_ONLY: [
    // Solo lectura en todo
    { module: MODULES.DASHBOARD, action: ACTIONS.VIEW },
    { module: MODULES.PROPERTIES, action: ACTIONS.VIEW },
    { module: MODULES.CONTRACTS, action: ACTIONS.VIEW },
    { module: MODULES.CLIENTS, action: ACTIONS.VIEW },
    { module: MODULES.GUARANTORS, action: ACTIONS.VIEW },
    { module: MODULES.OBLIGATIONS, action: ACTIONS.VIEW },
    { module: MODULES.PAYMENTS, action: ACTIONS.VIEW },
    { module: MODULES.FINANCES, action: ACTIONS.VIEW },
    { module: MODULES.REPORTS, action: ACTIONS.VIEW },
    { module: MODULES.TASKS, action: ACTIONS.VIEW },
    { module: MODULES.DOCUMENTS, action: ACTIONS.VIEW },
  ],
}

/**
 * Obtiene los permisos para un rol específico
 */
export function getPermissionsForRole(role: string): PermissionTemplate[] {
  return ROLE_PERMISSION_TEMPLATES[role] || []
}
