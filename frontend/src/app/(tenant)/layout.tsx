'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, 
  FileText, 
  CreditCard, 
  ScrollText,
  LogOut,
  ChevronDown,
  Building2,
  Menu,
  X
} from 'lucide-react'

interface TenantUser {
  id: number
  email: string
  name: string
  role: string
}

interface TenantInfo {
  id: number
  name: string
  contracts: {
    id: number
    apartmentId: number
    address: string
    startDate: string
    endDate: string
  }[]
}

interface TenantSession {
  user: TenantUser
  agency: { name: string }
  tenants: TenantInfo[]
}

const publicPaths = ['/tenant/login', '/tenant/activate']

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<TenantSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeContractId, setActiveContractId] = useState<number | null>(null)
  const [showContractSelector, setShowContractSelector] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const isPublicPath = publicPaths.some(path => pathname?.startsWith(path))

  // Ensure client-side only rendering to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      if (isPublicPath) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tenant/auth/me`, {
          credentials: 'include'
        })

        if (!response.ok) {
          router.push('/tenant/login')
          return
        }

        const data = await response.json()
        setSession(data)

        // Set first contract as active by default
        if (data.tenants?.[0]?.contracts?.[0]) {
          setActiveContractId(data.tenants[0].contracts[0].id)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/tenant/login')
      } finally {
        setLoading(false)
      }
    }

    if (mounted) {
      checkAuth()
    }
  }, [pathname, isPublicPath, router, mounted])

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tenant/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    router.push('/tenant/login')
  }

  // Get all contracts from all tenants
  const allContracts = session?.tenants?.flatMap(t => 
    t.contracts.map(c => ({ ...c, tenantName: t.name }))
  ) || []

  const activeContract = allContracts.find(c => c.id === activeContractId)

  // Public pages (login, activate) - render children directly
  if (isPublicPath) {
    return (
      <div className="tenant-portal">
        {children}
      </div>
    )
  }

  // Loading state - show spinner without layout
  if (!mounted || loading) {
    return (
      <div className="tenant-portal tp-flex tp-items-center tp-justify-center">
        <div className="tp-spinner" />
      </div>
    )
  }

  // Authenticated layout
  return (
    <div className="tenant-portal">
      {/* Header */}
      <header className="tp-header">
        <div className="tp-header-content">
          {/* Logo */}
          <div className="tp-header-left">
            <Link href="/tenant" className="tp-logo">
              <div className="tp-logo-icon">
                <Building2 size={18} />
              </div>
              <span className="tp-logo-text">Portal Inquilino</span>
            </Link>
            <span className="tp-agency-name">
              {session?.agency?.name}
            </span>
          </div>

          {/* User Menu */}
          <div className="tp-user-menu">
            <span className="tp-user-name">{session?.user?.name}</span>
            <button onClick={handleLogout} className="tp-logout-btn">
              <LogOut size={16} />
              <span>Salir</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="tp-mobile-menu-btn"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Contract Selector - Filtro Principal */}
      {allContracts.length > 0 && (
        <div className="tp-contract-bar">
          <div className="tp-contract-bar-content">
            <div className="tp-contract-selector">
              <span className="tp-contract-label">Propiedad:</span>
              <button
                onClick={() => setShowContractSelector(!showContractSelector)}
                className="tp-contract-btn"
              >
                <Home size={16} />
                <span className="tp-contract-address">
                  {activeContract?.address || 'Seleccionar'}
                </span>
                <ChevronDown size={16} className={showContractSelector ? 'tp-rotate' : ''} />
              </button>

              {showContractSelector && (
                <div className="tp-contract-dropdown">
                  {allContracts.map(contract => (
                    <button
                      key={contract.id}
                      onClick={() => {
                        setActiveContractId(contract.id)
                        setShowContractSelector(false)
                      }}
                      className={`tp-contract-option ${contract.id === activeContractId ? 'active' : ''}`}
                    >
                      <div className="tp-contract-option-title">{contract.address}</div>
                      <div className="tp-contract-option-subtitle">
                        Vigente hasta {new Date(contract.endDate).toLocaleDateString('es-AR')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="tp-nav">
        <div className="tp-nav-content">
          <NavTab href="/tenant" icon={<Home size={16} />}>
            Estado de Cuenta
          </NavTab>
          <NavTab href="/tenant/obligations" icon={<FileText size={16} />}>
            Obligaciones
          </NavTab>
          <NavTab href="/tenant/payments" icon={<CreditCard size={16} />}>
            Mis Pagos
          </NavTab>
          <NavTab href="/tenant/contract" icon={<ScrollText size={16} />}>
            Mi Contrato
          </NavTab>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="tp-mobile-menu">
          {/* Contract selector mobile */}
          {allContracts.length > 1 && (
            <div className="tp-mobile-contract">
              <span className="tp-contract-label">Propiedad:</span>
              <select 
                value={activeContractId || ''} 
                onChange={(e) => setActiveContractId(Number(e.target.value))}
                className="tp-select"
              >
                {allContracts.map(contract => (
                  <option key={contract.id} value={contract.id}>
                    {contract.address}
                  </option>
                ))}
              </select>
            </div>
          )}
          <nav className="tp-mobile-nav">
            <NavLink href="/tenant" icon={<Home size={18} />} onClick={() => setMobileMenuOpen(false)}>
              Estado de Cuenta
            </NavLink>
            <NavLink href="/tenant/obligations" icon={<FileText size={18} />} onClick={() => setMobileMenuOpen(false)}>
              Obligaciones
            </NavLink>
            <NavLink href="/tenant/payments" icon={<CreditCard size={18} />} onClick={() => setMobileMenuOpen(false)}>
              Mis Pagos
            </NavLink>
            <NavLink href="/tenant/contract" icon={<ScrollText size={18} />} onClick={() => setMobileMenuOpen(false)}>
              Mi Contrato
            </NavLink>
            <button onClick={handleLogout} className="tp-mobile-logout">
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="tp-main">
        {children}
      </main>

      {/* Footer */}
      <footer className="tp-footer">
        <p>Portal del Inquilino · Powered by InmoDash</p>
      </footer>
    </div>
  )
}

function NavTab({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/tenant' && pathname?.startsWith(href))

  return (
    <Link href={href} className={`tp-nav-tab ${isActive ? 'active' : ''}`}>
      {icon}
      {children}
    </Link>
  )
}

function NavLink({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/tenant' && pathname?.startsWith(href))

  return (
    <Link href={href} onClick={onClick} className={`tp-nav-tab ${isActive ? 'active' : ''}`}>
      {icon}
      {children}
    </Link>
  )
}
