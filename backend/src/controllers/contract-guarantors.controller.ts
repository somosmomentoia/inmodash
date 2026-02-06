import { Request, Response, NextFunction } from 'express'
import prisma from '../config/database'

/**
 * Obtener garantes de un contrato
 */
export const getContractGuarantors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    
    // Verificar que el contrato pertenece al usuario
    const contract = await prisma.contract.findFirst({
      where: { 
        id: parseInt(id), 
        userId 
      },
      include: {
        guarantors: {
          include: {
            guarantor: true
          }
        }
      }
    })
    
    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' })
    }
    
    // Retornar solo los garantes activos
    const guarantors = contract.guarantors
      .map((cg: { guarantor: { isActive: boolean } }) => cg.guarantor)
      .filter((g: { isActive: boolean }) => g.isActive)
    
    res.json(guarantors)
  } catch (error) {
    next(error)
  }
}

/**
 * Agregar garante a un contrato
 */
export const addGuarantorToContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { guarantorId } = req.body
    const userId = req.user!.userId
    
    if (!guarantorId) {
      return res.status(400).json({ error: 'guarantorId es requerido' })
    }
    
    // Verificar que el contrato pertenece al usuario
    const contract = await prisma.contract.findFirst({
      where: { 
        id: parseInt(id), 
        userId 
      }
    })
    
    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' })
    }
    
    // Verificar que el garante pertenece al usuario y está activo
    const guarantor = await prisma.guarantor.findFirst({
      where: { 
        id: guarantorId,
        userId,
        isActive: true
      }
    })
    
    if (!guarantor) {
      return res.status(400).json({ 
        error: 'Garante no encontrado o no está activo' 
      })
    }
    
    // Verificar que no esté ya asignado
    const existing = await prisma.contractGuarantor.findUnique({
      where: {
        contractId_guarantorId: {
          contractId: parseInt(id),
          guarantorId
        }
      }
    })
    
    if (existing) {
      return res.status(400).json({ 
        error: 'El garante ya está asignado a este contrato' 
      })
    }
    
    // Crear relación
    await prisma.contractGuarantor.create({
      data: {
        contractId: parseInt(id),
        guarantorId
      }
    })
    
    res.status(201).json({ 
      message: 'Garante agregado al contrato exitosamente',
      guarantorId 
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Quitar garante de un contrato
 */
export const removeGuarantorFromContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, guarantorId } = req.params
    const userId = req.user!.userId
    
    // Verificar que el contrato pertenece al usuario
    const contract = await prisma.contract.findFirst({
      where: { 
        id: parseInt(id), 
        userId 
      }
    })
    
    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' })
    }
    
    // Verificar que la relación existe
    const relation = await prisma.contractGuarantor.findUnique({
      where: {
        contractId_guarantorId: {
          contractId: parseInt(id),
          guarantorId: parseInt(guarantorId)
        }
      }
    })
    
    if (!relation) {
      return res.status(404).json({ 
        error: 'El garante no está asignado a este contrato' 
      })
    }
    
    // Eliminar relación
    await prisma.contractGuarantor.delete({
      where: {
        contractId_guarantorId: {
          contractId: parseInt(id),
          guarantorId: parseInt(guarantorId)
        }
      }
    })
    
    res.status(200).json({ 
      message: 'Garante removido del contrato exitosamente' 
    })
  } catch (error) {
    next(error)
  }
}
