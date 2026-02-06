import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import argon2 from 'argon2'
import prisma from '../config/database'
import { createToken, createRefreshToken } from '../lib/auth/jwt'
import { logger } from '../utils/logger'

const INVITE_EXPIRY_DAYS = 7
const TENANT_PORTAL_URL = process.env.TENANT_PORTAL_URL || 'http://localhost:3976'

/**
 * POST /api/tenants/:tenantId/invite
 * Genera un link de invitación para un inquilino
 * Solo accesible por admin/staff (usa authenticate middleware)
 */
export const generateInviteLink = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      })
    }

    // Verificar que el tenant existe y pertenece al usuario
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: parseInt(tenantId),
        userId: userId
      },
      select: { id: true, nameOrBusiness: true }
    })

    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      })
    }

    // Verificar si ya existe un TenantUser activo para este tenant
    const existingTenantUser = await prisma.tenantUser.findFirst({
      where: { tenantId: parseInt(tenantId) },
      include: { user: { select: { email: true } } }
    })

    if (existingTenantUser) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Este inquilino ya tiene una cuenta activa (${existingTenantUser.user.email})`,
        existingEmail: existingTenantUser.user.email
      })
    }

    // Invalidar invitaciones previas activas para este tenant
    await prisma.tenantInvite.updateMany({
      where: {
        tenantId: parseInt(tenantId),
        usedAt: null
      },
      data: {
        usedAt: new Date() // Marcar como usada para invalidar
      }
    })

    // Crear nueva invitación (sin email - el inquilino elige al activar)
    const token = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS)

    const invite = await prisma.tenantInvite.create({
      data: {
        tenantId: parseInt(tenantId),
        token,
        expiresAt
      }
    })

    // Construir link de activación
    const activationLink = `${TENANT_PORTAL_URL}/tenant/activate?token=${token}`

    // Obtener nombre de la inmobiliaria para el mensaje de WhatsApp
    const agency = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyName: true, name: true }
    })

    const agencyName = agency?.companyName || agency?.name || 'la inmobiliaria'

    // Mensaje predefinido para WhatsApp
    const whatsappMessage = encodeURIComponent(
      `¡Hola! Te invitamos a acceder al Portal del Inquilino de ${agencyName}.\n\n` +
      `Desde ahí podrás ver tu estado de cuenta, obligaciones pendientes y realizar pagos online.\n\n` +
      `Accede aquí: ${activationLink}\n\n` +
      `Este link expira en ${INVITE_EXPIRY_DAYS} días.`
    )

    const whatsappLink = `https://wa.me/?text=${whatsappMessage}`

    logger.info(`[TENANT INVITE] Generated invite for tenant ${tenantId} (${tenant.nameOrBusiness})`)

    return res.json({
      success: true,
      invite: {
        id: invite.id,
        tenantName: tenant.nameOrBusiness,
        expiresAt: invite.expiresAt,
        activationLink,
        whatsappLink
      }
    })
  } catch (error) {
    logger.error('[TENANT INVITE] Error generating invite:', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while generating the invite'
    })
  }
}

/**
 * GET /api/tenants/:tenantId/invite/status
 * Obtiene el estado de invitación de un inquilino
 */
export const getInviteStatus = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      })
    }

    // Verificar que el tenant existe y pertenece al usuario
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: parseInt(tenantId),
        userId: userId
      },
      select: {
        id: true,
        nameOrBusiness: true,
        contactEmail: true
      }
    })

    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      })
    }

    // Verificar si ya tiene cuenta activa
    const existingTenantUser = await prisma.tenantUser.findFirst({
      where: { tenantId: parseInt(tenantId) },
      include: {
        user: {
          select: { email: true, name: true, lastLoginAt: true }
        }
      }
    })

    if (existingTenantUser) {
      return res.json({
        success: true,
        status: 'active',
        user: {
          email: existingTenantUser.user.email,
          name: existingTenantUser.user.name,
          lastLoginAt: existingTenantUser.user.lastLoginAt
        }
      })
    }

    // Buscar última invitación
    const lastInvite = await prisma.tenantInvite.findFirst({
      where: { tenantId: parseInt(tenantId) },
      orderBy: { createdAt: 'desc' }
    })

    if (!lastInvite) {
      return res.json({
        success: true,
        status: 'none'
      })
    }

    // Determinar estado de la invitación
    const now = new Date()
    let inviteStatus: 'pending' | 'expired' | 'used'

    if (lastInvite.usedAt) {
      inviteStatus = 'used'
    } else if (lastInvite.expiresAt < now) {
      inviteStatus = 'expired'
    } else {
      inviteStatus = 'pending'
    }

    return res.json({
      success: true,
      status: inviteStatus,
      invite: {
        expiresAt: lastInvite.expiresAt,
        createdAt: lastInvite.createdAt
      }
    })
  } catch (error) {
    logger.error('[TENANT INVITE] Error getting status:', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred'
    })
  }
}

