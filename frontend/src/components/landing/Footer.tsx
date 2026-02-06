'use client'

import Link from 'next/link'
import { Building2, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'
import styles from './landing.module.css'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <div className={styles.footerLogoIcon}>
                <Building2 style={{ width: 20, height: 20, color: 'white' }} />
              </div>
              <span className={styles.footerLogoText}>InmoDash</span>
            </div>
            <p className={styles.footerDescription}>
              La plataforma todo-en-uno para inmobiliarias modernas. Automatiza, optimiza y crece con IA.
            </p>
            <div className={styles.footerSocial}>
              <a href="#" className={styles.socialLink}><Facebook style={{ width: 16, height: 16 }} /></a>
              <a href="#" className={styles.socialLink}><Twitter style={{ width: 16, height: 16 }} /></a>
              <a href="#" className={styles.socialLink}><Instagram style={{ width: 16, height: 16 }} /></a>
              <a href="#" className={styles.socialLink}><Linkedin style={{ width: 16, height: 16 }} /></a>
            </div>
          </div>

          <div className={styles.footerSection}>
            <h3>Producto</h3>
            <ul className={styles.footerLinks}>
              <li><Link href="/#features" className={styles.footerLink}>Características</Link></li>
              <li><Link href="/pricing" className={styles.footerLink}>Precios</Link></li>
              <li><Link href="/#testimonials" className={styles.footerLink}>Testimonios</Link></li>
              <li><a href="#" className={styles.footerLink}>Roadmap</a></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h3>Empresa</h3>
            <ul className={styles.footerLinks}>
              <li><a href="#" className={styles.footerLink}>Sobre Nosotros</a></li>
              <li><a href="#" className={styles.footerLink}>Blog</a></li>
              <li><a href="#" className={styles.footerLink}>Carreras</a></li>
              <li><a href="#" className={styles.footerLink}>Contacto</a></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h3>Contacto</h3>
            <ul className={styles.footerContact}>
              <li className={styles.footerContactItem}>
                <Mail className={styles.footerContactIcon} style={{ width: 16, height: 16 }} />
                <a href="mailto:info@inmodash.com" className={styles.footerContactLink}>info@inmodash.com</a>
              </li>
              <li className={styles.footerContactItem}>
                <Phone className={styles.footerContactIcon} style={{ width: 16, height: 16 }} />
                <a href="tel:+5491112345678" className={styles.footerContactLink}>+54 9 11 1234-5678</a>
              </li>
              <li className={styles.footerContactItem}>
                <MapPin className={styles.footerContactIcon} style={{ width: 16, height: 16 }} />
                <span className={styles.footerContactText}>Buenos Aires, Argentina</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.footerBottomContent}>
            <p className={styles.footerCopyright}>© {currentYear} InmoDash. Todos los derechos reservados.</p>
            <div className={styles.footerLegal}>
              <Link href="/legal/privacy" className={styles.footerLegalLink}>Privacidad</Link>
              <Link href="/legal/terms" className={styles.footerLegalLink}>Términos</Link>
              <a href="#" className={styles.footerLegalLink}>Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
