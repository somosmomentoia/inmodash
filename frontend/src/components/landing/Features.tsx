'use client'

import {
  Bot,
  Calendar,
  BarChart3,
  FileSignature,
  CreditCard,
  Globe,
  Smartphone,
  Shield,
  Zap,
  MessageSquare,
  Users,
  TrendingUp,
} from 'lucide-react'
import styles from './landing.module.css'

const features = [
  { icon: Bot, title: 'Chatbot con IA', description: 'Atiende a tus clientes 24/7 con respuestas inteligentes y personalizadas', colorClass: 'featureIconPurple', iconColor: '#8b5cf6' },
  { icon: CreditCard, title: 'Gestión de Pagos', description: 'Notificaciones automáticas, recordatorios y seguimiento de cobranzas', colorClass: 'featureIconGreen', iconColor: '#10b981' },
  { icon: BarChart3, title: 'Analytics Avanzado', description: 'Métricas en tiempo real y reportes detallados para tomar mejores decisiones', colorClass: 'featureIconBlue', iconColor: '#3b82f6' },
  { icon: FileSignature, title: 'Firma Digital', description: 'Firma contratos de forma electrónica con validez legal completa', colorClass: 'featureIconAmber', iconColor: '#f59e0b' },
  { icon: Calendar, title: 'Reservas Online', description: 'Agenda visitas automáticamente con sincronización de calendarios', colorClass: 'featureIconRed', iconColor: '#ef4444' },
  { icon: Globe, title: 'Tour Virtual 360°', description: 'Recorridos inmersivos de propiedades desde cualquier dispositivo', colorClass: 'featureIconIndigo', iconColor: '#6366f1' },
  { icon: Smartphone, title: 'App Móvil', description: 'Gestiona tu negocio desde iOS y Android con todas las funcionalidades', colorClass: 'featureIconPink', iconColor: '#ec4899' },
  { icon: Shield, title: 'Seguridad Total', description: 'Encriptación, backups automáticos y cumplimiento de normativas', colorClass: 'featureIconGray', iconColor: '#64748b' },
  { icon: MessageSquare, title: 'CRM Integrado', description: 'Gestiona clientes, leads y seguimientos en un solo lugar', colorClass: 'featureIconTeal', iconColor: '#14b8a6' },
  { icon: Users, title: 'Multi-usuario', description: 'Colabora con tu equipo con roles y permisos personalizados', colorClass: 'featureIconViolet', iconColor: '#7c3aed' },
  { icon: TrendingUp, title: 'Análisis de Mercado', description: 'Predicciones de precios y tendencias con inteligencia artificial', colorClass: 'featureIconLime', iconColor: '#84cc16' },
  { icon: Zap, title: 'Automatización', description: 'Workflows automáticos que ahorran tiempo y reducen errores', colorClass: 'featureIconYellow', iconColor: '#eab308' },
]

export const Features = () => {
  return (
    <section id="features" className={styles.features}>
      <div className={styles.featuresContainer}>
        <div className={styles.featuresHeader}>
          <div className={styles.featuresBadge}>
            <Zap style={{ width: 16, height: 16 }} />
            <span>Características Premium</span>
          </div>
          <h2 className={styles.featuresTitle}>Todo lo que necesitas en un solo lugar</h2>
          <p className={styles.featuresSubtitle}>
            Herramientas profesionales diseñadas para maximizar tu productividad y ventas
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles[feature.colorClass]}`}>
                <feature.icon style={{ width: 28, height: 28, color: feature.iconColor }} />
              </div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
