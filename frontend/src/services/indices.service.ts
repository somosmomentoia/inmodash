import { apiClient } from './api'

export interface IndexValue {
  type: 'icl' | 'ipc'
  value: number
  date: string
  rawData: Record<string, unknown>
}

export interface AllIndices {
  icl: IndexValue
  ipc: IndexValue
}

export interface CalculateUpdateResult {
  newAmount: number
  coefficient: number
  percentageIncrease: number
  currentIndexValue: number
  currentIndexDate: string
  indexType: 'icl' | 'ipc'
}

const indicesService = {
  /**
   * Obtener el valor actual del ICL
   */
  async getICL(): Promise<IndexValue> {
    return apiClient.get<IndexValue>('/api/indices/icl')
  },

  /**
   * Obtener el valor actual del IPC
   */
  async getIPC(): Promise<IndexValue> {
    return apiClient.get<IndexValue>('/api/indices/ipc')
  },

  /**
   * Obtener todos los índices
   */
  async getAll(): Promise<AllIndices> {
    return apiClient.get<AllIndices>('/api/indices/all')
  },

  /**
   * Obtener un índice por tipo
   */
  async getIndex(type: 'icl' | 'ipc'): Promise<IndexValue> {
    if (type === 'icl') {
      return this.getICL()
    } else {
      return this.getIPC()
    }
  },

  /**
   * Calcular actualización de monto
   */
  async calculateUpdate(
    baseAmount: number,
    initialIndexValue: number,
    indexType: 'icl' | 'ipc'
  ): Promise<CalculateUpdateResult> {
    return apiClient.post<CalculateUpdateResult>('/api/indices/calculate', {
      baseAmount,
      initialIndexValue,
      indexType
    })
  }
}

export default indicesService
