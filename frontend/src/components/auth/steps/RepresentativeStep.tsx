'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { RegistrationData } from '../MultiStepRegister'
import styles from '../register.module.css'

const representativeSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
  phone: z.string().min(8, 'Teléfono inválido'),
  position: z.string().min(2, 'El cargo es requerido'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type RepresentativeFormData = z.infer<typeof representativeSchema>

interface RepresentativeStepProps {
  data: Partial<RegistrationData>
  updateData: (data: Partial<RegistrationData>) => void
  onNext: () => void
  submitTrigger?: number
}

export function RepresentativeStep({ data, updateData, onNext, submitTrigger }: RepresentativeStepProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const submitRef = useRef<HTMLButtonElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RepresentativeFormData>({
    resolver: zodResolver(representativeSchema),
    defaultValues: {
      name: data.name || '',
      email: data.email || '',
      password: data.password || '',
      phone: data.phone || '',
      position: data.position || '',
    },
  })

  useEffect(() => {
    if (submitTrigger && submitTrigger > 0) {
      submitRef.current?.click()
    }
  }, [submitTrigger])

  const onSubmit = (formData: RepresentativeFormData) => {
    updateData({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      position: formData.position,
    })
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.formGrid}>
        <div className={`${styles.formField} ${styles.formFieldFull}`}>
          <label className={styles.formLabel}>Nombre Completo *</label>
          <input
            {...register('name')}
            type="text"
            className={styles.formInput}
            placeholder="Juan Pérez"
          />
          {errors.name && <span className={styles.formError}>{errors.name.message}</span>}
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>Email *</label>
          <input
            {...register('email')}
            type="email"
            className={styles.formInput}
            placeholder="juan@inmobiliaria.com"
          />
          {errors.email && <span className={styles.formError}>{errors.email.message}</span>}
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>Teléfono *</label>
          <input
            {...register('phone')}
            type="tel"
            className={styles.formInput}
            placeholder="+54 11 1234-5678"
          />
          {errors.phone && <span className={styles.formError}>{errors.phone.message}</span>}
        </div>

        <div className={`${styles.formField} ${styles.formFieldFull}`}>
          <label className={styles.formLabel}>Cargo en la Empresa *</label>
          <input
            {...register('position')}
            type="text"
            className={styles.formInput}
            placeholder="Ej: Director, Gerente, Propietario"
          />
          {errors.position && <span className={styles.formError}>{errors.position.message}</span>}
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>Contraseña *</label>
          <div className={styles.inputWrapper}>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className={styles.formInput}
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.inputIcon}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <span className={styles.formError}>{errors.password.message}</span>}
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>Confirmar Contraseña *</label>
          <div className={styles.inputWrapper}>
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              className={styles.formInput}
              placeholder="Repite la contraseña"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={styles.inputIcon}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && <span className={styles.formError}>{errors.confirmPassword.message}</span>}
        </div>
      </div>
      
      <button ref={submitRef} type="submit" style={{ display: 'none' }} />
    </form>
  )
}