/**
 * GET /api/tenant/activate/validate
 * Valida un token de invitación (público, sin auth)
 */
export const validateInviteToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Token is required'
      })
    }

    const invite = await prisma.tenantInvite.findUnique({
      where: { token },
      include: {
        tenant: {
          select: {
            id: true,
            nameOrBusiness: true,
            userId: true
          }
        }
      }
    })

    if (!invite) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invalid invitation link'
      })
    }

    // Verificar si ya fue usado
    if (invite.usedAt) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'This invitation has already been used'
      })
    }

    // Verificar si expiró
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'This invitation has expired'
      })
    }

    // Obtener nombre de la inmobiliaria
    const agency = await prisma.user.findUnique({
      where: { id: invite.tenant.userId },
      select: { companyName: true, name: true }
    })

    return res.json({
      success: true,
      valid: true,
      invite: {
        tenantName: invite.tenant.nameOrBusiness,
        agencyName: agency?.companyName || agency?.name || 'Inmobiliaria'
      }
    })
  } catch (error) {
    logger.error('[TENANT ACTIVATE] Error validating token:', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred'
    })
  }
}

/**
 * POST /api/tenant/activate
 * Activa una cuenta de tenant usando el token de invitación (público, sin auth)
 */
export const activateTenantAccount = async (req: Request, res: Response) => {
  try {
    const { token, email, name, password } = req.body

    if (!token || !email || !name || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Token, email, name and password are required'
      })
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid email format'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password must be at least 6 characters'
      })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Buscar invitación
    const invite = await prisma.tenantInvite.findUnique({
      where: { token },
      include: {
        tenant: {
          select: {
            id: true,
            nameOrBusiness: true,
            userId: true
          }
        }
      }
    })

    if (!invite) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invalid invitation link'
      })
    }

    if (invite.usedAt) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'This invitation has already been used'
      })
    }

    if (invite.expiresAt < new Date()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'This invitation has expired'
      })
    }

    // Verificar si el email ya existe como usuario
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (user) {
      // Usuario existe - verificar que sea tenant
      if (user.role !== 'tenant') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Este email ya está registrado como usuario administrativo'
        })
      }

      // Verificar que no esté ya vinculado a este tenant
      const existingLink = await prisma.tenantUser.findUnique({
        where: {
          userId_tenantId: {
            userId: user.id,
            tenantId: invite.tenant.id
          }
        }
      })

      if (existingLink) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'This account is already linked to this tenant'
        })
      }

      // Verificar que todos los tenants del usuario sean de la misma agencia
      const existingTenantUsers = await prisma.tenantUser.findMany({
        where: { userId: user.id },
        include: { tenant: { select: { userId: true } } }
      })

      const hasOtherAgency = existingTenantUsers.some(
        tu => tu.tenant.userId !== invite.tenant.userId
      )

      if (hasOtherAgency) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'This account is already linked to tenants from another agency'
        })
      }
    } else {
      // Crear nuevo usuario con el email que eligió el inquilino
      const passwordHash = await argon2.hash(password)

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name,
          role: 'tenant',
          isEmailVerified: true // Verificado por el token de invitación
        }
      })

      logger.info(`[TENANT ACTIVATE] Created new tenant user: ${normalizedEmail}`)
    }

    // Crear vinculación TenantUser
    await prisma.tenantUser.create({
      data: {
        userId: user.id,
        tenantId: invite.tenant.id
      }
    })

    // Marcar invitación como usada
    await prisma.tenantInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() }
    })

    // Crear tokens para login automático
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: 'tenant'
    }

    const accessToken = createToken(tokenPayload)
    const refreshToken = createRefreshToken(tokenPayload)

    // Guardar hash del refresh token
    const refreshTokenHash = await argon2.hash(refreshToken)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash,
        lastLoginAt: new Date()
      }
    })

    // Set cookies
    res.cookie('tenant-auth-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000
    })

    res.cookie('tenant-refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    // Obtener nombre de la inmobiliaria
    const agency = await prisma.user.findUnique({
      where: { id: invite.tenant.userId },
      select: { companyName: true, name: true }
    })

    logger.info(`[TENANT ACTIVATE] Account activated for tenant ${invite.tenant.id}: ${user.email}`)

    return res.json({
      success: true,
      message: 'Account activated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'tenant'
      },
      agency: {
        name: agency?.companyName || agency?.name || 'Inmobiliaria'
      },
      accessToken,
      refreshToken
    })
  } catch (error) {
    logger.error('[TENANT ACTIVATE] Error activating account:', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during activation'
    })
  }
}
