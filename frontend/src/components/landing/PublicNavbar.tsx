'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Menu, X, Sparkles, ArrowRight } from 'lucide-react'
import styles from './landing.module.css'

const navigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Características', href: '/#features' },
  { name: 'Precios', href: '/pricing' },
  { name: 'Testimonios', href: '/#testimonials' },
]

export const PublicNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Building2 style={{ width: 20, height: 20, color: 'white' }} />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>InmoDash</span>
            <span className={styles.logoPowered}>
              <Sparkles style={{ width: 10, height: 10 }} />
              Powered by Momento IA
            </span>
          </div>
        </Link>

        <div className={styles.navLinks}>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ''}`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className={styles.navButtons}>
          <Link href="/login">
            <button className={styles.btnLogin}>Iniciar Sesión</button>
          </Link>
          <Link href="/register">
            <button className={styles.btnCta}>
              Comenzar Gratis
              <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </Link>
        </div>

        <button className={styles.mobileMenuBtn} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileNavLinks}>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${styles.mobileNavLink} ${pathname === item.href ? styles.mobileNavLinkActive : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className={styles.mobileButtons}>
            <Link href="/login">
              <button className={styles.mobileLoginBtn} onClick={() => setMobileMenuOpen(false)}>
                Iniciar Sesión
              </button>
            </Link>
            <Link href="/register">
              <button className={styles.mobileCtaBtn} onClick={() => setMobileMenuOpen(false)}>
                Comenzar Gratis
                <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
