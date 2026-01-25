/**
 * Edit Position Modal Component
 * 
 * 📋 מה הקומפוננטה הזו עושה:
 * -------------------
 * Modal לעריכת פוזיציה - stop loss, take profit
 */

'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { updatePosition } from '@/lib/api'
import { showToast } from './Toast'

interface Position {
  token_address: string
  token_symbol: string
  stop_loss_price?: number
  stop_loss_pct?: number
  take_profit_1_price?: number
  take_profit_2_price?: number
}

interface EditPositionModalProps {
  position: Position | null
  onClose: () => void
  onUpdate: () => void
}

export default function EditPositionModal({ position, onClose, onUpdate }: EditPositionModalProps) {
  const [stopLossPct, setStopLossPct] = useState(15.0)
  const [takeProfit1, setTakeProfit1] = useState<number | undefined>()
  const [takeProfit2, setTakeProfit2] = useState<number | undefined>()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (position) {
      // Use stop_loss_pct if available, otherwise default to 15%
      setStopLossPct(position.stop_loss_pct || 15.0)
      setTakeProfit1(position.take_profit_1_price)
      setTakeProfit2(position.take_profit_2_price)
    }
  }, [position])

  if (!position) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates: any = {}
      if (stopLossPct !== undefined) {
        updates.stop_loss_pct = stopLossPct
      }
      if (takeProfit1 !== undefined) {
        updates.take_profit_1_price = takeProfit1
      }
      if (takeProfit2 !== undefined) {
        updates.take_profit_2_price = takeProfit2
      }

      const { data, error } = await updatePosition(position.token_address, updates)
      if (error) {
        showToast('אופס, שגיאה בעדכון פוזיציה', 'error')
      } else {
        showToast('פוזיציה עודכנה בהצלחה!', 'success')
        onUpdate()
        onClose()
      }
    } catch (error) {
      console.error('Error updating position:', error)
      showToast('אופס, שגיאה בעדכון פוזיציה', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            ערוך פוזיציה - {position.token_symbol}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stop Loss */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Stop Loss (%)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={stopLossPct}
              onChange={(e) => setStopLossPct(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              אם המחיר ירד ב-{stopLossPct}% מהמחיר הנוכחי, הפוזיציה תימכר אוטומטית
            </p>
          </div>

          {/* Take Profit 1 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Take Profit 1 (מחיר ב-USD)
            </label>
            <input
              type="number"
              min="0"
              step="0.000001"
              value={takeProfit1 || ''}
              onChange={(e) => setTakeProfit1(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="אופציונלי"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              מכירה חלקית כשהמחיר מגיע למחיר זה
            </p>
          </div>

          {/* Take Profit 2 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Take Profit 2 (מחיר ב-USD)
            </label>
            <input
              type="number"
              min="0"
              step="0.000001"
              value={takeProfit2 || ''}
              onChange={(e) => setTakeProfit2(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="אופציונלי"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              מכירה חלקית נוספת כשהמחיר מגיע למחיר זה
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  )
}
