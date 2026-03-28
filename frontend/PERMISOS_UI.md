# Guía de Implementación de Permisos en UI

## Módulos que requieren control de permisos en botones/acciones

### 1. Contratos (`/contracts`)
**Archivo**: `src/app/(dashboard)/contracts/contracts-content.tsx`
- ✅ Botón "Nuevo Contrato" → `contracts.create`
- ✅ Botón "Editar Contrato" → `contracts.edit`
- ✅ Botón "Eliminar Contrato" → `contracts.delete`
- ✅ Acceso a configuración → `settings.view`

### 2. Obligaciones (`/obligations`)
**Archivo**: `src/app/(dashboard)/obligations/obligations-content.tsx`
- ⚠️ Botón "Nueva Obligación" → `obligations.create`
- ⚠️ Botón "Registrar Pago" → `obligations.register_payment`
- ⚠️ Botón "Editar" → `obligations.edit`
- ⚠️ Botón "Eliminar" → `obligations.delete`

### 3. Propiedades (`/properties`)
**Archivo**: `src/app/(dashboard)/properties/rentals-content.tsx`
- ⚠️ Botón "Nueva Propiedad" → `properties.create`
- ⚠️ Botón "Editar" → `properties.edit`
- ⚠️ Botón "Eliminar" → `properties.delete`

### 4. Finanzas (`/finances`)
**Archivos**: 
- `src/app/(dashboard)/finances/settlements-content.tsx`
- `src/app/(dashboard)/finances/cashflow-content.tsx`
- ⚠️ Botón "Liquidar" → `finances.settle`
- ⚠️ Botón "Nuevo Movimiento" → `finances.create`
- ⚠️ Exportar → `finances.export`

### 5. Prospectos (`/prospects`)
**Archivo**: `src/app/(dashboard)/prospects/page.tsx`
- ⚠️ Botón "Nuevo Prospecto" → `prospects.create`
- ⚠️ Botón "Editar" → `prospects.edit`
- ⚠️ Botón "Eliminar" → `prospects.delete`

### 6. Tareas (`/tasks`)
**Archivo**: `src/app/(dashboard)/tasks/tasks-content.tsx`
- ⚠️ Botón "Nueva Tarea" → `tasks.create`
- ⚠️ Botón "Asignar" → `tasks.assign_tasks`
- ⚠️ Editar tarea de otro → `tasks.edit_any_task`

### 7. Documentos (`/documents`)
**Archivo**: `src/app/(dashboard)/documents/page.tsx`
- ⚠️ Botón "Subir Documento" → `documents.create`
- ⚠️ Botón "Eliminar" → `documents.delete`

### 8. Configuración (`/settings`)
**Archivo**: `src/app/(dashboard)/settings/page.tsx`
- ⚠️ Todo el módulo → `settings.view`
- ⚠️ Editar configuración → `settings.edit`

### 9. Usuarios/Staff (`/settings/users`)
**Archivo**: `src/app/(dashboard)/settings/users/page.tsx`
- ⚠️ Botón "Nuevo Usuario" → `users.create`
- ⚠️ Botón "Editar" → `users.edit`
- ⚠️ Botón "Eliminar" → `users.delete`

## Patrón de Implementación

### Opción 1: Componente PermissionGuard (Recomendado)
```tsx
import { PermissionGuard } from '@/components/permissions/PermissionGuard'

<PermissionGuard module="contracts" action="create">
  <Button onClick={() => router.push('/contracts/new')}>
    Nuevo Contrato
  </Button>
</PermissionGuard>
```

### Opción 2: Hook usePermissions
```tsx
import { usePermissions } from '@/hooks/usePermissions'

const { hasPermission } = usePermissions()

{hasPermission('contracts', 'create') && (
  <Button onClick={() => router.push('/contracts/new')}>
    Nuevo Contrato
  </Button>
)}
```

### Opción 3: Filtrar arrays de acciones
```tsx
const quickActions = [
  hasPermission('contracts', 'create') && {
    id: 'new',
    label: 'Nuevo',
    onClick: () => router.push('/contracts/new')
  },
  // ... más acciones
].filter(Boolean)
```

## Componentes Creados

1. **PermissionGuard** (`src/components/permissions/PermissionGuard.tsx`)
   - Wrapper para ocultar elementos según permisos
   - Soporta `module` y `action`

2. **PermissionButton** (`src/components/permissions/PermissionButton.tsx`)
   - Botón que se oculta automáticamente si no hay permiso

3. **usePermissionFilter** (`src/hooks/usePermissionFilter.ts`)
   - Hook helper para filtrar arrays según permisos

## Prioridad de Implementación

1. **ALTA**: Contratos, Obligaciones, Finanzas (botones de crear/editar/eliminar)
2. **MEDIA**: Propiedades, Prospectos, Tareas
3. **BAJA**: Documentos, Reportes

## Notas Importantes

- Los **Owners** siempre tienen acceso total (no se les oculta nada)
- Los **Staff** solo ven lo que sus permisos permiten
- Si un botón está oculto, el endpoint backend igual valida permisos (403 si intenta acceder)
- Los errores 403 se manejan silenciosamente en los hooks (no spam en consola)
