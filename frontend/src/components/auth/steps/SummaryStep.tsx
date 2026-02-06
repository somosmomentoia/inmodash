'use client'

import { User, Building2 } from 'lucide-react'
import { RegistrationData } from '../MultiStepRegister'
import styles from '../register.module.css'

interface SummaryStepProps {
  data: RegistrationData
  onNext: () => void
  onBack: () => void
  isLoading?: boolean
}

export function SummaryStep({ data, onNext, onBack, isLoading }: SummaryStepProps) {
  return (
    <div>
      <div className={styles.summarySection}>
        <h3 className={styles.summaryTitle}>
          <User size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          Datos del Representante
        </h3>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Nombre</span>
            <span className={styles.summaryValue}>{data.name}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Email</span>
            <span className={styles.summaryValue}>{data.email}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Teléfono</span>
            <span className={styles.summaryValue}>{data.phone}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Cargo</span>
            <span className={styles.summaryValue}>{data.position}</span>
          </div>
        </div>
      </div>

      <div className={styles.summarySection}>
        <h3 className={styles.summaryTitle}>
          <Building2 size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          Datos de la Empresa
        </h3>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Empresa</span>
            <span className={styles.summaryValue}>{data.companyName}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>CUIT/RUT</span>
            <span className={styles.summaryValue}>{data.companyTaxId}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Teléfono</span>
            <span className={styles.summaryValue}>{data.companyPhone}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Dirección</span>
            <span className={styles.summaryValue}>{data.companyAddress}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Ciudad</span>
            <span className={styles.summaryValue}>{data.companyCity}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Provincia</span>
            <span className={styles.summaryValue}>{data.companyState}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>País</span>
            <span className={styles.summaryValue}>{data.companyCountry}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Código Postal</span>
            <span className={styles.summaryValue}>{data.companyZipCode}</span>
          </div>
          {data.companyWebsite && (
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Sitio Web</span>
              <span className={styles.summaryValue}>{data.companyWebsite}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
