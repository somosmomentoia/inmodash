'use client'

import { ArrowRight, Play, Sparkles, TrendingUp, Users, Zap, Building2, Home, FileText, Wallet, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import styles from './landing.module.css'

export const Hero = () => {
  return (
    <section className={styles.hero}>

      <div className={styles.heroContainer}>
        <div className={styles.heroGrid}>
          {/* Left Content */}
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <Sparkles style={{ width: 16, height: 16 }} />
              <span>La plataforma inmobiliaria del futuro</span>
            </div>

            <h1 className={styles.heroTitle}>
              Gestiona tu negocio
              <span className={styles.heroTitleGradient}>con inteligencia</span>
            </h1>

            <p className={styles.heroDescription}>
              La plataforma todo-en-uno para inmobiliarias modernas. Automatiza, optimiza y crece con IA.
            </p>

            <div className={styles.heroButtons}>
              <Link href="/register">
                <button className={styles.btnPrimary}>
                  Comenzar Gratis
                  <ArrowRight style={{ width: 20, height: 20 }} />
                </button>
              </Link>
              <button className={styles.btnSecondary}>
                <Play style={{ width: 20, height: 20 }} />
                Ver Demo
              </button>
            </div>

            {/* Stats */}
            <div className={styles.heroStats}>
              {[
                { icon: Users, value: '500+', label: 'Clientes activos' },
                { icon: TrendingUp, value: '98%', label: 'Satisfacción' },
                { icon: Zap, value: '40%', label: 'Más productivo' },
              ].map((stat, index) => (
                <div key={index} className={styles.heroStat}>
                  <stat.icon className={styles.heroStatIcon} style={{ width: 24, height: 24 }} />
                  <div className={styles.heroStatValue}>{stat.value}</div>
                  <div className={styles.heroStatLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className={styles.heroPreview}>
            <div className={styles.dashboardMockup}>
              {/* Browser Bar */}
              <div className={styles.browserBar}>
                <div className={`${styles.browserDot} ${styles.browserDotRed}`} />
                <div className={`${styles.browserDot} ${styles.browserDotYellow}`} />
                <div className={`${styles.browserDot} ${styles.browserDotGreen}`} />
                <div className={styles.browserUrl} />
              </div>
              
              {/* Dashboard Layout */}
              <div className={styles.dashboardLayout}>
                {/* Sidebar */}
                <div className={styles.sidebar}>
                  <div className={styles.sidebarLogo}>
                    <div className={styles.sidebarLogoIcon}>
                      <Sparkles style={{ width: 16, height: 16, color: 'white' }} />
                    </div>
                    <div className={styles.sidebarLogoText}>
                      <div className={styles.sidebarLogoTitle} />
                      <div className={styles.sidebarLogoSub} />
                    </div>
                  </div>
                  
                  <div className={styles.sidebarMenu}>
                    {[1, 2, 3, 4, 5, 6, 7].map((item, i) => (
                      <div key={item} className={`${styles.sidebarItem} ${i === 0 ? styles.sidebarItemActive : ''}`}>
                        <div className={`${styles.sidebarItemIcon} ${i === 0 ? styles.sidebarItemIconActive : styles.sidebarItemIconInactive}`} />
                        <div className={`${styles.sidebarItemText} ${i === 0 ? styles.sidebarItemTextActive : styles.sidebarItemTextInactive}`} />
                      </div>
                    ))}
                  </div>
                  
                  <div className={styles.sidebarUser}>
                    <div className={styles.sidebarUserInner}>
                      <div className={styles.sidebarUserAvatar} />
                      <div className={styles.sidebarUserInfo}>
                        <div className={styles.sidebarUserName} />
                        <div className={styles.sidebarUserRole} />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Main Content */}
                <div className={styles.mainContent}>
                  <div className={styles.contentHeader}>
                    <div className={styles.contentHeaderLeft}>
                      <div className={styles.contentTitle} />
                      <div className={styles.contentSubtitle} />
                    </div>
                    <div className={styles.contentHeaderRight}>
                      <div className={`${styles.headerBtn} ${styles.headerBtnDefault}`} />
                      <div className={`${styles.headerBtn} ${styles.headerBtnAccent}`} />
                    </div>
                  </div>
                  
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <div className={`${styles.statCardIcon} ${styles.statCardIconBlue}`}>
                        <Building2 style={{ width: 14, height: 14, color: '#3b82f6' }} />
                      </div>
                      <div className={styles.statCardValue}>24</div>
                      <div className={styles.statCardLabel} />
                    </div>
                    <div className={styles.statCard}>
                      <div className={`${styles.statCardIcon} ${styles.statCardIconGreen}`}>
                        <TrendingUp style={{ width: 14, height: 14, color: '#10b981' }} />
                      </div>
                      <div className={styles.statCardValue}>156</div>
                      <div className={styles.statCardLabel} />
                    </div>
                    <div className={styles.statCard}>
                      <div className={`${styles.statCardIcon} ${styles.statCardIconPurple}`}>
                        <Users style={{ width: 14, height: 14, color: '#8b5cf6' }} />
                      </div>
                      <div className={styles.statCardValue}>89</div>
                      <div className={styles.statCardLabel} />
                    </div>
                  </div>
                  
                  <div className={styles.chartCard}>
                    <div className={styles.chartTitle} />
                    <div className={styles.chartBars}>
                      {[30, 50, 40, 70, 55, 85, 65, 75, 60, 90, 70, 80].map((height, i) => (
                        <div key={i} className={styles.chartBar} style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </div>
                  
                  <div className={styles.listItems}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={styles.listItem}>
                        <div className={styles.listItemIcon} />
                        <div className={styles.listItemContent}>
                          <div className={styles.listItemTitle} />
                          <div className={styles.listItemSub} />
                        </div>
                        <div className={styles.listItemBadge} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className={`${styles.floatingCard} ${styles.floatingCardTop}`}>
              <div className={styles.floatingCardHeader}>
                <div className={`${styles.floatingCardIcon} ${styles.floatingCardIconGreen}`}>
                  <TrendingUp style={{ width: 16, height: 16, color: '#10b981' }} />
                </div>
                <span className={styles.floatingCardTitle}>+32% cobranza</span>
              </div>
              <div className={styles.floatingCardSub}>Este mes</div>
            </div>

            <div className={`${styles.floatingCard} ${styles.floatingCardBottom}`}>
              <div className={styles.floatingCardHeader}>
                <div className={`${styles.floatingCardIcon} ${styles.floatingCardIconBlue}`}>
                  <Zap style={{ width: 16, height: 16, color: '#3b82f6' }} />
                </div>
                <span className={styles.floatingCardTitle}>12 contratos</span>
              </div>
              <div className={styles.floatingCardSub}>Activos este mes</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
