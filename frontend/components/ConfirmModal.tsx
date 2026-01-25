/**
 * Confirm Modal Component
 * 
 * 📋 מה הקומפוננטה הזו עושה:
 * -------------------
 * Modal לאישור פעולות חשובות/הרסניות.
 * 
 * תכונות:
 * - Title ו-message מותאמים אישית
 * - כפתורי אישור/ביטול
 * - אפשרות להוסיף checkbox (למשל "אני מבין את הסיכונים")
 * - Animations חלקות
 */

'use client'

import { X, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'red' | 'blue' | 'green' | 'yellow'
  requireCheckbox?: boolean
  checkboxLabel?: string
  isLoading?: boolean
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'אישור',
  cancelText = 'ביטול',
  confirmColor = 'red',
  requireCheckbox = false,
  checkboxLabel = 'אני מבין את הסיכונים',
  isLoading = false,
}: ConfirmModalProps) {
  const [checkboxChecked, setCheckboxChecked] = useState(false)

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const colorClasses = {
    red: 'bg-red-500 hover:bg-red-600 text-white',
    blue: 'bg-blue-500 hover:bg-blue-600 text-white',
    green: 'bg-green-500 hover:bg-green-600 text-white',
    yellow: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`p-3 rounded-full ${
            confirmColor === 'red' ? 'bg-red-100 dark:bg-red-900/20' :
            confirmColor === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
            confirmColor === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
            'bg-yellow-100 dark:bg-yellow-900/20'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${
              confirmColor === 'red' ? 'text-red-500' :
              confirmColor === 'blue' ? 'text-blue-500' :
              confirmColor === 'green' ? 'text-green-500' :
              'text-yellow-500'
            }`} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">
          {title}
        </h2>

        {/* Message */}
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
          {message}
        </p>

        {/* Checkbox (if required) */}
        {requireCheckbox && (
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checkboxChecked}
                onChange={(e) => setCheckboxChecked(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {checkboxLabel}
              </span>
            </label>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || (requireCheckbox && !checkboxChecked)}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses[confirmColor]}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                מעבד...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
