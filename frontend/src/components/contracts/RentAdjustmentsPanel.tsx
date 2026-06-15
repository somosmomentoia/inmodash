'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, Calendar, Edit2, Check, X, AlertTriangle, RefreshCw,
  Info, Clock, CheckCircle2, Circle, Lock, ExternalLink, ArrowRight,
} from 'lucide-react'
import {
  rentAdjustmentsService, RentAdjustment, IndexConfig, Timeline, TimelineSlot,
} from '@/services/rent-adjustments.service'
import { Badge } from '@/components/ui'
import styles from './RentAdjustmentsPanel.module.css'

interface RentAdjustmentsPanelProps {
  contractId: number
}

const INDEX_TYPE_LABELS: Record<string, string> = {
  icl: 'ICL (Índice para Contratos de Locación)',
  ipc: 'IPC (Índice de Precios al Consumidor)',
  fixed: 'Coeficiente Fijo',
}

const INDEX_TYPE_SHORT: Record<string, string> = {
  icl: 'ICL',
  ipc: 'IPC',
  fixed: 'Fijo',
}

export default function RentAdjustmentsPanel({ contractId }: RentAdjustmentsPanelProps) {
  const [config, setConfig] = useState<IndexConfig | null>(null)
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [configData, timelineData] = await Promise.all([
        rentAdjustmentsService.getIndexConfig(contractId),
        rentAdjustmentsService.getTimeline(contractId),
      ])
      setConfig(configData)
      setTimeline(timelineData)
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos de índice')
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

  const formatIndex = (value: number, type: string) => {
    if (type === 'fixed') return `x${value.toFixed(4)}`
    return value.toFixed(2)
  }

  const startEdit = (adj: RentAdjustment) => {
    setEditingId(adj.id)
    setEditValue(adj.appliedIndexValue.toString())
    setEditNotes('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
    setEditNotes('')
  }

  const saveEdit = async (adj: RentAdjustment) => {
    const newValue = parseFloat(editValue)
    if (isNaN(newValue) || newValue <= 0) return

    setSaving(true)
    try {
      await rentAdjustmentsService.modifyAdjustment(contractId, adj.id, newValue, editNotes || undefined)
      await loadData()
      cancelEdit()
    } catch (err: any) {
      alert(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const getSlotIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={18} />
      case 'current': return <Clock size={18} />
      case 'pending': return <AlertTriangle size={18} />
      case 'future': return <Circle size={18} />
      default: return <Circle size={18} />
    }
  }

  const getSlotStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Procesado'
      case 'current': return 'Mes actual'
      case 'pending': return 'Pendiente'
      case 'future': return 'Futuro'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <RefreshCw size={20} className={styles.spinner} />
        <span>Cargando datos de índice...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error}>
        <AlertTriangle size={20} />
        <span>{error}</span>
        <button onClick={loadData} className={styles.retryBtn}>Reintentar</button>
      </div>
    )
  }

  if (!config?.hasIndex) {
    return (
      <div className={styles.emptyState}>
        <TrendingUp size={48} className={styles.emptyIcon} />
        <h3>Sin Actualización Configurada</h3>
        <p>Este contrato no tiene configurada una regla de actualización de precios (ICL, IPC o coeficiente fijo).</p>
      </div>
    )
  }

  const cfg = config.config!
  const indexLabel = INDEX_TYPE_LABELS[cfg.updateIndexType || ''] || cfg.updateIndexType
  const indexShort = INDEX_TYPE_SHORT[cfg.updateIndexType || ''] || cfg.updateIndexType
  const meta = config.indexMetadata
  const slots = timeline?.slots || []
  const completedSlots = slots.filter(s => s.status === 'completed').length

  return (
    <div className={styles.container}>
      {/* Config Summary Card */}
      <div className={styles.configCard}>
        <div className={styles.configHeader}>
          <TrendingUp size={20} />
          <h3>Configuración de Actualización</h3>
        </div>
        <div className={styles.configGrid}>
          <div className={styles.configItem}>
            <span className={styles.configLabel}>Tipo de Índice</span>
            <span className={styles.configValue}>
              <Badge variant="info" size="sm">{indexShort}</Badge>
              <span className={styles.configValueText}>{indexLabel}</span>
            </span>
          </div>
          <div className={styles.configItem}>
            <span className={styles.configLabel}>Frecuencia</span>
            <span className={styles.configValue}>Cada {cfg.updateFrequencyMonths} {cfg.updateFrequencyMonths === 1 ? 'mes' : 'meses'}</span>
          </div>
          <div className={styles.configItem}>
            <span className={styles.configLabel}>Monto Base</span>
            <span className={styles.configValue}>{formatCurrency(cfg.amount)}</span>
          </div>
          <div className={styles.configItem}>
            <span className={styles.configLabel}>Monto Actual</span>
            <span className={styles.configValueHighlight}>{formatCurrency(cfg.currentAmount || cfg.amount)}</span>
          </div>
          {cfg.initialIndexValue && (
            <div className={styles.configItem}>
              <span className={styles.configLabel}>Índice Inicial</span>
              <span className={styles.configValue}>
                {formatIndex(cfg.initialIndexValue, cfg.updateIndexType || '')}
                {cfg.initialIndexDate && (
                  <span className={styles.configMeta}> ({formatDate(cfg.initialIndexDate)})</span>
                )}
              </span>
            </div>
          )}
          {config.currentIndex && (
            <div className={styles.configItem}>
              <span className={styles.configLabel}>Índice Actual ({indexShort})</span>
              <span className={styles.configValueHighlight}>
                {formatIndex(config.currentIndex.value, cfg.updateIndexType || '')}
                <span className={styles.configMeta}> ({formatDate(config.currentIndex.date)})</span>
              </span>
            </div>
          )}
        </div>

        {/* Index Metadata - transparency info */}
        {meta && (
          <div className={styles.metadataSection}>
            <div className={styles.metadataHeader}>
              <Info size={14} />
              <span>Sobre el {indexShort}</span>
            </div>
            <div className={styles.metadataContent}>
              <p className={styles.metadataDesc}>{meta.description}</p>
              <div className={styles.metadataGrid}>
                <div className={styles.metadataItem}>
                  <span className={styles.metadataLabel}>Publicado por</span>
                  <span className={styles.metadataValue}>{meta.provider}</span>
                </div>
                <div className={styles.metadataItem}>
                  <span className={styles.metadataLabel}>Frecuencia de publicación</span>
                  <span className={styles.metadataValue}>{meta.frequency}</span>
                </div>
                <div className={styles.metadataItem}>
                  <span className={styles.metadataLabel}>Retraso inherente</span>
                  <span className={styles.metadataValue}>{meta.delay}</span>
                </div>
                {meta.source && (
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>Fuente oficial</span>
                    <a href={meta.source} target="_blank" rel="noopener noreferrer" className={styles.metadataLink}>
                      {meta.source.replace('https://', '')} <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
              {config.currentIndex?.rawData && (cfg.updateIndexType === 'ipc') && (
                <div className={styles.metadataNote}>
                  <Clock size={12} />
                  <span>
                    Último dato disponible: {indexShort} de{' '}
                    {(config.currentIndex.rawData as any).nombre_mes} {(config.currentIndex.rawData as any).anio}
                    {(config.currentIndex.rawData as any).fecha_proximo_informe && (
                      <> — Próximo informe: {(config.currentIndex.rawData as any).fecha_proximo_informe}</>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Timeline Slots */}
      <div className={styles.historySection}>
        <div className={styles.historyHeader}>
          <h3>
            <Calendar size={18} />
            Línea de Tiempo de Actualizaciones
          </h3>
          <span className={styles.historyCount}>
            {completedSlots} de {slots.length} períodos procesados
          </span>
        </div>

        {slots.length === 0 ? (
          <div className={styles.noAdjustments}>
            <Info size={20} />
            <p>Aún no hay períodos de actualización programados para este contrato.</p>
          </div>
        ) : (
          <div className={styles.timelineList}>
            {/* Starting point */}
            <div className={styles.timelineStart}>
              <div className={styles.timelineStartDot} />
              <div className={styles.timelineStartContent}>
                <span className={styles.timelineStartLabel}>Inicio del contrato</span>
                <span className={styles.timelineStartMeta}>
                  {formatCurrency(cfg.amount)} — Índice base: {cfg.initialIndexValue ? formatIndex(cfg.initialIndexValue, cfg.updateIndexType || '') : 'N/A'}
                </span>
              </div>
            </div>

            {slots.map((slot, idx) => {
              const adj = slot.adjustment
              const isEditing = adj ? editingId === adj.id : false
              const isCompleted = slot.status === 'completed'
              const isFuture = slot.status === 'future'
              const isPending = slot.status === 'pending'

              return (
                <div
                  key={slot.period}
                  className={`${styles.timelineSlot} ${styles[`slot_${slot.status}`]}`}
                >
                  {/* Timeline connector */}
                  <div className={styles.timelineConnector}>
                    <div className={`${styles.timelineDot} ${styles[`dot_${slot.status}`]}`}>
                      {getSlotIcon(slot.status)}
                    </div>
                    {idx < slots.length - 1 && <div className={styles.timelineLine} />}
                  </div>

                  {/* Slot content */}
                  <div className={styles.slotContent}>
                    <div className={styles.slotHeader}>
                      <div className={styles.slotTitle}>
                        <span className={styles.slotNumber}>#{slot.slotNumber}</span>
                        <span className={styles.slotPeriod}>{slot.periodLabel}</span>
                        <Badge
                          variant={isCompleted ? 'success' : isPending ? 'warning' : isFuture ? 'default' : 'info'}
                          size="sm"
                        >
                          {getSlotStatusLabel(slot.status)}
                        </Badge>
                        {adj?.isManuallyModified && (
                          <Badge variant="warning" size="sm">Modificado</Badge>
                        )}
                      </div>
                    </div>

                    {adj ? (
                      <div className={styles.slotBody}>
                        <div className={styles.slotDataGrid}>
                          <div className={styles.slotDataItem}>
                            <span className={styles.slotDataLabel}>Índice aplicado</span>
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className={styles.editInput}
                                autoFocus
                              />
                            ) : (
                              <span className={styles.slotDataValue}>
                                {formatIndex(adj.appliedIndexValue, adj.indexType)}
                                {adj.isManuallyModified && (
                                  <span className={styles.originalValueHint}>
                                    (orig: {formatIndex(adj.originalIndexValue, adj.indexType)})
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          <div className={styles.slotDataItem}>
                            <span className={styles.slotDataLabel}>Monto anterior</span>
                            <span className={styles.slotDataValue}>{formatCurrency(adj.previousAmount)}</span>
                          </div>
                          <div className={styles.slotDataItem}>
                            <span className={styles.slotDataLabel}>
                              <ArrowRight size={12} /> Monto nuevo
                            </span>
                            <span className={styles.slotDataValueBold}>{formatCurrency(adj.newAmount)}</span>
                          </div>
                          <div className={styles.slotDataItem}>
                            <span className={styles.slotDataLabel}>Variación</span>
                            <span className={`${styles.slotDataValue} ${adj.percentageIncrease > 0 ? styles.positive : adj.percentageIncrease < 0 ? styles.negative : styles.neutral}`}>
                              {adj.percentageIncrease > 0 ? '+' : ''}{adj.percentageIncrease.toFixed(1)}%
                              <span className={styles.coefficient}> (x{adj.coefficient.toFixed(4)})</span>
                            </span>
                          </div>
                        </div>

                        {/* Notes */}
                        {adj.notes && !isEditing && (
                          <div className={styles.slotNotes}>
                            <Info size={12} />
                            <span>{adj.notes}</span>
                          </div>
                        )}

                        {/* Edit controls */}
                        <div className={styles.slotActions}>
                          {isEditing ? (
                            <div className={styles.editRow}>
                              <input
                                type="text"
                                placeholder="Motivo de la modificación..."
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                className={styles.editNotesInput}
                              />
                              <button onClick={() => saveEdit(adj)} disabled={saving} className={styles.saveBtn} title="Guardar">
                                <Check size={14} /> Guardar
                              </button>
                              <button onClick={cancelEdit} className={styles.cancelBtn} title="Cancelar">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => startEdit(adj)} className={styles.editBtn} title="Modificar valor del índice aplicado">
                              <Edit2 size={12} /> Modificar índice
                            </button>
                          )}
                        </div>
                      </div>
                    ) : isPending ? (
                      <div className={styles.slotBodyPending}>
                        <AlertTriangle size={14} />
                        <span>Este período debió procesarse pero no se generó la obligación. Verifique la generación automática.</span>
                      </div>
                    ) : isFuture ? (
                      <div className={styles.slotBodyFuture}>
                        <Lock size={14} />
                        <span>Se procesará cuando se genere la obligación de {slot.periodLabel.toLowerCase()}.</span>
                      </div>
                    ) : (
                      <div className={styles.slotBodyPending}>
                        <Clock size={14} />
                        <span>Período actual — se procesará en la próxima generación de obligaciones.</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <CheckCircle2 size={14} className={styles.legendIconCompleted} />
          <span>Procesado</span>
        </div>
        <div className={styles.legendItem}>
          <Clock size={14} className={styles.legendIconCurrent} />
          <span>Mes actual</span>
        </div>
        <div className={styles.legendItem}>
          <AlertTriangle size={14} className={styles.legendIconPending} />
          <span>Pendiente</span>
        </div>
        <div className={styles.legendItem}>
          <Circle size={14} className={styles.legendIconFuture} />
          <span>Futuro</span>
        </div>
      </div>
    </div>
  )
}
