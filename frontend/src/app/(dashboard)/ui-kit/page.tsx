'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  Select,
  Textarea,
  Checkbox,
  Badge,
  StatsCard,
  Table,
  Avatar,
  AvatarGroup,
  ProgressRing,
  BarChart,
  MiniChart,
  Tabs,
  Modal,
  ModalFooter,
  Toast,
  EmptyState,
  TaskItem,
  MetricCard,
  ActionCard,
  AnalyticsCard,
  QuickStatsCard,
  InsightCard,
  ComparisonCard,
  GlowCard,
  WidgetCard,
  TrendCard,
  GaugeCard,
  TimelineCard,
  HeatmapCard,
  LeaderboardCard,
  CounterCard,
  GradientBorderCard,
  SplitCard,
  RadialProgressCard,
  StatusCard,
  ReportCard,
  SummaryPanel,
  DataTableReport,
  EntityHeader,
  FilterChips,
  PeriodSelector,
} from '@/components/ui'
import {
  Building2,
  Home,
  Users,
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Bell,
  CreditCard,
  Receipt,
  Key,
  Lightbulb,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Server,
  Wifi,
  Activity,
  Award,
  Target,
  Sparkles,
  Percent,
} from 'lucide-react'
import styles from './page.module.css'

const sampleTableData = [
  { id: 1, name: 'María González', email: 'maria@email.com', role: 'Propietario', status: 'Activo' },
  { id: 2, name: 'Juan Pérez', email: 'juan@email.com', role: 'Inquilino', status: 'Activo' },
  { id: 3, name: 'Carlos López', email: 'carlos@email.com', role: 'Propietario', status: 'Inactivo' },
]

const chartData = [
  { label: 'Ene', value: 1800000 },
  { label: 'Feb', value: 2100000 },
  { label: 'Mar', value: 1950000 },
  { label: 'Abr', value: 2300000 },
  { label: 'May', value: 2150000 },
  { label: 'Jun', value: 2450000 },
]

const miniChartData = [45, 52, 38, 65, 48, 72, 58, 80, 65, 90, 78, 95]

