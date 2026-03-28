import prisma from '../config/database'
import * as cashflowService from './cashflow.service'

/**
 * Get all vendor commissions for a user
 */
export const getAll = async (userId: number) => {
  return await prisma.vendorCommission.findMany({
    where: { userId },
    include: {
      vendor: true,
      contract: {
        include: {
          apartment: { include: { building: true } },
          tenant: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Get vendor commissions by vendor
 */
export const getByVendor = async (vendorId: number, userId: number) => {
  return await prisma.vendorCommission.findMany({
    where: { vendorId, userId },
    include: {
      vendor: true,
      contract: {
        include: {
          apartment: { include: { building: true } },
          tenant: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Create a vendor commission (called automatically when signup fee is collected)
 */
export const create = async (data: {
  vendorId: number
  contractId: number
  amount: number
  notes?: string
}, userId: number) => {
  return await prisma.vendorCommission.create({
    data: {
      userId,
      vendorId: data.vendorId,
      contractId: data.contractId,
      amount: data.amount,
      status: 'pending',
      notes: data.notes,
    },
    include: {
      vendor: true,
      contract: true
    }
  })
}

/**
 * Mark a vendor commission as paid.
 * Creates an expense in cash flow (obligation + payment) and accounting entry.
 */
export const markAsPaid = async (id: number, userId: number, data: {
  paymentMethod?: string
  reference?: string
  notes?: string
}) => {
  const commission = await prisma.vendorCommission.findFirst({
    where: { id, userId },
    include: { vendor: true, contract: { include: { apartment: true } } }
  })

  if (!commission) {
    throw new Error('Commission not found or access denied')
  }

  if (commission.status === 'paid') {
    throw new Error('Commission already paid')
  }

  // 1. Update commission status
  const updated = await prisma.vendorCommission.update({
    where: { id },
    data: {
      status: 'paid',
      paidAt: new Date(),
      paymentMethod: data.paymentMethod,
      reference: data.reference,
      notes: data.notes,
    },
    include: {
      vendor: true,
      contract: true
    }
  })

  // 2. Create expense in cash flow (obligation + payment atomically)
  // This creates an expense_other obligation with agencyImpact = -amount
  try {
    await cashflowService.createMovement({
      type: 'expense_other',
      description: `Comisión vendedor: ${commission.vendor.name} - Contrato #${commission.contractId}`,
      amount: commission.amount,
      date: new Date(),
      paidBy: 'agency',
      category: 'vendor_commission',
      method: (data.paymentMethod as any) || 'transfer',
      reference: data.reference,
      notes: data.notes || `Pago de comisión a ${commission.vendor.name}`,
      contractId: commission.contractId,
      apartmentId: commission.contract.apartmentId,
    }, userId)
  } catch (error) {
    console.error('Error creating cash flow entry for vendor commission:', error)
    // Don't block the commission payment if cash flow fails
  }

  return updated
}

/**
 * Get summary stats for vendor commissions
 */
export const getStats = async (userId: number) => {
  const [pending, paid] = await Promise.all([
    prisma.vendorCommission.aggregate({
      where: { userId, status: 'pending' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.vendorCommission.aggregate({
      where: { userId, status: 'paid' },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  return {
    pendingCount: pending._count,
    pendingAmount: pending._sum.amount || 0,
    paidCount: paid._count,
    paidAmount: paid._sum.amount || 0,
  }
}
