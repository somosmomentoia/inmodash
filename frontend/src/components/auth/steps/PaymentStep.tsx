'use client'

import { useState } from 'react'
import { CreditCard, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { RegistrationData } from '../MultiStepRegister'
import { CardPaymentForm } from '@/components/subscription/CardPaymentForm'
import { createSubscription } from '@/services/subscription.service'
import styles from '../register.module.css'

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || 'APP_USR-28f83d59-0a3e-4a10-98ad-3c69a48ab570'

interface PaymentStepProps {
  data: Partial<RegistrationData>
  updateData: (data: Partial<RegistrationData>) => void
  onSubmit: () => void
  onBack: () => void
  isLoading: boolean
  accessToken?: string
}

export function PaymentStep({ data, updateData, onSubmit, onBack, isLoading, accessToken }: PaymentStepProps) {
  const [skipPayment, setSkipPayment] = useState(true)
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)

  const handleSkipAndRegister = () => {
    updateData({ paymentMethod: 'trial' })
    onSubmit()
  }

  const handleCardTokenCreated = async (cardToken: string) => {
    setIsCreatingSubscription(true)
    setSubscriptionError(null)

    try {
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://inmodash-back-production.up.railway.app'}/api/auth/me`, {
        credentials: 'include'
      })

      if (!userResponse.ok) {
        setSubscriptionError('Error de autenticación. Por favor, intenta nuevamente.')
        setIsCreatingSubscription(false)
        return
      }

      const userData = await userResponse.json()
      const email = userData.user?.email

      if (!email) {
        setSubscriptionError('No se pudo obtener el email del usuario')
        setIsCreatingSubscription(false)
        return
      }

      const result = await createSubscription({
        email,
        plan: 'professional',
        amount: 15,
        currency: 'ARS',
        cardToken,
      })

      if (result.success) {
        updateData({ paymentMethod: 'mercadopago' })
        setTimeout(() => {
          onSubmit()
        }, 1000)
      } else {
        setSubscriptionError(result.error || 'Error al crear la suscripción')
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      setSubscriptionError('Error inesperado al crear la suscripción')
    } finally {
      setIsCreatingSubscription(false)
    }
  }

  return (
    <div>
      {/* Payment Info Banner */}
      <div className={styles.paymentBanner}>
        <div className={styles.paymentBannerHeader}>
          <div className={styles.paymentBannerIcon}>
            <CreditCard size={24} />
          </div>
          <div className={styles.paymentBannerContent}>
            <h3>Configura tu suscripción</h3>
            <p>
              Puedes comenzar sin pago y configurar tu suscripción más adelante, 
              o configurar tu método de pago ahora con MercadoPago.
            </p>
            <div className={styles.paymentBenefits}>
              <div className={styles.paymentBenefit}>
                <CheckCircle2 size={16} />
                <span>Acceso completo a todas las funcionalidades</span>
              </div>
              <div className={styles.paymentBenefit}>
                <CheckCircle2 size={16} />
                <span>Pago seguro con MercadoPago</span>
              </div>
              <div className={styles.paymentBenefit}>
                <CheckCircle2 size={16} />
                <span>Cancela en cualquier momento</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {subscriptionError && (
        <div className={styles.errorAlert}>
          <AlertCircle size={20} />
          <div className={styles.errorAlertContent}>
            <p>Error al crear suscripción</p>
            <p>{subscriptionError}</p>
          </div>
        </div>
      )}

      {/* Payment Options */}
      <div className={styles.paymentOptions}>
        {/* Option: Start Trial */}
        <div
          className={`${styles.paymentOption} ${skipPayment ? styles.paymentOptionTrial : ''}`}
          onClick={() => setSkipPayment(true)}
        >
          <div className={styles.paymentOptionHeader}>
            <input
              type="radio"
              checked={skipPayment}
              onChange={() => setSkipPayment(true)}
              className={styles.paymentOptionRadio}
            />
            <div className={styles.paymentOptionContent}>
              <p>Comenzar sin pago</p>
              <p>Configura tu suscripción más adelante desde el dashboard</p>
            </div>
            <span className={`${styles.paymentOptionBadge} ${styles.badgeRecommended}`}>
              Recomendado
            </span>
          </div>
        </div>

        {/* Option: Pay Now with MercadoPago */}
        <div
          className={`${styles.paymentOption} ${!skipPayment ? styles.paymentOptionActive : ''}`}
          onClick={() => setSkipPayment(false)}
        >
          <div className={styles.paymentOptionHeader}>
            <input
              type="radio"
              checked={!skipPayment}
              onChange={() => setSkipPayment(false)}
              className={styles.paymentOptionRadio}
            />
            <div className={styles.paymentOptionContent}>
              <p>Configurar suscripción con MercadoPago</p>
              <p>$15 ARS/mes - Pago recurrente cada 30 días (Modo prueba)</p>
            </div>
            <span className={`${styles.paymentOptionBadge} ${styles.badgeAvailable}`}>
              Disponible
            </span>
          </div>
          
          {!skipPayment && (
            <div className={styles.paymentForm}>
              <CardPaymentForm
                publicKey={MP_PUBLIC_KEY}
                onTokenCreated={handleCardTokenCreated}
                onError={setSubscriptionError}
                isLoading={isCreatingSubscription}
              />
            </div>
          )}
        </div>
      </div>

      {/* Security Note */}
      <div className={styles.securityNote}>
        <Lock size={20} />
        <div className={styles.securityNoteContent}>
          <p>Pago 100% seguro</p>
          <p>
            Tus datos están protegidos con encriptación SSL de 256 bits.
            No almacenamos información de tarjetas de crédito.
          </p>
        </div>
      </div>

      {/* Skip Button (only visible when trial is selected) */}
      {skipPayment && (
        <button
          type="button"
          onClick={handleSkipAndRegister}
          disabled={isLoading}
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '14px 24px',
            fontSize: '14px',
            fontWeight: 600,
            color: 'white',
            background: '#10b981',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          {isLoading ? 'Procesando...' : 'Comenzar sin pago →'}
        </button>
      )}
    </div>
  )
}
