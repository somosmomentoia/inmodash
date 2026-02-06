'use client'

import { Star, Quote } from 'lucide-react'
import styles from './landing.module.css'

const testimonials = [
  { name: 'María González', role: 'Directora de Inmobiliaria Premium', company: 'Premium Properties', image: '👩‍💼', content: 'Desde que implementamos esta plataforma, nuestras ventas aumentaron un 45%. El chatbot con IA es increíble, atiende clientes mientras dormimos.', rating: 5 },
  { name: 'Carlos Rodríguez', role: 'Agente Inmobiliario', company: 'Rodríguez & Asociados', image: '👨‍💼', content: 'La automatización de pagos me ahorra 10 horas semanales. Ahora puedo enfocarme en cerrar más negocios en lugar de perseguir pagos.', rating: 5 },
  { name: 'Ana Martínez', role: 'CEO', company: 'Martínez Propiedades', image: '👩‍💻', content: 'El sistema de firma digital revolucionó nuestro proceso. Cerramos contratos en minutos en lugar de días. Totalmente recomendado.', rating: 5 },
  { name: 'Jorge López', role: 'Gerente de Ventas', company: 'López Inmobiliaria', image: '👨‍💻', content: 'Los analytics nos permiten tomar decisiones basadas en datos reales. Identificamos qué propiedades vender y a qué precio en tiempo real.', rating: 5 },
  { name: 'Laura Fernández', role: 'Propietaria', company: 'Fernández Real Estate', image: '👩', content: 'Como propietaria de una pequeña inmobiliaria, esta plataforma me dio herramientas de empresa grande a precio accesible. Excelente inversión.', rating: 5 },
  { name: 'Roberto Silva', role: 'Director Comercial', company: 'Silva Properties Group', image: '👨', content: 'El tour virtual 360° nos diferencia de la competencia. Los clientes pueden ver propiedades desde cualquier parte del mundo.', rating: 5 },
]

export const Testimonials = () => {
  return (
    <section id="testimonials" className={styles.testimonials}>
      <div className={styles.testimonialsContainer}>
        <div className={styles.testimonialsHeader}>
          <div className={styles.testimonialsBadge}>
            <Star style={{ width: 16, height: 16, fill: 'currentColor' }} />
            <span>Testimonios</span>
          </div>
          <h2 className={styles.testimonialsTitle}>Lo que dicen nuestros clientes</h2>
          <p className={styles.testimonialsSubtitle}>
            Más de 500 profesionales inmobiliarios confían en nuestra plataforma
          </p>
        </div>

        <div className={styles.testimonialsGrid}>
          {testimonials.map((testimonial, index) => (
            <div key={index} className={styles.testimonialCard}>
              <div className={styles.testimonialHeader}>
                <div className={styles.testimonialAvatar}>{testimonial.image}</div>
                <div className={styles.testimonialInfo}>
                  <h3>{testimonial.name}</h3>
                  <p>{testimonial.role}</p>
                  <span>{testimonial.company}</span>
                </div>
              </div>

              <div className={styles.testimonialStars}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className={styles.starIcon} style={{ width: 20, height: 20, fill: 'currentColor' }} />
                ))}
              </div>

              <div className={styles.testimonialContent}>
                <Quote className={styles.quoteIcon} style={{ width: 32, height: 32 }} />
                <p className={styles.testimonialText}>&ldquo;{testimonial.content}&rdquo;</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.statsSection}>
          {[
            { value: '500+', label: 'Clientes Activos' },
            { value: '98%', label: 'Satisfacción' },
            { value: '10K+', label: 'Propiedades Gestionadas' },
            { value: '24/7', label: 'Soporte Disponible' },
          ].map((stat, index) => (
            <div key={index} className={styles.statItem}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
