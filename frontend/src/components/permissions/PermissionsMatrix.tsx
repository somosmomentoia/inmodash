'use client'

import { useState, useEffect } from 'react'
import { PermissionTemplate, MODULE_LABELS, MODULE_DESCRIPTIONS, MODULE_ACTIONS } from '@/types'
import styles from './PermissionsMatrix.module.css'

interface PermissionsMatrixProps {
  permissions: PermissionTemplate[]
  onChange: (permissions: PermissionTemplate[]) => void
  readonly?: boolean
}

const MODULES = Object.keys(MODULE_ACTIONS)

export default function PermissionsMatrix({ permissions, onChange, readonly = false }: PermissionsMatrixProps) {
  const [permissionsMap, setPermissionsMap] = useState<Map<string, boolean>>(new Map())

  useEffect(() => {
    const map = new Map<string, boolean>()
    permissions.forEach(p => {
      map.set(`${p.module}:${p.action}`, p.allowed)
    })
    setPermissionsMap(map)
  }, [permissions])

  const isAllowed = (module: string, action: string) => {
    return permissionsMap.get(`${module}:${action}`) ?? false
  }

  const togglePermission = (module: string, action: string) => {
    if (readonly) return

    const newValue = !isAllowed(module, action)
    const newMap = new Map(permissionsMap)
    newMap.set(`${module}:${action}`, newValue)
    setPermissionsMap(newMap)

    const newPermissions = permissions.map(p => {
      if (p.module === module && p.action === action) {
        return { ...p, allowed: newValue }
      }
      return p
    })

    if (!permissions.some(p => p.module === module && p.action === action)) {
      newPermissions.push({ module, action, allowed: newValue })
    }

    onChange(newPermissions)
  }

  const toggleModule = (module: string, allowed: boolean) => {
    if (readonly) return

    const moduleActions = MODULE_ACTIONS[module] || []
    const newPermissions = [...permissions]

    moduleActions.forEach(({ key }) => {
      const existingIndex = newPermissions.findIndex(p => p.module === module && p.action === key)
      if (existingIndex >= 0) {
        newPermissions[existingIndex] = { ...newPermissions[existingIndex], allowed }
      } else {
        newPermissions.push({ module, action: key, allowed })
      }
    })

    onChange(newPermissions)
  }

  const getModuleStats = (module: string) => {
    const actions = MODULE_ACTIONS[module] || []
    const total = actions.length
    const allowed = actions.filter(a => isAllowed(module, a.key)).length
    return { total, allowed }
  }

  const isModuleFullyAllowed = (module: string) => {
    const { total, allowed } = getModuleStats(module)
    return total > 0 && allowed === total
  }

  return (
    <div className={styles.container}>
      <div className={styles.modulesGrid}>
        {MODULES.map(module => {
          const actions = MODULE_ACTIONS[module] || []
          const { total, allowed } = getModuleStats(module)
          const description = MODULE_DESCRIPTIONS[module]

          let badgeClass = styles.counterBadge
          if (allowed === 0) badgeClass = styles.counterBadgeNone
          else if (allowed < total) badgeClass = styles.counterBadgePartial

          return (
            <div key={module} className={styles.moduleCard}>
              <div className={styles.moduleHeader}>
                <div className={styles.moduleInfo}>
                  <span className={styles.moduleLabel}>
                    {MODULE_LABELS[module] || module}
                  </span>
                  {description && (
                    <span className={styles.moduleDescription}>{description}</span>
                  )}
                </div>
                <div className={styles.moduleToggle}>
                  <span className={badgeClass}>
                    {allowed}/{total}
                  </span>
                  {!readonly && (
                    <button
                      className={styles.moduleToggleBtn}
                      onClick={() => toggleModule(module, !isModuleFullyAllowed(module))}
                    >
                      {isModuleFullyAllowed(module) ? 'Quitar todo' : 'Dar todo'}
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.actionsBody}>
                {actions.map(action => {
                  const allowed = isAllowed(module, action.key)
                  return (
                    <div key={action.key} className={styles.actionRow}>
                      <div className={styles.actionInfo}>
                        <span className={styles.actionLabel}>{action.label}</span>
                        <span className={styles.actionDescription}>{action.description}</span>
                      </div>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          className={styles.switchInput}
                          checked={allowed}
                          onChange={() => togglePermission(module, action.key)}
                          disabled={readonly}
                        />
                        <span className={styles.switchSlider} />
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotOn}`} />
          <span>Permitido</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotOff}`} />
          <span>Denegado</span>
        </div>
        {!readonly && (
          <span className={styles.legendHint}>
            Usa los switches para activar/desactivar permisos individuales, o el botón en el header para dar/quitar todo el módulo.
          </span>
        )}
      </div>
    </div>
  )
}
