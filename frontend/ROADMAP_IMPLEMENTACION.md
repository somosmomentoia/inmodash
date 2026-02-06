# ROADMAP DE IMPLEMENTACIÓN - InmoDash V2

## Resumen del UI Kit

### Componentes Disponibles

| Categoría | Componente | Estado | Uso Principal |
|-----------|------------|--------|---------------|
| **Buttons** | Button | ✅ Listo | Acciones primarias/secundarias |
| **Layout** | Card, CardHeader, CardContent, CardFooter | ✅ Listo | Contenedores de contenido |
| **Layout** | DashboardLayout, Sidebar, Header | ✅ Listo | Estructura de páginas |
| **Forms** | Input | ✅ Listo | Campos de texto |
| **Forms** | Select | ✅ Listo | Dropdowns |
| **Forms** | Textarea | ✅ Listo | Texto multilínea |
| **Forms** | Checkbox | ✅ Listo | Opciones booleanas |
| **Data** | Badge | ✅ Listo | Estados, etiquetas |
| **Data** | StatsCard | ✅ Listo | Métricas destacadas |
| **Data** | Table | ✅ Listo | Listados de datos |
| **Data** | Avatar, AvatarGroup | ✅ Listo | Usuarios, propietarios |
| **Data** | TaskItem | ✅ Listo | Tareas, pendientes |
| **Data** | EmptyState | ✅ Listo | Estados vacíos |
| **Charts** | ProgressRing | ✅ Listo | Porcentajes circulares |
| **Charts** | BarChart | ✅ Listo | Gráficos de barras |
| **Charts** | MiniChart | ✅ Listo | Tendencias inline |
| **Navigation** | Tabs | ✅ Listo | Navegación por secciones |
| **Feedback** | Modal, ModalFooter | ✅ Listo | Diálogos, formularios |
| **Feedback** | Toast | ✅ Listo | Notificaciones |

---

## Páginas a Implementar

Basado en la documentación del sistema actual (`DOCUMENTACION_TECNICA_COMPLETA.md`):

### Fase 1: Core (Semana 1-2)

#### 1.1 Dashboard (`/dashboard`) ✅ COMPLETADO
- [x] Stats cards (edificios, propiedades, clientes, contratos)
- [x] Resumen financiero (cobrado, pendiente, vencido)
- [x] Gráfico de recaudación mensual
- [x] Tareas pendientes
- [x] Propietarios destacados
- [x] Acciones rápidas

#### 1.2 Propiedades (`/properties`)
**Componentes necesarios:**
- `Table` - Listado de propiedades
- `StatsCard` - Totales por estado
- `Tabs` - Filtros (Todas, Alquiladas, Disponibles, Mantenimiento)
- `Badge` - Estados de propiedad
- `Modal` - Crear/Editar propiedad
- `EmptyState` - Sin propiedades

**Datos a mostrar:**
- Dirección completa
- Tipo (departamento, casa, PH, local)
- Estado (disponible, ocupado, mantenimiento)
- Propietario
- Inquilino actual (si aplica)
- Monto de alquiler

#### 1.3 Edificios (`/buildings`)
**Componentes necesarios:**
- `Table` - Listado de edificios
- `StatsCard` - Total edificios, departamentos
- `Modal` - Crear/Editar edificio
- `Card` - Vista de edificio con pisos

**Datos a mostrar:**
- Nombre/Dirección
- Cantidad de pisos
- Cantidad de departamentos
- Propietario
- Estado general

### Fase 2: Personas (Semana 2-3)

#### 2.1 Propietarios (`/owners`)
**Componentes necesarios:**
- `Table` - Listado de propietarios
- `Avatar` - Foto/iniciales
- `Badge` - Estado (activo/inactivo)
- `Modal` - Crear/Editar propietario
- `StatsCard` - Total propietarios, balance total

**Datos a mostrar:**
- Nombre completo
- DNI/CUIT
- Teléfono, Email
- Cantidad de propiedades
- Balance actual
- Comisión configurada

