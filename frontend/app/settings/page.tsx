/**
 * Settings Page - הגדרות
 * 
 * 📋 מה הדף הזה עושה:
 * -------------------
 * ממשק לניהול כל ההגדרות של המערכת.
 * 
 * תכונות:
 * - Bot settings (threshold, scan interval)
 * - Trading settings (position size, stop-loss)
 * - API keys management
 * - Wallet management
 * - User preferences
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  Settings,
  RefreshCw,
  Save,
  Key,
  Wallet,
  AlertCircle
} from 'lucide-react'
import { getSettings, updateSettings } from '@/lib/api'
import { showToast } from '@/components/Toast'

export default function SettingsPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [settings, setSettings] = useState({
    alertThreshold: 85,
    scanInterval: 300,
    maxPositionSize: 5,
    stopLossPct: 15,
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    } else {
      setAuthChecked(true)
      loadSettings()
    }
  }, [router])

  const loadSettings = async () => {
    try {
      const { data, error } = await getSettings()
      if (error) {
        showToast(`שגיאה בטעינת הגדרות: ${error}`, 'error')
        return
      }
      if (data) {
        setSettings({
          alertThreshold: data.alert_threshold,
          scanInterval: data.scan_interval,
          maxPositionSize: data.max_position_size,
          stopLossPct: data.stop_loss_pct,
        })
      }
    } catch (error) {
      showToast('שגיאה בטעינת הגדרות', 'error')
    }
  }

  const saveSettings = async () => {
    try {
      const { error } = await updateSettings({
        alert_threshold: settings.alertThreshold,
        scan_interval: settings.scanInterval,
        max_position_size: settings.maxPositionSize,
        stop_loss_pct: settings.stopLossPct,
      })
      if (error) {
        showToast(`שגיאה בשמירת הגדרות: ${error}`, 'error')
        return
      }
      showToast('הגדרות נשמרו בהצלחה!', 'success')
    } catch (error) {
      showToast('שגיאה בשמירת הגדרות', 'error')
    }
  }

  if (!authChecked) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="relative">
        {/* Header */}
        <header className="border-b border-slate-200/50 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sticky top-0 z-50 shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  הגדרות המערכת והבוט
                </p>
              </div>
              <button
                onClick={saveSettings}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                שמור
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bot Settings */}
            <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                הגדרות בוט
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    סף התראה (Alert Threshold): {settings.alertThreshold}
                  </label>
                  <input
                    type="range"
                    min="70"
                    max="100"
                    value={settings.alertThreshold}
                    onChange={(e) => setSettings({...settings, alertThreshold: Number(e.target.value)})}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    רק טוקנים עם ציון {settings.alertThreshold}+ יקבלו התראה
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    תדירות סריקה (שניות): {settings.scanInterval}
                  </label>
                  <input
                    type="number"
                    value={settings.scanInterval}
                    onChange={(e) => setSettings({...settings, scanInterval: Number(e.target.value)})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Trading Settings */}
            <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                הגדרות מסחר
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    גודל פוזיציה מקסימלי (%): {settings.maxPositionSize}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.maxPositionSize}
                    onChange={(e) => setSettings({...settings, maxPositionSize: Number(e.target.value)})}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Stop-Loss (%): {settings.stopLossPct}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={settings.stopLossPct}
                    onChange={(e) => setSettings({...settings, stopLossPct: Number(e.target.value)})}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* API Keys */}
            <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Keys
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Helius API</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">••••••••</p>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Supabase</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">מוגדר</p>
                </div>
              </div>
            </div>

            {/* Wallet Info */}
            <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                ארנק
              </h2>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      ארנק לא מוגדר
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      הגדר ארנק ב-Day 15
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  )
}
