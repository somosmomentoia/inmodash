/**
 * Centralized logging utility
 * In production, this should be replaced with a proper logging service
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, data?: unknown) {
    if (!this.isDevelopment && level === 'debug') {
      return // Skip debug logs in production
    }

    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`

    switch (level) {
      case 'error':
        console.error(prefix, message, data)
        break
      case 'warn':
        console.warn(prefix, message, data)
        break
      case 'info':
      case 'debug':
      default:
        console.log(prefix, message, data)
    }
  }

  info(message: string, data?: unknown) {
    this.log('info', message, data)
  }

  warn(message: string, data?: unknown) {
    this.log('warn', message, data)
  }

  error(message: string, error?: unknown) {
    this.log('error', message, error)
  }

  debug(message: string, data?: unknown) {
    this.log('debug', message, data)
  }
}

export const logger = new Logger()