#### 2.2 Inquilinos (`/clients`)
**Componentes necesarios:**
- `Table` - Listado de inquilinos
- `Avatar` - Foto/iniciales
- `Badge` - Estado del contrato
- `Modal` - Crear/Editar inquilino
- `TaskItem` - Pagos pendientes

**Datos a mostrar:**
- Nombre completo
- DNI/CUIT
- Teléfono, Email
- Propiedad actual
- Estado de pagos

#### 2.3 Garantes (`/guarantors`)
**Componentes necesarios:**
- `Table` - Listado de garantes
- `Modal` - Crear/Editar garante
- `Badge` - Tipo de garantía

**Datos a mostrar:**
- Nombre completo
- DNI/CUIT
- Teléfono, Email
- Inquilino asociado
- Tipo de garantía

### Fase 3: Contratos (Semana 3-4)

#### 3.1 Contratos (`/contracts`)
**Componentes necesarios:**
- `Table` - Listado de contratos
- `Tabs` - Filtros (Vigentes, Por vencer, Vencidos)
- `Badge` - Estado del contrato
- `Modal` - Crear/Editar contrato
- `ProgressRing` - Tiempo transcurrido
- `StatsCard` - Totales por estado

**Datos a mostrar:**
- Propiedad
- Inquilino
- Fecha inicio/fin
- Monto actual
- Estado
- Próxima actualización

#### 3.2 Detalle de Contrato (`/contracts/[id]`)
**Componentes necesarios:**
- `Card` - Información general
- `Tabs` - Secciones (General, Pagos, Documentos, Garantes)
- `Table` - Historial de pagos
- `BarChart` - Pagos por mes
- `TaskItem` - Obligaciones pendientes

### Fase 4: Finanzas (Semana 4-5)

#### 4.1 Cuenta Corriente / Obligaciones (`/obligations`)
**Componentes necesarios:**
- `Table` - Listado de obligaciones
- `Tabs` - Filtros por tipo (Alquiler, Expensas, Servicios, etc.)
- `Badge` - Estado (pendiente, pagado, vencido)
- `Modal` - Crear obligación
- `Modal` - Registrar pago
- `StatsCard` - Totales por estado

**Datos a mostrar:**
- Tipo de obligación
- Descripción
- Período
- Monto
- Monto pagado
- Estado
- Contrato/Propiedad asociada

#### 4.2 Pagos Registrados (`/payments-received`)
**Componentes necesarios:**
- `Table` - Listado de pagos
- `Badge` - Método de pago
- `Select` - Filtros por período/método
- `StatsCard` - Total cobrado

**Datos a mostrar:**
- Fecha de pago
- Obligación asociada
- Monto
- Método de pago
- Referencia

#### 4.3 Liquidaciones (`/finances/settlements`)
**Componentes necesarios:**
- `Table` - Liquidaciones por propietario
- `Tabs` - Por período
- `ProgressRing` - Porcentaje liquidado
- `Modal` - Marcar como liquidado
- `BarChart` - Resumen por propietario

**Datos a mostrar:**
- Propietario
- Período
- Total cobrado
- Comisión
- Monto a liquidar
- Estado

#### 4.4 Contabilidad (`/finances/accounting`)
**Componentes necesarios:**
- `StatsCard` - Ingresos, Egresos, Balance
- `BarChart` - Flujo mensual
- `Table` - Movimientos
- `MiniChart` - Tendencias

### Fase 5: Documentos y Configuración (Semana 5-6)

#### 5.1 Documentos (`/documents`)
**Componentes necesarios:**
- `Table` - Listado de documentos
- `Badge` - Tipo de documento
- `Modal` - Subir documento
- `EmptyState` - Sin documentos

#### 5.2 Configuración (`/settings`)
**Componentes necesarios:**
- `Tabs` - Secciones (Perfil, WhatsApp, Notificaciones)
- `Input`, `Select`, `Checkbox` - Formularios
- `Card` - Secciones de configuración

