'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Settings,
  Bell,
  MessageSquare,
  Save,
  LayoutDashboard,
  Percent,
  GripVertical,
  Eye,
  EyeOff,
  Building2,
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  AlertCircle,
  PiggyBank,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  Select,
  Tabs,
  Checkbox,
  Badge,
} from '@/components/ui'
import { usePreferences, NotificationPreferences } from '@/hooks/usePreferences'
import styles from './settings.module.css'

const defaultNotificationPrefs: NotificationPreferences = {
  contractExpiring: true,
  paymentOverdue: true,
  taskDue: true,
  whatsappMessage: true,
  weeklySummary: false,
}

interface DashboardWidget {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  enabled: boolean
  order: number
}

const defaultWidgets: DashboardWidget[] = [
  { id: 'properties', name: 'Propiedades', description: 'Total de propiedades y ocupación', icon: <Building2 size={18} />, enabled: true, order: 1 },
  { id: 'income', name: 'Ingresos del Mes', description: 'Resumen de ingresos mensuales', icon: <DollarSign size={18} />, enabled: true, order: 2 },
  { id: 'pending', name: 'Pagos Pendientes', description: 'Obligaciones por cobrar', icon: <AlertCircle size={18} />, enabled: true, order: 3 },
  { id: 'contracts', name: 'Contratos Activos', description: 'Contratos vigentes', icon: <FileText size={18} />, enabled: true, order: 4 },
  { id: 'clients', name: 'Clientes', description: 'Total de inquilinos y propietarios', icon: <Users size={18} />, enabled: true, order: 5 },
  { id: 'expiring', name: 'Próximos Vencimientos', description: 'Contratos por vencer', icon: <Calendar size={18} />, enabled: true, order: 6 },
  { id: 'commissions', name: 'Comisiones', description: 'Comisiones del período', icon: <PiggyBank size={18} />, enabled: false, order: 7 },
  { id: 'trends', name: 'Tendencias', description: 'Gráfico de evolución', icon: <TrendingUp size={18} />, enabled: false, order: 8 },
]

type TabType = 'general' | 'dashboard' | 'commissions' | 'notifications' | 'whatsapp'

function SettingsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab') as TabType | null
  const validTabs = ['general', 'dashboard', 'commissions', 'notifications', 'whatsapp']
  const [activeTab, setActiveTab] = useState<TabType>(tabParam && validTabs.includes(tabParam) ? tabParam : 'general')

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabType)
    if (tab === 'general') {
      router.replace('/settings', { scroll: false })
    } else {
      router.replace(`/settings?tab=${tab}`, { scroll: false })
    }
  }, [router])
  const [saving, setSaving] = useState(false)
  const [widgets, setWidgets] = useState<DashboardWidget[]>(defaultWidgets)
  const [defaultCommission, setDefaultCommission] = useState('10')
  const [lateInterestRate, setLateInterestRate] = useState('2')
  const [gracePeriodDays, setGracePeriodDays] = useState('5')
  
  // Notification preferences
  const { preferences, setNotificationPreferences, loading: prefsLoading } = usePreferences()
  const notifPrefs = preferences.notifications || defaultNotificationPrefs

  const handleNotificationChange = async (key: keyof NotificationPreferences, value: boolean) => {
    await setNotificationPreferences({ [key]: value })
  }

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings size={16} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'commissions', label: 'Comisiones', icon: <Percent size={16} /> },
    { id: 'notifications', label: 'Notificaciones', icon: <Bell size={16} /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={16} /> },
  ]

  const toggleWidget = (widgetId: string) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    ))
  }

  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    const index = widgets.findIndex(w => w.id === widgetId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === widgets.length - 1) return

    const newWidgets = [...widgets]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newWidgets[index].order
    newWidgets[index].order = newWidgets[swapIndex].order
    newWidgets[swapIndex].order = temp
    ;[newWidgets[index], newWidgets[swapIndex]] = [newWidgets[swapIndex], newWidgets[index]]
    setWidgets(newWidgets)
  }

  const handleSave = async () => {
    setSaving(true)
    // TODO: Save settings
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
  }

  return (
    <div className={styles.pageContainer}>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} variant="underline" />

      <div className={styles.content}>
        {activeTab === 'general' && (
          <>
            <Card>
              <CardHeader title="Información de la Empresa" />
              <CardContent>
                <div className={styles.formGrid}>
                  <Input
                    label="Nombre de la Empresa"
                    placeholder="Mi Inmobiliaria"
                    fullWidth
                  />
                  <Input
                    label="CUIT"
                    placeholder="30-12345678-9"
                    fullWidth
                  />
                  <Input
                    label="Teléfono"
                    placeholder="+54 11 1234-5678"
                    fullWidth
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="contacto@miinmobiliaria.com"
                    fullWidth
                  />
                </div>
                <Input
                  label="Dirección"
                  placeholder="Av. Corrientes 1234, CABA"
                  fullWidth
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Preferencias" />
              <CardContent>
                <div className={styles.formGrid}>
                  <Select
                    label="Moneda"
                    options={[
                      { value: 'ARS', label: 'Peso Argentino (ARS)' },
                      { value: 'USD', label: 'Dólar (USD)' },
                    ]}
                    fullWidth
                  />
                  <Select
                    label="Formato de Fecha"
                    options={[
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                    ]}
                    fullWidth
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'dashboard' && (
          <Card>
            <CardHeader
              title="Widgets del Dashboard"
              subtitle="Personaliza qué información ver en tu panel principal"
            />
            <CardContent>
              <div className={styles.widgetList}>
                {widgets.map((widget, index) => (
                  <div key={widget.id} className={`${styles.widgetItem} ${!widget.enabled ? styles.widgetDisabled : ''}`}>
                    <div className={styles.widgetDrag}>
                      <GripVertical size={16} />
                    </div>
                    <div className={styles.widgetIcon}>{widget.icon}</div>
                    <div className={styles.widgetInfo}>
                      <span className={styles.widgetName}>{widget.name}</span>
                      <span className={styles.widgetDesc}>{widget.description}</span>
                    </div>
                    <div className={styles.widgetActions}>
                      <button
                        className={styles.widgetOrderBtn}
                        onClick={() => moveWidget(widget.id, 'up')}
                        disabled={index === 0}
                        title="Mover arriba"
                      >
                        ↑
                      </button>
                      <button
                        className={styles.widgetOrderBtn}
                        onClick={() => moveWidget(widget.id, 'down')}
                        disabled={index === widgets.length - 1}
                        title="Mover abajo"
                      >
                        ↓
                      </button>
                      <button
                        className={`${styles.widgetToggle} ${widget.enabled ? styles.widgetToggleActive : ''}`}
                        onClick={() => toggleWidget(widget.id)}
                        title={widget.enabled ? 'Ocultar widget' : 'Mostrar widget'}
                      >
                        {widget.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className={styles.widgetHint}>
                Arrastra los widgets para reordenarlos o usa las flechas. Los widgets desactivados no aparecerán en el dashboard.
              </p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'commissions' && (
          <>
            <Card>
              <CardHeader
                title="Comisiones por Defecto"
                subtitle="Configura los valores predeterminados para nuevos contratos"
              />
              <CardContent>
                <div className={styles.formGrid}>
                  <div className={styles.inputWithSuffix}>
                    <Input
                      label="Comisión por Alquiler"
                      value={defaultCommission}
                      onChange={(e) => setDefaultCommission(e.target.value)}
                      type="number"
                      min="0"
                      max="100"
                      fullWidth
                    />
                    <span className={styles.inputSuffix}>%</span>
                  </div>
                  <div className={styles.inputWithSuffix}>
                    <Input
                      label="Interés por Mora"
                      value={lateInterestRate}
                      onChange={(e) => setLateInterestRate(e.target.value)}
                      type="number"
                      min="0"
                      max="100"
                      fullWidth
                    />
                    <span className={styles.inputSuffix}>% mensual</span>
                  </div>
                </div>
                <div className={styles.inputWithSuffix}>
                  <Input
                    label="Días de Gracia"
                    value={gracePeriodDays}
                    onChange={(e) => setGracePeriodDays(e.target.value)}
                    type="number"
                    min="0"
                    max="30"
                    fullWidth
                  />
                  <span className={styles.inputSuffix}>días</span>
                </div>
                <p className={styles.formHint}>
                  Estos valores se aplicarán automáticamente a nuevos contratos. Podés modificarlos individualmente en cada contrato.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Tipos de Comisión"
                subtitle="Define cómo se calculan las comisiones según el tipo de operación"
              />
              <CardContent>
                <div className={styles.commissionTypes}>
                  <div className={styles.commissionType}>
                    <div className={styles.commissionTypeHeader}>
                      <span className={styles.commissionTypeName}>Alquiler Mensual</span>
                      <Badge variant="success">Activo</Badge>
                    </div>
                    <p className={styles.commissionTypeDesc}>
                      Se cobra el {defaultCommission}% del monto del alquiler cada mes
                    </p>
                  </div>
                  <div className={styles.commissionType}>
                    <div className={styles.commissionTypeHeader}>
                      <span className={styles.commissionTypeName}>Comisión por Contrato Nuevo</span>
                      <Badge variant="default">Opcional</Badge>
                    </div>
                    <p className={styles.commissionTypeDesc}>
                      Comisión única al firmar un nuevo contrato (configurable por contrato)
                    </p>
                  </div>
                  <div className={styles.commissionType}>
                    <div className={styles.commissionTypeHeader}>
                      <span className={styles.commissionTypeName}>Comisión por Renovación</span>
                      <Badge variant="default">Opcional</Badge>
                    </div>
                    <p className={styles.commissionTypeDesc}>
                      Comisión al renovar un contrato existente
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'notifications' && (
          <Card>
            <CardHeader
              title="Preferencias de Notificaciones"
              subtitle="Configura qué notificaciones querés recibir"
            />
            <CardContent>
              <div className={styles.notificationList}>
                <div className={styles.notificationItem}>
                  <div>
                    <span className={styles.notificationTitle}>Contratos por vencer</span>
                    <span className={styles.notificationDesc}>
                      Recibir alertas cuando un contrato esté próximo a vencer
                    </span>
                  </div>
                  <Checkbox 
                    checked={notifPrefs.contractExpiring}
                    onChange={(e) => handleNotificationChange('contractExpiring', e.target.checked)}
                    disabled={prefsLoading}
                  />
                </div>
                <div className={styles.notificationItem}>
                  <div>
                    <span className={styles.notificationTitle}>Pagos vencidos</span>
                    <span className={styles.notificationDesc}>
                      Notificar cuando haya pagos pendientes vencidos
                    </span>
                  </div>
                  <Checkbox 
                    checked={notifPrefs.paymentOverdue}
                    onChange={(e) => handleNotificationChange('paymentOverdue', e.target.checked)}
                    disabled={prefsLoading}
                  />
                </div>
                <div className={styles.notificationItem}>
                  <div>
                    <span className={styles.notificationTitle}>Tareas próximas a vencer</span>
                    <span className={styles.notificationDesc}>
                      Alertas cuando una tarea esté por vencer
                    </span>
                  </div>
                  <Checkbox 
                    checked={notifPrefs.taskDue}
                    onChange={(e) => handleNotificationChange('taskDue', e.target.checked)}
                    disabled={prefsLoading}
                  />
                </div>
                <div className={styles.notificationItem}>
                  <div>
                    <span className={styles.notificationTitle}>Mensajes de WhatsApp</span>
                    <span className={styles.notificationDesc}>
                      Alertas de nuevos mensajes de WhatsApp
                    </span>
                  </div>
                  <Checkbox 
                    checked={notifPrefs.whatsappMessage}
                    onChange={(e) => handleNotificationChange('whatsappMessage', e.target.checked)}
                    disabled={prefsLoading}
                  />
                </div>
                <div className={styles.notificationItem}>
                  <div>
                    <span className={styles.notificationTitle}>Resumen semanal</span>
                    <span className={styles.notificationDesc}>
                      Recibir un resumen semanal por email (próximamente)
                    </span>
                  </div>
                  <Checkbox 
                    checked={notifPrefs.weeklySummary}
                    onChange={(e) => handleNotificationChange('weeklySummary', e.target.checked)}
                    disabled={prefsLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'whatsapp' && (
          <Card>
            <CardHeader
              title="Configuración de WhatsApp"
              subtitle="Conecta tu cuenta de WhatsApp Business"
            />
            <CardContent>
              <div className={styles.whatsappStatus}>
                <div className={styles.statusIndicator}>
                  <div className={styles.statusDot} />
                  <span>Desconectado</span>
                </div>
                <Button>Conectar WhatsApp</Button>
              </div>

              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}>Respuestas Automáticas</h4>
                <div className={styles.formGrid}>
                  <Input
                    label="Mensaje de Bienvenida"
                    placeholder="¡Hola! Gracias por contactarnos..."
                    fullWidth
                  />
                  <Input
                    label="Mensaje Fuera de Horario"
                    placeholder="Estamos fuera de horario..."
                    fullWidth
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className={styles.actions}>
          <Button
            onClick={handleSave}
            loading={saving}
            leftIcon={<Save size={16} />}
          >
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <DashboardLayout title="Configuración" subtitle="Ajustes del sistema">
      <Suspense fallback={<div>Cargando...</div>}>
        <SettingsPageContent />
      </Suspense>
    </DashboardLayout>
  )
}
