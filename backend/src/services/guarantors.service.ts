import prisma from '../config/database'
import { CreateGuarantorDto, UpdateGuarantorDto } from '../types'

// Obtener todos los garantes del usuario (filtrado directo por userId)
export const getAll = async (userId: number) => {
  return await prisma.guarantor.findMany({
    where: {
      userId,
      isActive: true
    },
    include: {
      contracts: {
        include: {
          contract: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              tenant: {
                select: {
                  id: true,
                  nameOrBusiness: true
                }
              },
              apartment: {
                select: {
                  id: true,
                  floor: true,
                  nomenclature: true,
                  fullAddress: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export const getById = async (id: number, userId: number) => {
  return await prisma.guarantor.findFirst({
    where: { 
      id,
      userId,
      isActive: true
    },
    include: {
      contracts: {
        include: {
          contract: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              tenant: {
                select: {
                  id: true,
                  nameOrBusiness: true
                }
              },
              apartment: {
                select: {
                  id: true,
                  floor: true,
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
}

export const create = async (userId: number, data: CreateGuarantorDto) => {
  return await prisma.guarantor.create({
    data: {
      userId,
      name: data.name,
      dni: data.dni,
      address: data.address,
      email: data.email,
      phone: data.phone
    }
  })
}

export const update = async (id: number, userId: number, data: UpdateGuarantorDto) => {
  // Verificar que el garante pertenece al usuario
  const guarantor = await prisma.guarantor.findFirst({
    where: { id, userId }
  })
  
  if (!guarantor) {
    throw new Error('Garante no encontrado')
  }

  return await prisma.guarantor.update({
    where: { id },
    data: {
      name: data.name,
      dni: data.dni,
      address: data.address,
      email: data.email,
      phone: data.phone
    }
  })
}

// Soft delete
export const remove = async (id: number, userId: number) => {
  // Verificar que el garante pertenece al usuario
  const guarantor = await prisma.guarantor.findFirst({
    where: { id, userId }
  })
  
  if (!guarantor) {
    throw new Error('Garante no encontrado')
  }

  return await prisma.guarantor.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date()
    }
  })
}
