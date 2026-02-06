'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  Select,
} from '@/components/ui'
import { useBuildings } from '@/hooks/useBuildings'
import { useOwners } from '@/hooks/useOwners'
import { FloorConfiguration } from '@/types'
import styles from './new-building.module.css'

const PROVINCES = [
  { value: 'Buenos Aires', label: 'Buenos Aires' },
  { value: 'CABA', label: 'Ciudad Autónoma de Buenos Aires' },
  { value: 'Catamarca', label: 'Catamarca' },
  { value: 'Chaco', label: 'Chaco' },
  { value: 'Chubut', label: 'Chubut' },
  { value: 'Córdoba', label: 'Córdoba' },
  { value: 'Corrientes', label: 'Corrientes' },
  { value: 'Entre Ríos', label: 'Entre Ríos' },
  { value: 'Formosa', label: 'Formosa' },
  { value: 'Jujuy', label: 'Jujuy' },
  { value: 'La Pampa', label: 'La Pampa' },
  { value: 'La Rioja', label: 'La Rioja' },
  { value: 'Mendoza', label: 'Mendoza' },
  { value: 'Misiones', label: 'Misiones' },
  { value: 'Neuquén', label: 'Neuquén' },
  { value: 'Río Negro', label: 'Río Negro' },
  { value: 'Salta', label: 'Salta' },
  { value: 'San Juan', label: 'San Juan' },
  { value: 'San Luis', label: 'San Luis' },
  { value: 'Santa Cruz', label: 'Santa Cruz' },
  { value: 'Santa Fe', label: 'Santa Fe' },
  { value: 'Santiago del Estero', label: 'Santiago del Estero' },
  { value: 'Tierra del Fuego', label: 'Tierra del Fuego' },
  { value: 'Tucumán', label: 'Tucumán' },
]

export default function NewBuildingPage() {
  const router = useRouter()
  const { createBuilding } = useBuildings()
  const { owners } = useOwners()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    province: '',
    city: '',
    owner: '',
    ownerId: '',
    floors: 1,
    totalArea: 0,
  })
  
  const ownerOptions = owners.map(o => ({
    value: o.id.toString(),
    label: o.name
  }))
  const [floorConfig, setFloorConfig] = useState<FloorConfiguration[]>([
    { floor: 1, apartmentsCount: 1 },
  ])

  const handleFloorsChange = (newFloors: number) => {
    const floors = Math.max(1, Math.min(50, newFloors))
    setFormData((prev) => ({ ...prev, floors }))

    // Adjust floor configuration
    if (floors > floorConfig.length) {
      const newConfigs = [...floorConfig]
      for (let i = floorConfig.length + 1; i <= floors; i++) {
        newConfigs.push({ floor: i, apartmentsCount: 1 })
      }
      setFloorConfig(newConfigs)
    } else if (floors < floorConfig.length) {
      setFloorConfig(floorConfig.slice(0, floors))
    }
  }

  const handleFloorConfigChange = (floor: number, apartmentsCount: number) => {
    setFloorConfig((prev) =>
      prev.map((fc) =>
        fc.floor === floor ? { ...fc, apartmentsCount: Math.max(1, apartmentsCount) } : fc
      )
    )
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.address || !formData.province || !formData.city) {
      return
    }

    setLoading(true)
    try {
      await createBuilding({
        name: formData.name,
        address: formData.address,
        province: formData.province,
        city: formData.city,
        owner: formData.owner,
        ownerId: formData.ownerId ? parseInt(formData.ownerId) : undefined,
        floors: formData.floors,
        totalArea: formData.totalArea,
        floorConfiguration: floorConfig,
      })
      router.push('/properties')
    } catch (error) {
      console.error('Error creating building:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalUnits = floorConfig.reduce((sum, fc) => sum + fc.apartmentsCount, 0)

  return (
    <DashboardLayout title="Nuevo Edificio" subtitle="Crear un nuevo edificio">
      {/* Back Button */}
      <div className={styles.backRow}>
        <Link href="/properties">
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
            Volver a Propiedades
          </Button>
        </Link>
      </div>

      <div className={styles.formContainer}>
        {/* Basic Info */}
        <Card>
          <CardHeader title="Información Básica" />
          <CardContent>
            <div className={styles.formGrid}>
              <Input
                label="Nombre del Edificio *"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Torre Belgrano"
                fullWidth
              />
              <Select
                label="Propietario"
                options={ownerOptions}
                value={formData.ownerId}
                onChange={(e) => {
                  const selectedOwner = owners.find(o => o.id.toString() === e.target.value)
                  setFormData((prev) => ({ 
                    ...prev, 
                    ownerId: e.target.value,
                    owner: selectedOwner?.name || ''
                  }))
                }}
                placeholder="Seleccione un propietario..."
                fullWidth
              />
            </div>
            <div className={styles.formGrid}>
              <Input
                label="Dirección *"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Av. Corrientes 1234"
                fullWidth
              />
              <Input
                label="Ciudad *"
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="Buenos Aires"
                fullWidth
              />
            </div>
            <div className={styles.formGrid}>
              <Select
                label="Provincia *"
                options={PROVINCES}
                value={formData.province}
                onChange={(e) => setFormData((prev) => ({ ...prev, province: e.target.value }))}
                placeholder="Seleccione..."
                fullWidth
              />
              <Input
                label="Área Total (m²)"
                type="number"
                value={formData.totalArea || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, totalArea: Number(e.target.value) }))
                }
                placeholder="0"
                fullWidth
              />
            </div>
          </CardContent>
        </Card>

        {/* Floor Configuration */}
        <Card>
          <CardHeader
            title="Configuración de Pisos"
            subtitle={`${formData.floors} pisos, ${totalUnits} unidades totales`}
          />
          <CardContent>
            <div className={styles.floorsInput}>
              <Input
                label="Cantidad de Pisos"
                type="number"
                value={formData.floors}
                onChange={(e) => handleFloorsChange(Number(e.target.value))}
                min={1}
                max={50}
              />
            </div>

            <div className={styles.floorList}>
              {floorConfig.map((fc) => (
                <div key={fc.floor} className={styles.floorItem}>
                  <span className={styles.floorLabel}>Piso {fc.floor}</span>
                  <div className={styles.floorInput}>
                    <Input
                      type="number"
                      value={fc.apartmentsCount}
                      onChange={(e) =>
                        handleFloorConfigChange(fc.floor, Number(e.target.value))
                      }
                      min={1}
                      max={20}
                    />
                    <span className={styles.unitLabel}>unidades</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className={styles.actions}>
          <Link href="/properties">
            <Button variant="secondary">Cancelar</Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !formData.name ||
              !formData.address ||
              !formData.province ||
              !formData.city
            }
            loading={loading}
            leftIcon={<Building2 size={16} />}
          >
            Crear Edificio
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
