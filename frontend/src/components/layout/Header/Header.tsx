'use client'

import { useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { NotificationsDropdown } from '@/components/notifications'
import styles from './Header.module.css'

interface HeaderProps {
  title: string
  subtitle?: string
  userName?: string
  userAvatar?: string
}

export function Header({ title, subtitle, userName = 'Usuario', userAvatar }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className={styles.header}>
      {/* Left: Title */}
      <div className={styles.titleSection}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {/* Center: Search */}
      <div className={styles.searchWrapper}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Right: User & Notifications */}
      <div className={styles.rightSection}>
        <NotificationsDropdown />

        <div className={styles.userMenu}>
          <div className={styles.avatar}>
            {userAvatar ? (
              <img src={userAvatar} alt={userName} />
            ) : (
              <span>{userName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userName}</span>
            <ChevronDown size={16} className={styles.chevron} />
          </div>
        </div>
      </div>
    </header>
  )
}
