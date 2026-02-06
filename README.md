# Inmodash - Sistema de Gestión Inmobiliaria

Sistema completo para la gestión de inmobiliarias, incluyendo propiedades, contratos, inquilinos, pagos y más.

## Estructura del Proyecto

```
inmodash/
├── backend/          # API REST con Express + Prisma + PostgreSQL
├── frontend/         # Aplicación Next.js 15 + React 19
└── README.md
```

## Tecnologías

### Backend
- **Framework**: Express.js 5 + TypeScript
- **ORM**: Prisma 6 con PostgreSQL
- **Autenticación**: JWT + Argon2
- **Integraciones**: MercadoPago, OpenAI (WhatsApp Bot)

### Frontend
- **Framework**: Next.js 15 (App Router) + React 19
- **Estilos**: CSS Modules
- **Formularios**: React Hook Form + Zod
- **Iconos**: Lucide React

## Deploy

### Railway (Backend)
1. Crear nuevo proyecto en Railway
2. Conectar con este repositorio (carpeta `/backend`)
3. Agregar PostgreSQL como servicio
4. Configurar variables de entorno (ver `backend/.env.example`)
5. Railway detectará el Dockerfile automáticamente

### Vercel (Frontend)
1. Importar proyecto en Vercel
2. Configurar Root Directory: `frontend`
3. Configurar variables de entorno (ver `frontend/.env.example`)
4. Deploy automático

## Variables de Entorno

Ver archivos `.env.example` en cada carpeta:
- `backend/.env.example`
- `frontend/.env.example`

## Desarrollo Local

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Licencia

Privado - Todos los derechos reservados.
