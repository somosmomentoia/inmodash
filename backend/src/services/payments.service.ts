import prisma from '../config/database'
import { CreatePaymentDto, UpdatePaymentDto } from '../types'

export const getAll = async (userId: number) => {
  return await prisma.payment.findMany({
    where: { userId },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              building: true,
              owner: true
            }
          },
          tenant: true
        }
      }
    },
    orderBy: {
      month: 'desc'
    }
  })
}

export const getById = async (id: number, userId: number) => {
  return await prisma.payment.findFirst({
    where: { id, userId },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              building: true,
              owner: true
            }
          },
          tenant: true
        }
      }
    }
  })
}

export const getByContractId = async (contractId: number, userId: number) => {
  return await prisma.payment.findMany({
    where: { contractId, userId },
    orderBy: {
      month: 'desc'
    }
  })
}

export const getPendingPayments = async (userId: number) => {
  return await prisma.payment.findMany({
    where: {
      userId,
      status: 'pending'
    },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              building: true,
              owner: true
            }
          },
          tenant: true
        }
      }
    },
    orderBy: {
      month: 'asc'
    }
  })
}

export const getOverduePayments = async (userId: number) => {
  const today = new Date()
  
  return await prisma.payment.findMany({
    where: {
      userId,
      status: 'pending',
      month: {
        lt: today
      }
    },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              building: true,
              owner: true
            }
          },
          tenant: true
        }
      }
    },
    orderBy: {
      month: 'asc'
    }
  })
}

export const create = async (data: CreatePaymentDto, userId: number) => {
  return await prisma.payment.create({
    data: {
      userId,
      contractId: data.contractId,
      month: new Date(data.month),
      amount: data.amount,
      commissionAmount: data.commissionAmount ?? 0,
      ownerAmount: data.ownerAmount ?? data.amount,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
      status: data.status || 'pending',
      notes: data.notes
    },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              building: true,
              owner: true
            }
          },
          tenant: true
        }
      }
    }
  })
}

export const update = async (id: number, data: UpdatePaymentDto, userId: number) => {
  // Verify ownership
  const existingPayment = await getById(id, userId)
  if (!existingPayment) {
    throw new Error('Payment not found or access denied')
  }
  
  const updateData: any = {}

  if (data.amount !== undefined) {
    updateData.amount = data.amount
    updateData.commissionAmount = data.commissionAmount ?? 0
    updateData.ownerAmount = data.ownerAmount ?? data.amount
  }

  if (data.paymentDate !== undefined) {
    updateData.paymentDate = data.paymentDate ? new Date(data.paymentDate) : null
  }

  if (data.status !== undefined) {
    updateData.status = data.status
    
    // If marking as paid and no payment date, set it to now
    if (data.status === 'paid' && !data.paymentDate && !updateData.paymentDate) {
      updateData.paymentDate = new Date()
    }
  }

  if (data.notes !== undefined) {
    updateData.notes = data.notes
  }

  return await prisma.payment.update({
    where: { id },
    data: updateData,
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              building: true,
              owner: true
            }
          },
          tenant: true
        }
      }
    }
  })
}

export const remove = async (id: number, userId: number) => {
  const payment = await getById(id, userId)
  if (!payment) {
    throw new Error('Payment not found or access denied')
  }
  
  return await prisma.payment.delete({
    where: { id }
  })
}

/**
 * Mark payment as paid
 */
export const markAsPaid = async (id: number, userId: number, paymentDate?: string) => {
  return await update(id, {
    status: 'paid',
    paymentDate: paymentDate || new Date().toISOString()
  }, userId)
}

/**
 * Mark overdue payments
 */
export const markOverduePayments = async (userId: number) => {
  const today = new Date()
  
  const result = await prisma.payment.updateMany({
    where: {
      userId,
      status: 'pending',
      month: {
        lt: today
      }
    },
    data: {
      status: 'overdue'
    }
  })

  return result
}
