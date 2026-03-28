/**
 * Permission Templates — Islas de acciones por módulo
 * Cada módulo define SOLO las acciones que realmente existen en esa página.
 */

export interface ActionDefinition {
  key: string
  label: string
  description: string
}

export interface ModuleDefinition {
  label: string
  description?: string
  actions: ActionDefinition[]
}

export interface PermissionTemplate {
  module: string
  action: string
  allowed: boolean
}

// ─── Definición de módulos y sus acciones específicas ────────────────────────

export const MODULE_ACTIONS: Record<string, ModuleDefinition> = {
  dashboard: {
    label: 'Dashboard',
    actions: [
      { key: 'view', label: 'Ver', description: 'Acceder al dashboard' },
    ],
  },
  prospects: {
    label: 'Prospectos',
    actions: [
      { key: 'view', label: 'Ver', description: 'Ver lista de prospectos' },
      { key: 'create', label: 'Crear', description: 'Crear nuevo prospecto' },
      { key: 'edit', label: 'Editar', description: 'Editar prospecto' },
      { key: 'delete', label: 'Eliminar', description: 'Eliminar prospecto' },
    ],
  },
  properties: {
    label: 'Propiedades',
    description: 'Unidades, Edificios y Propietarios',
    actions: [
      { key: 'view', label: 'Ver', description: 'Ver propiedades, edificios y propietarios' },
      { key: 'create', label: 'Crear', description: 'Crear propiedad, edificio o propietario' },
      { key: 'edit', label: 'Editar', description: 'Editar propiedad, edificio o propietario' },
      { key: 'delete', label: 'Eliminar', description: 'Eliminar propiedad, edificio o propietario' },
    ],
  },
  contracts: {
    label: 'Contratos',
    description: 'Contratos, Inquilinos y Garantes',
    actions: [
      { key: 'view', label: 'Ver', description: 'Ver contratos, inquilinos y garantes' },
      { key: 'create', label: 'Crear', description: 'Crear contrato, inquilino o garante' },
      { key: 'edit', label: 'Editar', description: 'Editar contrato, inquilino o garante' },
      { key: 'delete', label: 'Eliminar', description: 'Eliminar contrato, inquilino o garante' },
    ],
  },
  obligations: {
    label: 'Cuenta Corriente',
    description: 'Obligaciones y Pagos',
    actions: [
      { key: 'view', label: 'Ver', description: 'Ver obligaciones y pagos' },
      { key: 'create', label: 'Crear', description: 'Crear obligación' },
      { key: 'edit', label: 'Editar', description: 'Editar obligación' },
      { key: 'delete', label: 'Eliminar', description: 'Eliminar obligación' },
      { key: 'register_payment', label: 'Registrar Pago', description: 'Registrar un pago contra una obligación' },
      { key: 'generate_recurring', label: 'Generar Recurrentes', description: 'Generar obligaciones recurrentes automáticamente' },
    ],
  },
  finances: {
    label: 'Finanzas',
    description: 'Flujo de Caja, Contabilidad, Liquidaciones y Comisiones',
    actions: [
      { key: 'view_cashflow', label: 'Ver Flujo de Caja', description: 'Ver movimientos de caja' },
      { key: 'create_movement', label: 'Registrar Movimiento', description: 'Registrar ingreso o egreso en flujo de caja' },
      { key: 'view_accounting', label: 'Ver Contabilidad', description: 'Ver asientos contables de la inmobiliaria' },
      { key: 'view_settlements', label: 'Ver Liquidaciones', description: 'Ver liquidaciones de propietarios' },
      { key: 'settle_owners', label: 'Liquidar Propietarios', description: 'Ejecutar liquidación y marcar como pagada' },
      { key: 'view_commissions', label: 'Ver Comisiones', description: 'Ver comisiones de vendedores' },
      { key: 'pay_commissions', label: 'Pagar Comisiones', description: 'Registrar pago de comisiones a vendedores' },
      { key: 'export', label: 'Exportar', description: 'Exportar datos financieros' },
    ],
  },
  tasks: {
    label: 'Tareas',
    actions: [
      { key: 'view', label: 'Ver', description: 'Ver mis tareas' },
      { key: 'create', label: 'Crear', description: 'Crear nueva tarea' },
      { key: 'edit', label: 'Editar', description: 'Editar mis tareas' },
      { key: 'delete', label: 'Eliminar', description: 'Eliminar mis tareas' },
      { key: 'view_all', label: 'Ver Todas', description: 'Ver tareas de todos los usuarios' },
      { key: 'manage_all', label: 'Gestionar Todas', description: 'Editar y eliminar tareas de cualquier usuario' },
    ],
  },
  documents: {
    label: 'Documentos',
    actions: [
      { key: 'view', label: 'Ver', description: 'Ver documentos' },
      { key: 'upload', label: 'Subir', description: 'Subir nuevos documentos' },
      { key: 'download', label: 'Descargar', description: 'Descargar documentos' },
      { key: 'delete', label: 'Eliminar', description: 'Eliminar documentos' },
    ],
  },
  reports: {
    label: 'Reportes',
    actions: [
      { key: 'view', label: 'Ver', description: 'Ver reportes' },
      { key: 'export', label: 'Exportar', description: 'Exportar y descargar reportes' },
    ],
  },
  settings: {
    label: 'Configuración',
    actions: [
      { key: 'view', label: 'Ver', description: 'Ver configuración del sistema' },
      { key: 'edit', label: 'Editar', description: 'Modificar configuración, comisiones, notificaciones' },
    ],
  },
  users: {
    label: 'Usuarios',
    actions: [
      { key: 'view', label: 'Ver', description: 'Ver lista de usuarios' },
      { key: 'create', label: 'Crear', description: 'Crear nuevo usuario staff' },
      { key: 'edit', label: 'Editar', description: 'Editar datos y rol de usuario' },
      { key: 'deactivate', label: 'Activar/Desactivar', description: 'Activar o desactivar acceso de un usuario' },
      { key: 'manage_permissions', label: 'Gestionar Permisos', description: 'Configurar permisos granulares de un usuario' },
    ],
  },
  integrations: {
    label: 'Integraciones',
    actions: [
      { key: 'view', label: 'Ver', description: 'Ver integraciones disponibles' },
      { key: 'configure', label: 'Configurar', description: 'Activar y configurar integraciones' },
    ],
  },
}

