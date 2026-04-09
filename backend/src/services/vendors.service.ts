import prisma from '../config/database'

export interface CreateVendorDto {
  name: string
  email?: string
  phone?: string
  defaultCommissionType?: string
  defaultCommissionPct?: number
  defaultCommissionFixed?: number
}

export interface UpdateVendorDto {
  name?: string
  email?: string
  phone?: string
  isActive?: boolean
  defaultCommissionType?: string
  defaultCommissionPct?: number
  defaultCommissionFixed?: number
}

export const getAll = async (userId: number) => {
  return await prisma.vendor.findMany({
    where: { userId },
    include: {
      _count: {
        select: { contracts: true, commissions: true }
      }
    },
    orderBy: { name: 'asc' }
  })
}

export const getById = async (id: number, userId: number) => {
  const vendor = await prisma.vendor.findFirst({
    where: { id, userId },
    include: {
      contracts: {
        include: {
          apartment: { include: { building: true } },
          tenant: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      commissions: {
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: { contracts: true, commissions: true }
      }
    }
  })

  if (!vendor) {
    throw new Error('Vendor not found or access denied')
  }

  return vendor
}

export const create = async (data: CreateVendorDto, userId: number) => {
  return await prisma.vendor.create({
    data: {
      userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      defaultCommissionType: data.defaultCommissionType,
      defaultCommissionPct: data.defaultCommissionPct,
      defaultCommissionFixed: data.defaultCommissionFixed,
    }
  })
}

export const update = async (id: number, data: UpdateVendorDto, userId: number) => {
  const existing = await prisma.vendor.findFirst({ where: { id, userId } })
  if (!existing) {
    throw new Error('Vendor not found or access denied')
  }

  return await prisma.vendor.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      isActive: data.isActive,
      defaultCommissionType: data.defaultCommissionType,
      defaultCommissionPct: data.defaultCommissionPct,
      defaultCommissionFixed: data.defaultCommissionFixed,
    }
  })
}

export const remove = async (id: number, userId: number) => {
  const existing = await prisma.vendor.findFirst({ where: { id, userId } })
  if (!existing) {
    throw new Error('Vendor not found or access denied')
  }

  return await prisma.vendor.delete({ where: { id } })
}
