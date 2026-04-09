import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import config from './config/env'
import { errorHandler } from './middleware/errorHandler'
import { securityHeaders, requestLogger, sanitizeInput } from './middleware/security'
import { logger } from './utils/logger'
import { startAllCronJobs } from './utils/cron'

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
const allowedOrigins = [
  'https://inmodash-front.vercel.app',
  'https://inmodash.com.ar',
  'https://www.inmodash.com.ar',
  'https://tenant.inmodash.com', // Tenant Portal
  'http://localhost:3000', // For local development
  'http://localhost:3376', // For local frontend v2 development (actual port)
  'http://localhost:3975', // For local frontend development
  'http://localhost:3976', // For local frontend v2 development
  'http://localhost:3977'  // For tenant portal development
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

// Temporary diagnostic + sync endpoints
import prisma from './config/database'

app.get('/api/debug/db-check', async (req, res) => {
  try {
    const tables: any[] = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `
    const tableNames = tables.map((t: any) => t.table_name)
    
    // Get all columns per table
    const columns: any[] = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `
    
    const tableColumns: Record<string, string[]> = {}
    columns.forEach((c: any) => {
      if (!tableColumns[c.table_name]) tableColumns[c.table_name] = []
      tableColumns[c.table_name].push(c.column_name)
    })
    
    res.json({ totalTables: tableNames.length, tableColumns })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Full DB schema sync - adds ALL missing columns and tables
app.post('/api/debug/full-sync', async (req, res) => {
  const results: string[] = []
  const errors: string[] = []
  
  async function safeExec(sql: string, label: string) {
    try {
      await prisma.$executeRawUnsafe(sql)
      results.push(label)
    } catch (e: any) {
      if (e.message.includes('already exists') || e.message.includes('duplicate')) {
        results.push(label + ' (already exists)')
      } else {
        errors.push(label + ': ' + e.message)
      }
    }
  }
  
  async function addCol(table: string, col: string, type: string, def?: string) {
    const defaultClause = def ? ` DEFAULT ${def}` : ''
    await safeExec(`
      DO $$ BEGIN
        ALTER TABLE "${table}" ADD COLUMN "${col}" ${type}${defaultClause};
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `, `${table}.${col}`)
  }
  
  try {
    // === ENUMS ===
    await safeExec(`DO $$ BEGIN CREATE TYPE "StaffRole" AS ENUM ('ADMIN','MANAGER','ACCOUNTING','COLLECTIONS','LEASING','MAINTENANCE','READ_ONLY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`, 'enum StaffRole')
    
    // === MISSING TABLES ===
    await safeExec(`CREATE TABLE IF NOT EXISTS "vendors" ("id" SERIAL PRIMARY KEY, "userId" INTEGER NOT NULL, "name" VARCHAR(255) NOT NULL, "email" VARCHAR(255), "phone" VARCHAR(50), "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`, 'table vendors')
    await safeExec(`CREATE TABLE IF NOT EXISTS "vendor_commissions" ("id" SERIAL PRIMARY KEY, "userId" INTEGER NOT NULL, "vendorId" INTEGER NOT NULL, "contractId" INTEGER NOT NULL, "amount" DOUBLE PRECISION NOT NULL, "status" VARCHAR(20) NOT NULL DEFAULT 'pending', "paidAt" TIMESTAMP(3), "paymentMethod" VARCHAR(50), "reference" VARCHAR(255), "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`, 'table vendor_commissions')
    await safeExec(`CREATE TABLE IF NOT EXISTS "staff_users" ("id" SERIAL PRIMARY KEY, "agencyId" INTEGER NOT NULL, "email" VARCHAR(255) NOT NULL, "passwordHash" VARCHAR(255) NOT NULL, "name" VARCHAR(255) NOT NULL, "role" "StaffRole" NOT NULL DEFAULT 'READ_ONLY', "isActive" BOOLEAN NOT NULL DEFAULT true, "lastLoginAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`, 'table staff_users')
    await safeExec(`CREATE TABLE IF NOT EXISTS "user_permissions" ("id" SERIAL PRIMARY KEY, "staffUserId" INTEGER NOT NULL, "module" VARCHAR(50) NOT NULL, "action" VARCHAR(50) NOT NULL, "allowed" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`, 'table user_permissions')
    await safeExec(`CREATE TABLE IF NOT EXISTS "rent_adjustments" ("id" SERIAL PRIMARY KEY, "userId" INTEGER NOT NULL, "contractId" INTEGER NOT NULL, "recurringObligationId" INTEGER NOT NULL, "period" TIMESTAMP(3) NOT NULL, "indexType" VARCHAR(20) NOT NULL, "originalIndexValue" DOUBLE PRECISION NOT NULL, "appliedIndexValue" DOUBLE PRECISION NOT NULL, "baseIndexValue" DOUBLE PRECISION NOT NULL, "isManuallyModified" BOOLEAN NOT NULL DEFAULT false, "baseAmount" DOUBLE PRECISION NOT NULL, "previousAmount" DOUBLE PRECISION NOT NULL, "newAmount" DOUBLE PRECISION NOT NULL, "coefficient" DOUBLE PRECISION NOT NULL, "percentageIncrease" DOUBLE PRECISION NOT NULL, "modifiedByUserId" INTEGER, "modifiedAt" TIMESTAMP(3), "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`, 'table rent_adjustments')
    
    // === MISSING COLUMNS ON EXISTING TABLES ===
    
    // obligations - chargeTo, origin columns
    await addCol('obligations', 'chargeTo', 'VARCHAR(20)', "'tenant'")
    await addCol('obligations', 'origin', 'VARCHAR(30)')
    await addCol('obligations', 'ownerImpact', 'DOUBLE PRECISION', '0')
    await addCol('obligations', 'agencyImpact', 'DOUBLE PRECISION', '0')
    
    // contracts - vendor and fee columns
    await addCol('contracts', 'vendorId', 'INTEGER')
    await addCol('contracts', 'vendorCommissionPct', 'DOUBLE PRECISION')
    await addCol('contracts', 'signupFeeAmount', 'DOUBLE PRECISION')
    await addCol('contracts', 'contractExpenses', 'DOUBLE PRECISION')
    await addCol('contracts', 'commissionType', 'VARCHAR(20)')
    await addCol('contracts', 'commissionValue', 'DOUBLE PRECISION')
    
    // documents - storageKey
    await addCol('documents', 'storageKey', 'VARCHAR(500)')
    
    // settlements - state, deductions
    await addCol('settlements', 'state', 'VARCHAR(20)', "'draft'")
    await addCol('settlements', 'deductions', 'DOUBLE PRECISION', '0')
    
    // obligation_payments - source, paymentGroupId  
    await addCol('obligation_payments', 'source', 'VARCHAR(50)')
    await addCol('obligation_payments', 'paymentGroupId', 'VARCHAR(100)')
    
    // recurring_obligations - update fields
    await addCol('recurring_obligations', 'updateIndexType', 'VARCHAR(20)')
    await addCol('recurring_obligations', 'updateFrequencyMonths', 'INTEGER')
    await addCol('recurring_obligations', 'initialIndexValue', 'DOUBLE PRECISION')
    await addCol('recurring_obligations', 'initialIndexDate', 'TIMESTAMP(3)')
    await addCol('recurring_obligations', 'fixedUpdateCoefficient', 'DOUBLE PRECISION')
    await addCol('recurring_obligations', 'currentAmount', 'DOUBLE PRECISION')
    await addCol('recurring_obligations', 'lastUpdateApplied', 'TIMESTAMP(3)')
    await addCol('recurring_obligations', 'periodsSinceUpdate', 'INTEGER', '0')
    
    // tasks - staff user fields
    await addCol('tasks', 'createdByStaffId', 'INTEGER')
    await addCol('tasks', 'assignedToStaffId', 'INTEGER')
    
    // === INDEXES ===
    const indexes = [
      `CREATE INDEX IF NOT EXISTS "vendors_userId_idx" ON "vendors"("userId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "staff_users_email_key" ON "staff_users"("email")`,
      `CREATE INDEX IF NOT EXISTS "staff_users_agencyId_idx" ON "staff_users"("agencyId")`,
      `CREATE INDEX IF NOT EXISTS "staff_users_isActive_idx" ON "staff_users"("isActive")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "user_permissions_staffUserId_module_action_key" ON "user_permissions"("staffUserId","module","action")`,
      `CREATE INDEX IF NOT EXISTS "user_permissions_staffUserId_module_idx" ON "user_permissions"("staffUserId","module")`,
      `CREATE INDEX IF NOT EXISTS "vendor_commissions_userId_idx" ON "vendor_commissions"("userId")`,
      `CREATE INDEX IF NOT EXISTS "vendor_commissions_vendorId_idx" ON "vendor_commissions"("vendorId")`,
      `CREATE INDEX IF NOT EXISTS "vendor_commissions_contractId_idx" ON "vendor_commissions"("contractId")`,
      `CREATE INDEX IF NOT EXISTS "vendor_commissions_status_idx" ON "vendor_commissions"("status")`,
      `CREATE INDEX IF NOT EXISTS "rent_adjustments_userId_idx" ON "rent_adjustments"("userId")`,
      `CREATE INDEX IF NOT EXISTS "rent_adjustments_contractId_idx" ON "rent_adjustments"("contractId")`,
      `CREATE INDEX IF NOT EXISTS "rent_adjustments_recurringObligationId_idx" ON "rent_adjustments"("recurringObligationId")`,
      `CREATE INDEX IF NOT EXISTS "rent_adjustments_period_idx" ON "rent_adjustments"("period")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "rent_adjustments_recurringObligationId_period_key" ON "rent_adjustments"("recurringObligationId","period")`,
    ]
    for (const idx of indexes) { await safeExec(idx, 'index') }
    
    // === FOREIGN KEYS ===
    const fks = [
      `ALTER TABLE "vendors" ADD CONSTRAINT "vendors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`,
      `ALTER TABLE "vendor_commissions" ADD CONSTRAINT "vendor_commissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`,
      `ALTER TABLE "vendor_commissions" ADD CONSTRAINT "vendor_commissions_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE`,
      `ALTER TABLE "vendor_commissions" ADD CONSTRAINT "vendor_commissions_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE`,
      `ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "users"("id") ON DELETE CASCADE`,
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "staff_users"("id") ON DELETE CASCADE`,
      `ALTER TABLE "rent_adjustments" ADD CONSTRAINT "rent_adjustments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`,
      `ALTER TABLE "rent_adjustments" ADD CONSTRAINT "rent_adjustments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE`,
      `ALTER TABLE "rent_adjustments" ADD CONSTRAINT "rent_adjustments_recurringObligationId_fkey" FOREIGN KEY ("recurringObligationId") REFERENCES "recurring_obligations"("id") ON DELETE CASCADE`,
      `ALTER TABLE "contracts" ADD CONSTRAINT "contracts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL`,
    ]
    for (const fk of fks) { await safeExec(fk, 'fk') }
    
    res.json({ success: true, results, errors })
  } catch (error: any) {
    res.status(500).json({ error: error.message, results, errors })
  }
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
import cashflowRoutes from './routes/cashflow.routes'
import indicesRoutes from './routes/indices.routes'
import vendorsRoutes from './routes/vendors.routes'
import vendorCommissionsRoutes from './routes/vendor-commissions.routes'
import staffRoutes from './routes/staff.routes'
import permissionsRoutes from './routes/permissions.routes'
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
app.use('/api/cash-flow', cashflowRoutes) // NEW - Flujo de Caja (Fase 2)
app.use('/api/indices', indicesRoutes) // NEW - Índices económicos (ICL/IPC via Argly)
app.use('/api/vendors', vendorsRoutes) // NEW - Vendedores
app.use('/api/vendor-commissions', vendorCommissionsRoutes) // NEW - Comisiones de vendedores
app.use('/api/staff', staffRoutes) // NEW - Staff users (usuarios internos)
app.use('/api/permissions', permissionsRoutes) // NEW - Permisos de staff users
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
  
  // Start cron jobs (recurring obligations + rent generation on 1st of each month)
  startAllCronJobs()

  // Run notification generator on startup (after 30 seconds) and then every hour
  setTimeout(() => {
    runNotificationGenerator()
    setInterval(runNotificationGenerator, NOTIFICATION_INTERVAL)
  }, 30000)
})

// Manejo de errores no capturados
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection', err)
  // No hacer process.exit(1) para que el server siga corriendo
})

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception', err)
  process.exit(1)
})
