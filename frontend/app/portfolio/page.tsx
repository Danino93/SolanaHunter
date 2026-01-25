/**
 * Portfolio Page - ניהול פוזיציות
 * 
 * 📋 מה הדף הזה עושה:
 * -------------------
 * מציג את כל הפוזיציות הפעילות שלך + P&L בזמן אמת.
 * 
 * תכונות:
 * - רשימת פוזיציות פעילות
 * - P&L לכל פוזיציה (רווח/הפסד)
 * - Portfolio value כולל
 * - Performance metrics
 * - Quick actions (Sell, Edit Stop-Loss)
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Percent,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  BarChart3
} from 'lucide-react'
import { getPositions, sellPosition, updatePosition, getWalletInfo, WalletInfo, getPortfolioPerformanceHistory, PerformanceHistoryData, getTradeHistory, TradeHistory } from '@/lib/api'
import { showToast } from '@/components/Toast'
import { formatAddress } from '@/lib/formatters'
import PerformanceChart from '@/components/PerformanceChart'
import EditPositionModal from '@/components/EditPositionModal'

interface Position {
  id: string
  token_address: string
  token_symbol: string
  token_name: string
  amount_tokens: number
  entry_price: number
  current_price: number
  entry_value_usd: number
  current_value_usd: number
  unrealized_pnl_usd: number
  unrealized_pnl_pct: number
  stop_loss_price?: number
  stop_loss_pct?: number
  take_profit_1_price?: number
  take_profit_2_price?: number
  opened_at: string
}

export default function PortfolioPage() {
  const router = useRouter()
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [sellingToken, setSellingToken] = useState<string | null>(null)
  const [editingToken, setEditingToken] = useState<string | null>(null)
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceHistoryData[]>([])
  const [chartTimeRange, setChartTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    } else {
      setAuthChecked(true)
      loadPositions()
      loadWalletInfo()
      loadPerformanceHistory()
      loadTradeHistory()
    }
  }, [router])

  const loadTradeHistory = async () => {
    try {
      const { data, error } = await getTradeHistory(100)
      if (error) {
        console.error('Failed to load trade history:', error)
        setTradeHistory([])
      } else {
        setTradeHistory(data?.trades || [])
      }
    } catch (error) {
      console.error('Error loading trade history:', error)
      setTradeHistory([])
    }
  }

  // Real-time updates from Supabase
  useEffect(() => {
    if (!authChecked || !isSupabaseConfigured || !supabase) return

    // Subscribe to positions table changes
    const positionsChannel = supabase
      .channel('positions-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'positions',
        },
        (payload) => {
          console.log('Position changed:', payload)
          // Reload positions when changed
          loadPositions()
        }
      )
      .subscribe()

    // Subscribe to trade_history table changes
    const tradesChannel = supabase
      .channel('trades-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_history',
        },
        (payload) => {
          console.log('Trade changed:', payload)
          // Reload positions to reflect changes
          loadPositions()
        }
      )
      .subscribe()

    return () => {
      positionsChannel.unsubscribe()
      tradesChannel.unsubscribe()
    }
  }, [authChecked])

  const loadPositions = async () => {
    setLoading(true)
    try {
      const { data, error } = await getPositions()
      if (error) {
        console.error('Failed to load positions:', error)
        setPositions([])
      } else {
        setPositions(data?.positions || [])
      }
    } catch (error) {
      console.error('Error loading positions:', error)
      setPositions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSell = async (tokenAddress: string) => {
    if (!confirm('האם אתה בטוח שברצונך למכור את הפוזיציה הזו?')) {
      return
    }
    
    setSellingToken(tokenAddress)
    try {
      const { data, error } = await sellPosition(tokenAddress, 100.0)
      if (error) {
        showToast('אופס, שגיאה במכירת פוזיציה', 'error')
      } else {
        showToast('פוזיציה נמכרה בהצלחה!', 'success')
        // Reload positions
        await loadPositions()
      }
    } catch (error) {
      console.error('Error selling position:', error)
      showToast('אופס, שגיאה במכירת פוזיציה', 'error')
    } finally {
      setSellingToken(null)
    }
  }

  const handleEdit = (tokenAddress: string) => {
    const position = positions.find(p => p.token_address === tokenAddress)
    if (position) {
      setEditingPosition(position)
    }
  }

  const loadWalletInfo = async () => {
    try {
      const { data, error } = await getWalletInfo()
      if (error) {
        console.error('Failed to load wallet info:', error)
        setWalletInfo(null)
      } else {
        setWalletInfo(data || null)
      }
    } catch (error) {
      console.error('Error loading wallet info:', error)
      setWalletInfo(null)
    }
  }

  const loadPerformanceHistory = async () => {
    try {
      const days = chartTimeRange === '7d' ? 7 : chartTimeRange === '30d' ? 30 : chartTimeRange === '90d' ? 90 : 365
      const { data, error } = await getPortfolioPerformanceHistory(days)
      if (error) {
        console.error('Failed to load performance history:', error)
        setPerformanceData([])
      } else {
        setPerformanceData(data?.data || [])
      }
    } catch (error) {
      console.error('Error loading performance history:', error)
      setPerformanceData([])
    }
  }

  useEffect(() => {
    if (authChecked) {
      loadPerformanceHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartTimeRange, authChecked])

  if (!authChecked) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  // Calculate portfolio stats
  const totalValue = positions.reduce((sum, p) => sum + p.current_value_usd, 0)
  const totalCost = positions.reduce((sum, p) => sum + p.entry_value_usd, 0)
  const totalPnl = totalValue - totalCost
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  return (
    <DashboardLayout>
      <div className="relative">
        {/* Header */}
        <header className="border-b border-slate-200/50 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sticky top-0 z-50 shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  תיק השקעות
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  פוזיציות פעילות וביצועים
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                    showHistory 
                      ? 'bg-purple-500 text-white hover:bg-purple-600' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  {showHistory ? 'הסתר היסטוריה' : 'היסטוריית עסקאות'}
                </button>
                <button
                  onClick={() => {
                    loadPositions()
                    loadWalletInfo()
                    loadPerformanceHistory()
                    loadTradeHistory()
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  רענן
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Wallet Info Card */}
          {walletInfo && walletInfo.available && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/50 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    ארנק הבוט
                  </h2>
                  <div className="flex items-center gap-3">
                    <code className="text-sm font-mono text-slate-600 dark:text-slate-400">
                      {formatAddress(walletInfo.address || '')}
                    </code>
                    <a
                      href={`https://solscan.io/account/${walletInfo.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {walletInfo.balance_sol.toFixed(4)} SOL
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    ${walletInfo.balance_usd.toFixed(2)} USD
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">ערך כולל</p>
                <Wallet className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                ${totalValue.toFixed(2)}
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">P&L כולל</p>
                {totalPnl >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
              <p className={`text-3xl font-bold ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </p>
              <p className={`text-sm ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalPnl >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">פוזיציות פעילות</p>
                <DollarSign className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {positions.length}
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">עלות כוללת</p>
                <Percent className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                ${totalCost.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Performance Chart */}
          {performanceData.length > 0 && (
            <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  ביצועי תיק
                </h2>
                <div className="flex items-center gap-2">
                  {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setChartTimeRange(range)
                        loadPerformanceHistory()
                      }}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        chartTimeRange === range
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {range === '7d' ? '7 ימים' : range === '30d' ? '30 ימים' : range === '90d' ? '90 ימים' : 'הכל'}
                    </button>
                  ))}
                </div>
              </div>
              <PerformanceChart
                data={performanceData.map(d => ({
                  date: d.date,
                  roi: d.pnl_pct,
                  value: d.value,
                }))}
                type="area"
                height={300}
              />
            </div>
          )}

          {/* Positions List */}
          <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl border border-slate-200/50 dark:border-slate-700 shadow-2xl overflow-hidden">
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">טוקן</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">כמות</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">מחיר כניסה</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">מחיר נוכחי</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-24" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-20" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-24" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-24" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-20" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : positions.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  אין פוזיציות פעילות
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  התחל לקנות טוקנים מהדף Trading או Dashboard
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-100/80 to-blue-50/50 dark:from-slate-900/80 dark:to-blue-900/20 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">טוקן</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">כמות</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">מחיר כניסה</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">מחיר נוכחי</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">ערך נוכחי</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">P&L</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {positions.map((position) => (
                      <tr
                        key={position.id}
                        className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/30 dark:hover:from-slate-800/50 dark:hover:to-slate-700/30 transition-all duration-300"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                              {position.token_symbol.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {position.token_symbol}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                {position.token_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-medium">
                          {position.amount_tokens.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
                          ${position.entry_price.toFixed(6)}
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
                          ${position.current_price.toFixed(6)}
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-semibold">
                          ${position.current_value_usd.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {position.unrealized_pnl_usd >= 0 ? (
                              <ArrowUpRight className="w-4 h-4 text-green-500" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-red-500" />
                            )}
                            <span
                              className={`font-bold ${
                                position.unrealized_pnl_usd >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}
                            >
                              {position.unrealized_pnl_usd >= 0 ? '+' : ''}${position.unrealized_pnl_usd.toFixed(2)}
                            </span>
                            <span
                              className={`text-sm ${
                                position.unrealized_pnl_pct >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}
                            >
                              ({position.unrealized_pnl_pct >= 0 ? '+' : ''}{position.unrealized_pnl_pct.toFixed(2)}%)
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSell(position.token_address)}
                              disabled={sellingToken === position.token_address}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {sellingToken === position.token_address ? 'מוכר...' : 'מכור'}
                            </button>
                            <button
                              onClick={() => handleEdit(position.token_address)}
                              disabled={editingToken === position.token_address}
                              className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ערוך
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Trade History Section */}
          {showHistory && (
            <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl border border-slate-200/50 dark:border-slate-700 shadow-2xl overflow-hidden mt-8">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  היסטוריית עסקאות
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  כל העסקאות שביצעת (קנייה ומכירה)
                </p>
              </div>
              {tradeHistory.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>אין היסטוריית עסקאות עדיין</p>
                  <p className="text-xs mt-2">העסקאות יופיעו כאן אחרי שתבצע קנייה או מכירה</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">תאריך</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">סוג</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">מטבע</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">כמות</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">מחיר</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">ערך</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">P&L</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">טרנזקציה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {tradeHistory.map((trade) => (
                        <tr key={trade.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {new Date(trade.created_at).toLocaleString('he-IL')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              trade.trade_type === 'BUY' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {trade.trade_type === 'BUY' ? 'קנייה' : 'מכירה'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                            {trade.token_symbol}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                            {trade.amount_tokens.toFixed(4)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                            ${trade.price_usd.toFixed(6)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                            ${trade.value_usd.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {trade.realized_pnl_usd !== undefined && trade.realized_pnl_usd !== null ? (
                              <span className={`font-semibold ${
                                trade.realized_pnl_usd >= 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {trade.realized_pnl_usd >= 0 ? '+' : ''}${trade.realized_pnl_usd.toFixed(2)}
                                {trade.realized_pnl_pct !== undefined && trade.realized_pnl_pct !== null && (
                                  <span className="ml-1">
                                    ({trade.realized_pnl_pct >= 0 ? '+' : ''}{trade.realized_pnl_pct.toFixed(2)}%)
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {trade.transaction_signature ? (
                              <a
                                href={`https://solscan.io/tx/${trade.transaction_signature}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-600 text-xs flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                צפה
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Edit Position Modal */}
      {editingPosition && (
        <EditPositionModal
          position={editingPosition}
          onClose={() => setEditingPosition(null)}
          onUpdate={() => {
            loadPositions()
            setEditingPosition(null)
          }}
        />
      )}
    </DashboardLayout>
  )
}
