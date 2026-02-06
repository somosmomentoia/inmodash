'use client'

import { useState, useEffect, CSSProperties } from 'react'
import { 
  Building2, FileText, Wallet, BarChart3, Check, Search, Plus, Clock, 
  AlertTriangle, TrendingUp, Home, Users, DollarSign, CreditCard,
  ChevronRight, Download, CheckCircle, Receipt,
  FileSpreadsheet, Settings, CalendarClock, RefreshCw, Sparkles, Bell, X
} from 'lucide-react'
import styles from './landing.module.css'

type DemoTab = 'dashboard' | 'contracts' | 'settlements' | 'properties'

export const InteractiveDemo = () => {
  const [activeTab, setActiveTab] = useState<DemoTab>('dashboard')

  const tabs = [
    { id: 'dashboard' as DemoTab, label: 'Dashboard', icon: BarChart3 },
    { id: 'contracts' as DemoTab, label: 'Contratos', icon: FileText },
    { id: 'settlements' as DemoTab, label: 'Liquidaciones', icon: Wallet },
    { id: 'properties' as DemoTab, label: 'Propiedades', icon: Building2 },
  ]

  return (
    <section className={styles.demoSection}>
      <div className={styles.demoContainer}>
        <div className={styles.demoHeader}>
          <div className={styles.demoBadge}>
            <Sparkles style={{ width: 16, height: 16 }} />
            <span>Demo Interactiva</span>
          </div>
          <h2 className={styles.demoTitle}>Explora el sistema en acción</h2>
          <p className={styles.demoSubtitle}>
            Haz clic en cualquier elemento para ver cómo funciona. Todo es interactivo.
          </p>
        </div>

        <div className={styles.demoTabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.demoTab} ${activeTab === tab.id ? styles.demoTabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon style={{ width: 16, height: 16 }} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.demoContent}>
          <div className={styles.demoFrame}>
            {activeTab === 'dashboard' && <DashboardDemo />}
            {activeTab === 'contracts' && <ContractsDemo />}
            {activeTab === 'settlements' && <SettlementsDemo />}
            {activeTab === 'properties' && <PropertiesDemo />}
          </div>
        </div>
      </div>
    </section>
  )
}

// Estilos compartidos
const baseStyles = {
  card: { background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-light)', transition: 'all 0.2s ease' } as CSSProperties,
  statCard: { background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px 20px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s ease', cursor: 'pointer' } as CSSProperties,
  badge: (color: string): CSSProperties => ({ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: color === 'green' ? '#d1fae5' : color === 'orange' ? '#fef3c7' : color === 'red' ? '#fee2e2' : color === 'blue' ? '#dbeafe' : '#f3f4f6', color: color === 'green' ? '#059669' : color === 'orange' ? '#d97706' : color === 'red' ? '#dc2626' : color === 'blue' ? '#2563eb' : '#6b7280' }),
  iconBox: (color: string): CSSProperties => ({ width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: color === 'blue' ? '#dbeafe' : color === 'green' ? '#d1fae5' : color === 'orange' ? '#fef3c7' : color === 'purple' ? '#f3e8ff' : color === 'red' ? '#fee2e2' : '#f3f4f6', transition: 'all 0.2s ease' }),
  btn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease' } as CSSProperties,
  btnPrimary: { background: 'var(--accent-primary)', color: 'white' } as CSSProperties,
  btnSecondary: { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' } as CSSProperties,
}

// Componente animado con hover
const AnimatedCard = ({ children, delay = 0, onClick, style }: { children: React.ReactNode, delay?: number, onClick?: () => void, style?: CSSProperties }) => {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...baseStyles.card,
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? (hovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0)') : 'translateY(20px)',
        boxShadow: hovered ? '0 12px 30px rgba(0,0,0,0.12)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {children}
    </div>
  )
}

// Contador animado
const AnimatedNumber = ({ value, prefix = '', suffix = '' }: { value: number, prefix?: string, suffix?: string }) => {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const duration = 1200
    const increment = value / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= value) { setCount(value); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [value])
  return <>{prefix}{count.toLocaleString('es-AR')}{suffix}</>
}

// Toast de notificación
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div style={{
      position: 'absolute', bottom: '20px', right: '20px', padding: '12px 16px',
      background: type === 'success' ? '#10b981' : '#3b82f6', color: 'white',
      borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease',
      zIndex: 100, fontSize: '13px', fontWeight: 500
    }}>
      {type === 'success' ? <CheckCircle size={18} /> : <Bell size={18} />}
      {message}
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', marginLeft: '8px' }}>
        <X size={14} />
      </button>
    </div>
  )
}

