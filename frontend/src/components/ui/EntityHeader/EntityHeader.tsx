'use client'

import { ReactNode } from 'react'
import { Mail, Phone, CheckCircle } from 'lucide-react'
import { Avatar } from '../Avatar'
import { Badge } from '../Badge'
import styles from './EntityHeader.module.css'

export interface EntityHeaderProps {
  name: string
  email?: string
  phone?: string
  balance?: number
  status?: 'liquidada' | 'pendiente' | 'parcial'
  avatarSize?: 'md' | 'lg' | 'xl'
  extra?: ReactNode
}

export function EntityHeader({
  name,
  email,
  phone,
  balance,
  status,
  avatarSize = 'lg',
  extra,
}: EntityHeaderProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'liquidada':
        return <Badge variant="success"><CheckCircle size={12} /> Liquidada</Badge>
      case 'pendiente':
        return <Badge variant="warning">Pendiente</Badge>
      case 'parcial':
        return <Badge variant="info">Parcial</Badge>
      default:
        return null
    }
  }

  return (
    <div className={styles.header}>
      <div className={styles.info}>
        <Avatar name={name} size={avatarSize} />
        <div className={styles.details}>
          <div className={styles.nameRow}>
            <h2 className={styles.name}>{name}</h2>
            {getStatusBadge()}
          </div>
          {email && (
            <div className={styles.contact}>
              <Mail size={14} />
              <span>{email}</span>
            </div>
          )}
          {phone && (
            <div className={styles.contact}>
              <Phone size={14} />
              <span>{phone}</span>
            </div>
          )}
          {extra}
        </div>
      </div>
      {balance !== undefined && (
        <div className={styles.balance}>
          <span className={`${styles.balanceValue} ${balance >= 0 ? styles.positive : styles.negative}`}>
            {formatCurrency(balance)}
          </span>
        </div>
      )}
    </div>
  )
}
