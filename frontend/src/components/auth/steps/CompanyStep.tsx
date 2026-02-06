'use client'

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RegistrationData } from '../MultiStepRegister'
import styles from '../register.module.css'

const companySchema = z.object({
  companyName: z.string().min(3, 'El nombre de la inmobiliaria es requerido'),
  companyTaxId: z.string().min(8, 'CUIT/RUT inválido'),
  companyAddress: z.string().min(5, 'La dirección es requerida'),
  companyCity: z.string().min(2, 'La ciudad es requerida'),
  companyState: z.string().min(2, 'La provincia/estado es requerida'),
  companyCountry: z.string().min(2, 'El país es requerido'),
  companyZipCode: z.string().min(3, 'El código postal es requerido'),
  companyPhone: z.string().min(8, 'El teléfono es requerido'),
  companyWebsite: z.string().url('URL inválida').optional().or(z.literal('')),
})

type CompanyFormData = z.infer<typeof companySchema>

interface CompanyStepProps {
  data: Partial<RegistrationData>
  updateData: (data: Partial<RegistrationData>) => void
  onNext: () => void
  onBack: () => void
  submitTrigger?: number
}

export function CompanyStep({ data, updateData, onNext, onBack, submitTrigger }: CompanyStepProps) {
  const submitRef = useRef<HTMLButtonElement>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: data.companyName || '',
      companyTaxId: data.companyTaxId || '',
      companyAddress: data.companyAddress || '',
      companyCity: data.companyCity || '',
      companyState: data.companyState || '',
      companyCountry: data.companyCountry || 'Argentina',
      companyZipCode: data.companyZipCode || '',
      companyPhone: data.companyPhone || '',
      companyWebsite: data.companyWebsite || '',
    },
  })

  useEffect(() => {
    if (submitTrigger && submitTrigger > 0) {
      submitRef.current?.click()
    }
  }, [submitTrigger])

  const onSubmit = (formData: CompanyFormData) => {
    updateData(formData)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.formGrid}>
        <div className={`${styles.formField} ${styles.formFieldFull}`}>
          <label className={styles.formLabel}>Nombre de la Empresa *</label>
          <input
            {...register('companyName')}
            type="text"
            className={styles.formInput}
            placeholder="InmoDash XYZ S.A."
          />
          {errors.companyName && <span className={styles.formError}>{errors.companyName.message}</span>}
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>CUIT/RUT *</label>
          <input
            {...register('companyTaxId')}
            type="text"
            className={styles.formInput}
            placeholder="20-12345678-9"
          />
          {errors.companyTaxId && <span className={styles.formError}>{errors.companyTaxId.message}</span>}
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>Teléfono de la Empresa *</label>
          <input
            {...register('companyPhone')}
            type="tel"
            className={styles.formInput}
            placeholder="+54 11 1234-5678"
          />
          {errors.companyPhone && <span className={styles.formError}>{errors.companyPhone.message}</span>}
        </div>

        <div className={`${styles.formField} ${styles.formFieldFull}`}>
          <label className={styles.formLabel}>Dirección *</label>
          <input
            {...register('companyAddress')}
            type="text"
            className={styles.formInput}
            placeholder="Av. Corrientes 1234, Piso 5"
          />
          {errors.companyAddress && <span className={styles.formError}>{errors.companyAddress.message}</span>}
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>Ciudad *</label>
          <input
            {...register('companyCity')}
            type="text"
            className={styles.formInput}
            placeholder="Buenos Aires"
          />
          {errors.companyCity && <span className={styles.formError}>{errors.companyCity.message}</span>}
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>Provincia/Estado *</label>
          <input
            {...register('companyState')}
            type="text"
            className={styles.formInput}
            placeholder="CABA"
          />
          {errors.companyState && <span className={styles.formError}>{errors.companyState.message}</span>}
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>País *</label>
          <select {...register('companyCountry')} className={styles.formSelect}>
            <option value="Argentina">Argentina</option>
            <option value="Chile">Chile</option>
            <option value="Uruguay">Uruguay</option>
            <option value="Paraguay">Paraguay</option>
            <option value="Brasil">Brasil</option>
            <option value="México">México</option>
            <option value="Colombia">Colombia</option>
            <option value="Perú">Perú</option>
            <option value="Otro">Otro</option>
          </select>
          {errors.companyCountry && <span className={styles.formError}>{errors.companyCountry.message}</span>}
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>Código Postal *</label>
          <input
            {...register('companyZipCode')}
            type="text"
            className={styles.formInput}
            placeholder="C1001"
          />
          {errors.companyZipCode && <span className={styles.formError}>{errors.companyZipCode.message}</span>}
        </div>

        <div className={`${styles.formField} ${styles.formFieldFull}`}>
          <label className={styles.formLabel}>Sitio Web (Opcional)</label>
          <input
            {...register('companyWebsite')}
            type="url"
            className={styles.formInput}
            placeholder="https://www.tuinmobiliaria.com"
          />
          {errors.companyWebsite && <span className={styles.formError}>{errors.companyWebsite.message}</span>}
        </div>
      </div>
      
      <button ref={submitRef} type="submit" style={{ display: 'none' }} />
    </form>
  )
}