const DashboardDemo = () => {
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null)
  const [completedTasks, setCompletedTasks] = useState<number[]>([])
  const [hoveredStat, setHoveredStat] = useState<number | null>(null)

  const stats = [
    { label: 'Contratos Activos', value: 18, icon: FileText, color: 'blue' },
    { label: 'Comisiones Cobradas', value: 485200, icon: DollarSign, color: 'green', prefix: '$' },
    { label: 'Tareas Pendientes', value: 7, icon: Clock, color: 'orange' },
    { label: 'Obligaciones Vencidas', value: 3, icon: AlertTriangle, color: 'red' },
  ]

  const quickActions = [
    { icon: CreditCard, label: 'Registrar Pago', badge: 12, action: () => setToast({ message: '¡Modal de pago abierto!', type: 'info' }) },
    { icon: Receipt, label: 'Nueva Obligación', action: () => setToast({ message: 'Creando nueva obligación...', type: 'info' }) },
    { icon: FileText, label: 'Nuevo Contrato', action: () => setToast({ message: 'Formulario de contrato abierto', type: 'info' }) },
    { icon: Check, label: 'Nueva Tarea', action: () => setToast({ message: 'Tarea creada exitosamente', type: 'success' }) },
    { icon: FileSpreadsheet, label: 'Liquidaciones', action: () => setToast({ message: 'Cargando liquidaciones...', type: 'info' }) },
    { icon: Home, label: 'Propiedades', action: () => setToast({ message: '24 propiedades encontradas', type: 'info' }) },
    { icon: Download, label: 'Reportes', action: () => setToast({ message: 'Generando reporte PDF...', type: 'success' }) },
    { icon: DollarSign, label: 'Contabilidad', action: () => setToast({ message: 'Abriendo contabilidad...', type: 'info' }) },
  ]

  const tasks = [
    { id: 1, title: 'Llamar a Juan Pérez por renovación', date: '15 Ene', overdue: true },
    { id: 2, title: 'Enviar contrato a María García', date: '18 Ene', overdue: false },
    { id: 3, title: 'Verificar pago de expensas Belgrano 567', date: '20 Ene', overdue: false },
  ]

  const overdueObligations = [
    { desc: 'Alquiler Enero - Av. Corrientes 1234', date: '05 Ene', amount: 120000 },
    { desc: 'Expensas Enero - Santa Fe 890', date: '10 Ene', amount: 35000 },
  ]

  const toggleTask = (id: number) => {
    if (completedTasks.includes(id)) {
      setCompletedTasks(prev => prev.filter(t => t !== id))
    } else {
      setCompletedTasks(prev => [...prev, id])
      setToast({ message: '¡Tarea completada! 🎉', type: 'success' })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {stats.map((stat, i) => (
          <AnimatedCard key={i} delay={i * 80} onClick={() => setToast({ message: `Ver detalles de ${stat.label}`, type: 'info' })}>
            <div 
              style={{ ...baseStyles.statCard, border: 'none' }}
              onMouseEnter={() => setHoveredStat(i)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <div style={{
                ...baseStyles.iconBox(stat.color),
                transform: hoveredStat === i ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
              }}>
                <stat.icon size={20} style={{ color: stat.color === 'blue' ? '#3b82f6' : stat.color === 'green' ? '#10b981' : stat.color === 'orange' ? '#f59e0b' : '#ef4444' }} />
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  <AnimatedNumber value={stat.value} prefix={stat.prefix || ''} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{stat.label}</div>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Quick Actions */}
      <AnimatedCard delay={350} style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <CreditCard size={16} style={{ color: '#3b82f6' }} />
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Acciones Rápidas</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px' }}>
          {quickActions.map((action, i) => {
            const [hovered, setHovered] = useState(false)
            return (
              <button 
                key={i} 
                onClick={action.action}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', 
                  padding: '12px 8px', background: hovered ? 'var(--accent-primary-light)' : 'var(--bg-tertiary)', 
                  border: hovered ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)', 
                  borderRadius: '8px', cursor: 'pointer', position: 'relative',
                  transform: hovered ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.15s ease'
                }}
              >
                <action.icon size={18} style={{ color: hovered ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
                <span style={{ fontSize: '11px', color: hovered ? 'var(--accent-primary)' : 'var(--text-secondary)', textAlign: 'center' }}>{action.label}</span>
                {action.badge && <span style={{ position: 'absolute', top: '6px', right: '6px', background: '#ef4444', color: 'white', fontSize: '10px', padding: '2px 5px', borderRadius: '10px', animation: 'pulse 2s infinite' }}>{action.badge}</span>}
              </button>
            )
          })}
        </div>
      </AnimatedCard>

      {/* Widgets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Tasks Widget */}
        <AnimatedCard delay={450} style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} style={{ color: '#3b82f6' }} />
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Tareas</span>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tasks.map((task) => {
              const isCompleted = completedTasks.includes(task.id)
              return (
                <div 
                  key={task.id} 
                  onClick={() => toggleTask(task.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', 
                    background: isCompleted ? '#d1fae5' : task.overdue ? '#fef2f2' : 'var(--bg-tertiary)', 
                    borderRadius: '8px', 
                    border: isCompleted ? '1px solid #10b981' : task.overdue ? '1px solid #fecaca' : '1px solid var(--border-light)',
                    cursor: 'pointer',
                    opacity: isCompleted ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ 
                    width: '18px', height: '18px', borderRadius: '4px', 
                    border: isCompleted ? 'none' : '2px solid var(--border-medium)',
                    background: isCompleted ? '#10b981' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    {isCompleted && <Check size={12} style={{ color: 'white' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', textDecoration: isCompleted ? 'line-through' : 'none' }}>{task.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} /> {task.date}
                    </div>
                  </div>
                  {task.overdue && !isCompleted && <span style={baseStyles.badge('red')}>Vencida</span>}
                </div>
              )
            })}
          </div>
        </AnimatedCard>

        {/* Overdue Widget */}
        <AnimatedCard delay={550} style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Obligaciones Vencidas</span>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)' }}><AnimatedNumber value={3} /></span>
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>obligaciones vencidas</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Total pendiente: <span style={{ color: '#ef4444', fontWeight: 500 }}>$<AnimatedNumber value={155000} /></span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {overdueObligations.map((ob, i) => {
              const [hovered, setHovered] = useState(false)
              return (
                <div 
                  key={i} 
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                  onClick={() => setToast({ message: 'Abriendo detalle de obligación...', type: 'info' })}
                  style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', 
                    background: hovered ? '#fef2f2' : 'var(--bg-tertiary)', borderRadius: '8px',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    transform: hovered ? 'translateX(4px)' : 'translateX(0)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{ob.desc}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{ob.date}</div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>${ob.amount.toLocaleString('es-AR')}</span>
                </div>
              )
            })}
          </div>
        </AnimatedCard>
      </div>
      
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  )
}

const ContractsDemo = () => {
  const [activeFilter, setActiveFilter] = useState('all')
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  
  const stats = [
    { label: 'Total Contratos', value: 24, icon: FileText, color: 'blue' },
    { label: 'Vigentes', value: 18, icon: TrendingUp, color: 'green' },
    { label: 'Por Vencer', value: 4, icon: Clock, color: 'orange', glow: true },
    { label: 'Vencidos', value: 2, icon: AlertTriangle, color: 'purple' },
  ]

  const filters = [
    { id: 'all', label: 'Todos', count: 24 },
    { id: 'active', label: 'Vigentes', count: 18 },
    { id: 'expiring', label: 'Por Vencer', count: 4 },
    { id: 'expired', label: 'Vencidos', count: 2 },
  ]

  const contracts = [
    { id: 1, tenant: 'Juan Pérez', property: 'Av. Corrientes 1234, 3B', dates: '01/03/2024 - 28/02/2027', amount: 120000, status: 'active' },
    { id: 2, tenant: 'María García', property: 'Belgrano 567, PB', dates: '15/06/2024 - 14/06/2027', amount: 95000, status: 'active' },
    { id: 3, tenant: 'Carlos López', property: 'Santa Fe 890, 5A', dates: '01/01/2024 - 31/12/2026', amount: 150000, status: 'expiring' },
    { id: 4, tenant: 'Ana Martínez', property: 'Callao 123, 2C', dates: '01/09/2023 - 31/08/2026', amount: 85000, status: 'active' },
    { id: 5, tenant: 'Roberto Silva', property: 'Rivadavia 456, 1D', dates: '01/05/2022 - 30/04/2025', amount: 78000, status: 'expired' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {stats.map((stat, i) => (
          <AnimatedCard key={i} delay={i * 80} onClick={() => setToast({ message: `Filtrando por ${stat.label}...`, type: 'info' })}>
            <div style={{ ...baseStyles.statCard, border: 'none', boxShadow: stat.glow ? '0 0 0 2px #fef3c7' : 'none' }}>
              <div style={baseStyles.iconBox(stat.color)}>
                <stat.icon size={20} style={{ color: stat.color === 'blue' ? '#3b82f6' : stat.color === 'green' ? '#10b981' : stat.color === 'orange' ? '#f59e0b' : '#8b5cf6' }} />
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}><AnimatedNumber value={stat.value} /></div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{stat.label}</div>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Quick Actions */}
      <AnimatedCard delay={350} style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { icon: Plus, label: 'Nuevo Contrato', color: 'blue' },
            { icon: Settings, label: 'Configurar Comisiones', color: 'purple' },
            { icon: BarChart3, label: 'Generar Reportes', color: 'green' },
            { icon: CalendarClock, label: 'Ver Vencimientos', color: 'orange', badge: 4 },
          ].map((action, i) => {
            const [hovered, setHovered] = useState(false)
            return (
              <button 
                key={i} 
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={() => setToast({ message: `${action.label}...`, type: 'info' })}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', 
                  background: hovered ? 'var(--accent-primary-light)' : 'var(--bg-tertiary)', 
                  border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer',
                  transform: hovered ? 'scale(1.03)' : 'scale(1)', transition: 'all 0.15s ease'
                }}
              >
                <action.icon size={14} style={{ color: action.color === 'blue' ? '#3b82f6' : action.color === 'purple' ? '#8b5cf6' : action.color === 'green' ? '#10b981' : '#f59e0b' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{action.label}</span>
                {action.badge && <span style={{ background: '#f59e0b', color: 'white', fontSize: '10px', padding: '1px 5px', borderRadius: '10px', marginLeft: '4px' }}>{action.badge}</span>}
              </button>
            )
          })}
        </div>
      </AnimatedCard>

      {/* Alerts */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <AnimatedCard delay={400} onClick={() => setActiveFilter('expiring')} style={{ flex: 1, padding: '12px 16px', background: '#fef3c7', border: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={18} style={{ color: '#d97706' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#92400e' }}>4 contratos por vencer</div>
              <div style={{ fontSize: '12px', color: '#a16207' }}>En los próximos 30 días</div>
            </div>
            <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 500 }}>Ver →</span>
          </div>
        </AnimatedCard>
        <AnimatedCard delay={450} onClick={() => setActiveFilter('expired')} style={{ flex: 1, padding: '12px 16px', background: '#fee2e2', border: '1px solid #fecaca' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RefreshCw size={18} style={{ color: '#dc2626' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#991b1b' }}>2 contratos vencidos</div>
              <div style={{ fontSize: '12px', color: '#b91c1c' }}>Requieren renovación</div>
            </div>
            <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>Gestionar →</span>
          </div>
        </AnimatedCard>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-light)', paddingBottom: '0' }}>
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 500, color: activeFilter === filter.id ? 'var(--accent-primary)' : 'var(--text-secondary)', background: 'transparent', border: 'none', borderBottom: activeFilter === filter.id ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer', marginBottom: '-1px', transition: 'all 0.15s ease' }}
          >
            {filter.label} <span style={{ marginLeft: '4px', padding: '2px 6px', background: activeFilter === filter.id ? 'var(--accent-primary-light)' : 'var(--bg-tertiary)', borderRadius: '10px', fontSize: '11px' }}>{filter.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <AnimatedCard delay={500} style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Propiedad</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inquilino</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Período</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monto</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr 
                key={c.id} 
                onClick={() => { setSelectedRow(c.id); setToast({ message: `Abriendo contrato de ${c.tenant}...`, type: 'info' }) }}
                style={{ 
                  borderBottom: '1px solid var(--border-light)', cursor: 'pointer',
                  background: selectedRow === c.id ? 'var(--accent-primary-light)' : 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Home size={16} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{c.property}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={16} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{c.tenant}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{c.dates}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right' }}>${c.amount.toLocaleString('es-AR')}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <span style={baseStyles.badge(c.status === 'active' ? 'green' : c.status === 'expiring' ? 'orange' : 'red')}>
                    {c.status === 'active' ? 'Vigente' : c.status === 'expiring' ? 'Por Vencer' : 'Vencido'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AnimatedCard>
      
      <style>{`@keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  )
}

const SettlementsDemo = () => {
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null)
  const [settledItems, setSettledItems] = useState<number[]>([1]) // Laura ya está liquidada
  
  const settlements = [
    { id: 0, owner: 'Roberto Fernández', initials: 'RF', properties: 3, income: 285000, expenses: 12500, commission: 28500, net: 244000 },
    { id: 1, owner: 'Laura Gómez', initials: 'LG', properties: 2, income: 180000, expenses: 8200, commission: 18000, net: 153800 },
    { id: 2, owner: 'Miguel Torres', initials: 'MT', properties: 1, income: 95000, expenses: 4500, commission: 9500, net: 81000 },
  ]

  const formatCurrency = (n: number) => '$' + n.toLocaleString('es-AR')

  const totalIncome = settlements.reduce((sum, s) => sum + s.income, 0)
  const totalCommissions = settlements.reduce((sum, s) => sum + s.commission, 0)
  const totalPending = settlements.filter(s => !settledItems.includes(s.id)).reduce((sum, s) => sum + s.net, 0)

  const handleSettle = (id: number, name: string) => {
    setSettledItems(prev => [...prev, id])
    setToast({ message: `¡Liquidación de ${name} registrada! 💰`, type: 'success' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Search & Filter Bar */}
      <AnimatedCard delay={0} style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
            <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
            <input type="text" placeholder="Buscar propietario..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: 'var(--text-primary)', width: '100%' }} />
          </div>
          <select style={{ padding: '8px 12px', fontSize: '13px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
            <option>Enero 2025</option>
            <option>Diciembre 2024</option>
          </select>
          <button onClick={() => setToast({ message: 'Exportando a Excel...', type: 'success' })} style={{ ...baseStyles.btn, ...baseStyles.btnSecondary }}>
            <Download size={14} /> Exportar
          </button>
        </div>
      </AnimatedCard>

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Filtros:</span>
        {[
          { icon: Clock, label: `Pendientes (${settlements.length - settledItems.length})`, active: true, color: '#fef3c7', borderColor: '#fde68a', textColor: '#d97706' },
          { icon: CheckCircle, label: `Liquidados (${settledItems.length})`, active: false, color: 'var(--bg-tertiary)', borderColor: 'var(--border-light)', textColor: 'var(--text-secondary)' },
          { icon: TrendingUp, label: 'Saldo positivo', active: false, color: 'var(--bg-tertiary)', borderColor: 'var(--border-light)', textColor: 'var(--text-secondary)' },
        ].map((pill, i) => (
          <button key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12px', background: pill.color, border: `1px solid ${pill.borderColor}`, borderRadius: '20px', color: pill.textColor, cursor: 'pointer', transition: 'all 0.15s ease' }}>
            <pill.icon size={12} /> {pill.label}
          </button>
        ))}
      </div>

      {/* Summary Bar */}
      <AnimatedCard delay={100} style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Período</div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Enero 2025</div>
          </div>
          <div style={{ width: '1px', height: '32px', background: 'var(--border-light)', margin: '0 20px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Total Ingresos</div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#10b981' }}><AnimatedNumber value={totalIncome} prefix="$" /></div>
          </div>
          <div style={{ width: '1px', height: '32px', background: 'var(--border-light)', margin: '0 20px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Comisiones</div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#3b82f6' }}><AnimatedNumber value={totalCommissions} prefix="$" /></div>
          </div>
          <div style={{ width: '1px', height: '32px', background: 'var(--border-light)', margin: '0 20px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Pendiente a liquidar</div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#f59e0b' }}><AnimatedNumber value={totalPending} prefix="$" /></div>
          </div>
        </div>
      </AnimatedCard>

      {/* Settlements List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {settlements.map((settlement, i) => {
          const isSettled = settledItems.includes(settlement.id)
          return (
            <AnimatedCard key={settlement.id} delay={200 + i * 100} onClick={() => setToast({ message: `Ver detalle de ${settlement.owner}`, type: 'info' })}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
                {/* Owner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '200px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isSettled ? '#d1fae5' : 'var(--accent-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: isSettled ? '#059669' : 'var(--accent-primary)', transition: 'all 0.3s ease' }}>{settlement.initials}</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{settlement.owner}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building2 size={10} /> {settlement.properties} {settlement.properties === 1 ? 'propiedad' : 'propiedades'}
                    </div>
                  </div>
                </div>

                {/* Amounts */}
                <div style={{ flex: 1, display: 'flex', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Ingresos</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#10b981' }}>+{formatCurrency(settlement.income)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Gastos</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#ef4444' }}>-{formatCurrency(settlement.expenses)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Comisión</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#3b82f6' }}>-{formatCurrency(settlement.commission)}</div>
                  </div>
                  <div style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Neto</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: settlement.net >= 0 ? '#10b981' : '#ef4444' }}>{formatCurrency(settlement.net)}</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {!isSettled ? (
                    <>
                      <span style={baseStyles.badge('orange')}>Pendiente</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleSettle(settlement.id, settlement.owner) }}
                        style={{ ...baseStyles.btn, ...baseStyles.btnPrimary, padding: '6px 12px' }}
                      >
                        Liquidar
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={baseStyles.badge('green')}>Liquidado</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Transferencia</span>
                    </>
                  )}
                  <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              </div>
            </AnimatedCard>
          )
        })}
      </div>
      
      <style>{`@keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  )
}

const PropertiesDemo = () => {
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null)
  
  const stats = [
    { label: 'Total Propiedades', value: 24, icon: Building2, color: 'blue' },
    { label: 'Alquiladas', value: 18, icon: Home, color: 'green' },
    { label: 'Disponibles', value: 4, icon: Check, color: 'purple' },
    { label: 'En Mantenimiento', value: 2, icon: Settings, color: 'orange' },
  ]

  const properties = [
    { id: 1, address: 'Av. Corrientes 1234, 3B', type: 'Departamento', owner: 'Roberto Fernández', tenant: 'Juan Pérez', rent: 120000, status: 'rented' },
    { id: 2, address: 'Belgrano 567, PB', type: 'PH', owner: 'Laura Gómez', tenant: 'María García', rent: 95000, status: 'rented' },
    { id: 3, address: 'Santa Fe 890, 5A', type: 'Departamento', owner: 'Miguel Torres', tenant: null, rent: null, status: 'available' },
    { id: 4, address: 'Callao 123, 2C', type: 'Departamento', owner: 'Roberto Fernández', tenant: 'Ana Martínez', rent: 85000, status: 'rented' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {stats.map((stat, i) => (
          <AnimatedCard key={i} delay={i * 80} onClick={() => setToast({ message: `Filtrando: ${stat.label}`, type: 'info' })}>
            <div style={{ ...baseStyles.statCard, border: 'none' }}>
              <div style={baseStyles.iconBox(stat.color)}>
                <stat.icon size={20} style={{ color: stat.color === 'blue' ? '#3b82f6' : stat.color === 'green' ? '#10b981' : stat.color === 'purple' ? '#8b5cf6' : '#f59e0b' }} />
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}><AnimatedNumber value={stat.value} /></div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{stat.label}</div>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Search & Actions */}
      <AnimatedCard delay={350} style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
            <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
            <input type="text" placeholder="Buscar propiedad..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: 'var(--text-primary)', width: '100%' }} />
          </div>
          <button onClick={() => setToast({ message: 'Abriendo formulario de nueva propiedad...', type: 'info' })} style={{ ...baseStyles.btn, ...baseStyles.btnPrimary }}>
            <Plus size={14} /> Nueva Propiedad
          </button>
        </div>
      </AnimatedCard>

      {/* Properties Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {properties.map((p, i) => (
          <AnimatedCard key={p.id} delay={400 + i * 100} onClick={() => setToast({ message: `Abriendo ficha de ${p.address}`, type: 'info' })} style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>{p.address}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{p.type}</div>
              </div>
              <span style={baseStyles.badge(p.status === 'rented' ? 'blue' : 'green')}>
                {p.status === 'rented' ? 'Alquilado' : 'Disponible'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Propietario: </span>
                <span style={{ color: 'var(--text-secondary)' }}>{p.owner}</span>
              </div>
              {p.tenant && (
                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>Inquilino: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{p.tenant}</span>
                </div>
              )}
            </div>
            {p.rent && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Alquiler mensual</span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>${p.rent.toLocaleString('es-AR')}</span>
              </div>
            )}
          </AnimatedCard>
        ))}
      </div>
      
      <style>{`@keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  )
}
