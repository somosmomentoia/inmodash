import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import config from './config/env'
import { errorHandler } from './middleware/errorHandler'
import { securityHeaders, requestLogger, sanitizeInput } from './middleware/security'
import { logger } from './utils/logger'

const app = express()

// Security: Disable X-Powered-By header
app.disable('x-powered-by')

// Security headers
app.use(securityHeaders)

// Request logging
if (config.isDevelopment) {
  app.use(requestLogger)
}

// CORS configuration - Allow multiple domains
const envOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [];
const allowedOrigins = [
  'https://inmodash-front.vercel.app',
  'https://inmodash.com.ar',
  'https://www.inmodash.com.ar',
  'https://tenant.inmodash.com', // Tenant Portal
  'http://localhost:3000', // For local development
  'http://localhost:3975', // For local frontend development
  'http://localhost:3976', // For local frontend v2 development
  'http://localhost:3977',  // For tenant portal development
  ...envOrigins // Add origins from FRONTEND_URL env variable
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel preview deployments
    if (origin && (
      allowedOrigins.indexOf(origin) !== -1 || 
      origin.endsWith('.vercel.app')
    )) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Cookie parser
app.use(cookieParser())

// Body parser with size limits
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Input sanitization
app.use(sanitizeInput)

// Serve uploaded files statically (with permissive headers for iframe embedding)
app.use('/uploads', (req, res, next) => {
  // Remove X-Frame-Options to allow embedding in iframes
  res.removeHeader('X-Frame-Options')
  // Allow embedding from same origin
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:3975")
  next()
}, express.static(path.join(__dirname, '../uploads')))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: '1.1.0' // WhatsApp Bot Phase 1
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Sistema de Gestión Inmobiliaria - API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      buildings: '/api/buildings',
      apartments: '/api/apartments',
      tenants: '/api/tenants',
      guarantors: '/api/guarantors',
      contracts: '/api/contracts',
      dashboard: '/api/dashboard/stats',
      owners: '/api/owners',
      payments: '/api/payments',
      documents: '/api/documents'
    },
    documentation: 'Ver QUICK_START.md para más información'
  })
})

// Importar rutas
import authRoutes from './routes/auth.routes'
import buildingsRoutes from './routes/buildings.routes'
import apartmentsRoutes from './routes/apartments.routes'
import tenantsRoutes from './routes/tenants.routes'
import guarantorsRoutes from './routes/guarantors.routes'
import contractsRoutes from './routes/contracts.routes'
import dashboardRoutes from './routes/dashboard.routes'
import ownersRoutes from './routes/owners.routes'
import paymentsRoutes from './routes/payments.routes'
import documentsRoutes from './routes/documents.routes'
import migrationRoutes from './routes/migration.routes'
import whatsappRoutes from './whatsapp/routes/index'
import subscriptionRoutes from './routes/subscription.routes'
import obligationsRoutes from './routes/obligations.routes'
import recurringObligationsRoutes from './routes/recurring-obligations.routes'
import settlementsRoutes from './routes/settlements.routes'
import tasksRoutes from './routes/tasks.routes'
import contactsRoutes from './routes/contacts.routes'
import notificationsRoutes from './routes/notifications.routes'
import prospectsRoutes from './routes/prospects.routes'
import tenantAuthRoutes from './routes/tenant.auth.routes'
import tenantInviteRoutes from './routes/tenant.invite.routes'
import tenantPortalRoutes from './routes/tenant.portal.routes'
import tenantWebhookRoutes from './routes/tenant.webhook.routes'
import accountingRoutes from './routes/accounting.routes'
import indicesRoutes from './routes/indices.routes'
import { authenticate } from './middleware/auth'

// Usar rutas
app.use('/api/auth', authRoutes)
app.use('/api/buildings', buildingsRoutes)
app.use('/api/apartments', apartmentsRoutes)
app.use('/api/tenants', tenantsRoutes)
app.use('/api/guarantors', guarantorsRoutes)
app.use('/api/contracts', contractsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/owners', ownersRoutes)
app.use('/api/payments', paymentsRoutes) // LEGACY - mantener para compatibilidad
app.use('/api/recurring-obligations', recurringObligationsRoutes) // NEW - Recurrencias (ANTES de obligations)
app.use('/api/obligations', obligationsRoutes) // NEW - Sistema de obligaciones
app.use('/api/settlements', settlementsRoutes) // NEW - Liquidaciones a propietarios
app.use('/api/tasks', tasksRoutes) // NEW - Sistema de tareas
app.use('/api/contacts', contactsRoutes) // NEW - Sistema de contactos
app.use('/api/notifications', notificationsRoutes) // NEW - Sistema de notificaciones
app.use('/api/prospects', prospectsRoutes) // NEW - Sistema de prospectos (leasing)
app.use('/api/accounting', accountingRoutes) // NEW - Asientos contables (comisiones)
app.use('/api/indices', indicesRoutes) // NEW - Índices económicos (ICL/IPC via Argly)
app.use('/api/documents', documentsRoutes)
app.use('/api/migration', migrationRoutes)
// WhatsApp routes - webhook endpoints don't need auth, config endpoints do
app.use('/api/whatsapp', whatsappRoutes)
// Subscription routes - MercadoPago integration
app.use('/api/subscriptions', subscriptionRoutes)

// Tenant Portal routes
app.use('/api/tenant/auth', tenantAuthRoutes) // Auth para inquilinos
app.use('/api/tenant', tenantInviteRoutes) // Activación de cuenta tenant (público) - DEBE IR ANTES
app.use('/api/tenant', tenantPortalRoutes) // Portal tenant (contratos, obligaciones, pagos) - requiere auth
app.use('/api/webhooks', tenantWebhookRoutes) // Webhooks MercadoPago tenant

// Error handler (debe ser el último middleware)
app.use(errorHandler)

// Notification generator scheduler
import { notificationGeneratorService } from './services/notification-generator.service'

// Run notification generator every hour
const NOTIFICATION_INTERVAL = 60 * 60 * 1000 // 1 hour in ms

const runNotificationGenerator = async () => {
  try {
    const result = await notificationGeneratorService.generateAll()
    if (result.generated > 0) {
      console.log(`[Notifications] Generated ${result.generated} notifications`)
    }
    if (result.errors > 0) {
      console.warn(`[Notifications] ${result.errors} errors during generation`)
    }
  } catch (err) {
    console.error('[Notifications] Error running generator:', err)
  }
}

// Iniciar servidor
app.listen(config.port, () => {
  logger.serverStart(config.port, config.nodeEnv)
  
  // Run notification generator on startup (after 30 seconds) and then every hour
  setTimeout(() => {
    runNotificationGenerator()
    setInterval(runNotificationGenerator, NOTIFICATION_INTERVAL)
  }, 30000)
})

// Manejo de errores no capturados
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection', err)
  process.exit(1)
})

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception', err)
  process.exit(1)
})
