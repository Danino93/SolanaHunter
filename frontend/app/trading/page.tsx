/**
 * Trading Page - ביצוע Trades
 * 
 * 📋 מה הדף הזה עושה:
 * -------------------
 * ממשק לביצוע קניות ומכירות ישירות מהדשבורד.
 * 
 * תכונות:
 * - Buy/Sell interface
 * - DCA Strategy configuration
 * - Quick actions
 * - Trade preview
 * - Trade history
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { buyToken, sellToken } from '@/lib/api'
import { showToast } from '@/components/Toast'

function TradingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authChecked, setAuthChecked] = useState(false)
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [tokenAddress, setTokenAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [dcaEnabled, setDcaEnabled] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    } else {
      setAuthChecked(true)
      // Load token from URL if provided
      const tokenParam = searchParams.get('token')
      if (tokenParam) {
        setTokenAddress(tokenParam)
      }
    }
  }, [router, searchParams])

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
                Trading
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                ביצוע קניות ומכירות
              </p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trading Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-2xl">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                  {tradeType === 'buy' ? 'קנייה' : 'מכירה'}
                </h2>

                {/* Trade Type Toggle */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setTradeType('buy')}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      tradeType === 'buy'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5 inline-block ml-2" />
                    קנייה
                  </button>
                  <button
                    onClick={() => setTradeType('sell')}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      tradeType === 'sell'
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <TrendingDown className="w-5 h-5 inline-block ml-2" />
                    מכירה
                  </button>
                </div>

                {/* Token Address */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    כתובת טוקן
                  </label>
                  <input
                    type="text"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    placeholder="הכנס כתובת טוקן..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
                    dir="rtl"
                  />
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    סכום (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* DCA Strategy */}
                {tradeType === 'buy' && (
                  <div className="mb-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dcaEnabled}
                        onChange={(e) => setDcaEnabled(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        השתמש באסטרטגיית DCA (קנייה בשלבים)
                      </span>
                    </label>
                    {dcaEnabled && (
                      <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-slate-600 dark:text-slate-400">
                        <p className="font-semibold mb-2">אסטרטגיית DCA:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>30% - כניסה ראשונית</li>
                          <li>40% - אחרי 2 דקות (אם מחיר יציב/עולה)</li>
                          <li>30% - אחרי עוד 2 דקות (אם יש spike ב-volume)</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Execute Button */}
                <button
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 ${
                    tradeType === 'buy'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  }`}
                >
                  {tradeType === 'buy' ? 'קנה עכשיו' : 'מכור עכשיו'}
                </button>
              </div>
            </div>

            {/* Info Panel */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                  פעולות מהירות
                </h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-sm font-medium text-right">
                    קנה $50
                  </button>
                  <button className="w-full px-4 py-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-sm font-medium text-right">
                    קנה $100
                  </button>
                  <button className="w-full px-4 py-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-sm font-medium text-right">
                    קנה $200
                  </button>
                </div>
              </div>

              {/* Trade Info */}
              <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                  מידע על Trade
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">סוג:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {tradeType === 'buy' ? 'קנייה' : 'מכירה'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">סכום:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      ${amount || '0.00'}
                    </span>
                  </div>
                  {dcaEnabled && tradeType === 'buy' && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        DCA פעיל - הקנייה תתבצע ב-3 שלבים
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  )
}

export default function TradingPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    }>
      <TradingContent />
    </Suspense>
  )
}
