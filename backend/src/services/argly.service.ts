/**
 * Servicio para consultar índices económicos de Argentina via Argly API
 * https://www.argly.com.ar/
 * 
 * Endpoints disponibles:
 * - ICL (Índice para Contratos de Locación): https://api.argly.com.ar/api/icl
 * - IPC (Índice de Precios al Consumidor): https://api.argly.com.ar/api/ipc
 */

const ARGLY_BASE_URL = 'https://api.argly.com.ar/api'

export interface ICLResponse {
  data: {
    fecha: string    // "03/02/2026"
    valor: number    // 30.06
  }
}

export interface IPCResponse {
  data: {
    anio: number
    mes: number
    nombre_mes: string
    indice_ipc: number
    fecha_publicacion: string
    fecha_proximo_informe: string
  }
}

export interface IndexValue {
  type: 'icl' | 'ipc'
  value: number
  date: Date
  rawData: ICLResponse['data'] | IPCResponse['data']
}

class ArglyService {
  private cache: Map<string, { value: IndexValue; timestamp: number }> = new Map()
  private CACHE_TTL = 1000 * 60 * 60 // 1 hora de cache

  /**
   * Obtener el valor actual del ICL
   */
  async getICL(): Promise<IndexValue> {
    const cacheKey = 'icl'
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value
    }

    try {
      const response = await fetch(`${ARGLY_BASE_URL}/icl`)
      if (!response.ok) {
        throw new Error(`Error fetching ICL: ${response.status}`)
      }
      
      const data = await response.json() as ICLResponse
      
      // Parsear fecha DD/MM/YYYY
      const [day, month, year] = data.data.fecha.split('/').map(Number)
      const date = new Date(year, month - 1, day)
      
      const result: IndexValue = {
        type: 'icl',
        value: data.data.valor,
        date,
        rawData: data.data
      }
      
      this.cache.set(cacheKey, { value: result, timestamp: Date.now() })
      return result
    } catch (error) {
      console.error('Error fetching ICL from Argly:', error)
      throw error
    }
  }

  /**
   * Obtener el valor actual del IPC
   */
  async getIPC(): Promise<IndexValue> {
    const cacheKey = 'ipc'
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value
    }

    try {
      const response = await fetch(`${ARGLY_BASE_URL}/ipc`)
      if (!response.ok) {
        throw new Error(`Error fetching IPC: ${response.status}`)
      }
      
      const data = await response.json() as IPCResponse
      
      // Fecha del IPC es el último día del mes reportado
      const date = new Date(data.data.anio, data.data.mes, 0)
      
      const result: IndexValue = {
        type: 'ipc',
        value: data.data.indice_ipc,
        date,
        rawData: data.data
      }
      
      this.cache.set(cacheKey, { value: result, timestamp: Date.now() })
      return result
    } catch (error) {
      console.error('Error fetching IPC from Argly:', error)
      throw error
    }
  }

  /**
   * Obtener el valor de un índice por tipo
   */
  async getIndex(type: 'icl' | 'ipc'): Promise<IndexValue> {
    if (type === 'icl') {
      return this.getICL()
    } else {
      return this.getIPC()
    }
  }

  /**
   * Calcular el coeficiente de actualización entre dos valores de índice
   * @param initialValue Valor del índice al inicio
   * @param currentValue Valor actual del índice
   * @returns Coeficiente de actualización (ej: 1.15 = 15% de aumento)
   */
  calculateUpdateCoefficient(initialValue: number, currentValue: number): number {
    if (initialValue <= 0) {
      throw new Error('El valor inicial del índice debe ser mayor a 0')
    }
    return currentValue / initialValue
  }

  /**
   * Calcular el nuevo monto aplicando el coeficiente de actualización
   * @param baseAmount Monto base (inicial del contrato)
   * @param initialIndexValue Valor del índice al inicio del contrato
   * @param currentIndexValue Valor actual del índice
   * @returns Nuevo monto actualizado
   */
  calculateUpdatedAmount(
    baseAmount: number,
    initialIndexValue: number,
    currentIndexValue: number
  ): { newAmount: number; coefficient: number; percentageIncrease: number } {
    const coefficient = this.calculateUpdateCoefficient(initialIndexValue, currentIndexValue)
    const newAmount = Math.round(baseAmount * coefficient) // Redondear a entero
    const percentageIncrease = (coefficient - 1) * 100
    
    return {
      newAmount,
      coefficient,
      percentageIncrease
    }
  }

  /**
   * Limpiar cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

export const arglyService = new ArglyService()
export default arglyService
