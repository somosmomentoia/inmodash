'use client'

import { useState } from 'react'
import {
  Plug,
  MessageCircle,
  CreditCard,
  Bot,
  Zap,
  CheckCircle,
  XCircle,
  Settings,
  ExternalLink,
  ArrowRight,
  Shield,
  Clock,
  Users,
  TrendingUp,
  Bell,
  Mail,
  Calendar,
  FileText,
  Database,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardContent,
  Badge,
  Modal,
  ModalFooter,
  Input,
} from '@/components/ui'
import styles from './integrations.module.css'

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'communication' | 'payments' | 'ai' | 'productivity'
  status: 'connected' | 'available' | 'coming_soon'
  features: string[]
  color: string
  popular?: boolean
}

const integrations: Integration[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business API',
    description: 'Envía notificaciones automáticas, recordatorios de pago y comunícate con inquilinos directamente desde WhatsApp.',
    icon: <MessageCircle size={32} />,
    category: 'communication',
    status: 'available',
    features: [
      'Notificaciones automáticas de vencimientos',
      'Recordatorios de pago personalizados',
      'Respuestas automáticas 24/7',
      'Historial de conversaciones',
    ],
    color: '#25D366',
    popular: true,
  },
  {
    id: 'neuralbot',
    name: 'NeuralBot AI',
    description: 'Asistente de IA conversacional que responde consultas de inquilinos, agenda visitas y gestiona solicitudes automáticamente.',
    icon: <Bot size={32} />,
    category: 'ai',
    status: 'available',
    features: [
      'Atención al cliente 24/7 con IA',
      'Respuestas inteligentes a consultas',
      'Agendamiento automático de visitas',
      'Integración con WhatsApp y web',
    ],
    color: '#8B5CF6',
    popular: true,
  },
  {
    id: 'mercadopago',
    name: 'MercadoPago',
    description: 'Recibe pagos de alquiler online, genera links de pago y automatiza la conciliación de cobros.',
    icon: <CreditCard size={32} />,
    category: 'payments',
    status: 'connected',
    features: [
      'Links de pago personalizados',
      'Cobro automático recurrente',
      'Múltiples medios de pago',
      'Conciliación automática',
    ],
    color: '#009EE3',
    popular: true,
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sincroniza visitas, vencimientos y eventos importantes con tu calendario de Google.',
    icon: <Calendar size={32} />,
    category: 'productivity',
    status: 'available',
    features: [
      'Sincronización bidireccional',
      'Recordatorios automáticos',
      'Eventos de vencimientos',
      'Agenda de visitas',
    ],
    color: '#4285F4',
  },
  {
    id: 'email-smtp',
    name: 'Email SMTP',
    description: 'Configura tu servidor de correo para enviar notificaciones y comunicaciones personalizadas.',
    icon: <Mail size={32} />,
    category: 'communication',
    status: 'available',
    features: [
      'Emails personalizados',
      'Plantillas profesionales',
      'Tracking de apertura',
      'Envío masivo',
    ],
    color: '#EA4335',
  },
  {
    id: 'afip',
    name: 'AFIP Facturación',
    description: 'Genera facturas electrónicas automáticamente y mantén tu facturación al día con AFIP.',
    icon: <FileText size={32} />,
    category: 'productivity',
    status: 'coming_soon',
    features: [
      'Factura electrónica automática',
      'Sincronización con AFIP',
      'Reportes fiscales',
      'Libro IVA digital',
    ],
    color: '#1E3A5F',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Conecta Inmodash con más de 5000 aplicaciones y automatiza flujos de trabajo complejos.',
    icon: <Zap size={32} />,
    category: 'productivity',
    status: 'coming_soon',
    features: [
      'Más de 5000 integraciones',
      'Automatizaciones personalizadas',
      'Triggers y acciones',
      'Sin código necesario',
    ],
    color: '#FF4A00',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Recibe notificaciones importantes en tu canal de Slack y mantén a tu equipo informado.',
    icon: <Bell size={32} />,
    category: 'communication',
    status: 'coming_soon',
    features: [
      'Notificaciones en tiempo real',
      'Canales personalizados',
      'Alertas de pagos',
      'Resúmenes diarios',
    ],
    color: '#4A154B',
  },
]

