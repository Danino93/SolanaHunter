/**
 * Analytics Page - ביצועים ודוחות
 * 
 * 📋 מה הדף הזה עושה:
 * -------------------
 * מציג analytics מפורטים על ביצועי המסחר.
 * 
 * תכונות:
 * - Performance charts
 * - Win/Loss analysis
 * - ROI calculator
 * - Daily/Weekly/Monthly reports
 * - Token performance tracking
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import PerformanceChart from '@/components/PerformanceChart'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  DollarSign
} from 'lucide-react'
import { getPerformance, getTradesAnalysis, getROI, getPortfolioPerformanceHistory, type PerformanceData, type TradesAnalysis, type ROIData, type PerformanceHistoryData } from '@/lib/api'
import { showToast } from '@/components/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function AnalyticsPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [performance, setPerformance] = useState<PerformanceData | null>(null)
  const [tradesAnalysis, setTradesAnalysis] = useState<TradesAnalysis | null>(null)
  const [roiData, setRoiData] = useState<ROIData | null>(null)
  const [chartData, setChartData] = useState<PerformanceHistoryData[]>([])
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    } else {
      setAuthChecked(true)
      loadAnalytics()
    }
  }, [router, timeRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // Calculate days for chart based on time range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
      
      // Load all analytics data in parallel with time range
      const [performanceRes, tradesRes, roiRes, chartRes] = await Promise.all([
        getPerformance(timeRange),
        getTradesAnalysis(timeRange),
        getROI(timeRange),
        getPortfolioPerformanceHistory(days),
      ])
      
      if (performanceRes.data) {
        setPerformance(performanceRes.data)
      }
      if (tradesRes.data) {
        setTradesAnalysis(tradesRes.data)
      }
      if (roiRes.data) {
        setRoiData(roiRes.data)
      }
      if (chartRes.data) {
        setChartData(chartRes.data.data || [])
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      showToast('שגיאה בטעינת אנליטיקה', 'error')
    } finally {
      setLoading(false)
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
                אנליטיקה
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                ביצועים ודוחות מפורטים
              </p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Time Range Selector */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">טווח זמן:</span>
            </div>
            <div className="flex gap-2">
              {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {range === '7d' ? '7 ימים' : range === '30d' ? '30 ימים' : range === '90d' ? '90 ימים' : 'הכל'}
                </button>
              ))}
            </div>
            <button
              onClick={loadAnalytics}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              title="רענון"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">אחוז הצלחה</p>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-500">
                {performance?.win_rate?.toFixed(1) || '0.0'}%
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {tradesAnalysis?.winning_trades || 0} הצלחות / {tradesAnalysis?.total_trades || 0} עסקאות
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">סה"כ רווח/הפסד</p>
                <DollarSign className={`w-5 h-5 ${
                  (performance?.total_pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                }`} />
              </div>
              <p className={`text-3xl font-bold ${
                (performance?.total_pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                ${performance?.total_pnl?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">מאז ומעולם</p>
            </div>

            <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">סה"כ עסקאות</p>
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {tradesAnalysis?.total_trades || performance?.total_trades || 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">הושלמו</p>
            </div>

            <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">רווח ממוצע</p>
                <TrendingUp className="w-5 h-5 text-yellow-500" />
              </div>
              <p className={`text-3xl font-bold ${
                (performance?.avg_profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                ${performance?.avg_profit?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">לעסקה</p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* ROI Card */}
            <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">ROI</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">סה"כ הושקע:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    ${roiData?.total_invested?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">שווי נוכחי:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    ${roiData?.total_value?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">רווח/הפסד:</span>
                  <span className={`font-bold text-lg ${
                    (roiData?.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    ${roiData?.profit?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">ROI:</span>
                  <span className={`font-bold text-lg ${
                    (roiData?.roi || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {roiData?.roi?.toFixed(2) || '0.00'}%
                  </span>
                </div>
              </div>
            </div>

            {/* Trades Breakdown */}
            <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">פירוט עסקאות</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">עסקאות רווחיות:</span>
                  <span className="font-medium text-green-500">
                    {tradesAnalysis?.winning_trades || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">עסקאות הפסדיות:</span>
                  <span className="font-medium text-red-500">
                    {tradesAnalysis?.losing_trades || 0}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">רווח ממוצע (זכייה):</span>
                  <span className="font-medium text-green-500">
                    ${tradesAnalysis?.avg_win?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">הפסד ממוצע:</span>
                  <span className="font-medium text-red-500">
                    ${Math.abs(tradesAnalysis?.avg_loss || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                גרף ביצועים
              </h2>
            </div>
            <PerformanceChart
              data={chartData}
              timeRange={timeRange}
            />
          </div>

          {/* Best/Worst Trades */}
          {(performance?.best_trade || performance?.worst_trade) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {performance.best_trade && (
                <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
                  <h3 className="text-lg font-bold text-green-500 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    עסקה מוצלחת ביותר
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">טוקן:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {performance.best_trade.token_symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">רווח:</span>
                      <span className="font-bold text-green-500 text-lg">
                        ${performance.best_trade.pnl_usd?.toFixed(2)}
                      </span>
                    </div>
                    {performance.best_trade.date && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">תאריך:</span>
                        <span className="text-sm text-slate-500">
                          {new Date(performance.best_trade.date).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {performance.worst_trade && (
                <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
                  <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    עסקה הפסדית ביותר
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">טוקן:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {performance.worst_trade.token_symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">הפסד:</span>
                      <span className="font-bold text-red-500 text-lg">
                        ${Math.abs(performance.worst_trade.pnl_usd || 0).toFixed(2)}
                      </span>
                    </div>
                    {performance.worst_trade.date && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">תאריך:</span>
                        <span className="text-sm text-slate-500">
                          {new Date(performance.worst_trade.date).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  )
}
