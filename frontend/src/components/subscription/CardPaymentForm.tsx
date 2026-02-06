'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import { CreditCard, Lock } from 'lucide-react'
import styles from './CardPaymentForm.module.css'

declare global {
  interface Window {
    MercadoPago: any
  }
}

interface CardPaymentFormProps {
  publicKey: string
  onTokenCreated: (token: string) => void
  onError: (error: string) => void
  isLoading?: boolean
}

export function CardPaymentForm({ publicKey, onTokenCreated, onError, isLoading }: CardPaymentFormProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [securityCode, setSecurityCode] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [sdkLoaded, setSdkLoaded] = useState(false)

  useEffect(() => {
    if (window.MercadoPago) {
      setSdkLoaded(true)
    }
  }, [])

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  const formatExpirationDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4)
    }
    return v
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cardNumber || !cardholderName || !expirationDate || !securityCode || !docNumber) {
      onError('Por favor completa todos los campos')
      return
    }

    if (!window.MercadoPago) {
      onError('SDK de MercadoPago no está cargado. Por favor recarga la página.')
      return
    }

    try {
      const mp = new window.MercadoPago(publicKey)
      const [month, year] = expirationDate.split('/')

      const cardData = {
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName,
        cardExpirationMonth: month,
        cardExpirationYear: `20${year}`,
        securityCode,
        identificationType: 'DNI',
        identificationNumber: docNumber,
      }

      const token = await mp.createCardToken(cardData)

      if (token.id) {
        onTokenCreated(token.id)
      } else {
        onError('Error al crear el token de la tarjeta')
      }
    } catch (error) {
      console.error('Error creating card token:', error)
      onError('Error al procesar la tarjeta. Verifica los datos.')
    }
  }

  return (
    <>
      <Script 
        src="https://sdk.mercadopago.com/js/v2" 
        strategy="lazyOnload"
        onLoad={() => setSdkLoaded(true)}
      />
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.securityNote}>
          <Lock size={16} />
          <span>Pago seguro y encriptado</span>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Número de Tarjeta</label>
          <div className={styles.inputWrapper}>
            <CreditCard size={18} className={styles.inputIcon} />
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className={styles.input}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Nombre del Titular</label>
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
            placeholder="JUAN PEREZ"
            className={styles.input}
            disabled={isLoading}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Vencimiento</label>
            <input
              type="text"
              value={expirationDate}
              onChange={(e) => setExpirationDate(formatExpirationDate(e.target.value))}
              placeholder="MM/AA"
              maxLength={5}
              className={styles.input}
              disabled={isLoading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>CVV</label>
            <input
              type="text"
              value={securityCode}
              onChange={(e) => setSecurityCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="123"
              maxLength={4}
              className={styles.input}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>DNI</label>
          <input
            type="text"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="12345678"
            maxLength={8}
            className={styles.input}
            disabled={isLoading}
          />
        </div>

        <button type="submit" disabled={isLoading} className={styles.submitBtn}>
          {isLoading ? (
            <>
              <div className={styles.spinner} />
              Procesando...
            </>
          ) : (
            <>
              <CreditCard size={18} />
              Confirmar Suscripción
            </>
          )}
        </button>
      </form>
    </>
  )
}
