/**
 * Toast Notification Component
 * 
 * 📋 מה הקומפוננטה הזו עושה:
 * -------------------
 * מספקת התראות יפות (success/error/info/warning) בפינה של המסך.
 * 
 * תכונות:
 * - 4 סוגי התראות (success, error, info, warning)
 * - Auto-dismiss אחרי X שניות
 * - Manual dismiss
 * - Animations חלקות
 * - Stack multiple toasts
 */

'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id)
      }, toast.duration || 5000)
      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onDismiss])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
  }

  const colors = {
    success: 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400',
  }

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg
        animate-slide-in-right
        ${colors[toast.type]}
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

let toastIdCounter = 0
const toastListeners: Array<(toast: Toast) => void> = []

export function showToast(message: string, type: ToastType = 'info', duration: number = 5000) {
  const toast: Toast = {
    id: `toast-${++toastIdCounter}`,
    message,
    type,
    duration,
  }
  toastListeners.forEach(listener => listener(toast))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts(prev => [...prev, toast])
    }
    toastListeners.push(listener)
    return () => {
      const index = toastListeners.indexOf(listener)
      if (index > -1) toastListeners.splice(index, 1)
    }
  }, [])

  const handleDismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-4 z-50 space-y-2 max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  )
}