export default function UIKitPage() {
  const [activeTab, setActiveTab] = useState('buttons')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formValues, setFormValues] = useState({
    input: '',
    select: '',
    textarea: '',
    checkbox: false,
  })

  const tabs = [
    { id: 'buttons', label: 'Buttons' },
    { id: 'forms', label: 'Forms' },
    { id: 'cards', label: 'Cards' },
    { id: 'premium', label: '✨ Premium' },
    { id: 'data', label: 'Data Display' },
    { id: 'charts', label: 'Charts' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'reports', label: '📊 Reports' },
  ]

  return (
    <DashboardLayout title="UI Kit" subtitle="Componentes del sistema de diseño">
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} variant="underline" />

      <div className={styles.content}>
        {/* BUTTONS SECTION */}
        {activeTab === 'buttons' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Buttons</h2>
            
            <Card>
              <CardHeader title="Variantes" subtitle="Diferentes estilos de botones" />
              <CardContent>
                <div className={styles.row}>
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Tamaños" />
              <CardContent>
                <div className={styles.row}>
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Con iconos" />
              <CardContent>
                <div className={styles.row}>
                  <Button leftIcon={<Plus size={16} />}>Agregar</Button>
                  <Button variant="secondary" leftIcon={<Edit size={16} />}>Editar</Button>
                  <Button variant="danger" leftIcon={<Trash2 size={16} />}>Eliminar</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Estados" />
              <CardContent>
                <div className={styles.row}>
                  <Button loading>Cargando</Button>
                  <Button disabled>Deshabilitado</Button>
                  <Button fullWidth>Full Width</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* FORMS SECTION */}
        {activeTab === 'forms' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Form Elements</h2>

            <div className={styles.grid2}>
              <Card>
                <CardHeader title="Input" />
                <CardContent>
                  <div className={styles.formStack}>
                    <Input label="Nombre" placeholder="Ingrese su nombre" />
                    <Input label="Email" placeholder="email@ejemplo.com" leftIcon={<Mail size={18} />} />
                    <Input label="Teléfono" placeholder="+54 11 1234-5678" leftIcon={<Phone size={18} />} />
                    <Input label="Con error" placeholder="Campo requerido" error="Este campo es obligatorio" />
                    <Input label="Con hint" placeholder="Contraseña" hint="Mínimo 8 caracteres" type="password" />
                    <Input label="Deshabilitado" placeholder="No editable" disabled />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Select" />
                <CardContent>
                  <div className={styles.formStack}>
                    <Select
                      label="Tipo de propiedad"
                      placeholder="Seleccione..."
                      options={[
                        { value: 'departamento', label: 'Departamento' },
                        { value: 'casa', label: 'Casa' },
                        { value: 'ph', label: 'PH' },
                        { value: 'local', label: 'Local comercial' },
                      ]}
                    />
                    <Select
                      label="Estado"
                      options={[
                        { value: 'disponible', label: 'Disponible' },
                        { value: 'ocupado', label: 'Ocupado' },
                        { value: 'mantenimiento', label: 'En mantenimiento' },
                      ]}
                      size="sm"
                    />
                    <Select
                      label="Con error"
                      options={[{ value: '', label: 'Seleccione...' }]}
                      error="Debe seleccionar una opción"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Textarea" />
                <CardContent>
                  <div className={styles.formStack}>
                    <Textarea label="Descripción" placeholder="Escriba una descripción..." />
                    <Textarea label="Notas" placeholder="Notas adicionales..." rows={3} hint="Máximo 500 caracteres" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Checkbox" />
                <CardContent>
                  <div className={styles.formStack}>
                    <Checkbox label="Acepto los términos y condiciones" />
                    <Checkbox label="Recibir notificaciones por email" defaultChecked />
                    <Checkbox label="Con error" error="Debe aceptar para continuar" />
                    <Checkbox label="Deshabilitado" disabled />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* CARDS SECTION */}
        {activeTab === 'cards' && (
          <div className={styles.section}>
            {/* Stats Cards */}
            <h2 className={styles.sectionTitle}>Stats Cards</h2>
            <div className={styles.grid4}>
              <StatsCard variant="gradient" icon={<Building2 />} value="12" label="Edificios" />
              <StatsCard variant="gradient" icon={<Home />} value="48" label="Propiedades" />
              <StatsCard icon={<Users />} value="36" label="Clientes" trend={{ value: 12, isPositive: true }} />
              <StatsCard icon={<FileText />} value="28" label="Contratos" trend={{ value: 5, isPositive: false }} />
            </div>

            {/* Metric Cards con Sparklines */}
            <h2 className={styles.sectionTitle}>Metric Cards (con Sparklines)</h2>
            <div className={styles.grid4}>
              <MetricCard
                variant="blue"
                icon={<DollarSign size={20} />}
                value="$2.4M"
                label="Ingresos Mensuales"
                trend={{ value: 12, isPositive: true }}
                sparkline={[45, 52, 38, 65, 48, 72, 58, 80, 65, 90, 78, 95]}
                interactive
                onClick={() => console.log('clicked')}
              />
              <MetricCard
                variant="purple"
                icon={<FileText size={20} />}
                value="28"
                label="Contratos Activos"
                subtitle="4 por renovar"
                sparkline={[20, 25, 22, 28, 24, 26, 28, 30, 28, 32]}
              />
              <MetricCard
                variant="green"
                icon={<CheckCircle size={20} />}
                value="94%"
                label="Tasa de Ocupación"
                trend={{ value: 3, isPositive: true }}
                sparkline={[88, 90, 89, 92, 91, 93, 94, 93, 95, 94]}
              />
              <MetricCard
                variant="cyan"
                icon={<Home size={20} />}
                value="48"
                label="Propiedades"
                subtitle="12 edificios"
              />
            </div>

            {/* Action Cards */}
            <h2 className={styles.sectionTitle}>Action Cards (Acciones Rápidas)</h2>
            <div className={styles.grid3}>
              <ActionCard
                variant="default"
                color="blue"
                icon={<Plus size={24} />}
                title="Nuevo Contrato"
                description="Crear un contrato de alquiler"
                onClick={() => console.log('nuevo contrato')}
              />
              <ActionCard
                variant="gradient"
                color="purple"
                icon={<Receipt size={24} />}
                title="Registrar Pago"
                description="Cobrar alquiler o expensas"
                badge={3}
                onClick={() => console.log('registrar pago')}
              />
              <ActionCard
                variant="outlined"
                color="green"
                icon={<Key size={24} />}
                title="Nueva Propiedad"
                description="Agregar departamento o casa"
                onClick={() => console.log('nueva propiedad')}
              />
            </div>

            {/* Insight Cards */}
            <h2 className={styles.sectionTitle}>Insight Cards (Alertas)</h2>
            <div className={styles.grid2}>
              <InsightCard
                variant="warning"
                icon={<AlertTriangle size={18} />}
                title="3 contratos próximos a vencer"
                description="Revisa los contratos que vencen en los próximos 30 días"
                metric={{ value: 3, label: 'contratos' }}
                action={{ label: 'Ver contratos', onClick: () => {} }}
                dismissible
              />
              <InsightCard
                variant="error"
                icon={<Clock size={18} />}
                title="5 pagos vencidos"
                description="Hay pagos pendientes que requieren atención inmediata"
                metric={{ value: '$450.000', label: 'total' }}
                action={{ label: 'Gestionar', onClick: () => {} }}
              />
              <InsightCard
                variant="success"
                icon={<CheckCircle size={18} />}
                title="Recaudación del mes completada"
                description="Se cobraron todos los alquileres programados"
                metric={{ value: '100%', label: 'cobrado' }}
              />
              <InsightCard
                variant="tip"
                icon={<Lightbulb size={18} />}
                title="Tip: Actualización de contratos"
                description="Recuerda revisar los índices de actualización para el próximo trimestre"
                action={{ label: 'Configurar', onClick: () => {} }}
              />
            </div>

            {/* Comparison Card */}
            <h2 className={styles.sectionTitle}>Comparison Cards (Comparativas)</h2>
            <div className={styles.grid2}>
              <ComparisonCard
                title="Ingresos"
                periods={[
                  { id: 'month', label: 'Mes' },
                  { id: 'quarter', label: 'Trim' },
                  { id: 'year', label: 'Año' },
                ]}
                current={{ value: '$2.4M', label: 'Este mes' }}
                previous={{ value: '$2.1M', label: 'Mes anterior' }}
                change={{ value: 14, isPositive: true }}
                chart={[1800, 2100, 1950, 2300, 2150, 2400]}
                color="blue"
              />
              <ComparisonCard
                title="Ocupación"
                periods={[
                  { id: 'month', label: 'Mes' },
                  { id: 'year', label: 'Año' },
                ]}
                current={{ value: '94%', label: 'Actual' }}
                previous={{ value: '91%', label: 'Anterior' }}
                change={{ value: 3, isPositive: true }}
                chart={[88, 90, 89, 92, 91, 94]}
                color="green"
              />
            </div>

            {/* Quick Stats Card */}
            <h2 className={styles.sectionTitle}>Quick Stats Card (Resumen Rápido)</h2>
            <QuickStatsCard
              title="Resumen del Mes"
              stats={[
                { label: 'Ingresos', value: '$2.4M', change: 12, color: 'blue' },
                { label: 'Cobrado', value: '94%', change: 3, color: 'green' },
                { label: 'Pendiente', value: '$150K', change: -8, color: 'orange' },
                { label: 'Vencido', value: '$45K', change: 15, color: 'red' },
              ]}
              columns={4}
            />

            {/* Widget Card */}
            <h2 className={styles.sectionTitle}>Widget Card (Acciones del Dashboard)</h2>
            <WidgetCard
              title="Acciones Rápidas"
              subtitle="Gestiona tu cartera inmobiliaria"
              items={[
                { id: '1', icon: <Plus size={24} />, label: 'Nuevo Contrato', color: 'blue', onClick: () => {} },
                { id: '2', icon: <Receipt size={24} />, label: 'Cobrar Pago', badge: 5, color: 'green', onClick: () => {} },
                { id: '3', icon: <Bell size={24} />, label: 'Notificaciones', badge: 3, color: 'purple', onClick: () => {} },
                { id: '4', icon: <Calendar size={24} />, label: 'Vencimientos', color: 'orange', onClick: () => {} },
                { id: '5', icon: <Users size={24} />, label: 'Inquilinos', color: 'cyan', onClick: () => {} },
                { id: '6', icon: <Building2 size={24} />, label: 'Propiedades', color: 'blue', onClick: () => {} },
                { id: '7', icon: <FileText size={24} />, label: 'Documentos', color: 'purple', onClick: () => {} },
                { id: '8', icon: <BarChart3 size={24} />, label: 'Reportes', color: 'green', onClick: () => {} },
              ]}
              columns={4}
            />

            {/* Glow Cards */}
            <h2 className={styles.sectionTitle}>Glow Cards (Efectos Especiales)</h2>
            <div className={styles.grid3}>
              <GlowCard variant="default" color="blue" glow>
                <div className={styles.glowCardContent}>
                  <DollarSign size={32} />
                  <span className={styles.glowValue}>$2.4M</span>
                  <span className={styles.glowLabel}>Recaudación Total</span>
                </div>
              </GlowCard>
              <GlowCard variant="gradient" color="purple" glow>
                <div className={styles.glowCardContent}>
                  <TrendingUp size={32} />
                  <span className={styles.glowValue}>+24%</span>
                  <span className={styles.glowLabel}>Crecimiento Anual</span>
                </div>
              </GlowCard>
              <GlowCard variant="gradient" color="multi" glow animated>
                <div className={styles.glowCardContent}>
                  <Zap size={32} />
                  <span className={styles.glowValue}>Premium</span>
                  <span className={styles.glowLabel}>Efecto Animado</span>
                </div>
              </GlowCard>
            </div>

            {/* Analytics Card */}
            <h2 className={styles.sectionTitle}>Analytics Cards (Gráficos Interactivos)</h2>
            <div className={styles.grid2}>
              <AnalyticsCard
                title="Distribución por Tipo"
                subtitle="Propiedades en cartera"
                type="donut"
                data={[
                  { label: 'Departamentos', value: 28, color: '#3B82F6' },
                  { label: 'Casas', value: 12, color: '#8B5CF6' },
                  { label: 'Locales', value: 5, color: '#10B981' },
                  { label: 'Cocheras', value: 3, color: '#F59E0B' },
                ]}
                height={180}
              />
              <AnalyticsCard
                title="Ingresos por Mes"
                subtitle="Últimos 6 meses"
                modes={[
                  { id: 'bar', label: 'Barras' },
                  { id: 'line', label: 'Línea' },
                ]}
                type="bar"
                data={[
                  { label: 'Jul', value: 1800000 },
                  { label: 'Ago', value: 2100000 },
                  { label: 'Sep', value: 1950000 },
                  { label: 'Oct', value: 2300000 },
                  { label: 'Nov', value: 2150000 },
                  { label: 'Dic', value: 2450000 },
                ]}
                height={200}
              />
            </div>

            {/* Base Cards */}
            <h2 className={styles.sectionTitle}>Base Cards</h2>
            <div className={styles.grid3}>
              <Card>
                <CardHeader title="Card Default" subtitle="Con subtítulo" />
                <CardContent>
                  <p>Contenido de la card con estilo default.</p>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader title="Card Elevated" action={<Button variant="ghost" size="sm">Acción</Button>} />
                <CardContent>
                  <p>Card con sombra elevada.</p>
                </CardContent>
              </Card>

              <Card variant="gradient">
                <CardContent>
                  <div className={styles.gradientCardContent}>
                    <Calendar size={24} />
                    <span className={styles.gradientValue}>4</span>
                    <span className={styles.gradientLabel}>Contratos por vencer</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* PREMIUM CARDS SECTION */}
        {activeTab === 'premium' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>✨ Premium Cards - World Class UI</h2>

            {/* Trend Cards */}
            <h3 className={styles.subsectionTitle}>Trend Cards (Animated Data)</h3>
            <div className={styles.grid2}>
              <TrendCard
                title="Ingresos Mensuales"
                value={2450000}
                previousValue={2100000}
                format="currency"
                data={[1800, 2100, 1950, 2300, 2150, 2450]}
                color="blue"
                showPulse
              />
              <TrendCard
                title="Tasa de Ocupación"
                value={94}
                previousValue={91}
                format="percentage"
                data={[88, 90, 89, 92, 91, 94]}
                color="green"
              />
            </div>

            {/* Counter Cards */}
            <h3 className={styles.subsectionTitle}>Counter Cards (Animated Numbers)</h3>
            <div className={styles.grid4}>
              <CounterCard
                title="Propiedades"
                value={48}
                icon={<Home size={28} />}
                color="blue"
                size="md"
              />
              <CounterCard
                title="Ingresos"
                value={2450000}
                prefix="$"
                icon={<DollarSign size={28} />}
                color="green"
                size="md"
                glowing
              />
              <CounterCard
                title="Contratos"
                value={28}
                icon={<FileText size={28} />}
                color="purple"
                size="md"
              />
              <CounterCard
                title="Ocupación"
                value={94}
                suffix="%"
                icon={<Target size={28} />}
                color="cyan"
                size="md"
                glowing
              />
            </div>

            {/* Gauge Cards */}
            <h3 className={styles.subsectionTitle}>Gauge Cards (Animated Indicators)</h3>
            <div className={styles.grid3}>
              <GaugeCard
                title="Ocupación"
                value={94}
                maxValue={100}
                unit="%"
                size="md"
                thresholds={{ warning: 70, danger: 90 }}
              />
              <GaugeCard
                title="Cobranza"
                value={78}
                maxValue={100}
                unit="%"
                size="md"
                thresholds={{ warning: 60, danger: 40 }}
              />
              <GaugeCard
                title="Rendimiento"
                value={85}
                maxValue={100}
                unit="%"
                size="md"
              />
            </div>

            {/* Radial Progress */}
            <h3 className={styles.subsectionTitle}>Radial Progress Cards</h3>
            <div className={styles.grid2}>
              <RadialProgressCard
                title="Distribución de Propiedades"
                segments={[
                  { value: 28, color: '#3B82F6', label: 'Departamentos' },
                  { value: 12, color: '#8B5CF6', label: 'Casas' },
                  { value: 5, color: '#10B981', label: 'Locales' },
                  { value: 3, color: '#F59E0B', label: 'Cocheras' },
                ]}
                centerValue="48"
                centerLabel="Total"
                size="lg"
              />
              <RadialProgressCard
                title="Estado de Pagos"
                segments={[
                  { value: 75, color: '#10B981', label: 'Cobrados' },
                  { value: 15, color: '#F59E0B', label: 'Pendientes' },
                  { value: 10, color: '#EF4444', label: 'Vencidos' },
                ]}
                centerValue="75%"
                centerLabel="Cobrado"
                size="lg"
              />
            </div>

            {/* Split Cards */}
            <h3 className={styles.subsectionTitle}>Split Cards (VS Comparison)</h3>
            <SplitCard
              leftTitle="Este Mes"
              rightTitle="Mes Anterior"
              leftValue="$2.4M"
              rightValue="$2.1M"
              leftSubtitle="28 pagos"
              rightSubtitle="25 pagos"
              leftIcon={<TrendingUp size={24} />}
              rightIcon={<TrendingUp size={24} />}
              leftColor="green"
              rightColor="blue"
              comparison={{ winner: 'left', difference: '+14%' }}
            />

            {/* Timeline Cards */}
            <h3 className={styles.subsectionTitle}>Timeline Cards</h3>
            <TimelineCard
              title="Actividad Reciente"
              events={[
                { id: '1', title: 'Pago recibido', description: 'Juan Pérez - Alquiler Diciembre', time: 'Hace 2h', status: 'completed', color: 'green' },
                { id: '2', title: 'Contrato renovado', description: 'Av. Corrientes 1234 - 5A', time: 'Hace 5h', status: 'completed', color: 'blue' },
                { id: '3', title: 'Inspección programada', description: 'Belgrano 567 - PB', time: 'Mañana', status: 'current', color: 'purple' },
                { id: '4', title: 'Vencimiento de contrato', description: 'María González', time: 'En 15 días', status: 'upcoming', color: 'orange' },
              ]}
              variant="detailed"
            />

            {/* Leaderboard Cards */}
            <h3 className={styles.subsectionTitle}>Leaderboard Cards</h3>
            <LeaderboardCard
              title="Top Propiedades por Ingresos"
              subtitle="Últimos 30 días"
              valueLabel="Ingresos"
              items={[
                { id: '1', rank: 1, name: 'Av. Corrientes 1234 - 5A', value: '$450.000', change: 12 },
                { id: '2', rank: 2, name: 'Belgrano 567 - PB', value: '$380.000', change: 8 },
                { id: '3', rank: 3, name: 'Palermo 890 - 3B', value: '$320.000', change: -3 },
                { id: '4', rank: 4, name: 'Recoleta 456 - 2A', value: '$290.000', change: 5 },
                { id: '5', rank: 5, name: 'Caballito 123 - 1C', value: '$250.000', change: 2 },
              ]}
            />

            {/* Heatmap Cards */}
            <h3 className={styles.subsectionTitle}>Heatmap Cards</h3>
            <HeatmapCard
              title="Ocupación por Edificio y Mes"
              subtitle="Porcentaje de ocupación"
              rows={['Torre A', 'Torre B', 'Torre C', 'Torre D']}
              cols={['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']}
              data={[
                { row: 'Torre A', col: 'Jul', value: 85 },
                { row: 'Torre A', col: 'Ago', value: 90 },
                { row: 'Torre A', col: 'Sep', value: 88 },
                { row: 'Torre A', col: 'Oct', value: 95 },
                { row: 'Torre A', col: 'Nov', value: 92 },
                { row: 'Torre A', col: 'Dic', value: 98 },
                { row: 'Torre B', col: 'Jul', value: 78 },
                { row: 'Torre B', col: 'Ago', value: 82 },
                { row: 'Torre B', col: 'Sep', value: 85 },
                { row: 'Torre B', col: 'Oct', value: 88 },
                { row: 'Torre B', col: 'Nov', value: 90 },
                { row: 'Torre B', col: 'Dic', value: 94 },
                { row: 'Torre C', col: 'Jul', value: 92 },
                { row: 'Torre C', col: 'Ago', value: 94 },
                { row: 'Torre C', col: 'Sep', value: 91 },
                { row: 'Torre C', col: 'Oct', value: 96 },
                { row: 'Torre C', col: 'Nov', value: 98 },
                { row: 'Torre C', col: 'Dic', value: 100 },
                { row: 'Torre D', col: 'Jul', value: 70 },
                { row: 'Torre D', col: 'Ago', value: 75 },
                { row: 'Torre D', col: 'Sep', value: 72 },
                { row: 'Torre D', col: 'Oct', value: 80 },
                { row: 'Torre D', col: 'Nov', value: 85 },
                { row: 'Torre D', col: 'Dic', value: 88 },
              ]}
              colorScale="green"
              showValues
            />

            {/* Status Cards */}
            <h3 className={styles.subsectionTitle}>Status Cards</h3>
            <div className={styles.grid3}>
              <StatusCard
                title="API Server"
                status="online"
                icon={<Server size={20} />}
                metrics={[
                  { label: 'Uptime', value: '99.9%' },
                  { label: 'Latencia', value: '45ms' },
                ]}
                lastUpdated="Hace 30 seg"
              />
              <StatusCard
                title="Base de Datos"
                status="warning"
                statusText="Alta carga"
                icon={<Activity size={20} />}
                metrics={[
                  { label: 'Conexiones', value: '85/100' },
                  { label: 'Queries/s', value: '1.2k' },
                ]}
                lastUpdated="Hace 1 min"
              />
              <StatusCard
                title="Pagos"
                status="error"
                statusText="Fallo"
                icon={<CreditCard size={20} />}
                metrics={[
                  { label: 'Pendientes', value: 3 },
                  { label: 'Fallidos', value: 1 },
                ]}
                lastUpdated="Hace 5 min"
              />
            </div>

            {/* Gradient Border Cards */}
            <h3 className={styles.subsectionTitle}>Gradient Border Cards</h3>
            <div className={styles.grid3}>
              <GradientBorderCard gradient="blue-purple" animated glowIntensity="medium" hoverEffect="lift">
                <div className={styles.glowCardContent}>
                  <Sparkles size={32} />
                  <span className={styles.glowValue}>Premium</span>
                  <span className={styles.glowLabel}>Blue → Purple</span>
                </div>
              </GradientBorderCard>
              <GradientBorderCard gradient="green-cyan" animated glowIntensity="medium" hoverEffect="glow">
                <div className={styles.glowCardContent}>
                  <Award size={32} />
                  <span className={styles.glowValue}>Success</span>
                  <span className={styles.glowLabel}>Green → Cyan</span>
                </div>
              </GradientBorderCard>
              <GradientBorderCard gradient="rainbow" animated glowIntensity="strong" hoverEffect="scale">
                <div className={styles.glowCardContent}>
                  <Zap size={32} />
                  <span className={styles.glowValue}>Rainbow</span>
                  <span className={styles.glowLabel}>Full Spectrum</span>
                </div>
              </GradientBorderCard>
            </div>
          </div>
        )}

        {/* DATA DISPLAY SECTION */}
        {activeTab === 'data' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Data Display</h2>

            <Card>
              <CardHeader title="Badges" />
              <CardContent>
                <div className={styles.row}>
                  <Badge>Default</Badge>
                  <Badge variant="success">Pagado</Badge>
                  <Badge variant="warning">Pendiente</Badge>
                  <Badge variant="error">Vencido</Badge>
                  <Badge variant="info">Info</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Avatars" />
              <CardContent>
                <div className={styles.row}>
                  <Avatar name="María González" size="xs" />
                  <Avatar name="Juan Pérez" size="sm" />
                  <Avatar name="Carlos López" size="md" />
                  <Avatar name="Ana Martínez" size="lg" />
                  <Avatar name="Pedro García" size="xl" />
                </div>
                <div className={styles.row} style={{ marginTop: 16 }}>
                  <Avatar name="Online" size="md" status="online" />
                  <Avatar name="Offline" size="md" status="offline" />
                  <Avatar name="Busy" size="md" status="busy" />
                  <Avatar name="Away" size="md" status="away" />
                </div>
                <div className={styles.row} style={{ marginTop: 16 }}>
                  <AvatarGroup max={3}>
                    <Avatar name="María" size="md" />
                    <Avatar name="Juan" size="md" />
                    <Avatar name="Carlos" size="md" />
                    <Avatar name="Ana" size="md" />
                    <Avatar name="Pedro" size="md" />
                  </AvatarGroup>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Table" action={<Button size="sm" leftIcon={<Plus size={14} />}>Agregar</Button>} />
              <CardContent>
                <Table
                  columns={[
                    { key: 'name', header: 'Nombre' },
                    { key: 'email', header: 'Email' },
                    { key: 'role', header: 'Rol' },
                    {
                      key: 'status',
                      header: 'Estado',
                      render: (item) => (
                        <Badge variant={item.status === 'Activo' ? 'success' : 'default'}>
                          {item.status as string}
                        </Badge>
                      ),
                    },
                  ]}
                  data={sampleTableData}
                  onRowClick={(item) => console.log('Clicked:', item)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Task Items" />
              <CardContent>
                <div className={styles.taskList}>
                  <TaskItem title="Renovar contrato" subtitle="Vence en 15 días" status="pending" priority="high" dueDate="08 Ene" />
                  <TaskItem title="Cobrar alquiler" subtitle="Juan Pérez" status="overdue" priority="high" dueDate="Vencido" />
                  <TaskItem title="Inspección" subtitle="Belgrano 567" status="in_progress" priority="medium" dueDate="10 Ene" />
                  <TaskItem title="Documentación" subtitle="3 contratos" status="completed" priority="low" dueDate="Completado" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Empty State" />
              <CardContent>
                <EmptyState
                  icon={<Package />}
                  title="No hay propiedades"
                  description="Comienza agregando tu primera propiedad para gestionar tus alquileres."
                  action={<Button leftIcon={<Plus size={16} />}>Agregar propiedad</Button>}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* CHARTS SECTION */}
        {activeTab === 'charts' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Charts & Visualization</h2>

            <div className={styles.grid2}>
              <Card>
                <CardHeader title="Progress Ring" />
                <CardContent>
                  <div className={styles.row}>
                    <ProgressRing value={78} size="sm" color="primary" label="Cobrado" />
                    <ProgressRing value={65} size="md" color="success" label="Ocupación" />
                    <ProgressRing value={45} size="lg" color="warning" label="Pendiente" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Mini Chart" />
                <CardContent>
                  <div className={styles.chartRow}>
                    <div>
                      <span className={styles.chartLabel}>Ingresos</span>
                      <MiniChart data={miniChartData} color="success" height={60} />
                    </div>
                    <div>
                      <span className={styles.chartLabel}>Ocupación</span>
                      <MiniChart data={[80, 75, 82, 78, 85, 90, 88, 92]} color="primary" height={60} />
                    </div>
                    <div>
                      <span className={styles.chartLabel}>Vencimientos</span>
                      <MiniChart data={[10, 15, 8, 12, 20, 18, 25, 22]} color="warning" height={60} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader title="Bar Chart - Horizontal" />
              <CardContent>
                <BarChart data={chartData} horizontal showValues />
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Bar Chart - Vertical" />
              <CardContent>
                <BarChart data={chartData} showValues />
              </CardContent>
            </Card>
          </div>
        )}

        {/* FEEDBACK SECTION */}
        {activeTab === 'feedback' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Feedback & Overlays</h2>

            <Card>
              <CardHeader title="Modal" />
              <CardContent>
                <Button onClick={() => setIsModalOpen(true)}>Abrir Modal</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Toasts" />
              <CardContent>
                <div className={styles.toastGrid}>
                  <Toast variant="success" title="Operación exitosa" description="El pago se registró correctamente." />
                  <Toast variant="error" title="Error" description="No se pudo procesar la solicitud." />
                  <Toast variant="warning" title="Atención" description="El contrato está próximo a vencer." />
                  <Toast variant="info" title="Información" description="Tienes 3 notificaciones nuevas." />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Tabs - Variantes" />
              <CardContent>
                <div className={styles.tabsDemo}>
                  <div>
                    <span className={styles.demoLabel}>Underline</span>
                    <Tabs
                      tabs={[
                        { id: '1', label: 'General' },
                        { id: '2', label: 'Pagos', badge: 3 },
                        { id: '3', label: 'Documentos' },
                      ]}
                      activeTab="1"
                      onTabChange={() => {}}
                      variant="underline"
                    />
                  </div>
                  <div>
                    <span className={styles.demoLabel}>Pills</span>
                    <Tabs
                      tabs={[
                        { id: '1', label: 'Todos' },
                        { id: '2', label: 'Activos' },
                        { id: '3', label: 'Inactivos' },
                      ]}
                      activeTab="1"
                      onTabChange={() => {}}
                      variant="underline"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* REPORTS SECTION */}
        {activeTab === 'reports' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>📊 Report Components</h2>
            <p className={styles.sectionDesc}>Componentes especializados para el sistema de reportes y análisis</p>

            {/* Report Cards */}
            <h3 className={styles.subsectionTitle}>Report Cards (Navegación de Reportes)</h3>
            <div className={styles.grid2}>
              <ReportCard
                icon={<DollarSign size={24} />}
                iconColor="blue"
                title="Resultado del Período"
                description="Resumen de ingresos y egresos netos en el período seleccionado."
                format="Excel / PDF recomendado"
                onClick={() => console.log('Resultado del Período')}
              />
              <ReportCard
                icon={<Receipt size={24} />}
                iconColor="purple"
                title="Movimientos Financieros"
                description="Detalle de todas las entradas y salidas de efectivo registradas."
                format="Excel / PDF recomendado"
                onClick={() => console.log('Movimientos')}
              />
              <ReportCard
                icon={<Percent size={24} />}
                iconColor="green"
                title="Comisiones Cobradas"
                description="Lista de todas las comisiones cobradas por alquileres y servicios."
                format="Excel / PDF recomendado"
                onClick={() => console.log('Comisiones')}
              />
              <ReportCard
                icon={<Users size={24} />}
                iconColor="orange"
                title="Liquidaciones Mensuales"
                description="Balance de liquidaciones por propietario en el período."
                format="Excel / PDF recomendado"
                onClick={() => console.log('Liquidaciones')}
              />
            </div>

            {/* Period Selector */}
            <h3 className={styles.subsectionTitle}>Period Selector</h3>
            <Card>
              <CardContent>
                <div className={styles.row}>
                  <PeriodSelector
                    value="current-month"
                    onChange={(v) => console.log('Period:', v)}
                  />
                  <PeriodSelector
                    value="last-3-months"
                    onChange={(v) => console.log('Period:', v)}
                    options={[
                      { value: 'last-3-months', label: 'Últimos 3 meses' },
                      { value: 'last-6-months', label: 'Últimos 6 meses' },
                      { value: 'this-year', label: 'Este año' },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Filter Chips */}
            <h3 className={styles.subsectionTitle}>Filter Chips</h3>
            <Card>
              <CardContent>
                <FilterChips
                  chips={[
                    { id: '1', label: 'Todos los propietarios', icon: <Users size={14} />, hasDropdown: true },
                    { id: '2', label: 'Todas las propiedades', icon: <Building2 size={14} />, hasDropdown: true },
                    { id: '3', label: 'Todos los contratos', icon: <FileText size={14} />, hasDropdown: true },
                    { id: '4', label: 'Pagado', removable: true },
                    { id: '5', label: 'Abril 2024', removable: true },
                  ]}
                  onRemove={(id) => console.log('Remove:', id)}
                  onClick={(id) => console.log('Click:', id)}
                />
              </CardContent>
            </Card>

            {/* Entity Header */}
            <h3 className={styles.subsectionTitle}>Entity Header (Propietario)</h3>
            <EntityHeader
              name="Facundo Esquivel"
              email="facu@uesquil.com"
              phone="+54 3794-787878"
              balance={706800}
              status="liquidada"
            />
            <div style={{ marginTop: 16 }}>
              <EntityHeader
                name="María Elena González"
                email="megonzalez@email.com"
                phone="+54 11 5555-1234"
                balance={-150000}
                status="pendiente"
              />
            </div>

            {/* Summary Panel */}
            <h3 className={styles.subsectionTitle}>Summary Panel</h3>
            <div className={styles.grid2}>
              <SummaryPanel
                title="Resumen Abril 2024"
                items={[
                  { label: 'Cobrado', value: 779000, color: 'success' },
                  { label: 'Ajustes', value: -50000, color: 'error' },
                  { label: 'Comisión', value: -22200, color: 'warning' },
                ]}
                total={{ label: 'Saldo a Liquidar', value: 706800 }}
                actions={{
                  customAction: {
                    label: 'Registrar Pago al Propietario',
                    icon: <DollarSign size={16} />,
                    onClick: () => console.log('Registrar pago'),
                  },
                  onExportPDF: () => console.log('Export PDF'),
                  onExportCSV: () => console.log('Export CSV'),
                }}
              />
              <SummaryPanel
                title="Totales del Período"
                items={[
                  { label: 'Ingresos', value: 2254000, color: 'success' },
                  { label: 'Egresos', value: -786000, color: 'error' },
                  { label: 'Resultado Neto', value: 1393000, color: 'success', bold: true },
                ]}
                actions={{
                  onExportPDF: () => console.log('Export PDF'),
                  onExportCSV: () => console.log('Export CSV'),
                }}
              />
            </div>

            {/* Data Table Report */}
            <h3 className={styles.subsectionTitle}>Data Table Report</h3>
            <DataTableReport
              title="Resumen de Liquidaciones - Abril 2024"
              showAvatar
              columns={[
                { key: 'name', header: 'Propietario' },
                { key: 'category', header: 'Categoría', render: (item) => (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Badge variant="success">{String(item.egresos)} Egresos</Badge>
                    <Badge variant="info">{String(item.inmuebles)} inmuebles</Badge>
                  </div>
                )},
                { key: 'ajustes', header: 'Ajustes / Deuda', align: 'right' },
                { key: 'comision', header: 'Comisión', align: 'right', render: (item) => (
                  <span style={{ color: '#ef4444' }}>{String(item.comision)}</span>
                )},
                { key: 'aLiquidar', header: 'A Liquidar', align: 'right', render: (item) => (
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>{String(item.aLiquidar)}</span>
                )},
              ]}
              data={[
                { name: 'Facundo Esquivel', email: 'facu@uesquil.com', egresos: 4, inmuebles: 3, ajustes: '$779.000', comision: '-$50.000', aLiquidar: '$706.800' },
                { name: 'María Elena González', email: 'megonzalez@email.com', egresos: 5, inmuebles: 7, ajustes: '$576.000', comision: '-$120.000', aLiquidar: '$222.200' },
                { name: 'Juan Carlos Pérez', email: 'jopercz@email.com', egresos: 3, inmuebles: 6, ajustes: '$726.000', comision: '-$110.000', aLiquidar: '$593.800' },
                { name: 'Roberto Fernández', email: 'rfernandez@email.com', egresos: 3, inmuebles: 6, ajustes: '$173.000', comision: '-$50.000', aLiquidar: '$100.800' },
              ]}
              totals={{
                ajustes: 2254000,
                comision: -330000,
                aLiquidar: 1834800,
              }}
              onRowClick={(item) => console.log('Row clicked:', item)}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Contrato"
        subtitle="Complete los datos del contrato"
        size="md"
      >
        <div className={styles.formStack}>
          <Select
            label="Propiedad"
            placeholder="Seleccione una propiedad"
            options={[
              { value: '1', label: 'Av. Corrientes 1234 - 5A' },
              { value: '2', label: 'Belgrano 567 - PB' },
            ]}
            fullWidth
          />
          <Select
            label="Inquilino"
            placeholder="Seleccione un inquilino"
            options={[
              { value: '1', label: 'María González' },
              { value: '2', label: 'Juan Pérez' },
            ]}
            fullWidth
          />
          <div className={styles.formRow}>
            <Input label="Fecha inicio" type="date" fullWidth />
            <Input label="Fecha fin" type="date" fullWidth />
          </div>
          <Input label="Monto mensual" placeholder="$0.00" leftIcon={<DollarSign size={18} />} fullWidth />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          <Button onClick={() => setIsModalOpen(false)}>Crear Contrato</Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  )
}
