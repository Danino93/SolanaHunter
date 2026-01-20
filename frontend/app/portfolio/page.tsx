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
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Percent,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

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
  take_profit_1_price?: number
  take_profit_2_price?: number
  opened_at: string
}

export default function PortfolioPage() {
  const router = useRouter()
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    } else {
      setAuthChecked(true)
      loadPositions()
    }
  }, [router])

  const loadPositions = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/portfolio')
      if (response.ok) {
        const data = await response.json()
        setPositions(data.positions || [])
      } else {
        console.error('Failed to load positions')
        setPositions([])
      }
    } catch (error) {
      console.error('Error loading positions:', error)
      setPositions([])
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
              <button
                onClick={loadPositions}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                רענן
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
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

          {/* Positions List */}
          <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl border border-slate-200/50 dark:border-slate-700 shadow-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-slate-600 dark:text-slate-400">טוען פוזיציות...</p>
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
                            <button className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium">
                              מכור
                            </button>
                            <button className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-sm font-medium">
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
        </main>
      </div>
    </DashboardLayout>
  )
}
