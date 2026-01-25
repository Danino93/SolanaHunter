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
import { getBotStatus, startBot, stopBot, pauseBot, resumeBot, getBotStats, getBotHealth, type BotHealth } from '@/lib/api'
import { showToast } from '@/components/Toast'
import ConfirmModal from '@/components/ConfirmModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function BotControlPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [botStatus, setBotStatus] = useState<'running' | 'paused' | 'stopped' | 'not_initialized'>('stopped')
  const [loading, setLoading] = useState(false)
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const [health, setHealth] = useState<BotHealth | null>(null)
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
      
      // Load health status
      loadHealthStatus()
      
      // Auto-refresh every 5 seconds
      const interval = setInterval(() => {
        loadBotStatus()
        loadHealthStatus()
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [router])

  const loadBotStatus = async () => {
    try {
      // Load status
      const { data: statusData, error: statusError } = await getBotStatus()
      if (statusError) {
        console.error('Error loading bot status:', statusError)
        showToast('שגיאה בטעינת מצב הבוט', 'error')
        return
      }
      if (statusData) {
        const status = statusData.status === 'running' ? 'running' : 
                      statusData.status === 'paused' ? 'paused' : 
                      statusData.status === 'not_initialized' ? 'not_initialized' : 'stopped'
        setBotStatus(status)
        
        // Load stats
        const { data: statsData, error: statsError } = await getBotStats()
        if (!statsError && statsData) {
          setStats({
            tokensScanned: statsData.scans || statusData.scan_count || 0,
            tokensAnalyzed: statsData.tokens_analyzed || statusData.tokens_analyzed || 0,
            alertsSent: statsData.alerts_sent || 0,
            uptime: formatUptime(statsData.uptime_seconds || 0),
          })
        } else {
          // Fallback to status data
          setStats({
            tokensScanned: statusData.scan_count || 0,
            tokensAnalyzed: statusData.tokens_analyzed || 0,
            alertsSent: statusData.high_score_count || 0,
            uptime: '0h 0m',
          })
        }
      }
    } catch (error) {
      console.error('Error loading bot status:', error)
      showToast('שגיאה בטעינת מצב הבוט', 'error')
    }
  }

  const formatUptime = (seconds: number): string => {
    if (seconds === 0) return '0h 0m'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const loadHealthStatus = async () => {
    try {
      const { data, error } = await getBotHealth()
      if (error) {
        console.error('Error loading health status:', error)
        return
      }
      if (data) {
        setHealth(data)
      }
    } catch (error) {
      console.error('Error loading health status:', error)
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
    <ErrorBoundary>
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
                      botStatus === 'not_initialized' ? 'לא מאותחל' :
                      'עצור'
                    }
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    {botStatus === 'running' ? 'הבוט סורק טוקנים פעיל' : 
                     botStatus === 'paused' ? 'הבוט מושהה זמנית' : 
                     botStatus === 'not_initialized' ? 'הבוט לא אותחל - נדרש אתחול' :
                     'הבוט לא פועל'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(botStatus === 'stopped' || botStatus === 'not_initialized') && (
                  <button
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const { error } = await startBot()
                        if (error) {
                          showToast(`שגיאה בהפעלת הבוט: ${error}`, 'error')
                        } else {
                          showToast('הבוט הופעל בהצלחה!', 'success')
                          await loadBotStatus()
                        }
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4" />
                    הפעל
                  </button>
                )}
                {botStatus === 'running' && (
                  <>
                    <button
                      onClick={async () => {
                        setLoading(true)
                        try {
                          const { error } = await pauseBot()
                          if (error) {
                            showToast(`שגיאה בהשהיית הבוט: ${error}`, 'error')
                          } else {
                            showToast('הבוט הושהה', 'info')
                            await loadBotStatus()
                          }
                        } finally {
                          setLoading(false)
                        }
                      }}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 text-white hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Pause className="w-4 h-4" />
                      השהייה
                    </button>
                    <button
                      onClick={() => setShowStopConfirm(true)}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        setLoading(true)
                        try {
                          const { error } = await resumeBot()
                          if (error) {
                            showToast(`שגיאה בחידוש הבוט: ${error}`, 'error')
                          } else {
                            showToast('הבוט חודש', 'success')
                            await loadBotStatus()
                          }
                        } finally {
                          setLoading(false)
                        }
                      }}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-4 h-4" />
                      המשך
                    </button>
                    <button
                      onClick={() => setShowStopConfirm(true)}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                מצב המערכת
              </h2>
              <button
                onClick={() => {
                  loadBotStatus()
                  loadHealthStatus()
                }}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                title="רענון"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {health ? (
                <>
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    health.scanner.status === 'healthy' ? 'bg-green-50 dark:bg-green-900/20' :
                    health.scanner.status === 'unhealthy' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                    'bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <div className="flex-1">
                      <span className="text-slate-700 dark:text-slate-300">Scanner</span>
                      {health.scanner.status !== 'healthy' && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {health.scanner.message}
                        </p>
                      )}
                    </div>
                    {health.scanner.status === 'healthy' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : health.scanner.status === 'unhealthy' ? (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    health.analyzer.status === 'healthy' ? 'bg-green-50 dark:bg-green-900/20' :
                    health.analyzer.status === 'unhealthy' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                    'bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <div className="flex-1">
                      <span className="text-slate-700 dark:text-slate-300">Analyzer</span>
                      {health.analyzer.status !== 'healthy' && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {health.analyzer.message}
                        </p>
                      )}
                    </div>
                    {health.analyzer.status === 'healthy' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : health.analyzer.status === 'unhealthy' ? (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    health.database.status === 'healthy' ? 'bg-green-50 dark:bg-green-900/20' :
                    health.database.status === 'unhealthy' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                    'bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <div className="flex-1">
                      <span className="text-slate-700 dark:text-slate-300">Database (Supabase)</span>
                      {health.database.status !== 'healthy' && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {health.database.message}
                        </p>
                      )}
                    </div>
                    {health.database.status === 'healthy' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : health.database.status === 'unhealthy' ? (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    health.telegram.status === 'healthy' ? 'bg-green-50 dark:bg-green-900/20' :
                    health.telegram.status === 'unhealthy' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                    'bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <div className="flex-1">
                      <span className="text-slate-700 dark:text-slate-300">Telegram Bot</span>
                      {health.telegram.status !== 'healthy' && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {health.telegram.message}
                        </p>
                      )}
                    </div>
                    {health.telegram.status === 'healthy' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : health.telegram.status === 'unhealthy' ? (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                    <span className="text-slate-700 dark:text-slate-300">Scanner</span>
                    <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                    <span className="text-slate-700 dark:text-slate-300">Analyzer</span>
                    <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                    <span className="text-slate-700 dark:text-slate-300">Database (Supabase)</span>
                    <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                    <span className="text-slate-700 dark:text-slate-300">Telegram Bot</span>
                    <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

        {/* Stop Confirmation Modal */}
        <ConfirmModal
          isOpen={showStopConfirm}
          onClose={() => setShowStopConfirm(false)}
          onConfirm={async () => {
            setShowStopConfirm(false)
            setLoading(true)
            try {
              const { error } = await stopBot()
              if (error) {
                showToast(`שגיאה בעצירת הבוט: ${error}`, 'error')
              } else {
                showToast('הבוט נעצר', 'info')
                await loadBotStatus()
              }
            } finally {
              setLoading(false)
            }
          }}
          title="עצירת הבוט"
          message="האם אתה בטוח שברצונך לעצור את הבוט? זה ימנע סריקת טוקנים חדשים והבוט יפסיק לפעול."
          confirmText="כן, עצור"
          cancelText="ביטול"
          confirmColor="red"
          isLoading={loading}
        />
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  )
}
