const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://inmodash-back-production.up.railway.app'

export interface CreateSubscriptionParams {
  email: string
  plan?: string
  amount?: number
  currency?: string
  cardToken: string // Token de la tarjeta (obligatorio)
}

export interface SubscriptionResponse {
  success: boolean
  subscription?: any
  initPoint?: string
  error?: string
}

/**
 * Crear una suscripción en MercadoPago
 */
export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<SubscriptionResponse> {
  try {
    const response = await fetch(`${API_URL}/api/subscriptions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Las cookies se envían automáticamente
      body: JSON.stringify(params),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to create subscription',
      }
    }

    return data
  } catch (error) {
    console.error('Error creating subscription:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Obtener la suscripción actual del usuario
 */
export async function getMySubscription(): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/subscriptions/me`, {
      method: 'GET',
      credentials: 'include', // Las cookies se envían automáticamente
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.subscription
  } catch (error) {
    console.error('Error getting subscription:', error)
    return null
  }
}

/**
 * Cancelar la suscripción actual
 */
export async function cancelSubscription(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/subscriptions/cancel`, {
      method: 'POST',
      credentials: 'include', // Las cookies se envían automáticamente
    })

    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return false
  }
}
