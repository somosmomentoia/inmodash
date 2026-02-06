# Funcionalidades Faltantes - inmodash-front-v2

## Análisis comparativo con inmodash-front

### 1. CLIENTES (Tenants)
- [x] Lista de clientes con búsqueda
- [x] Modal crear cliente
- [x] Modal editar cliente
- [x] Modal eliminar cliente
- [ ] **Vista detalle cliente** (`/clients/[id]`) - FALTA
  - Info del cliente
  - Info de contacto
  - Contratos activos
  - Historial de contratos
  - Garantes asociados
- [ ] **Página editar cliente** (`/clients/[id]/edit`) - FALTA

### 2. PROPIETARIOS (Owners)
- [ ] **Lista de propietarios** (`/owners`) - FALTA
- [ ] **Vista detalle propietario** (`/owners/[id]`) - FALTA
- [ ] **Crear propietario** (`/owners/new`) - FALTA
- [ ] **Editar propietario** - FALTA

### 3. GARANTES (Guarantors)
- [x] Lista de garantes
- [ ] **Vista detalle garante** (`/guarantors/[id]`) - FALTA
- [ ] **Editar garante** (`/guarantors/[id]/edit`) - FALTA

### 4. CONTRATOS (Contracts)
- [x] Lista de contratos
- [x] Wizard nuevo contrato (5 pasos)
- [x] Vista detalle contrato (`/contracts/[id]`)
- [ ] **Editar contrato** (`/contracts/[id]/edit`) - FALTA
- [ ] **Libro mayor/Ledger** (`/contracts/[id]/ledger`) - FALTA
- [ ] **Garantes de contrato** (`/contracts/guarantors`) - FALTA

### 5. EDIFICIOS (Buildings)
- [x] Lista de edificios
- [x] Crear edificio
- [x] Vista detalle edificio
- [ ] **Editar edificio** (`/buildings/[id]/edit`) - FALTA
- [ ] **Apartamentos del edificio** (`/buildings/[id]/apartments`) - FALTA
- [ ] **Nuevo apartamento en edificio** (`/buildings/[id]/apartments/new`) - FALTA

### 6. APARTAMENTOS (Apartments)
- [x] Lista de apartamentos
- [x] Crear apartamento
- [x] Vista detalle apartamento
- [ ] **Editar apartamento** (`/apartments/[id]/edit`) - FALTA
- [ ] **Inquilinos del apartamento** (`/apartments/[id]/tenants`) - FALTA
- [ ] **Nuevo inquilino en apartamento** (`/apartments/[id]/tenants/new`) - FALTA
- [ ] **Contrato de inquilino** (`/apartments/[id]/tenants/[tenantId]/contract`) - FALTA

### 7. PAGOS (Payments)
- [x] Pagos recibidos (`/payments-received`)
- [ ] **Lista de pagos pendientes** (`/payments`) - FALTA
- [ ] **Detalle de pago** (`/payments/[id]`) - FALTA
- [ ] **Nuevo pago** (`/payments/new`) - FALTA

### 8. OBLIGACIONES (Obligations)
- [x] Lista de obligaciones
- [x] Crear obligación
- [ ] **Detalle de obligación** (`/obligations/[id]`) - FALTA

### 9. DOCUMENTOS (Documents)
- [x] Lista de documentos
- [ ] **Nuevo documento** (`/documents/new`) - FALTA

### 10. OTROS
- [ ] **Suscripción** (`/subscription`) - FALTA
- [ ] **Clear auth** (`/clear-auth`) - FALTA

---

## Prioridad de implementación

### Alta prioridad (flujos principales)
1. Vista detalle cliente (`/clients/[id]`)
2. Lista de propietarios (`/owners`)
3. Vista detalle propietario (`/owners/[id]`)
4. Editar contrato (`/contracts/[id]/edit`)
5. Lista de pagos (`/payments`)
6. Nuevo pago (`/payments/new`)

### Media prioridad
7. Editar edificio
8. Editar apartamento
9. Vista detalle garante
10. Libro mayor de contrato

### Baja prioridad
11. Rutas anidadas de apartamentos
12. Suscripción
13. Clear auth
