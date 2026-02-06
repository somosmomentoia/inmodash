import { Request, Response, NextFunction } from 'express'
import { verifyToken, shouldRenewToken, createToken } from '../lib/auth/jwt'
import { logger } from '../utils/logger'
import prisma from '../config/database'

// Extend Express Request to include tenantContext
declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext
    }
  }
}

// Tipos para el contexto del tenant
interface TenantUserInfo {
  tenantId: number
  tenant: {
    id: number
    nameOrBusiness: string
    contactEmail: string
    userId: number // agencyUserId
  }
  contracts: {
    id: number
    apartmentId: number
    startDate: Date
    endDate: Date
    apartment: {
      id: number
      nomenclature: string
      fullAddress: string | null
    }
  }[]
}

export interface TenantContext {
  userId: number           // User.id del tenant (cuenta de acceso)
  email: string
  tenantUsers: TenantUserInfo[]
  agencyUserId: number     // Desde Tenant.userId (inmobiliaria)
}

/**
 * Tenant Authentication middleware
 * Verifies JWT token for tenant users and builds tenant context
 * 
 * IMPORTANTE: Este middleware es SEPARADO del auth admin/staff
 * - Usa cookies diferentes (tenant-auth-token)
 * - Solo permite role='tenant'
 * - Construye contexto con todos los TenantUser vinculados
 */
export const tenantAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from tenant-specific cookie or Authorization header
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.['tenant-auth-token']

    if (!token) {
      logger.warn(`[TENANT AUTH] No token provided for ${req.method} ${req.path}`)
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided'
      })
    }

    // Verify token
    const payload = await verifyToken(token)

    if (!payload) {
      logger.warn(`[TENANT AUTH] Invalid token for ${req.method} ${req.path}`)
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      })
    }

    // Verificar que el usuario tiene role='tenant'
    if (payload.role !== 'tenant') {
      logger.warn(`[TENANT AUTH] Non-tenant role attempted access: ${payload.role}`)
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access restricted to tenant users'
      })
    }

    // Obtener todos los TenantUser vinculados a este User
    const tenantUsers = await prisma.tenantUser.findMany({
      where: { userId: payload.userId },
      include: {
        tenant: {
          select: {
            id: true,
            nameOrBusiness: true,
            contactEmail: true,
            userId: true, // agencyUserId
            contracts: {
              select: {
                id: true,
                apartmentId: true,
                startDate: true,
                endDate: true,
                apartment: {
                  select: {
                    id: true,
                    nomenclature: true,
                    fullAddress: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (tenantUsers.length === 0) {
      logger.warn(`[TENANT AUTH] User ${payload.userId} has no tenant associations`)
      return res.status(403).json({
        error: 'Forbidden',
        message: 'No tenant associations found for this user'
      })
    }

    // Verificar que todos los tenants pertenecen a la misma agencia
    const agencyUserIds = [...new Set(tenantUsers.map(tu => tu.tenant.userId))]
    if (agencyUserIds.length > 1) {
      logger.error(`[TENANT AUTH] User ${payload.userId} has tenants from multiple agencies: ${agencyUserIds.join(', ')}`)
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid tenant configuration'
      })
    }

    const agencyUserId = agencyUserIds[0]

    // Construir contexto del tenant
    const tenantContext: TenantContext = {
      userId: payload.userId,
      email: payload.email,
      agencyUserId,
      tenantUsers: tenantUsers.map(tu => ({
        tenantId: tu.tenantId,
        tenant: {
          id: tu.tenant.id,
          nameOrBusiness: tu.tenant.nameOrBusiness,
          contactEmail: tu.tenant.contactEmail,
          userId: tu.tenant.userId
        },
        contracts: tu.tenant.contracts.map(c => ({
          id: c.id,
          apartmentId: c.apartmentId,
          startDate: c.startDate,
          endDate: c.endDate,
          apartment: {
            id: c.apartment.id,
            nomenclature: c.apartment.nomenclature,
            fullAddress: c.apartment.fullAddress
          }
        }))
      }))
    }

    // Attach context to request
    req.tenantContext = tenantContext

    // Check if token needs renewal
    if (shouldRenewToken(token)) {
      try {
        const newToken = createToken({
          userId: payload.userId,
          email: payload.email,
          role: 'tenant'
        })
        
        // Set new token in tenant-specific cookie
        res.cookie('tenant-auth-token', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
          maxAge: 8 * 60 * 60 * 1000 // 8 hours
        })
        
        res.setHeader('X-New-Token', newToken)
        logger.info(`[TENANT AUTH] Token renewed for tenant user ${payload.email}`)
      } catch (renewError) {
        logger.error('[TENANT AUTH] Token renewal failed', renewError)
      }
    }

    next()
  } catch (error) {
    logger.error('[TENANT AUTH] Authentication error', error)
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed'
    })
  }
}

/**
 * Validates that a contract belongs to the authenticated tenant
 */
export const validateContractOwnership = async (
  contractId: number,
  tenantContext: TenantContext
): Promise<boolean> => {
  const allContractIds = tenantContext.tenantUsers.flatMap(
    tu => tu.contracts.map(c => c.id)
  )
  return allContractIds.includes(contractId)
}

/**
 * Gets all tenant IDs for the authenticated user
 */
export const getTenantIds = (tenantContext: TenantContext): number[] => {
  return tenantContext.tenantUsers.map(tu => tu.tenantId)
}

/**
 * Gets all contract IDs for the authenticated user
 */
export const getContractIds = (tenantContext: TenantContext): number[] => {
  return tenantContext.tenantUsers.flatMap(tu => tu.contracts.map(c => c.id))
}
