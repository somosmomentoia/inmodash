import { useState, useCallback } from 'react'

export interface Toast {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((toast: Toast) => {
    // For now, just use alert - we can improve this later with a proper toast component
    if (toast.variant === 'destructive') {
      alert(`❌ ${toast.title}\n${toast.description || ''}`)
    } else {
      alert(`✅ ${toast.title}\n${toast.description || ''}`)
    }
  }, [])

  return { toast, toasts }
}
