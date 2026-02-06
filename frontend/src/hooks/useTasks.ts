import { useState, useEffect, useCallback } from 'react'
import { Task, CreateTaskDto, UpdateTaskDto, TaskStats, TaskStatus, TaskPriority } from '@/types'
import { apiClient, ApiError } from '@/services/api'

interface UseTasksOptions {
  status?: TaskStatus
  priority?: TaskPriority
  includeCompleted?: boolean
}

export function useTasks(options?: UseTasksOptions) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (options?.status) params.append('status', options.status)
      if (options?.priority) params.append('priority', options.priority)
      if (options?.includeCompleted) params.append('includeCompleted', 'true')

      const data = await apiClient.get<Task[]>(`/api/tasks?${params}`)
      setTasks(data)
      setError(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Session expired, apiClient will redirect to login
        return
      }
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [options?.status, options?.priority, options?.includeCompleted])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const createTask = async (data: CreateTaskDto): Promise<Task | null> => {
    try {
      const newTask = await apiClient.post<Task>('/api/tasks', data)
      setTasks(prev => [newTask, ...prev])
      return newTask
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  const updateTask = async (id: number, data: UpdateTaskDto): Promise<Task | null> => {
    try {
      const updatedTask = await apiClient.put<Task>(`/api/tasks/${id}`, data)
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
      return updatedTask
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  const toggleTask = async (id: number): Promise<Task | null> => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks/${id}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error('Failed to toggle task')
      const updatedTask = await response.json()
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
      return updatedTask
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  const deleteTask = async (id: number): Promise<boolean> => {
    try {
      await apiClient.delete(`/api/tasks/${id}`)
      setTasks(prev => prev.filter(t => t.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
  }
}

export function useTaskStats() {
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.get<TaskStats>('/api/tasks/stats')
      setStats(data)
      setError(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}

export function useUpcomingTasks(limit: number = 5) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      // Fetch pending tasks
      const pendingData = await apiClient.get<Task[]>(`/api/tasks/upcoming?limit=${limit}`)
      setTasks(pendingData)
      
      // Fetch recently completed tasks (last 5)
      const completedData = await apiClient.get<Task[]>(`/api/tasks?status=completed&limit=5`)
      setCompletedTasks(completedData)
      
      setError(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const toggleTask = async (id: number): Promise<Task | null> => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks/${id}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error('Failed to toggle task')
      const updatedTask = await response.json()
      if (updatedTask.status === 'completed') {
        // Move from pending to completed
        setTasks(prev => prev.filter(t => t.id !== id))
        setCompletedTasks(prev => [updatedTask, ...prev.slice(0, 4)])
      } else {
        // Move from completed to pending
        setCompletedTasks(prev => prev.filter(t => t.id !== id))
        setTasks(prev => [updatedTask, ...prev])
      }
      return updatedTask
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  return { tasks, completedTasks, loading, error, refetch: fetchTasks, toggleTask }
}

export function useTask(id: number) {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.get<Task>(`/api/tasks/${id}`)
      setTask(data)
      setError(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchTask()
    }
  }, [id, fetchTask])

  return { task, loading, error, refetch: fetchTask }
}

export function useTasksByContact(contactId: number | undefined) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!contactId) {
      setTasks([])
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const data = await apiClient.get<Task[]>(`/api/tasks?contactId=${contactId}&includeCompleted=true`)
      setTasks(data)
      setError(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [contactId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const toggleTask = async (id: number): Promise<Task | null> => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks/${id}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error('Failed to toggle task')
      const updatedTask = await response.json()
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
      return updatedTask
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  return { tasks, loading, error, refetch: fetchTasks, toggleTask }
}
