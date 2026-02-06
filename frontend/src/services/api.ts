/**
 * API Client
 * Base configuration for API requests
 */

import config from '@/config/env'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private baseUrl: string
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (value?: unknown) => void
    reject: (reason?: unknown) => void
  }> = []

  constructor() {
    this.baseUrl = config.apiUrl
  }

  private processQueue(error: Error | null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error)
      } else {
        prom.resolve()
      }
    })
    
    this.failedQueue = []
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to refresh token')
      }

      // Token is now in httpOnly cookie
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    // Get token from localStorage for cross-origin requests
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token')
      if (token) {
        (defaultHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`
      }
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // Send cookies with requests
    }

    try {
      let response = await fetch(url, config)

      // If we get a 401, try to refresh the token
      if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
        if (this.isRefreshing) {
          // If already refreshing, wait for it to complete
          await new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject })
          })
          // Retry the original request
          response = await fetch(url, config)
        } else {
          this.isRefreshing = true

          try {
            const refreshSuccess = await this.refreshAccessToken()

            if (refreshSuccess) {
              this.processQueue(null)
              // Retry the original request with new token
              response = await fetch(url, config)
            } else {
              // Refresh failed, clear auth data and redirect to login
              this.processQueue(new Error('Token refresh failed'))
              if (typeof window !== 'undefined') {
                localStorage.removeItem('auth-token')
                // Use replace to prevent back button returning to protected page
                window.location.replace('/login')
              }
              throw new ApiError('Session expired', 401)
            }
          } catch (error) {
            this.processQueue(error as Error)
            throw error
          } finally {
            this.isRefreshing = false
          }
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        )
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null as T
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      )
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {}
    
    // Get token from localStorage for cross-origin requests
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    const config: RequestInit = {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      )
    }
  }
}

export const apiClient = new ApiClient()
