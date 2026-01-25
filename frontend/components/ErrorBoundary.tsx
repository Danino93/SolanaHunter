/**
 * Error Boundary Component
 * 
 * 📋 מה הקומפוננטה הזו עושה:
 * -------------------
 * תופס שגיאות JavaScript בכל מקום בעץ הקומפוננטות
 * ומציג UI חלופי במקום crash של כל הדף.
 * 
 * תכונות:
 * - תופס שגיאות ב-render, lifecycle methods, constructors
 * - מציג הודעת שגיאה ידידותית
 * - כפתור "נסה שוב"
 * - דיווח שגיאות (אופציונלי)
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (in production, you might want to log to an error reporting service)
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  onReset: () => void
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">
          אופס! משהו השתבש
        </h1>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
          אירעה שגיאה בלתי צפויה. אנא נסה לרענן את הדף או לחזור לדף הבית.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all">
              {error.message || 'Unknown error'}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            נסה שוב
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            דף הבית
          </button>
        </div>
      </div>
    </div>
  )
}
