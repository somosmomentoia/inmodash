'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Plus,
  Check,
  Clock,
  Calendar,
  Search,
  X,
  ChevronRight,
  User,
  FileText,
  Users,
  Home,
  Building2,
  Receipt,
  Link2,
} from 'lucide-react'
import { Button, Badge, Card, CardContent, Input, Modal, SearchSelect, SearchSelectOption } from '@/components/ui'
import { useTasks } from '@/hooks/useTasks'
import { useContacts } from '@/hooks/useContacts'
import { useContracts } from '@/hooks/useContracts'
import { useApartments } from '@/hooks/useApartments'
import { useOwners } from '@/hooks/useOwners'
import { useTenants } from '@/hooks/useTenants'
import { useObligations } from '@/hooks/useObligations'
import { Task, TaskStatus, TaskPriority, CreateTaskDto, Contact } from '@/types'
import styles from './page.module.css'

export function TasksContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const initialStatus = searchParams.get('status') as TaskStatus | null
  const initialPriority = searchParams.get('priority') as TaskPriority | null
  
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>(initialStatus || 'all')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>(initialPriority || 'all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTask, setNewTask] = useState<CreateTaskDto>({ title: '', priority: 'medium' })
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  useEffect(() => {
    if (initialStatus) setStatusFilter(initialStatus)
    if (initialPriority) setPriorityFilter(initialPriority)
  }, [initialStatus, initialPriority])

  const { tasks, loading, createTask, toggleTask, deleteTask } = useTasks({
    includeCompleted: statusFilter === 'all' || statusFilter === 'completed',
  })
  const { contacts } = useContacts()
  const { contracts } = useContracts()
  const { apartments } = useApartments()
  const { owners } = useOwners()
  const { tenants } = useTenants()
  const { obligations } = useObligations()

  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'completed') return false
    return new Date(task.dueDate) < new Date()
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'default'
      case 'low': return 'success'
    }
  }

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Alta'
      case 'medium': return 'Media'
      case 'low': return 'Baja'
    }
  }

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return
    try {
      await createTask(newTask)
      setNewTask({ title: '', priority: 'medium' })
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleToggleTask = async (task: Task) => {
    try {
      await toggleTask(task.id)
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const handleDeleteTask = async (task: Task) => {
    if (!confirm('¿Eliminar esta tarea?')) return
    try {
      await deleteTask(task.id)
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    const days: (Date | null)[] = []
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return taskDate.toDateString() === date.toDateString()
    })
  }

  const calendarDays = getDaysInMonth(currentMonth)
  const monthName = currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const today = new Date()

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      client: 'Cliente',
      provider: 'Proveedor',
      agent: 'Agente',
      lawyer: 'Abogado',
      accountant: 'Contador',
      maintenance: 'Mantenimiento',
      other: 'Otro'
    }
    return labels[category] || category
  }

  return (
    <>
      <div className={styles.mainLayout}>
        {/* Left Panel - Tasks List */}
        <div className={styles.listPanel}>
          <Card className={styles.listCard}>
            <CardContent style={{ padding: 0 }}>
              {/* Filters */}
              <div className={styles.listHeader}>
                <Input
                  placeholder="Buscar tareas..."
                  leftIcon={<Search size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <select
                  className={styles.filterSelect}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completada</option>
                </select>
                <select
                  className={styles.filterSelect}
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
                >
                  <option value="all">Prioridad</option>
                  <option value="urgent">Urgente</option>
                  <option value="high">Alta</option>
                  <option value="medium">Media</option>
                  <option value="low">Baja</option>
                </select>
                <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
                  Nueva
                </Button>
              </div>

              {/* Tasks List */}
              <div className={styles.tasksList}>
                {loading ? (
                  <div className={styles.loading}>Cargando tareas...</div>
                ) : filteredTasks.length === 0 ? (
                  <div className={styles.empty}>
                    <FileText size={48} />
                    <p>No hay tareas</p>
                    <Button onClick={() => setShowCreateModal(true)}>Crear primera tarea</Button>
                  </div>
                ) : (
                  <>
                    {/* Pending Tasks */}
                    {filteredTasks.filter(t => t.status !== 'completed').map((task) => (
                      <div
                        key={task.id}
                        className={`${styles.taskItem} ${isOverdue(task) ? styles.overdue : ''}`}
                      >
                        <button
                          className={styles.taskCheckbox}
                          onClick={() => handleToggleTask(task)}
                        >
                        </button>

                        <div className={styles.taskContent}>
                          <div className={styles.taskHeader}>
                            <span className={styles.taskTitle}>{task.title}</span>
                            <Badge variant={getPriorityColor(task.priority)}>
                              {getPriorityLabel(task.priority)}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className={styles.taskDescription}>{task.description}</p>
                          )}
                          <div className={styles.taskMeta}>
                            {task.dueDate && (
                              <span className={styles.taskMetaItem}>
                                <Calendar size={14} />
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={styles.taskActions}>
                          <button
                            className={styles.taskAction}
                            onClick={() => router.push(`/tasks/${task.id}`)}
                            title="Ver detalle"
                          >
                            <ChevronRight size={18} />
                          </button>
                          <button
                            className={styles.taskAction}
                            onClick={() => handleDeleteTask(task)}
                            title="Eliminar"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Completed Tasks Section */}
                    {filteredTasks.filter(t => t.status === 'completed').length > 0 && (
                      <div className={styles.completedSection}>
                        <div className={styles.completedHeader}>
                          <Check size={16} />
                          <span>Completadas ({filteredTasks.filter(t => t.status === 'completed').length})</span>
                        </div>
                        {filteredTasks.filter(t => t.status === 'completed').map((task) => (
                          <div
                            key={task.id}
                            className={`${styles.taskItem} ${styles.completed}`}
                          >
                            <button
                              className={`${styles.taskCheckbox} ${styles.checked}`}
                              onClick={() => handleToggleTask(task)}
                            >
                              <Check size={14} />
                            </button>

                            <div className={styles.taskContent}>
                              <div className={styles.taskHeader}>
                                <span className={styles.taskTitle}>{task.title}</span>
                                <Badge variant={getPriorityColor(task.priority)}>
                                  {getPriorityLabel(task.priority)}
                                </Badge>
                              </div>
                              {task.description && (
                                <p className={styles.taskDescription}>{task.description}</p>
                              )}
                              <div className={styles.taskMeta}>
                                {task.dueDate && (
                                  <span className={styles.taskMetaItem}>
                                    <Calendar size={14} />
                                    {formatDate(task.dueDate)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className={styles.taskActions}>
                              <button
                                className={styles.taskAction}
                                onClick={() => router.push(`/tasks/${task.id}`)}
                                title="Ver detalle"
                              >
                                <ChevronRight size={18} />
                              </button>
                              <button
                                className={styles.taskAction}
                                onClick={() => handleDeleteTask(task)}
                                title="Eliminar"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Calendar + Widgets */}
        <div className={styles.rightPanel}>
          {/* Calendar / Day View */}
          <Card className={styles.calendarCard}>
            <CardContent>
              {selectedDay ? (
                /* Day View - Sticky Notes */
                <>
                  <div className={styles.dayViewBreadcrumb}>
                    <button 
                      className={styles.breadcrumbBack}
                      onClick={() => setSelectedDay(null)}
                    >
                      <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                      Calendario
                    </button>
                    <span className={styles.breadcrumbSeparator}>/</span>
                    <span className={styles.breadcrumbCurrent}>
                      {selectedDay.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <h3 className={styles.dayViewTitle}>
                    {selectedDay.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  <div className={styles.stickyNotesGrid}>
                    {getTasksForDate(selectedDay).map(task => (
                      <div 
                        key={task.id}
                        className={`${styles.stickyNote} ${styles[`stickyNote${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`]}`}
                        onClick={() => router.push(`/tasks/${task.id}`)}
                      >
                        <div className={styles.stickyNoteHeader}>
                          <span className={styles.stickyNoteTitle}>{task.title}</span>
                          <Badge 
                            variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'info' : 'warning'}
                            size="sm"
                          >
                            {task.status === 'completed' ? 'Completada' : task.status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className={styles.stickyNoteDescription}>{task.description}</p>
                        )}
                        <div className={styles.stickyNoteFooter}>
                          <span className={styles.stickyNotePriority}>
                            {task.priority === 'urgent' ? '🔴 Urgente' : 
                             task.priority === 'high' ? '🟠 Alta' : 
                             task.priority === 'medium' ? '🟡 Media' : '🟢 Baja'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Calendar View */
                <>
                  <div className={styles.calendarHeader}>
                    <button 
                      className={styles.calendarNavBtn}
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    >
                      <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    <h3 className={styles.calendarTitle}>{monthName}</h3>
                    <button 
                      className={styles.calendarNavBtn}
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  
                  <div className={styles.calendarWeekdays}>
                    {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(day => (
                      <div key={day} className={styles.weekday}>{day}</div>
                    ))}
                  </div>
                  
                  <div className={styles.calendarGrid}>
                    {calendarDays.map((day, index) => {
                      if (!day) {
                        return <div key={`empty-${index}`} className={styles.calendarDayEmpty} />
                      }
                      
                      const dayTasks = getTasksForDate(day)
                      const isToday = day.toDateString() === today.toDateString()
                      const isPast = day < today && !isToday
                      const hasTasks = dayTasks.length > 0
                      
                      return (
                        <div 
                          key={day.toISOString()} 
                          className={`${styles.calendarDay} ${isToday ? styles.calendarDayToday : ''} ${isPast ? styles.calendarDayPast : ''} ${hasTasks ? styles.calendarDayHasTasks : ''}`}
                          onClick={() => hasTasks && setSelectedDay(day)}
                          style={{ cursor: hasTasks ? 'pointer' : 'default' }}
                        >
                          <span className={styles.dayNumber}>{day.getDate()}</span>
                          {hasTasks && (
                            <div className={styles.taskIndicator}>
                              {dayTasks.slice(0, 2).map(task => (
                                <div 
                                  key={task.id} 
                                  className={`${styles.taskDot} ${styles[`dot${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`]}`}
                                  title={task.title}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contacts Widget */}
          <Card className={styles.widgetCard}>
            <CardContent>
              <div className={styles.widgetHeader}>
                <h3 className={styles.widgetTitle}>
                  <Users size={18} />
                  Contactos
                </h3>
                <Button variant="ghost" size="sm" onClick={() => router.push('/tasks?tab=contacts')}>
                  Ver todos
                </Button>
              </div>
              <div className={styles.contactsList}>
                {contacts.slice(0, 5).map(contact => (
                  <div key={contact.id} className={styles.contactItem}>
                    <div className={styles.contactAvatar}>
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.contactInfo}>
                      <span className={styles.contactName}>{contact.name}</span>
                      <span className={styles.contactCategory}>{getCategoryLabel(contact.category)}</span>
                    </div>
                  </div>
                ))}
                {contacts.length === 0 && (
                  <p className={styles.emptyWidget}>No hay contactos</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nueva Tarea"
        size="lg"
      >
        <div className={styles.modalContent}>
          <div className={styles.formGroup}>
            <label>Título *</label>
            <Input
              placeholder="Título de la tarea"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Descripción</label>
            <textarea
              className={styles.textarea}
              placeholder="Descripción opcional..."
              value={newTask.description || ''}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Fecha de vencimiento</label>
              <Input
                type="date"
                value={newTask.dueDate ? new Date(newTask.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    // Parse as local date to avoid timezone issues
                    const [year, month, day] = e.target.value.split('-').map(Number)
                    const localDate = new Date(year, month - 1, day, 12, 0, 0)
                    setNewTask({ ...newTask, dueDate: localDate.toISOString() })
                  } else {
                    setNewTask({ ...newTask, dueDate: undefined })
                  }
                }}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Prioridad</label>
              <select
                className={styles.select}
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          {/* Vincular con entidades */}
          <div className={styles.formGroup}>
            <label className={styles.linkLabel}>
              <Link2 size={14} />
              Vincular con (opcional)
            </label>
            <div className={styles.linkGridPremium}>
              <SearchSelect
                icon={<FileText size={16} />}
                placeholder="Contrato"
                searchPlaceholder="Buscar contrato..."
                emptyMessage="No hay contratos"
                options={contracts.map(c => ({
                  value: c.id,
                  label: apartments.find(a => a.id === c.apartmentId)?.nomenclature || `Contrato #${c.id}`,
                  sublabel: tenants.find(t => t.id === c.tenantId)?.nameOrBusiness
                }))}
                value={newTask.contractId || null}
                onChange={(val) => setNewTask({ ...newTask, contractId: val ? Number(val) : undefined })}
              />

              <SearchSelect
                icon={<Home size={16} />}
                placeholder="Unidad / Propiedad"
                searchPlaceholder="Buscar unidad..."
                emptyMessage="No hay unidades"
                options={apartments.map(a => ({
                  value: a.id,
                  label: a.nomenclature || a.fullAddress || `Unidad #${a.id}`,
                  sublabel: a.fullAddress !== a.nomenclature ? a.fullAddress : undefined
                }))}
                value={newTask.apartmentId || null}
                onChange={(val) => setNewTask({ ...newTask, apartmentId: val ? Number(val) : undefined })}
              />

              <SearchSelect
                icon={<User size={16} />}
                placeholder="Propietario"
                searchPlaceholder="Buscar propietario..."
                emptyMessage="No hay propietarios"
                options={owners.map(o => ({
                  value: o.id,
                  label: o.name,
                  sublabel: o.email || o.phone
                }))}
                value={newTask.ownerId || null}
                onChange={(val) => setNewTask({ ...newTask, ownerId: val ? Number(val) : undefined })}
              />

              <SearchSelect
                icon={<Users size={16} />}
                placeholder="Inquilino"
                searchPlaceholder="Buscar inquilino..."
                emptyMessage="No hay inquilinos"
                options={tenants.map(t => ({
                  value: t.id,
                  label: t.nameOrBusiness,
                  sublabel: t.contactEmail || t.contactPhone
                }))}
                value={newTask.tenantId || null}
                onChange={(val) => setNewTask({ ...newTask, tenantId: val ? Number(val) : undefined })}
              />

              <SearchSelect
                icon={<Receipt size={16} />}
                placeholder="Obligación"
                searchPlaceholder="Buscar obligación..."
                emptyMessage="No hay obligaciones pendientes"
                options={obligations.map(o => ({
                  value: o.id,
                  label: o.description,
                  sublabel: `$${o.amount?.toLocaleString('es-AR')} - ${o.status === 'pending' ? 'Pendiente' : o.status}`
                }))}
                value={newTask.obligationId || null}
                onChange={(val) => setNewTask({ ...newTask, obligationId: val ? Number(val) : undefined })}
              />

              <SearchSelect
                icon={<Building2 size={16} />}
                placeholder="Contacto"
                searchPlaceholder="Buscar contacto..."
                emptyMessage="No hay contactos"
                options={contacts.map(c => ({
                  value: c.id,
                  label: c.name,
                  sublabel: c.company || c.email || c.phone
                }))}
                value={newTask.contactId || null}
                onChange={(val) => setNewTask({ ...newTask, contactId: val ? Number(val) : undefined })}
              />
            </div>
          </div>

          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTask} disabled={!newTask.title.trim()}>
              Crear Tarea
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
