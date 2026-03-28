'use client'

import { useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Home,
  FileText,
  Wallet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Receipt,
  FolderOpen,
  PiggyBank,
  Plug,
  FileBarChart,
  Sliders,
  CheckSquare,
  Users,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSidebar } from '@/contexts/SidebarContext'
import { usePermissions } from '@/hooks/usePermissions'
import styles from './Sidebar.module.css'

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
  module?: string // Permission module name
}

// Main navigation items
const mainNavItems: NavItem[] = [
  { icon: <LayoutDashboard size={22} />, label: 'Dashboard', href: '/dashboard', module: 'dashboard' },
  { icon: <Users size={22} />, label: 'Prospectos', href: '/prospects', module: 'prospects' },
  { icon: <Building2 size={22} />, label: 'Alquileres', href: '/properties', module: 'properties' },
  { icon: <FileText size={22} />, label: 'Contratos', href: '/contracts', module: 'contracts' },
  { icon: <Wallet size={22} />, label: 'Cuenta Corriente', href: '/obligations', module: 'obligations' },
  { icon: <PiggyBank size={22} />, label: 'Finanzas', href: '/finances', module: 'finances' },
  { icon: <CheckSquare size={22} />, label: 'Tareas', href: '/tasks', module: 'tasks' },
  { icon: <FolderOpen size={22} />, label: 'Documentos', href: '/documents', module: 'documents' },
  { icon: <FileBarChart size={22} />, label: 'Centro de Análisis', href: '/reports', module: 'reports' },
]

// Tools & Integrations section
const toolsNavItems: NavItem[] = [
  { icon: <Plug size={22} />, label: 'Integraciones', href: '/integrations', module: 'integrations' },
]

// Settings section
const settingsNavItems: NavItem[] = [
  { icon: <Sliders size={22} />, label: 'Configuración', href: '/settings', module: 'settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isExpanded, isPinned, setIsExpanded, setIsPinned } = useSidebar()
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { logout } = useAuth()
  const { canViewModule, loading: permissionsLoading, isStaff, permissions } = usePermissions()

  // Filter navigation items based on permissions
  const visibleMainNavItems = mainNavItems.filter(item => {
    const canView = !item.module || canViewModule(item.module)
    if (item.module) {
      console.log(`🔍 Module ${item.module}: canView=${canView}, isStaff=${isStaff}`)
    }
    return canView
  })
  const visibleToolsNavItems = toolsNavItems.filter(item => 
    !item.module || canViewModule(item.module)
  )
  const visibleSettingsNavItems = settingsNavItems.filter(item => 
    !item.module || canViewModule(item.module)
  )

  // Debug log
  useEffect(() => {
    console.log('🎯 Sidebar permissions state:', { 
      isStaff, 
      permissionsCount: permissions.length,
      loading: permissionsLoading,
      visibleItems: visibleMainNavItems.length 
    })
  }, [isStaff, permissions, permissionsLoading, visibleMainNavItems])

  // Persist pinned state in localStorage
  useEffect(() => {
    const savedPinned = localStorage.getItem('sidebar-pinned')
    if (savedPinned === 'true') {
      setIsPinned(true)
      setIsExpanded(true)
    }
  }, [setIsPinned, setIsExpanded])

  useEffect(() => {
    localStorage.setItem('sidebar-pinned', isPinned.toString())
  }, [isPinned])

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    // Clients and Guarantors are now under Contracts
    if (href === '/contracts') {
      return pathname.startsWith('/contracts') || 
             pathname.startsWith('/clients') || 
             pathname.startsWith('/guarantors')
    }
    return pathname.startsWith(href)
  }

  const handleMouseEnter = useCallback(() => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current)
      collapseTimeoutRef.current = null
    }
    // Expand on hover
    if (!isExpanded) {
      setIsExpanded(true)
    }
  }, [isExpanded])

  const handleMouseLeave = useCallback(() => {
    if (!isPinned && isExpanded) {
      collapseTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false)
      }, 300)
    }
  }, [isPinned, isExpanded])

  const handleItemClick = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true)
    }
  }, [isExpanded])

  const togglePin = useCallback(() => {
    const newPinned = !isPinned
    setIsPinned(newPinned)
    if (newPinned) {
      setIsExpanded(true)
    }
  }, [isPinned, setIsPinned, setIsExpanded])

  return (
    <aside 
      className={`${styles.sidebar} ${isExpanded ? styles.expanded : ''} ${isPinned ? styles.pinned : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Building2 size={24} />
        </div>
        {isExpanded && <span className={styles.logoText}>InmoDash</span>}
      </div>

      {/* Main Navigation */}
      <nav className={styles.nav}>
        {visibleMainNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
            title={!isExpanded ? item.label : undefined}
            onClick={handleItemClick}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={`${styles.navLabel} ${isExpanded ? styles.navLabelVisible : ''}`}>{item.label}</span>
          </Link>
        ))}

        {/* Separator - Tools */}
        {visibleToolsNavItems.length > 0 && <div className={styles.navSeparator} />}

        {/* Tools & Integrations */}
        {visibleToolsNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
            title={!isExpanded ? item.label : undefined}
            onClick={handleItemClick}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={`${styles.navLabel} ${isExpanded ? styles.navLabelVisible : ''}`}>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className={styles.bottomActions}>
        {/* Separator - Settings */}
        {visibleSettingsNavItems.length > 0 && <div className={styles.navSeparator} />}

        {/* Settings Section */}
        {visibleSettingsNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
            title={!isExpanded ? item.label : undefined}
            onClick={handleItemClick}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={`${styles.navLabel} ${isExpanded ? styles.navLabelVisible : ''}`}>{item.label}</span>
          </Link>
        ))}

        <button
          className={styles.navItem}
          onClick={logout}
          title={!isExpanded ? 'Cerrar sesión' : undefined}
        >
          <span className={styles.navIcon}>
            <LogOut size={22} />
          </span>
          <span className={`${styles.navLabel} ${isExpanded ? styles.navLabelVisible : ''}`}>Cerrar sesión</span>
        </button>

        {/* Toggle/Pin Button */}
        <button
          className={`${styles.toggleButton} ${isPinned ? styles.toggleButtonPinned : ''}`}
          onClick={togglePin}
          title={isPinned ? 'Desfijar sidebar' : 'Fijar sidebar expandido'}
        >
          {isPinned ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </aside>
  )
}
