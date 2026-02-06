import { v4 as uuidv4 } from 'uuid'
import { logger } from '../utils/logger'

// ============================================
// TIPOS PARA MERCADOPAGO
// ============================================

export interface PaymentItem {
  id: string
  title: string
  description?: string
  quantity: number
  unit_price: number
  currency_id?: string
}

export interface PayerInfo {
  email: string
  name?: string
  identification?: {
    type: string
    number: string
  }
}

export interface CreatePreferenceRequest {
  items: PaymentItem[]
  payer?: PayerInfo
  external_reference: string
  back_urls: {
    success: string
    failure: string
    pending: string
  }
  auto_return?: 'approved' | 'all'
  notification_url?: string
  statement_descriptor?: string
  expires?: boolean
  expiration_date_from?: string
  expiration_date_to?: string
}

export interface PreferenceResponse {
  id: string
  init_point: string
  sandbox_init_point: string
  external_reference: string
  items: PaymentItem[]
  date_created: string
}

export interface PaymentNotification {
  id: number
  status: 'approved' | 'pending' | 'rejected' | 'cancelled' | 'refunded'
  status_detail: string
  external_reference: string
  transaction_amount: number
  currency_id: string
  payment_method_id: string
  payment_type_id: string
  payer: {
    email: string
    id?: string
  }
  date_approved?: string
  date_created: string
}

// ============================================
// CONFIGURACIÓN
// ============================================

const TENANT_PORTAL_URL = process.env.TENANT_PORTAL_URL || 'http://localhost:3976'
const API_URL = process.env.API_URL || 'http://localhost:3001'
const USE_MOCK = process.env.MP_USE_MOCK !== 'false' // Default to mock

// ============================================
// SERVICIO MERCADOPAGO PARA TENANT PORTAL
// ============================================

class TenantMercadoPagoService {
  private accessToken: string | null = null

  constructor() {
    this.accessToken = process.env.MP_ACCESS_TOKEN || null
    
    if (!this.accessToken && !USE_MOCK) {
      logger.warn('[TENANT MP] No access token configured, using mock mode')
    }
  }

  /**
   * Crea una preferencia de pago para obligaciones del tenant
   */
  async createPaymentPreference(
    obligations: Array<{
      id: number
      description: string
      amount: number
    }>,
    payerEmail: string,
    paymentGroupId: string
  ): Promise<PreferenceResponse> {
    const items: PaymentItem[] = obligations.map(o => ({
      id: `obligation_${o.id}`,
      title: o.description,
      quantity: 1,
      unit_price: o.amount,
      currency_id: 'ARS'
    }))

    const externalReference = JSON.stringify({
      type: 'tenant_portal_payment',
      paymentGroupId,
      obligationIds: obligations.map(o => o.id)
    })

    const request: CreatePreferenceRequest = {
      items,
      payer: { email: payerEmail },
      external_reference: externalReference,
      back_urls: {
        success: `${TENANT_PORTAL_URL}/tenant/payments/success`,
        failure: `${TENANT_PORTAL_URL}/tenant/payments/failure`,
        pending: `${TENANT_PORTAL_URL}/tenant/payments/pending`
      },
      auto_return: 'approved',
      notification_url: `${API_URL}/api/webhooks/mercadopago/tenant`,
      statement_descriptor: 'INMODASH'
    }

    if (USE_MOCK) {
      return this.createMockPreference(request, paymentGroupId)
    }

    return this.createRealPreference(request)
  }

  /**
   * Mock de preferencia para desarrollo
   */
  private createMockPreference(
    request: CreatePreferenceRequest,
    paymentGroupId: string
  ): PreferenceResponse {
    const mockId = `MOCK_PREF_${paymentGroupId.substring(0, 8)}`
    
    logger.info(`[TENANT MP MOCK] Created preference: ${mockId}`)
    logger.info(`[TENANT MP MOCK] Items: ${request.items.length}`)
    logger.info(`[TENANT MP MOCK] Total: $${request.items.reduce((s, i) => s + i.unit_price, 0)}`)

    return {
      id: mockId,
      init_point: `${TENANT_PORTAL_URL}/tenant/payments/mock-checkout?pref=${mockId}&ref=${encodeURIComponent(request.external_reference)}`,
      sandbox_init_point: `${TENANT_PORTAL_URL}/tenant/payments/mock-checkout?pref=${mockId}&ref=${encodeURIComponent(request.external_reference)}`,
      external_reference: request.external_reference,
      items: request.items,
      date_created: new Date().toISOString()
    }
  }

  /**
   * Crea preferencia real en MercadoPago
   * TODO: Implementar cuando se configure MP en producción
   */
  private async createRealPreference(
    request: CreatePreferenceRequest
  ): Promise<PreferenceResponse> {
    if (!this.accessToken) {
      throw new Error('MercadoPago access token not configured')
    }

    // TODO: Implementar llamada real a MercadoPago API
    // const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.accessToken}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(request)
    // })
    // return response.json()

    throw new Error('Real MercadoPago integration not implemented yet')
  }

  /**
   * Obtiene información de un pago por ID
   */
  async getPayment(paymentId: string): Promise<PaymentNotification | null> {
    if (USE_MOCK) {
      return this.getMockPayment(paymentId)
    }

    return this.getRealPayment(paymentId)
  }

  /**
   * Mock de obtener pago
   */
  private getMockPayment(paymentId: string): PaymentNotification | null {
    logger.info(`[TENANT MP MOCK] Getting payment: ${paymentId}`)
    
    // Return mock approved payment
    return {
      id: parseInt(paymentId) || 12345,
      status: 'approved',
      status_detail: 'accredited',
      external_reference: '{}',
      transaction_amount: 0,
      currency_id: 'ARS',
      payment_method_id: 'visa',
      payment_type_id: 'credit_card',
      payer: { email: 'mock@test.com' },
      date_approved: new Date().toISOString(),
      date_created: new Date().toISOString()
    }
  }

  /**
   * Obtiene pago real de MercadoPago
   */
  private async getRealPayment(paymentId: string): Promise<PaymentNotification | null> {
    if (!this.accessToken) {
      throw new Error('MercadoPago access token not configured')
    }

    // TODO: Implementar llamada real
    // const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    //   headers: { 'Authorization': `Bearer ${this.accessToken}` }
    // })
    // return response.json()

    return null
  }

  /**
   * Valida la firma del webhook de MercadoPago
   */
  validateWebhookSignature(
    xSignature: string | undefined,
    xRequestId: string | undefined,
    dataId: string
  ): boolean {
    if (USE_MOCK) {
      return true // Skip validation in mock mode
    }

    // TODO: Implementar validación real de firma
    // https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
    
    if (!xSignature || !xRequestId) {
      logger.warn('[TENANT MP] Missing signature headers')
      return false
    }

    return true
  }
}

export const tenantMercadoPagoService = new TenantMercadoPagoService()