// Arrays derivados para compatibilidad
export const MODULES = Object.keys(MODULE_ACTIONS)

export function getModuleActions(module: string): string[] {
  return MODULE_ACTIONS[module]?.actions.map(a => a.key) || []
}

// ─── Helper para construir permisos de un rol ─────────────────────────────────

function buildPermissions(allowedMap: Record<string, string[]>): PermissionTemplate[] {
  const permissions: PermissionTemplate[] = []
  for (const [module, def] of Object.entries(MODULE_ACTIONS)) {
    const allowedActions = allowedMap[module] || []
    for (const action of def.actions) {
      permissions.push({
        module,
        action: action.key,
        allowed: allowedActions.includes(action.key),
      })
    }
  }
  return permissions
}

// Helper: todas las acciones de un módulo
function allActions(module: string): string[] {
  return MODULE_ACTIONS[module]?.actions.map(a => a.key) || []
}

// ─── Role Templates ───────────────────────────────────────────────────────────

export const ROLE_PERMISSION_TEMPLATES: Record<string, PermissionTemplate[]> = {
  // ADMIN: Acceso total a todo
  ADMIN: buildPermissions(
    Object.fromEntries(Object.keys(MODULE_ACTIONS).map(m => [m, allActions(m)]))
  ),

  // MANAGER: Gestión general excepto usuarios, settings e integraciones
  MANAGER: buildPermissions({
    dashboard: ['view'],
    prospects: allActions('prospects'),
    properties: allActions('properties'),
    contracts: allActions('contracts'),
    obligations: allActions('obligations'),
    finances: allActions('finances'),
    tasks: allActions('tasks'),
    documents: allActions('documents'),
    reports: allActions('reports'),
    // Sin acceso: settings, users, integrations
  }),

  // ACCOUNTING: Contabilidad, finanzas, cobranzas
  ACCOUNTING: buildPermissions({
    dashboard: ['view'],
    contracts: ['view'],
    obligations: ['view', 'create', 'edit', 'register_payment', 'generate_recurring'],
    finances: ['view_cashflow', 'create_movement', 'view_accounting', 'view_settlements', 'settle_owners', 'export'],
    reports: ['view', 'export'],
  }),

  // COLLECTIONS: Solo cobranzas — obligaciones, pagos, lectura de contratos
  COLLECTIONS: buildPermissions({
    dashboard: ['view'],
    contracts: ['view'],
    obligations: ['view', 'edit', 'register_payment'],
    finances: ['view_cashflow'],
    reports: ['view'],
  }),

  // LEASING: Alquileres — prospectos, propiedades, contratos, documentos
  LEASING: buildPermissions({
    dashboard: ['view'],
    prospects: allActions('prospects'),
    properties: ['view', 'create', 'edit'],
    contracts: ['view', 'create', 'edit'],
    obligations: ['view'],
    tasks: ['view', 'create', 'edit', 'delete'],
    documents: ['view', 'upload', 'download'],
    reports: ['view'],
  }),

  // MAINTENANCE: Mantenimiento — propiedades (lectura/edición) y tareas
  MAINTENANCE: buildPermissions({
    dashboard: ['view'],
    properties: ['view', 'edit'],
    tasks: ['view', 'create', 'edit'],
    documents: ['view', 'download'],
  }),

  // READ_ONLY: Solo lectura en módulos operativos
  READ_ONLY: buildPermissions({
    dashboard: ['view'],
    prospects: ['view'],
    properties: ['view'],
    contracts: ['view'],
    obligations: ['view'],
    finances: ['view_cashflow', 'view_accounting', 'view_settlements', 'view_commissions'],
    tasks: ['view'],
    documents: ['view', 'download'],
    reports: ['view', 'export'],
  }),
}

export function getPermissionsForRole(role: string): PermissionTemplate[] {
  return ROLE_PERMISSION_TEMPLATES[role] || []
}