#### 5.3 Perfil (`/profile`)
**Componentes necesarios:**
- `Avatar` - Foto de perfil
- `Input` - Datos personales
- `Card` - Secciones

---

## Componentes Adicionales a Crear

### Prioridad Alta
1. **DatePicker** - Selección de fechas
2. **SearchInput** - Búsqueda con autocompletado
3. **Pagination** - Paginación de tablas
4. **Dropdown** - Menús desplegables
5. **FileUpload** - Subida de archivos

### Prioridad Media
6. **Calendar** - Vista de calendario
7. **Timeline** - Historial de eventos
8. **Skeleton** - Estados de carga
9. **Tooltip** - Información adicional
10. **Popover** - Contenido flotante

### Prioridad Baja
11. **Breadcrumb** - Navegación jerárquica
12. **Stepper** - Procesos multi-paso
13. **Accordion** - Contenido colapsable

---

## Flujos Críticos a Replicar

### 1. Registro de Pago (CRÍTICO)
```
RegisterPaymentModal.tsx → obligationsService.createPayment()
```
**Lógica a mantener:**
- `isOwnerObligation` - Determina si se puede usar saldo del propietario
- Obtención del `owner` desde la obligación
- Validación de `hasSufficientBalance`
- Método de pago `owner_balance`

### 2. Cálculo de Liquidaciones (CRÍTICO)
```
settlements-content.tsx → calculateDistribution()
```
**Lógica a mantener:**
- `impactsFromCreation` - Tipos que impactan desde creación
- `effectiveOwnerImpact` - Cálculo de impacto real
- Pagos con `owner_balance` vs pagos independientes

### 3. Generación de Obligaciones
```
obligationsService.generate() → Backend genera obligaciones del mes
```

### 4. Recálculo de Saldos
```
obligationsService.recalculateAllOwnerBalances()
```

---

## Orden de Implementación Recomendado

```
Semana 1:
├── Dashboard (✅ completado)
├── UI Kit / Playground (✅ completado)
└── Propiedades (listado + CRUD)

Semana 2:
├── Edificios (listado + CRUD)
├── Propietarios (listado + CRUD)
└── Inquilinos (listado + CRUD)

Semana 3:
├── Garantes (listado + CRUD)
├── Contratos (listado)
└── Detalle de Contrato

Semana 4:
├── Obligaciones / Cuenta Corriente
├── Registro de Pago (modal crítico)
└── Pagos Registrados

Semana 5:
├── Liquidaciones
├── Contabilidad
└── Recálculo de saldos

Semana 6:
├── Documentos
├── Configuración
├── Perfil
└── Testing y ajustes
```

---

## Archivos de Referencia del Sistema Actual

| Funcionalidad | Archivo Frontend V1 | Archivo Backend |
|---------------|---------------------|-----------------|
| Obligaciones | `/app/(dashboard)/obligations/page.tsx` | `/services/obligations.service.ts` |
| Pagos | `/components/obligations/RegisterPaymentModal.tsx` | `/controllers/obligations.controller.ts` |
| Liquidaciones | `/app/(dashboard)/finances/settlements-content.tsx` | `/services/settlements.service.ts` |
| Contratos | `/app/(dashboard)/contracts/page.tsx` | `/services/contracts.service.ts` |
| Propiedades | `/app/(dashboard)/properties/page.tsx` | `/services/apartments.service.ts` |

---

## Notas Importantes

1. **Servicios ya copiados** - Los archivos en `/services/`, `/hooks/`, `/types/` ya están en V2
2. **Backend sin cambios** - El backend permanece igual, solo cambia el frontend
3. **Puerto V2: 3976** - Diferente al V1 (3975) para desarrollo paralelo
4. **CSS Modules** - Sin Tailwind, usar variables CSS definidas en `/styles/variables.css`

---

*Documento generado el 23 de Diciembre de 2024*
