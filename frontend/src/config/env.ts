/**
 * Environment configuration for frontend
 * Centralized configuration for environment variables
 */

interface AppConfig {
  apiUrl: string
  isDevelopment: boolean
  isProduction: boolean
}

const config: AppConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
}

export default config
