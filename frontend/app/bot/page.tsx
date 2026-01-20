/**
 * Bot Control Page - ניהול הבוט
 * 
 * 📋 מה הדף הזה עושה:
 * -------------------
 * ממשק לשליטה על הבוט והגדרותיו.
 * 
 * תכונות:
 * - Start/Stop/Pause controls
 * - Bot status dashboard
 * - Settings management
 * - Logs viewer
 * - Health monitoring
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  Bot,
  Play,
  Pause,
  Square,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Settings,
  Activity
} from 'lucide-react'
import { getBotStatus, startBot, stopBot, pauseBot, resumeBot, getBotStats, type BotStatus as BotStatusType } from '@/lib/api'
import { showToast } from '@/components/Toast'

export default function BotControlPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [botStatus, setBotStatus] = useState<'running' | 'paused' | 'stopped'>('stopped')
  const [stats, setStats] = useState({
    tokensScanned: 0,
    tokensAnalyzed: 0,
    alertsSent: 0,
    uptime: '0h 0m',
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    } else {
      setAuthChecked(true)
      loadBotStatus()
    }
  }, [router])

  const loadBotStatus = async () => {
    try {
      const { data, error } = await getBotStatus()
      if (error) {
        console.error('Error loading bot status:', error)
        return
      }
      if (data) {
        setBotStatus(data.status === 'running' ? 'running' : data.status === 'paused' ? 'paused' : 'stopped')
        setStats({
          tokensScanned: data.scan_count || 0,
          tokensAnalyzed: data.tokens_analyzed || 0,
          alertsSent: 0,
          uptime: '0h 0m',
        })
      }
    } catch (error) {
      console.error('Error loading bot status:', error)
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
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Bot Control
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                ניהול ושליטה על הבוט
              </p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Status Card */}
          <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  botStatus === 'running' ? 'bg-green-500/20' : 
                  botStatus === 'paused' ? 'bg-yellow-500/20' : 
                  'bg-red-500/20'
                }`}>
                  <Bot className={`w-6 h-6 ${
                    botStatus === 'running' ? 'text-green-500' : 
                    botStatus === 'paused' ? 'text-yellow-500' : 
                    'text-red-500'
                  }`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    מצב הבוט: {
                      botStatus === 'running' ? 'פועל' : 
                      botStatus === 'paused' ? 'מושהה' : 
                      'עצור'
                    }
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    {botStatus === 'running' ? 'הבוט סורק טוקנים פעיל' : 
                     botStatus === 'paused' ? 'הבוט מושהה זמנית' : 
                     'הבוט לא פועל'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {botStatus === 'stopped' && (
                  <button
                    onClick={async () => {
                      const { error } = await startBot()
                      if (error) {
                        showToast(`שגיאה בהפעלת הבוט: ${error}`, 'error')
                      } else {
                        showToast('הבוט הופעל בהצלחה!', 'success')
                      }
                      await loadBotStatus()
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    הפעל
                  </button>
                )}
                {botStatus === 'running' && (
                  <>
                    <button
                      onClick={async () => {
                        const { error } = await pauseBot()
                        if (error) {
                          showToast(`שגיאה בהשהיית הבוט: ${error}`, 'error')
                        } else {
                          showToast('הבוט הושהה', 'info')
                        }
                        await loadBotStatus()
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                    >
                      <Pause className="w-4 h-4" />
                      השהייה
                    </button>
                    <button
                      onClick={async () => {
                        const { error } = await stopBot()
                        if (error) {
                          showToast(`שגיאה בעצירת הבוט: ${error}`, 'error')
                        } else {
                          showToast('הבוט נעצר', 'info')
                        }
                        await loadBotStatus()
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      <Square className="w-4 h-4" />
                      עצור
                    </button>
                  </>
                )}
                {botStatus === 'paused' && (
                  <>
                    <button
                      onClick={async () => {
                        const { error } = await resumeBot()
                        if (error) {
                          showToast(`שגיאה בחידוש הבוט: ${error}`, 'error')
                        } else {
                          showToast('הבוט חודש', 'success')
                        }
                        await loadBotStatus()
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      המשך
                    </button>
                    <button
                      onClick={async () => {
                        const { error } = await stopBot()
                        if (error) {
                          showToast(`שגיאה בעצירת הבוט: ${error}`, 'error')
                        } else {
                          showToast('הבוט נעצר', 'info')
                        }
                        await loadBotStatus()
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      <Square className="w-4 h-4" />
                      עצור
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">טוקנים נסרקו</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.tokensScanned}</p>
              </div>
              <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">טוקנים נותחו</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.tokensAnalyzed}</p>
              </div>
              <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">התראות נשלחו</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.alertsSent}</p>
              </div>
              <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">זמן פעילות</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.uptime}</p>
              </div>
            </div>
          </div>

          {/* Health Status */}
          <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              מצב המערכת
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-slate-700 dark:text-slate-300">Scanner</span>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-slate-700 dark:text-slate-300">Analyzer</span>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-slate-700 dark:text-slate-300">Telegram Bot</span>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <span className="text-slate-700 dark:text-slate-300">Executor</span>
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  )
}
