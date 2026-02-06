'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2, Check, X, Sparkles, ArrowRight, Crown, Zap, Shield,
  FileText, ClipboardList, Receipt, Users, TrendingUp, BarChart3,
  Calculator, UserCheck, Settings, Phone, Target, PieChart
} from 'lucide-react'
import styles from './pricing.module.css'

const plans = [
  {
    id: 'base',
    name: 'Base',
    price: 250,
    description: 'Ideal para inmobiliarias pequeñas que están comenzando',
    icon: Zap,
    color: '#3b82f6',
    popular: false,
    features: [
      { name: 'Gestión básica de contratos', included: true, icon: FileText },
      { name: 'Gestión de tareas', included: true, icon: ClipboardList },
      { name: 'Obligaciones básicas', included: true, icon: Receipt },
      { name: 'Hasta 50 propiedades', included: true, icon: Building2 },
      { name: 'Soporte por email', included: true, icon: Phone },
      { name: 'Gestión de leads', included: false, icon: Target },
      { name: 'Liquidaciones', included: false, icon: Calculator },
      { name: 'Contabilidad', included: false, icon: PieChart },
      { name: 'Análisis de métricas', included: false, icon: BarChart3 },
      { name: 'Portal del inquilino', included: false, icon: UserCheck },
    ],
  },
  {
    id: 'pro',
    name: 'Profesional',
    price: 350,
    description: 'Para inmobiliarias en crecimiento que necesitan más control',
    icon: Crown,
    color: '#8b5cf6',
    popular: true,
    features: [
      { name: 'Todo lo del plan Base', included: true, icon: Check },
      { name: 'Gestión de leads', included: true, icon: Target },
      { name: 'Conversión de leads', included: true, icon: TrendingUp },
      { name: 'Liquidaciones automáticas', included: true, icon: Calculator },
      { name: 'Contabilidad de la empresa', included: true, icon: PieChart },
      { name: 'Hasta 200 propiedades', included: true, icon: Building2 },
      { name: 'Soporte prioritario', included: true, icon: Phone },
      { name: 'Análisis de métricas', included: false, icon: BarChart3 },
      { name: 'Gestión de vendedores', included: false, icon: Users },
      { name: 'Configuración avanzada', included: false, icon: Settings },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 500,
    description: 'Solución completa para inmobiliarias grandes y franquicias',
    icon: Shield,
    color: '#10b981',
    popular: false,
    features: [
      { name: 'Todo lo del plan Profesional', included: true, icon: Check },
      { name: 'Análisis avanzado de métricas', included: true, icon: BarChart3 },
      { name: 'Gestión de vendedores', included: true, icon: Users },
      { name: 'Portal del inquilino completo', included: true, icon: UserCheck },
      { name: 'Gestión avanzada de tareas', included: true, icon: ClipboardList },
      { name: 'Gestión de contactos', included: true, icon: Phone },
      { name: 'Configuración avanzada', included: true, icon: Settings },
      { name: 'Propiedades ilimitadas', included: true, icon: Building2 },
      { name: 'Soporte 24/7 dedicado', included: true, icon: Phone },
      { name: 'Onboarding personalizado', included: true, icon: Sparkles },
    ],
  },
]

const faqs = [
  {
    question: '¿Puedo cambiar de plan en cualquier momento?',
    answer: 'Sí, puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplicarán en tu próximo ciclo de facturación.',
  },
  {
    question: '¿Hay algún costo de configuración?',
    answer: 'No, no hay costos de configuración. Puedes comenzar a usar InmoDash inmediatamente después de registrarte.',
  },
  {
    question: '¿Ofrecen descuentos por pago anual?',
    answer: 'Sí, ofrecemos un 20% de descuento en todos los planes cuando pagas anualmente.',
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos tarjetas de crédito/débito a través de MercadoPago, transferencias bancarias y pagos en efectivo.',
  },
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  const getPrice = (basePrice: number) => {
    if (billingCycle === 'annual') {
      return Math.round(basePrice * 0.8)
    }
    return basePrice
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Building2 size={24} />
          </div>
          <span>InmoDash</span>
        </Link>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Inicio</Link>
          <Link href="/login" className={styles.navLink}>Iniciar Sesión</Link>
          <Link href="/register" className={styles.navBtn}>Comenzar Gratis</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <Sparkles size={16} />
          <span>Precios transparentes</span>
        </div>
        <h1 className={styles.heroTitle}>
          Elige el plan perfecto para tu inmobiliaria
        </h1>
        <p className={styles.heroSubtitle}>
          Sin costos ocultos. Cancela cuando quieras. Comienza con una prueba gratuita de 14 días.
        </p>

        {/* Billing Toggle */}
        <div className={styles.billingToggle}>
          <button
            className={`${styles.billingBtn} ${billingCycle === 'monthly' ? styles.billingBtnActive : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Mensual
          </button>
          <button
            className={`${styles.billingBtn} ${billingCycle === 'annual' ? styles.billingBtnActive : ''}`}
            onClick={() => setBillingCycle('annual')}
          >
            Anual
            <span className={styles.discountBadge}>-20%</span>
          </button>
        </div>
      </section>

      {/* Plans */}
      <section className={styles.plansSection}>
        <div className={styles.plansGrid}>
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.id}
                className={`${styles.planCard} ${plan.popular ? styles.planCardPopular : ''}`}
              >
                {plan.popular && (
                  <div className={styles.popularBadge}>
                    <Crown size={14} />
                    Más Popular
                  </div>
                )}

                <div className={styles.planHeader}>
                  <div className={styles.planIcon} style={{ background: `${plan.color}15`, color: plan.color }}>
                    <Icon size={24} />
                  </div>
                  <h3 className={styles.planName}>{plan.name}</h3>
                  <p className={styles.planDescription}>{plan.description}</p>
                </div>

                <div className={styles.planPricing}>
                  <div className={styles.priceWrapper}>
                    <span className={styles.currency}>USD</span>
                    <span className={styles.price}>{getPrice(plan.price)}</span>
                    <span className={styles.period}>/mes</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className={styles.annualNote}>
                      Facturado anualmente (${getPrice(plan.price) * 12}/año)
                    </p>
                  )}
                </div>

                <Link
                  href="/register"
                  className={`${styles.planCta} ${plan.popular ? styles.planCtaPopular : ''}`}
                  style={plan.popular ? { background: plan.color } : {}}
                >
                  Comenzar prueba gratis
                  <ArrowRight size={18} />
                </Link>

                <div className={styles.planFeatures}>
                  <p className={styles.featuresTitle}>Incluye:</p>
                  <ul className={styles.featuresList}>
                    {plan.features.map((feature, idx) => {
                      const FeatureIcon = feature.icon
                      return (
                        <li
                          key={idx}
                          className={`${styles.featureItem} ${!feature.included ? styles.featureItemDisabled : ''}`}
                        >
                          <span className={`${styles.featureIcon} ${feature.included ? styles.featureIconIncluded : styles.featureIconExcluded}`}>
                            {feature.included ? <Check size={14} /> : <X size={14} />}
                          </span>
                          <span>{feature.name}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Comparison Table */}
      <section className={styles.comparisonSection}>
        <h2 className={styles.sectionTitle}>Comparación detallada</h2>
        <div className={styles.comparisonTable}>
          <div className={styles.tableHeader}>
            <div className={styles.tableHeaderCell}>Característica</div>
            <div className={styles.tableHeaderCell}>Base</div>
            <div className={styles.tableHeaderCell}>Profesional</div>
            <div className={styles.tableHeaderCell}>Enterprise</div>
          </div>
          <div className={styles.tableBody}>
            <div className={styles.tableRow}>
              <div className={styles.tableCell}>Propiedades</div>
              <div className={styles.tableCell}>50</div>
              <div className={styles.tableCell}>200</div>
              <div className={styles.tableCell}>Ilimitadas</div>
            </div>
            <div className={styles.tableRow}>
              <div className={styles.tableCell}>Usuarios</div>
              <div className={styles.tableCell}>2</div>
              <div className={styles.tableCell}>5</div>
              <div className={styles.tableCell}>Ilimitados</div>
            </div>
            <div className={styles.tableRow}>
              <div className={styles.tableCell}>Contratos</div>
              <div className={styles.tableCell}><Check size={16} className={styles.checkIcon} /></div>
              <div className={styles.tableCell}><Check size={16} className={styles.checkIcon} /></div>
              <div className={styles.tableCell}><Check size={16} className={styles.checkIcon} /></div>
            </div>
            <div className={styles.tableRow}>
              <div className={styles.tableCell}>Tareas</div>
              <div className={styles.tableCell}><Check size={16} className={styles.checkIcon} /></div>
              <div className={styles.tableCell}><Check size={16} className={styles.checkIcon} /></div>
              <div className={styles.tableCell}><Check size={16} className={styles.checkIcon} /></div>
            </div>
            <div className={styles.tableRow}>
              <div className={styles.tableCell}>Obligaciones</div>
              <div className={styles.tableCell}>Básicas</div>
              <div className={styles.tableCell}>Completas</div>
              <div className={styles.tableCell}>Avanzadas</div>
            </div>
            <div className={styles.tableRow}>
              <div className={styles.tableCell}>Gestión de Leads</div>
              <div className={styles.tableCell}><X size={16} className={styles.xIcon} /></div>
              <div className={styles.tableCell}><Check size={16} className={styles.checkIcon} /></div>
              <div className={styles.tableCell}><Check size={16} className={styles.checkIcon} /></div>
            </div>
            <div className={styles.tableRow}>
              <div className={styles.tableCell}>Liquidaciones</div>
              <div className={styles.tableCell}><X size={16} className={styles.xIcon} /></div>
              <div className={styles.tableCell}><Check size={16} className={styles.checkIcon} /></div>
              <div className={styles.tableCell}><Check size={16} className={styles.checkIcon} /></div>
            </div>
            <div className={styles.tableRow}>
              <div className={styles.tableCell}>Contabilidad</div>
              <div className={styles.tableCell}><X size={16} className={styles.xIcon} /></div>
              <div className={styles.tableCell}><Check size={16} className={styles.checkIcon} /></div>
              <div className={styles.tableCell}><Check size={16} className={styles.checkIcon} /></div>
            </div>
            <div className={styles.tableRow}>
              <div className={styles.tableCell}>Análisis de Métricas</div>
              <div className={styles.tableCell}><X size={16} className={styles.xIcon} /></div>
              <div className={styles.tableCell}><X size={16} className={styles.xIcon} /></div>
              <div className={styles.tableCell}><Check size={16} className={styles.checkIcon} /></div>
            </div>
            <div className={styles.tableRow}>
              <div className={styles.tableCell}>Portal del Inquilino</div>
              <div className={styles.tableCell}><X size={16} className={styles.xIcon} /></div>
              <div className={styles.tableCell}><X size={16} className={styles.xIcon} /></div>
              <div className={styles.tableCell}><Check size={16} className={styles.checkIcon} /></div>
            </div>
            <div className={styles.tableRow}>
              <div className={styles.tableCell}>Gestión de Vendedores</div>
              <div className={styles.tableCell}><X size={16} className={styles.xIcon} /></div>
              <div className={styles.tableCell}><X size={16} className={styles.xIcon} /></div>
              <div className={styles.tableCell}><Check size={16} className={styles.checkIcon} /></div>
            </div>
            <div className={styles.tableRow}>
              <div className={styles.tableCell}>Soporte</div>
              <div className={styles.tableCell}>Email</div>
              <div className={styles.tableCell}>Prioritario</div>
              <div className={styles.tableCell}>24/7 Dedicado</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faqSection}>
        <h2 className={styles.sectionTitle}>Preguntas Frecuentes</h2>
        <div className={styles.faqGrid}>
          {faqs.map((faq, idx) => (
            <div key={idx} className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>{faq.question}</h3>
              <p className={styles.faqAnswer}>{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>¿Listo para transformar tu inmobiliaria?</h2>
          <p className={styles.ctaSubtitle}>
            Comienza tu prueba gratuita de 14 días. Sin tarjeta de crédito requerida.
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/register" className={styles.ctaPrimary}>
              Comenzar Gratis
              <ArrowRight size={18} />
            </Link>
            <Link href="/" className={styles.ctaSecondary}>
              Ver Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <Building2 size={24} />
            <span>InmoDash</span>
          </div>
          <p className={styles.footerText}>
            © 2024 InmoDash. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
