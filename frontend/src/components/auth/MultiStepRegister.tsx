'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, User, FileText, CreditCard, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { RepresentativeStep } from './steps/RepresentativeStep'
import { CompanyStep } from './steps/CompanyStep'
import { SummaryStep } from './steps/SummaryStep'
import { PaymentStep } from './steps/PaymentStep'
import styles from './register.module.css'

export interface RegistrationData {
  name: string
  email: string
  password: string
  phone: string
  position: string
  companyName: string
  companyTaxId: string
  companyAddress: string
  companyCity: string
  companyState: string
  companyCountry: string
  companyZipCode: string
  companyPhone: string
  companyWebsite: string
  paymentMethod?: string
}

const steps = [
  { id: 1, title: 'Representante', description: 'Datos personales', headerTitle: 'Datos del Representante', headerDescription: 'Información personal del responsable', icon: User },
  { id: 2, title: 'Empresa', description: 'Tu empresa', headerTitle: 'Datos de la Empresa', headerDescription: 'Información de tu empresa inmobiliaria', icon: Building2 },
  { id: 3, title: 'Resumen', description: 'Confirmación', headerTitle: 'Resumen de tu Registro', headerDescription: 'Verifica que toda la información sea correcta', icon: FileText },
  { id: 4, title: 'Pago', description: 'Suscripción', headerTitle: 'Método de Pago', headerDescription: 'Configura tu método de pago para continuar', icon: CreditCard },
]

export function MultiStepRegister() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<RegistrationData>>({})
  const [formSubmitTrigger, setFormSubmitTrigger] = useState(0)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const updateFormData = (data: Partial<RegistrationData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const triggerFormSubmit = () => {
    setFormSubmitTrigger(prev => prev + 1)
  }

  const handleRegisterUser = async () => {
    setIsLoading(true)
    try {
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error('Faltan datos requeridos')
      }

      const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://inmodash-back-production.up.railway.app'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      const data = await result.json()
      
      if (data.success && data.accessToken) {
        setAccessToken(data.accessToken)
        nextStep()
      } else {
        throw new Error(data.error || 'Error al registrar usuario')
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert(error instanceof Error ? error.message : 'Error al registrar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://inmodash-back-production.up.railway.app'}/api/auth/me`, {
        credentials: 'include'
      })

      if (response.ok) {
        alert('¡Registro exitoso! Bienvenido a InmoDash')
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      } else {
        alert('Error: No se pudo completar el registro. Por favor, intenta iniciar sesión.')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
      }
    } catch (error) {
      console.error('Error verifying authentication:', error)
      alert('Error al verificar la autenticación. Por favor, intenta iniciar sesión.')
      setTimeout(() => {
        window.location.href = '/login'
      }, 1000)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <RepresentativeStep data={formData} updateData={updateFormData} onNext={nextStep} submitTrigger={formSubmitTrigger} />
      case 2:
        return <CompanyStep data={formData} updateData={updateFormData} onNext={nextStep} onBack={prevStep} submitTrigger={formSubmitTrigger} />
      case 3:
        return <SummaryStep data={formData as RegistrationData} onNext={handleRegisterUser} onBack={prevStep} isLoading={isLoading} />
      case 4:
        return <PaymentStep data={formData} updateData={updateFormData} onSubmit={handleSubmit} onBack={prevStep} isLoading={isLoading} accessToken={accessToken || undefined} />
      default:
        return null
    }
  }

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Building2 size={24} />
          </div>
          <div className={styles.logoText}>
            <h1>InmoDash</h1>
            <span className={styles.logoBadge}>Premium</span>
          </div>
        </div>

        <nav className={styles.stepsNav}>
          {steps.map((step) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            
            return (
              <div
                key={step.id}
                className={`${styles.step} ${isActive ? styles.stepActive : ''} ${isCompleted ? styles.stepCompleted : ''}`}
              >
                <div className={styles.stepIcon}>
                  {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                </div>
                <div className={styles.stepContent}>
                  <p className={styles.stepTitle}>{step.title}</p>
                  <p className={styles.stepDesc}>{step.description}</p>
                </div>
              </div>
            )
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <p>¿Ya tienes una cuenta?</p>
          <Link href="/login" className={styles.loginLink}>Iniciar Sesión</Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.formContainer}>
          <div className={styles.header}>
            <h2 className={styles.headerTitle}>{steps[currentStep - 1].headerTitle}</h2>
            <p className={styles.headerDesc}>{steps[currentStep - 1].headerDescription}</p>
          </div>

          <div className={styles.formContent}>
            {renderStep()}
          </div>

          <div className={styles.footer}>
            {currentStep > 1 ? (
              <button type="button" onClick={prevStep} className={styles.btnBack}>
                <ArrowLeft size={18} />
                Atrás
              </button>
            ) : (
              <div />
            )}
            
            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1 || currentStep === 2) {
                    triggerFormSubmit()
                  } else if (currentStep === 3) {
                    handleRegisterUser()
                  } else {
                    nextStep()
                  }
                }}
                disabled={isLoading}
                className={styles.btnNext}
              >
                {isLoading ? 'Procesando...' : 'Siguiente'}
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className={`${styles.btnNext} ${styles.btnComplete}`}
              >
                {isLoading ? 'Registrando...' : 'Completar Registro'}
                <CheckCircle2 size={18} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