const categories = [
  { id: 'all', label: 'Todas', icon: <Plug size={16} /> },
  { id: 'communication', label: 'Comunicación', icon: <MessageCircle size={16} /> },
  { id: 'payments', label: 'Pagos', icon: <CreditCard size={16} /> },
  { id: 'ai', label: 'Inteligencia Artificial', icon: <Bot size={16} /> },
  { id: 'productivity', label: 'Productividad', icon: <TrendingUp size={16} /> },
]

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)

  const filteredIntegrations = integrations.filter(
    (i) => selectedCategory === 'all' || i.category === selectedCategory
  )

  const connectedCount = integrations.filter((i) => i.status === 'connected').length
  const availableCount = integrations.filter((i) => i.status === 'available').length

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <Badge variant="success">Conectado</Badge>
      case 'available':
        return <Badge variant="default">Disponible</Badge>
      case 'coming_soon':
        return <Badge variant="warning">Próximamente</Badge>
    }
  }

  const handleConfigure = (integration: Integration) => {
    setSelectedIntegration(integration)
    setShowConfigModal(true)
  }

  return (
    <DashboardLayout title="Integraciones" subtitle="Conecta tus herramientas favoritas">
      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
            <CheckCircle size={24} style={{ color: '#22C55E' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{connectedCount}</span>
            <span className={styles.statLabel}>Conectadas</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <Plug size={24} style={{ color: '#3B82F6' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{availableCount}</span>
            <span className={styles.statLabel}>Disponibles</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
            <Zap size={24} style={{ color: '#8B5CF6' }} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{integrations.length}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className={styles.categoryFilter}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`${styles.categoryButton} ${selectedCategory === cat.id ? styles.active : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className={styles.integrationsGrid}>
        {filteredIntegrations.map((integration) => (
          <div
            key={integration.id}
            className={`${styles.integrationCard} ${integration.status === 'connected' ? styles.connected : ''}`}
          >
            {integration.popular && (
              <div className={styles.popularBadge}>
                <Zap size={12} />
                Popular
              </div>
            )}
            
            <div className={styles.cardHeader}>
              <div
                className={styles.integrationIcon}
                style={{ backgroundColor: `${integration.color}15`, color: integration.color }}
              >
                {integration.icon}
              </div>
              {getStatusBadge(integration.status)}
            </div>

            <h3 className={styles.integrationName}>{integration.name}</h3>
            <p className={styles.integrationDescription}>{integration.description}</p>

            <div className={styles.featuresList}>
              {integration.features.slice(0, 3).map((feature, idx) => (
                <div key={idx} className={styles.featureItem}>
                  <CheckCircle size={14} />
                  <span>{feature}</span>
                </div>
              ))}
              {integration.features.length > 3 && (
                <span className={styles.moreFeatures}>
                  +{integration.features.length - 3} más
                </span>
              )}
            </div>

            <div className={styles.cardActions}>
              {integration.status === 'connected' ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Settings size={14} />}
                    onClick={() => handleConfigure(integration)}
                  >
                    Configurar
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ExternalLink size={14} />
                  </Button>
                </>
              ) : integration.status === 'available' ? (
                <Button
                  size="sm"
                  leftIcon={<Plug size={14} />}
                  onClick={() => handleConfigure(integration)}
                >
                  Conectar
                </Button>
              ) : (
                <Button variant="secondary" size="sm" disabled>
                  <Clock size={14} />
                  <span>Próximamente</span>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Configuration Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => {
          setShowConfigModal(false)
          setSelectedIntegration(null)
        }}
        title={`Configurar ${selectedIntegration?.name}`}
        size="md"
      >
        {selectedIntegration && (
          <div className={styles.configModal}>
            <div className={styles.configHeader}>
              <div
                className={styles.configIcon}
                style={{
                  backgroundColor: `${selectedIntegration.color}15`,
                  color: selectedIntegration.color,
                }}
              >
                {selectedIntegration.icon}
              </div>
              <div>
                <h4>{selectedIntegration.name}</h4>
                <p>{selectedIntegration.description}</p>
              </div>
            </div>

            <div className={styles.configFeatures}>
              <h5>Características incluidas:</h5>
              <ul>
                {selectedIntegration.features.map((feature, idx) => (
                  <li key={idx}>
                    <CheckCircle size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {selectedIntegration.status === 'available' && (
              <div className={styles.configForm}>
                <h5>Configuración:</h5>
                {selectedIntegration.id === 'whatsapp' && (
                  <>
                    <Input
                      label="Número de WhatsApp Business"
                      placeholder="+54 9 11 1234-5678"
                    />
                    <Input
                      label="Token de API"
                      placeholder="Tu token de WhatsApp Business API"
                      type="password"
                    />
                  </>
                )}
                {selectedIntegration.id === 'neuralbot' && (
                  <>
                    <Input
                      label="API Key de NeuralBot"
                      placeholder="Tu API key de NeuralBot"
                      type="password"
                    />
                    <Input
                      label="Nombre del asistente"
                      placeholder="Ej: Asistente Inmobiliaria"
                    />
                  </>
                )}
                {selectedIntegration.id === 'google-calendar' && (
                  <p className={styles.oauthNote}>
                    Serás redirigido a Google para autorizar la conexión.
                  </p>
                )}
                {selectedIntegration.id === 'email-smtp' && (
                  <>
                    <Input label="Servidor SMTP" placeholder="smtp.gmail.com" />
                    <Input label="Puerto" placeholder="587" />
                    <Input label="Usuario" placeholder="tu@email.com" />
                    <Input
                      label="Contraseña"
                      placeholder="Tu contraseña"
                      type="password"
                    />
                  </>
                )}
              </div>
            )}

            {selectedIntegration.status === 'connected' && (
              <div className={styles.connectedInfo}>
                <div className={styles.connectedStatus}>
                  <CheckCircle size={20} />
                  <span>Integración activa y funcionando</span>
                </div>
                <p>Última sincronización: hace 5 minutos</p>
              </div>
            )}
          </div>
        )}
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowConfigModal(false)
              setSelectedIntegration(null)
            }}
          >
            Cancelar
          </Button>
          {selectedIntegration?.status === 'connected' ? (
            <Button variant="danger">Desconectar</Button>
          ) : (
            <Button>Conectar</Button>
          )}
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  )
}
