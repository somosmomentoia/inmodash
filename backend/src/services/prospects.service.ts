import { PrismaClient, Prisma } from '@prisma/client'
import {
  CreateProspectDto,
  UpdateProspectDto,
  ChangeProspectStatusDto,
  AddProspectNoteDto,
  ConvertProspectDto,
  ProspectFilters,
  ProspectStatus,
  ProspectActivityType,
} from '../types/prospect.types'

const prisma = new PrismaClient()

class ProspectsService {
  /**
   * Get all prospects for a user with optional filters
   */
  async getAll(userId: number, filters?: ProspectFilters) {
    const where: Prisma.ProspectWhereInput = { userId }

    if (filters?.status) {
      where.status = filters.status
    }
    if (filters?.source) {
      where.source = filters.source
    }
    if (filters?.apartmentId) {
      where.apartmentId = filters.apartmentId
    }
    if (filters?.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    if (filters?.fromDate) {
      where.createdAt = { gte: filters.fromDate }
    }
    if (filters?.toDate) {
      where.createdAt = { ...where.createdAt as object, lte: filters.toDate }
    }

    return prisma.prospect.findMany({
      where,
      include: {
        apartment: {
          select: {
            id: true,
            nomenclature: true,
            fullAddress: true,
            propertyType: true,
            status: true,
          },
        },
        _count: {
          select: {
            activities: true,
            documents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get a single prospect by ID
   */
  async getById(userId: number, prospectId: number) {
    const prospect = await prisma.prospect.findFirst({
      where: { id: prospectId, userId },
      include: {
        apartment: {
          select: {
            id: true,
            nomenclature: true,
            fullAddress: true,
            propertyType: true,
            status: true,
            rentalPrice: true,
            owner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        convertedToTenant: {
          select: {
            id: true,
            nameOrBusiness: true,
          },
        },
        convertedToContract: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    })

    if (!prospect) {
      throw new Error('Prospecto no encontrado')
    }

    return prospect
  }

  /**
   * Create a new prospect
   */
  async create(userId: number, data: CreateProspectDto) {
    const prospect = await prisma.prospect.create({
      data: {
        userId,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        dniOrCuit: data.dniOrCuit,
        apartmentId: data.apartmentId,
        source: data.source || 'other',
        notes: data.notes,
        status: 'new',
      },
      include: {
        apartment: {
          select: {
            id: true,
            nomenclature: true,
            fullAddress: true,
          },
        },
      },
    })

    // Create initial activity
    await this.createActivity(prospect.id, 'created', 'Prospecto creado')

    return prospect
  }

  /**
   * Update prospect basic info
   */
  async update(userId: number, prospectId: number, data: UpdateProspectDto) {
    // Verify ownership
    const existing = await prisma.prospect.findFirst({
      where: { id: prospectId, userId },
    })

    if (!existing) {
      throw new Error('Prospecto no encontrado')
    }

    if (existing.status === 'converted') {
      throw new Error('No se puede modificar un prospecto convertido')
    }

    const prospect = await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        dniOrCuit: data.dniOrCuit,
        apartmentId: data.apartmentId,
        source: data.source,
        notes: data.notes,
      },
      include: {
        apartment: {
          select: {
            id: true,
            nomenclature: true,
            fullAddress: true,
          },
        },
      },
    })

    // Log activity
    await this.createActivity(prospectId, 'info_updated', 'Información actualizada')

    return prospect
  }

  /**
   * Change prospect status
   */
  async changeStatus(userId: number, prospectId: number, data: ChangeProspectStatusDto) {
    const existing = await prisma.prospect.findFirst({
      where: { id: prospectId, userId },
    })

    if (!existing) {
      throw new Error('Prospecto no encontrado')
    }

    if (existing.status === 'converted') {
      throw new Error('No se puede cambiar el estado de un prospecto convertido')
    }

    // Validate status transition
    this.validateStatusTransition(existing.status as ProspectStatus, data.status)

    const prospect = await prisma.prospect.update({
      where: { id: prospectId },
      data: { status: data.status },
    })

    // Log activity with metadata
    await this.createActivity(
      prospectId,
      'status_changed',
      data.note || `Estado cambiado de ${existing.status} a ${data.status}`,
      { previousStatus: existing.status, newStatus: data.status }
    )

    return prospect
  }

  /**
   * Add a note to prospect
   */
  async addNote(userId: number, prospectId: number, data: AddProspectNoteDto) {
    const existing = await prisma.prospect.findFirst({
      where: { id: prospectId, userId },
    })

    if (!existing) {
      throw new Error('Prospecto no encontrado')
    }

    // Append note to existing notes
    const updatedNotes = existing.notes
      ? `${existing.notes}\n\n---\n${new Date().toLocaleString('es-AR')}: ${data.note}`
      : data.note

    await prisma.prospect.update({
      where: { id: prospectId },
      data: { notes: updatedNotes },
    })

    // Log activity
    await this.createActivity(prospectId, 'note_added', data.note)

    return { success: true }
  }

  /**
   * Convert prospect to tenant and prepare for contract
   */
  async convert(userId: number, prospectId: number, data: ConvertProspectDto) {
    const prospect = await prisma.prospect.findFirst({
      where: { id: prospectId, userId },
      include: { apartment: true },
    })

    if (!prospect) {
      throw new Error('Prospecto no encontrado')
    }

    if (prospect.status === 'converted') {
      throw new Error('Este prospecto ya fue convertido')
    }

    if (prospect.status !== 'approved') {
      throw new Error('Solo se pueden convertir prospectos aprobados')
    }

    let tenantId: number

    if (data.existingTenantId) {
      // Use existing tenant
      const tenant = await prisma.tenant.findFirst({
        where: { id: data.existingTenantId, userId },
      })
      if (!tenant) {
        throw new Error('Inquilino no encontrado')
      }
      tenantId = tenant.id
    } else if (data.createNewTenant && data.tenantData) {
      // Create new tenant from prospect data
      const tenant = await prisma.tenant.create({
        data: {
          userId,
          nameOrBusiness: data.tenantData.nameOrBusiness || prospect.fullName,
          dniOrCuit: data.tenantData.dniOrCuit || prospect.dniOrCuit || '',
          address: data.tenantData.address || '',
          contactName: data.tenantData.contactName || prospect.fullName,
          contactPhone: data.tenantData.contactPhone || prospect.phone,
          contactEmail: data.tenantData.contactEmail || prospect.email || '',
          contactAddress: data.tenantData.contactAddress || '',
        },
      })
      tenantId = tenant.id
    } else {
      throw new Error('Debe especificar un inquilino existente o crear uno nuevo')
    }

    // Update prospect with conversion info
    await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        status: 'converted',
        convertedToTenantId: tenantId,
        convertedAt: new Date(),
      },
    })

    // Log activity
    await this.createActivity(
      prospectId,
      'converted',
      `Convertido a inquilino #${tenantId}`,
      { tenantId }
    )

    return {
      success: true,
      tenantId,
      apartmentId: prospect.apartmentId,
      prospectData: {
        fullName: prospect.fullName,
        phone: prospect.phone,
        email: prospect.email,
        dniOrCuit: prospect.dniOrCuit,
      },
      redirectUrl: data.redirectToContractWizard
        ? `/contracts/new?tenantId=${tenantId}&apartmentId=${prospect.apartmentId || ''}&prospectId=${prospectId}`
        : null,
    }
  }

  /**
   * Delete a prospect (soft delete by marking as rejected, or hard delete if new)
   */
  async delete(userId: number, prospectId: number) {
    const existing = await prisma.prospect.findFirst({
      where: { id: prospectId, userId },
    })

    if (!existing) {
      throw new Error('Prospecto no encontrado')
    }

    // If converted, check if there's an actual contract
    if (existing.status === 'converted' && existing.convertedToContractId) {
      // Check if contract actually exists
      const contract = await prisma.contract.findFirst({
        where: { id: existing.convertedToContractId },
      })
      if (contract) {
        throw new Error('No se puede eliminar un prospecto con contrato asociado')
      }
    }

    // Delete associated activities first
    await prisma.prospectActivity.deleteMany({
      where: { prospectId },
    })

    // Delete associated documents
    await prisma.prospectDocument.deleteMany({
      where: { prospectId },
    })

    // Hard delete the prospect
    await prisma.prospect.delete({ where: { id: prospectId } })

    return { success: true }
  }

  /**
   * Get prospect statistics
   */
  async getStats(userId: number) {
    const [total, byStatus, bySource, recentActivity] = await Promise.all([
      prisma.prospect.count({ where: { userId } }),
      prisma.prospect.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
      prisma.prospect.groupBy({
        by: ['source'],
        where: { userId },
        _count: true,
      }),
      prisma.prospectActivity.findMany({
        where: { prospect: { userId } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          prospect: {
            select: { id: true, fullName: true },
          },
        },
      }),
    ])

    const statusCounts = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    const sourceCounts = bySource.reduce((acc, item) => {
      acc[item.source] = item._count
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      byStatus: statusCounts,
      bySource: sourceCounts,
      recentActivity,
    }
  }

  /**
   * Get stale prospects (new status for more than X hours)
   */
  async getStaleProspects(userId: number, hoursThreshold: number = 24) {
    const thresholdDate = new Date()
    thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold)

    return prisma.prospect.findMany({
      where: {
        userId,
        status: 'new',
        createdAt: { lt: thresholdDate },
      },
      include: {
        apartment: {
          select: { id: true, nomenclature: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Get approved prospects pending conversion
   */
  async getApprovedPendingConversion(userId: number) {
    return prisma.prospect.findMany({
      where: {
        userId,
        status: 'approved',
      },
      include: {
        apartment: {
          select: { id: true, nomenclature: true, fullAddress: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  // Private helper methods

  private async createActivity(
    prospectId: number,
    type: ProspectActivityType,
    description: string,
    metadata?: Record<string, unknown>
  ) {
    return prisma.prospectActivity.create({
      data: {
        prospectId,
        type,
        description,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    })
  }

  private validateStatusTransition(currentStatus: ProspectStatus, newStatus: ProspectStatus) {
    // Only block transitions FROM converted state (terminal)
    if (currentStatus === 'converted') {
      throw new Error('No se puede cambiar el estado de un prospecto convertido')
    }
    
    // Allow any other transition - business logic is flexible
    // Users may need to move prospects back and forth as situations change
  }
}

export const prospectsService = new ProspectsService()
