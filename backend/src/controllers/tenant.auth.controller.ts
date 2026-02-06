import { Request, Response } from 'express'
import argon2 from 'argon2'
import prisma from '../config/database'
import { createToken, createRefreshToken, verifyToken } from '../lib/auth/jwt'
import { logger } from '../utils/logger'

/**
 * POST /api/tenant/auth/login
 * Login para usuarios tenant
 */
export const tenantLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required'
      })
    }

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      logger.warn(`[TENANT LOGIN] User not found: ${email}`)
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      })
    }

    // Verificar que sea un usuario tenant
    if (user.role !== 'tenant') {
      logger.warn(`[TENANT LOGIN] Non-tenant user attempted login: ${email} (role: ${user.role})`)
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      })
    }

    // Verificar contraseña
    const isValidPassword = await argon2.verify(user.passwordHash, password)
    if (!isValidPassword) {
      logger.warn(`[TENANT LOGIN] Invalid password for: ${email}`)
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      })
    }

    // Verificar que tenga al menos un TenantUser asociado
    const tenantUsers = await prisma.tenantUser.findMany({
      where: { userId: user.id },
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

    if (tenantUsers.length === 0) {
      logger.warn(`[TENANT LOGIN] User has no tenant associations: ${email}`)
      return res.status(403).json({
        error: 'Forbidden',
        message: 'No tenant associations found. Please contact your property manager.'
      })
    }

    // Obtener nombre de la inmobiliaria
    const agencyUserId = tenantUsers[0].tenant.userId
    const agency = await prisma.user.findUnique({
      where: { id: agencyUserId },
      select: { companyName: true, name: true }
    })

    // Crear tokens
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
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    })

    res.cookie('tenant-refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    logger.info(`[TENANT LOGIN] Successful login: ${email}`)

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'tenant'
      },
      agency: {
        name: agency?.companyName || agency?.name || 'Inmobiliaria'
      },
      tenants: tenantUsers.map(tu => ({
        id: tu.tenant.id,
        name: tu.tenant.nameOrBusiness
      })),
      accessToken,
      refreshToken
    })
  } catch (error) {
    logger.error('[TENANT LOGIN] Error:', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during login'
    })
  }
}

/**
 * POST /api/tenant/auth/logout
 * Logout para usuarios tenant
 */
export const tenantLogout = async (req: Request, res: Response) => {
  try {
    // Clear cookies
    res.clearCookie('tenant-auth-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    })

    res.clearCookie('tenant-refresh-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    })

    logger.info('[TENANT LOGOUT] User logged out')

    return res.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    logger.error('[TENANT LOGOUT] Error:', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during logout'
    })
  }
}

/**
 * GET /api/tenant/auth/me
 * Obtener información del usuario tenant autenticado
 */
export const tenantMe = async (req: Request, res: Response) => {
  try {
    const tenantContext = req.tenantContext

    if (!tenantContext) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated'
      })
    }

    // Obtener información de la agencia
    const agency = await prisma.user.findUnique({
      where: { id: tenantContext.agencyUserId },
      select: { companyName: true, name: true }
    })

    // Obtener información del usuario
    const user = await prisma.user.findUnique({
      where: { id: tenantContext.userId },
      select: { id: true, email: true, name: true }
    })

    return res.json({
      success: true,
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        role: 'tenant'
      },
      agency: {
        name: agency?.companyName || agency?.name || 'Inmobiliaria'
      },
      tenants: tenantContext.tenantUsers.map(tu => ({
        id: tu.tenant.id,
        name: tu.tenant.nameOrBusiness,
        contracts: tu.contracts.map(c => ({
          id: c.id,
          apartmentId: c.apartmentId,
          address: c.apartment.fullAddress || c.apartment.nomenclature,
          startDate: c.startDate,
          endDate: c.endDate
        }))
      }))
    })
  } catch (error) {
    logger.error('[TENANT ME] Error:', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred'
    })
  }
}

/**
 * POST /api/tenant/auth/refresh
 * Renovar token de acceso usando refresh token
 */
export const tenantRefresh = async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.['tenant-refresh-token'] || req.body.refreshToken

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No refresh token provided'
      })
    }

    // Verify refresh token
    const payload = await verifyToken(refreshToken)

    if (!payload) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token'
      })
    }

    // Verify user exists and is tenant
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!user || user.role !== 'tenant') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid user'
      })
    }

    // Verify refresh token hash matches
    if (user.refreshTokenHash) {
      const isValidRefresh = await argon2.verify(user.refreshTokenHash, refreshToken)
      if (!isValidRefresh) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid refresh token'
        })
      }
    }

    // Create new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: 'tenant'
    }

    const newAccessToken = createToken(tokenPayload)
    const newRefreshToken = createRefreshToken(tokenPayload)

    // Update refresh token hash
    const newRefreshTokenHash = await argon2.hash(newRefreshToken)
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newRefreshTokenHash }
    })

    // Set new cookies
    res.cookie('tenant-auth-token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000
    })

    res.cookie('tenant-refresh-token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    logger.info(`[TENANT REFRESH] Token refreshed for: ${user.email}`)

    return res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    })
  } catch (error) {
    logger.error('[TENANT REFRESH] Error:', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during token refresh'
    })
  }
}
