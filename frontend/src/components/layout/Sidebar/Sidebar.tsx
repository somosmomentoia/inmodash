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
import styles from './Sidebar.module.css'

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
}

// Main navigation items
const mainNavItems: NavItem[] = [
  { icon: <LayoutDashboard size={22} />, label: 'Dashboard', href: '/dashboard' },
  { icon: <Users size={22} />, label: 'Prospectos', href: '/prospects' },
  { icon: <Building2 size={22} />, label: 'Alquileres', href: '/properties' },
  { icon: <FileText size={22} />, label: 'Contratos', href: '/contracts' },
  { icon: <Wallet size={22} />, label: 'Cuenta Corriente', href: '/obligations' },
  { icon: <PiggyBank size={22} />, label: 'Finanzas', href: '/finances' },
  { icon: <CheckSquare size={22} />, label: 'Tareas', href: '/tasks' },
  { icon: <FolderOpen size={22} />, label: 'Documentos', href: '/documents' },
  { icon: <FileBarChart size={22} />, label: 'Centro de Análisis', href: '/reports' },
]

// Tools & Integrations section
const toolsNavItems: NavItem[] = [
  { icon: <Plug size={22} />, label: 'Integraciones', href: '/integrations' },
]

// Settings section
const settingsNavItems: NavItem[] = [
  { icon: <Sliders size={22} />, label: 'Configuración', href: '/settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isExpanded, isPinned, setIsExpanded, setIsPinned } = useSidebar()
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { logout } = useAuth()

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
        {mainNavItems.map((item) => (
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
        <div className={styles.navSeparator} />

        {/* Tools & Integrations */}
        {toolsNavItems.map((item) => (
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
        <div className={styles.navSeparator} />

        {/* Settings Section */}
        {settingsNavItems.map((item) => (
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
