'use client'

import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import styles from './landing.module.css'

export const CTA = () => {
  return (
    <section className={styles.cta}>
      <div className={styles.ctaBackground} />
      <div className={styles.ctaBlob1} />
      <div className={styles.ctaBlob2} />

      <div className={styles.ctaContainer}>
        <div className={styles.ctaContent}>
          <div className={styles.ctaBadge}>
            <Sparkles style={{ width: 16, height: 16 }} />
            <span>Oferta de Lanzamiento</span>
          </div>

          <h2 className={styles.ctaTitle}>Transforma tu negocio inmobiliario hoy</h2>
          <p className={styles.ctaSubtitle}>
            Únete a cientos de profesionales que ya están creciendo con nuestra plataforma
          </p>

          <div className={styles.ctaBenefits}>
            {['Prueba gratis 14 días', 'Sin tarjeta de crédito', 'Cancela cuando quieras', 'Soporte en español'].map((benefit, index) => (
              <div key={index} className={styles.ctaBenefit}>
                <CheckCircle className={styles.benefitIcon} style={{ width: 20, height: 20 }} />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className={styles.ctaButtons}>
            <Link href="/register">
              <button className={styles.ctaBtnPrimary}>
                Comenzar Gratis
                <ArrowRight style={{ width: 24, height: 24 }} />
              </button>
            </Link>
            <Link href="/contact">
              <button className={styles.ctaBtnSecondary}>Hablar con Ventas</button>
            </Link>
          </div>

          <div className={styles.ctaTrust}>
            {['Datos encriptados', 'Cumplimiento GDPR', 'Uptime 99.9%', 'Backups diarios'].map((item, index) => (
              <div key={index} className={styles.ctaTrustItem}>
                <CheckCircle style={{ width: 20, height: 20 }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
