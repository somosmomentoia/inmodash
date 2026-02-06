'use client'

import { useRouter } from 'next/navigation'
import {
  DollarSign,
  Building2,
  Users,
  FileText,
  TrendingUp,
  Home,
  Receipt,
  Download,
  Clock,
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle,
  CreditCard,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { ReportCard } from '@/components/ui'
import styles from './reports.module.css'

interface QuickAccessReport {
  id: string
  title: string
  description: string
  icon: 'liquidaciones' | 'pagos' | 'mora'
  route: string
}

const quickAccessReports: QuickAccessReport[] = [
  { id: '1', title: 'Liquidaciones del Mes', description: 'Ver liquidaciones pendientes', icon: 'liquidaciones', route: '/reports/liquidaciones' },
  { id: '2', title: 'Pagos Recientes', description: 'Últimos pagos registrados', icon: 'pagos', route: '/reports/pagos' },
  { id: '3', title: 'Deudas Pendientes', description: 'Obligaciones vencidas', icon: 'mora', route: '/reports/mora' },
]

export default function ReportsPage() {
  const router = useRouter()

  const navigateToReport = (reportId: string) => {
    router.push(`/reports/${reportId}`)
  }

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'liquidaciones': return <Home size={18} />
      case 'pagos': return <CreditCard size={18} />
      case 'mora': return <AlertTriangle size={18} />
      default: return <FileText size={18} />
    }
  }

  return (
    <DashboardLayout title="Reportes" subtitle="Genera y exporta reportes de tu negocio">
      <div className={styles.mainLayout}>
        {/* Reports Grid */}
        <div className={styles.reportsGrid}>
          {/* Reportes Financieros */}
          <section className={styles.reportSection}>
            <h2 className={styles.sectionTitle}>Reportes Financieros</h2>
            <div className={styles.reportCards}>
              <ReportCard
                icon={<DollarSign size={24} />}
                iconColor="blue"
                title="Resultado del Período"
                description="Resumen de ingresos y egresos netos en el período seleccionado."
                format="Excel / PDF recomendado"
                onClick={() => navigateToReport('resultado-periodo')}
              />
              <ReportCard
                icon={<Receipt size={24} />}
                iconColor="purple"
                title="Movimientos Financieros"
                description="Detalle de todas las entradas y salidas de efectivo registradas."
                format="Excel / PDF recomendado"
                onClick={() => navigateToReport('movimientos')}
              />
              <ReportCard
                icon={<TrendingUp size={24} />}
                iconColor="green"
                title="Comisiones Cobradas"
                description="Lista de todas las comisiones cobradas por alquileres y servicios."
                format="Excel / PDF recomendado"
                onClick={() => navigateToReport('comisiones')}
              />
              <ReportCard
                icon={<Users size={24} />}
                iconColor="orange"
                title="Pagos de Propietarios a la Inmobiliaria"
                description="Pagos realizados independientemente de liquidaciones."
                format="Excel / PDF recomendado"
                onClick={() => navigateToReport('pagos-propietarios')}
              />
            </div>
          </section>

          {/* Liquidaciones y Propietarios */}
          <section className={styles.reportSection}>
            <h2 className={styles.sectionTitle}>Liquidaciones y Propietarios</h2>
            <div className={styles.reportCards}>
              <ReportCard
                icon={<Home size={24} />}
                iconColor="blue"
                title="Liquidaciones Mensuales"
                description="Balance de liquidaciones por propietario en el período."
                format="Excel / PDF recomendado"
                onClick={() => navigateToReport('liquidaciones')}
              />
              <ReportCard
                icon={<Users size={24} />}
                iconColor="purple"
                title="Estado de Cuenta por Propietario"
                description="Resumen detallado de ingresos y gastos por propietario."
                format="Excel / PDF recomendado"
                onClick={() => navigateToReport('estado-cuenta')}
              />
              <ReportCard
                icon={<Building2 size={24} />}
                iconColor="cyan"
                title="Listado de Propiedades"
                description="Tabla con toda la información de propiedades en el sistema."
                format="Excel / PDF recomendado"
                onClick={() => navigateToReport('propiedades')}
              />
            </div>
          </section>

          {/* Cobranza */}
          <section className={styles.reportSection}>
            <h2 className={styles.sectionTitle}>Cobranza</h2>
            <div className={styles.reportCards}>
              <ReportCard
                icon={<BarChart3 size={24} />}
                iconColor="blue"
                title="Cobranza por Mes"
                description="Ingresos por alquiler vs saldo pendiente, mes por mes."
                format="Excel / PDF recomendado"
                onClick={() => navigateToReport('cobranza')}
              />
              <ReportCard
                icon={<AlertTriangle size={24} />}
                iconColor="red"
                title="Mora y Deudas"
                description="Listado de alquileres vencidos organizados por antigüedad."
                format="PDF recomendado"
                onClick={() => navigateToReport('mora')}
              />
              <ReportCard
                icon={<CheckCircle size={24} />}
                iconColor="green"
                title="Pagos Registrados"
                description="Tabla con todos los pagos registrados en el período filtrado."
                format="Excel / PDF recomendado"
                onClick={() => navigateToReport('pagos')}
              />
            </div>
          </section>

          {/* Analíticas */}
          <section className={styles.reportSection}>
            <h2 className={styles.sectionTitle}>Analíticas</h2>
            <div className={styles.reportCards}>
              <ReportCard
                icon={<PieChart size={24} />}
                iconColor="purple"
                title="Dashboard Analítico"
                description="Visualización de métricas clave y tendencias del negocio."
                format="Vista interactiva"
                onClick={() => navigateToReport('analiticas')}
              />
              <ReportCard
                icon={<TrendingUp size={24} />}
                iconColor="green"
                title="Ingresos"
                description="Análisis detallado de ingresos por propietario y período."
                format="Excel / PDF recomendado"
                onClick={() => navigateToReport('ingresos')}
              />
            </div>
          </section>
        </div>

        {/* Quick Access Sidebar */}
        <aside className={styles.savedReports}>
          <h3 className={styles.savedTitle}>Acceso Rápido</h3>
          <div className={styles.savedList}>
            {quickAccessReports.map((report) => (
              <div 
                key={report.id} 
                className={styles.savedItem}
                onClick={() => router.push(report.route)}
                style={{ cursor: 'pointer' }}
              >
                <div className={`${styles.savedIcon} ${styles[report.icon]}`}>
                  {getReportIcon(report.icon)}
                </div>
                <div className={styles.savedInfo}>
                  <span className={styles.savedName}>{report.title}</span>
                  <span className={styles.savedSubtitle}>{report.description}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </DashboardLayout>
  )
}
