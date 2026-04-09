'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Settings,
  Bell,
  Save,
  LayoutDashboard,
  Percent,
  Building2,
  Users,
  FileText,
  Calendar,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  UserCog,
  Check,
  X,
  CreditCard,
  Home,
  Activity,
  BarChart3,
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
import { useVendors } from '@/hooks/useVendors'
import { Vendor } from '@/types'
import { UsersContent } from './users-content'
import config from '@/config/env'
import styles from './settings.module.css'

const defaultNotificationPrefs: NotificationPreferences = {
  contractExpiring: true,
  paymentOverdue: true,
  taskDue: true,
  whatsappMessage: true,
  weeklySummary: false,
}

// Dashboard widget definitions (must match dashboard page DEFAULT_WIDGETS)
interface WidgetConfig {
  id: string
  title: string
  icon: string
  enabled: boolean
}

const ALL_WIDGETS: WidgetConfig[] = [
  { id: 'quick-actions', title: 'Acciones Rápidas', icon: 'zap', enabled: true },
  { id: 'tasks', title: 'Tareas', icon: 'file-text', enabled: true },
  { id: 'overdue', title: 'Obligaciones Vencidas', icon: 'alert-triangle', enabled: true },
  { id: 'pending-rent', title: 'Alquileres Pendientes', icon: 'home', enabled: true },
  { id: 'recent-payments', title: 'Últimos Pagos', icon: 'credit-card', enabled: true },
  { id: 'cashflow', title: 'Flujo de Caja', icon: 'bar-chart', enabled: true },
  { id: 'agency-expenses', title: 'Gastos Inmobiliaria', icon: 'building', enabled: true },
  { id: 'commissions', title: 'Comisiones', icon: 'percent', enabled: true },
  { id: 'activity', title: 'Actividad Reciente', icon: 'activity', enabled: true },
  { id: 'calendar', title: 'Calendario', icon: 'calendar', enabled: true },
]

// Company settings interface
interface CompanySettings {
  companyName: string
  companyTaxId: string
  companyAddress: string
  companyCity: string
  companyState: string
  companyCountry: string
  companyZipCode: string
  companyPhone: string
  companyWebsite: string
  name: string
  email: string
  phone: string
  position: string
}

const emptyCompany: CompanySettings = {
  companyName: '', companyTaxId: '', companyAddress: '', companyCity: '',
  companyState: '', companyCountry: '', companyZipCode: '', companyPhone: '',
  companyWebsite: '', name: '', email: '', phone: '', position: '',
}

type TabType = 'general' | 'dashboard' | 'commissions' | 'vendors' | 'notifications' | 'users'

function SettingsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab') as TabType | null
  const validTabs = ['general', 'dashboard', 'commissions', 'vendors', 'notifications', 'users']
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

  // Company settings
  const [company, setCompany] = useState<CompanySettings>(emptyCompany)
  const [companySaving, setCompanySaving] = useState(false)
  const [companyLoading, setCompanyLoading] = useState(true)
  const [companySaved, setCompanySaved] = useState(false)

  // Fetch company settings
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const headers: Record<string, string> = {}
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(`${config.apiUrl}/api/auth/company`, { credentials: 'include', headers })
        if (res.ok) {
          const data = await res.json()
          if (data.company) {
            setCompany({
              companyName: data.company.companyName || '',
              companyTaxId: data.company.companyTaxId || '',
              companyAddress: data.company.companyAddress || '',
              companyCity: data.company.companyCity || '',
              companyState: data.company.companyState || '',
              companyCountry: data.company.companyCountry || '',
              companyZipCode: data.company.companyZipCode || '',
              companyPhone: data.company.companyPhone || '',
              companyWebsite: data.company.companyWebsite || '',
              name: data.company.name || '',
              email: data.company.email || '',
              phone: data.company.phone || '',
              position: data.company.position || '',
            })
          }
        }
      } catch (err) {
        console.error('Error fetching company:', err)
      } finally {
        setCompanyLoading(false)
      }
    }
    fetchCompany()
  }, [])

  const handleSaveCompany = async () => {
    setCompanySaving(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${config.apiUrl}/api/auth/company`, {
        method: 'PUT', headers, credentials: 'include',
        body: JSON.stringify(company),
      })
      if (res.ok) {
        setCompanySaved(true)
        setTimeout(() => setCompanySaved(false), 3000)
      } else {
        alert('Error al guardar configuración')
      }
    } catch (err) {
      alert('Error de conexión')
    } finally {
      setCompanySaving(false)
    }
  }

  // Dashboard widgets
  const { preferences, updatePreferences, loading: prefsLoading } = usePreferences()
  const [widgets, setWidgets] = useState<WidgetConfig[]>(ALL_WIDGETS)

  useEffect(() => {
    if (!prefsLoading && preferences.dashboardWidgets && Array.isArray(preferences.dashboardWidgets)) {
      const savedWidgetIds = preferences.dashboardWidgets as string[]
      setWidgets(prev => prev.map(w => ({ ...w, enabled: savedWidgetIds.includes(w.id) })))
    }
  }, [preferences, prefsLoading])

  const handleToggleWidget = useCallback(async (widgetId: string) => {
    setWidgets(prev => {
      const updated = prev.map(w => w.id === widgetId ? { ...w, enabled: !w.enabled } : w)
      const enabledIds = updated.filter(w => w.enabled).map(w => w.id)
      updatePreferences({ dashboardWidgets: enabledIds })
      return updated
    })
  }, [updatePreferences])

  // Notification preferences
  const notifPrefs = preferences.notifications || defaultNotificationPrefs

  const handleNotificationChange = async (key: keyof NotificationPreferences, value: boolean) => {
    const currentNotifs = preferences.notifications || defaultNotificationPrefs
    await updatePreferences({ notifications: { ...currentNotifs, [key]: value } })
  }

  // Vendors
  const { vendors, loading: vendorsLoading, createVendor, updateVendor, deleteVendor } = useVendors()
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [vendorForm, setVendorForm] = useState({
    name: '', email: '', phone: '',
    defaultCommissionType: '' as '' | 'percentage' | 'fixed',
    defaultCommissionPct: '',
    defaultCommissionFixed: '',
  })
  const [vendorSaving, setVendorSaving] = useState(false)
  const [vendorDeleting, setVendorDeleting] = useState<number | null>(null)

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings size={16} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'commissions', label: 'Comisiones', icon: <Percent size={16} /> },
    { id: 'vendors', label: 'Vendedores', icon: <Users size={16} /> },
    { id: 'users', label: 'Usuarios', icon: <UserCog size={16} /> },
    { id: 'notifications', label: 'Notificaciones', icon: <Bell size={16} /> },
  ]

  const getWidgetIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'zap': <CreditCard size={18} />,
      'file-text': <FileText size={18} />,
      'alert-triangle': <AlertCircle size={18} />,
      'home': <Home size={18} />,
      'building': <Building2 size={18} />,
      'percent': <Percent size={18} />,
      'activity': <Activity size={18} />,
      'calendar': <Calendar size={18} />,
      'credit-card': <CreditCard size={18} />,
      'bar-chart': <BarChart3 size={18} />,
    }
    return icons[iconName] || <FileText size={18} />
  }

  const openNewVendor = () => {
    setEditingVendor(null)
    setVendorForm({ name: '', email: '', phone: '', defaultCommissionType: '', defaultCommissionPct: '', defaultCommissionFixed: '' })
    setShowVendorModal(true)
  }

  const openEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setVendorForm({
      name: vendor.name,
      email: vendor.email || '',
      phone: vendor.phone || '',
      defaultCommissionType: (vendor.defaultCommissionType as '' | 'percentage' | 'fixed') || '',
      defaultCommissionPct: vendor.defaultCommissionPct?.toString() || '',
      defaultCommissionFixed: vendor.defaultCommissionFixed?.toString() || '',
    })
    setShowVendorModal(true)
  }

  const handleVendorSubmit = async () => {
    if (!vendorForm.name.trim()) return
    setVendorSaving(true)
    try {
      const commissionData = {
        defaultCommissionType: vendorForm.defaultCommissionType || undefined,
        defaultCommissionPct: vendorForm.defaultCommissionType === 'percentage' && vendorForm.defaultCommissionPct
          ? parseFloat(vendorForm.defaultCommissionPct) : undefined,
        defaultCommissionFixed: vendorForm.defaultCommissionType === 'fixed' && vendorForm.defaultCommissionFixed
          ? parseFloat(vendorForm.defaultCommissionFixed) : undefined,
      }
      if (editingVendor) {
        await updateVendor(editingVendor.id, {
          name: vendorForm.name,
          email: vendorForm.email || undefined,
          phone: vendorForm.phone || undefined,
          ...commissionData,
        })
      } else {
        await createVendor({
          name: vendorForm.name,
          email: vendorForm.email || undefined,
          phone: vendorForm.phone || undefined,
          ...commissionData,
        })
      }
      setShowVendorModal(false)
      setEditingVendor(null)
    } catch (err: any) {
      alert(err.message || 'Error al guardar vendedor')
    } finally {
      setVendorSaving(false)
    }
  }

  const handleDeleteVendor = async (id: number) => {
    if (!confirm('¿Eliminar este vendedor? Las comisiones asociadas no se eliminarán.')) return
    setVendorDeleting(id)
    try {
      await deleteVendor(id)
    } catch (err: any) {
      alert(err.message || 'Error al eliminar vendedor')
    } finally {
      setVendorDeleting(null)
    }
  }

  const handleToggleVendorActive = async (vendor: Vendor) => {
    try {
      await updateVendor(vendor.id, { isActive: !vendor.isActive })
    } catch (err: any) {
      alert(err.message || 'Error al actualizar vendedor')
    }
  }

  return (
    <div className={styles.pageContainer}>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} variant="underline" />

      <div className={styles.content}>
        {/* ===== GENERAL TAB ===== */}
        {activeTab === 'general' && (
          <>
            <Card>
              <CardHeader title="Información de la Empresa" />
              <CardContent>
                {companyLoading ? (
                  <p style={{ color: 'var(--text-tertiary)' }}>Cargando datos...</p>
                ) : (
                  <>
                    <div className={styles.formGrid}>
                      <Input label="Nombre de la Empresa" placeholder="Mi Inmobiliaria" fullWidth
                        value={company.companyName}
                        onChange={(e) => setCompany({ ...company, companyName: e.target.value })} />
                      <Input label="CUIT / Tax ID" placeholder="30-12345678-9" fullWidth
                        value={company.companyTaxId}
                        onChange={(e) => setCompany({ ...company, companyTaxId: e.target.value })} />
                      <Input label="Teléfono de la Empresa" placeholder="+54 11 1234-5678" fullWidth
                        value={company.companyPhone}
                        onChange={(e) => setCompany({ ...company, companyPhone: e.target.value })} />
                      <Input label="Sitio Web" placeholder="https://miinmobiliaria.com" fullWidth
                        value={company.companyWebsite}
                        onChange={(e) => setCompany({ ...company, companyWebsite: e.target.value })} />
                    </div>
                    <div className={styles.formGrid} style={{ marginTop: 'var(--spacing-lg)' }}>
                      <Input label="Dirección" placeholder="Av. Corrientes 1234" fullWidth
                        value={company.companyAddress}
                        onChange={(e) => setCompany({ ...company, companyAddress: e.target.value })} />
                      <Input label="Ciudad" placeholder="CABA" fullWidth
                        value={company.companyCity}
                        onChange={(e) => setCompany({ ...company, companyCity: e.target.value })} />
                      <Input label="Provincia / Estado" placeholder="Buenos Aires" fullWidth
                        value={company.companyState}
                        onChange={(e) => setCompany({ ...company, companyState: e.target.value })} />
                      <Input label="País" placeholder="Argentina" fullWidth
                        value={company.companyCountry}
                        onChange={(e) => setCompany({ ...company, companyCountry: e.target.value })} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Datos del Representante" />
              <CardContent>
                <div className={styles.formGrid}>
                  <Input label="Nombre Completo" placeholder="Juan Pérez" fullWidth
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })} />
                  <Input label="Email" type="email" fullWidth disabled
                    value={company.email} />
                  <Input label="Teléfono Personal" placeholder="+54 11 9999-8888" fullWidth
                    value={company.phone}
                    onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
                  <Input label="Cargo" placeholder="Director" fullWidth
                    value={company.position}
                    onChange={(e) => setCompany({ ...company, position: e.target.value })} />
                </div>
              </CardContent>
            </Card>

            <div className={styles.actions}>
              <Button onClick={handleSaveCompany} loading={companySaving} leftIcon={companySaved ? <Check size={16} /> : <Save size={16} />}>
                {companySaved ? 'Guardado ✓' : 'Guardar Cambios'}
              </Button>
            </div>
          </>
        )}

        {/* ===== DASHBOARD TAB ===== */}
        {activeTab === 'dashboard' && (
          <Card>
            <CardHeader
              title="Widgets del Dashboard"
              subtitle="Selecciona qué widgets mostrar en tu panel principal. Los cambios se aplican de inmediato."
            />
            <CardContent>
              <div className={styles.widgetList}>
                {widgets.map((widget) => (
                  <div key={widget.id} className={`${styles.widgetItem} ${!widget.enabled ? styles.widgetDisabled : ''}`}>
                    <div className={styles.widgetIcon}>{getWidgetIcon(widget.icon)}</div>
                    <div className={styles.widgetInfo}>
                      <span className={styles.widgetName}>{widget.title}</span>
                    </div>
                    <div className={styles.widgetActions}>
                      <button
                        className={`${styles.widgetToggle} ${widget.enabled ? styles.widgetToggleActive : ''}`}
                        onClick={() => handleToggleWidget(widget.id)}
                        title={widget.enabled ? 'Ocultar widget' : 'Mostrar widget'}
                      >
                        {widget.enabled ? <Check size={16} /> : <X size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className={styles.widgetHint}>
                Los widgets desactivados no aparecerán en el dashboard. Los cambios se guardan automáticamente.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ===== COMMISSIONS TAB ===== */}
        {activeTab === 'commissions' && (
          <>
            <Card>
              <CardHeader
                title="Sistema de Comisiones"
                subtitle="Resumen del modelo de comisiones activo en Inmodash"
              />
              <CardContent>
                <div className={styles.commissionTypes}>
                  <div className={styles.commissionType}>
                    <div className={styles.commissionTypeHeader}>
                      <span className={styles.commissionTypeName}>Comisión de la Inmobiliaria</span>
                      <Badge variant="success">Activo</Badge>
                    </div>
                    <p className={styles.commissionTypeDesc}>
                      Se configura al crear cada contrato (porcentaje o monto fijo sobre el alquiler). Se aplica automáticamente a cada obligación de alquiler generada.
                    </p>
                  </div>
                  <div className={styles.commissionType}>
                    <div className={styles.commissionTypeHeader}>
                      <span className={styles.commissionTypeName}>Comisión de Alta (Signup Fee)</span>
                      <Badge variant="success">Activo</Badge>
                    </div>
                    <p className={styles.commissionTypeDesc}>
                      Monto fijo que paga el inquilino al firmar. Se genera como obligación pendiente al crear el contrato.
                    </p>
                  </div>
                  <div className={styles.commissionType}>
                    <div className={styles.commissionTypeHeader}>
                      <span className={styles.commissionTypeName}>Gastos de Contrato</span>
                      <Badge variant="success">Activo</Badge>
                    </div>
                    <p className={styles.commissionTypeDesc}>
                      Sellados, escribanía, etc. Se genera como obligación pendiente al crear el contrato.
                    </p>
                  </div>
                  <div className={styles.commissionType}>
                    <div className={styles.commissionTypeHeader}>
                      <span className={styles.commissionTypeName}>Comisión del Vendedor</span>
                      <Badge variant="success">Activo</Badge>
                    </div>
                    <p className={styles.commissionTypeDesc}>
                      Porcentaje sobre la comisión de alta o monto fijo. Se precarga desde la configuración del vendedor y se puede ajustar por contrato. Se genera como VendorCommission pendiente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Actualización por Índice"
                subtitle="Configuración disponible al crear contratos"
              />
              <CardContent>
                <div className={styles.commissionTypes}>
                  <div className={styles.commissionType}>
                    <div className={styles.commissionTypeHeader}>
                      <span className={styles.commissionTypeName}>ICL (Índice para Contratos de Locación)</span>
                      <Badge variant="success">Disponible</Badge>
                    </div>
                    <p className={styles.commissionTypeDesc}>
                      Actualización automática basada en el ICL del BCRA. Se obtiene el valor actual al crear el contrato y se recalcula en cada período.
                    </p>
                  </div>
                  <div className={styles.commissionType}>
                    <div className={styles.commissionTypeHeader}>
                      <span className={styles.commissionTypeName}>IPC (Índice de Precios al Consumidor)</span>
                      <Badge variant="success">Disponible</Badge>
                    </div>
                    <p className={styles.commissionTypeDesc}>
                      Actualización automática basada en el IPC del INDEC. Similar al ICL pero con diferente fuente de datos.
                    </p>
                  </div>
                  <div className={styles.commissionType}>
                    <div className={styles.commissionTypeHeader}>
                      <span className={styles.commissionTypeName}>Coeficiente Fijo</span>
                      <Badge variant="success">Disponible</Badge>
                    </div>
                    <p className={styles.commissionTypeDesc}>
                      Aumento porcentual fijo cada N meses (ej: 5% cada 4 meses). No depende de índices externos.
                    </p>
                  </div>
                </div>
                <p className={styles.formHint}>
                  La configuración de actualización e índices se realiza individualmente al crear cada contrato. La línea de tiempo de ajustes se puede ver y modificar desde el detalle del contrato, pestaña &quot;Índice&quot;.
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* ===== VENDORS TAB ===== */}
        {activeTab === 'vendors' && (
          <Card>
            <CardHeader
              title="Vendedores"
              subtitle="Gestiona los vendedores de tu inmobiliaria y su comisión por defecto"
            />
            <CardContent>
              <div className={styles.vendorActions}>
                <Button onClick={openNewVendor} leftIcon={<Plus size={16} />}>
                  Nuevo Vendedor
                </Button>
              </div>

              {vendorsLoading ? (
                <div className={styles.vendorLoading}>Cargando vendedores...</div>
              ) : vendors.length === 0 ? (
                <div className={styles.vendorEmpty}>
                  <Users size={40} />
                  <p>No hay vendedores registrados</p>
                  <p className={styles.vendorEmptyHint}>Los vendedores se asignan al crear contratos para gestionar sus comisiones.</p>
                </div>
              ) : (
                <div className={styles.vendorList}>
                  {vendors.map((vendor) => (
                    <div key={vendor.id} className={`${styles.vendorItem} ${!vendor.isActive ? styles.vendorItemInactive : ''}`}>
                      <div className={styles.vendorInfo}>
                        <div className={styles.vendorName}>
                          {vendor.name}
                          {!vendor.isActive && <Badge variant="default" size="sm">Inactivo</Badge>}
                          {vendor.defaultCommissionType === 'percentage' && vendor.defaultCommissionPct && (
                            <Badge variant="success" size="sm">{vendor.defaultCommissionPct}%</Badge>
                          )}
                          {vendor.defaultCommissionType === 'fixed' && vendor.defaultCommissionFixed && (
                            <Badge variant="success" size="sm">${vendor.defaultCommissionFixed.toLocaleString('es-AR')}</Badge>
                          )}
                        </div>
                        <div className={styles.vendorMeta}>
                          {vendor.email && <span>{vendor.email}</span>}
                          {vendor.email && vendor.phone && <span>·</span>}
                          {vendor.phone && <span>{vendor.phone}</span>}
                          {vendor._count && (
                            <span className={styles.vendorCount}>
                              · {vendor._count.contracts} contratos · {vendor._count.commissions} comisiones
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.vendorItemActions}>
                        <button
                          className={styles.vendorBtn}
                          onClick={() => handleToggleVendorActive(vendor)}
                          title={vendor.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {vendor.isActive ? <UserCheck size={16} /> : <UserX size={16} />}
                        </button>
                        <button
                          className={styles.vendorBtn}
                          onClick={() => openEditVendor(vendor)}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className={`${styles.vendorBtn} ${styles.vendorBtnDanger}`}
                          onClick={() => handleDeleteVendor(vendor.id)}
                          disabled={vendorDeleting === vendor.id}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Vendor Modal */}
        {showVendorModal && (
          <div className={styles.modalBackdrop} onClick={() => setShowVendorModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.modalTitle}>
                {editingVendor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
              </h3>
              <div className={styles.modalBody}>
                <Input
                  label="Nombre *"
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  placeholder="Nombre del vendedor"
                  fullWidth
                />
                <Input
                  label="Email"
                  type="email"
                  value={vendorForm.email}
                  onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                  placeholder="vendedor@email.com"
                  fullWidth
                />
                <Input
                  label="Teléfono"
                  value={vendorForm.phone}
                  onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                  placeholder="+54 11 1234-5678"
                  fullWidth
                />
                <Select
                  label="Tipo de Comisión por Defecto"
                  options={[
                    { value: '', label: 'Sin comisión por defecto' },
                    { value: 'percentage', label: 'Porcentaje sobre comisión de alta' },
                    { value: 'fixed', label: 'Monto fijo' },
                  ]}
                  value={vendorForm.defaultCommissionType}
                  onChange={(e) => setVendorForm({ ...vendorForm, defaultCommissionType: e.target.value as '' | 'percentage' | 'fixed' })}
                  fullWidth
                />
                {vendorForm.defaultCommissionType === 'percentage' && (
                  <Input
                    label="Porcentaje de Comisión (%)"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={vendorForm.defaultCommissionPct}
                    onChange={(e) => setVendorForm({ ...vendorForm, defaultCommissionPct: e.target.value })}
                    placeholder="10"
                    hint="Ej: 10 = el vendedor se lleva el 10% de la comisión de alta"
                    fullWidth
                  />
                )}
                {vendorForm.defaultCommissionType === 'fixed' && (
                  <Input
                    label="Monto Fijo de Comisión (ARS)"
                    type="number"
                    step="1"
                    min="0"
                    value={vendorForm.defaultCommissionFixed}
                    onChange={(e) => setVendorForm({ ...vendorForm, defaultCommissionFixed: e.target.value })}
                    placeholder="50000"
                    hint="Monto fijo que cobra el vendedor por cada contrato cerrado"
                    fullWidth
                  />
                )}
              </div>
              <div className={styles.modalFooter}>
                <Button variant="secondary" onClick={() => setShowVendorModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleVendorSubmit}
                  loading={vendorSaving}
                  disabled={!vendorForm.name.trim()}
                >
                  {editingVendor ? 'Guardar' : 'Crear Vendedor'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===== NOTIFICATIONS TAB ===== */}
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

        {/* ===== USERS TAB ===== */}
        {activeTab === 'users' && <UsersContent />}
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
