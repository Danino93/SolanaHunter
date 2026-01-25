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
import { buyToken, sellToken, getWalletInfo, getTradeHistory, getDexTokenDetails, type WalletInfo, type TradeHistory } from '@/lib/api'
import { showToast } from '@/components/Toast'
import ConfirmModal from '@/components/ConfirmModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function TradingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authChecked, setAuthChecked] = useState(false)
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [tokenAddress, setTokenAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [dcaEnabled, setDcaEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [preview, setPreview] = useState<{ price?: number; tokens?: number; fee?: number } | null>(null)
  const [showTradeConfirm, setShowTradeConfirm] = useState(false)
  const [pendingTrade, setPendingTrade] = useState<{ type: 'buy' | 'sell'; tokenAddress: string; amount: string } | null>(null)

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
      // Load wallet info and trade history
      loadWalletInfo()
      loadTradeHistory()
    }
  }, [router, searchParams])

  // Load token price when address changes
  useEffect(() => {
    if (tokenAddress && isValidSolanaAddress(tokenAddress) && amount && parseFloat(amount) > 0) {
      loadTokenPreview()
    } else {
      setPreview(null)
    }
  }, [tokenAddress, amount])

  const loadTokenPreview = async () => {
    if (!tokenAddress || !isValidSolanaAddress(tokenAddress)) return

    try {
      const { data, error } = await getDexTokenDetails(tokenAddress)
      if (error || !data) {
        setPreview(null)
        return
      }

      const price = data.price_usd
      const amountNum = parseFloat(amount)
      if (amountNum > 0 && price > 0) {
        const tokens = amountNum / price
        // Estimate fee: ~0.1% for Jupiter swap
        const estimatedFee = amountNum * 0.001

        setPreview({
          price,
          tokens,
          fee: estimatedFee,
        })
      } else {
        setPreview(null)
      }
    } catch (error) {
      console.error('Error loading token preview:', error)
      setPreview(null)
    }
  }

  const loadWalletInfo = async () => {
    try {
      const { data, error } = await getWalletInfo()
      if (error) {
        console.error('Error loading wallet info:', error)
        setWalletInfo(null)
      } else {
        setWalletInfo(data || null)
      }
    } catch (error) {
      console.error('Error loading wallet info:', error)
      setWalletInfo(null)
    }
  }

  const loadTradeHistory = async () => {
    try {
      const { data, error } = await getTradeHistory(20)
      if (error) {
        console.error('Error loading trade history:', error)
        setTradeHistory([])
      } else {
        setTradeHistory(data?.trades || [])
      }
    } catch (error) {
      console.error('Error loading trade history:', error)
      setTradeHistory([])
    }
  }

  const handleExecuteTrade = () => {
    if (!tokenAddress || !amount || parseFloat(amount) <= 0) {
      showToast('אנא מלא כתובת טוקן וסכום תקינים', 'error')
      return
    }

    // Validate token address format
    if (!isValidSolanaAddress(tokenAddress)) {
      showToast('כתובת טוקן לא תקינה. אנא בדוק את הכתובת.', 'error')
      return
    }

    // Check wallet balance for buy
    if (tradeType === 'buy' && walletInfo) {
      if (parseFloat(amount) > walletInfo.balance_usd) {
        showToast(`יתרה לא מספקת. יתרה זמינה: $${walletInfo.balance_usd.toFixed(2)}`, 'error')
        return
      }
    }

    // Show confirmation
    setPendingTrade({ type: tradeType, tokenAddress, amount })
    setShowTradeConfirm(true)
  }

  const executeTradeConfirmed = async () => {
    if (!pendingTrade) return

    setShowTradeConfirm(false)
    setLoading(true)
    try {
      if (pendingTrade.type === 'buy') {
        const { data, error } = await buyToken({
          token_address: pendingTrade.tokenAddress,
          amount_usd: parseFloat(pendingTrade.amount),
          use_dca: dcaEnabled,
        })
        
        if (error) {
          showToast(`שגיאה בקנייה: ${error}`, 'error')
        } else if (data?.success) {
          showToast('קנייה בוצעה בהצלחה!', 'success')
          setTokenAddress('')
          setAmount('')
          await loadWalletInfo()
          await loadTradeHistory()
        } else {
          showToast(data?.message || 'קנייה נכשלה', 'error')
        }
      } else {
        const { data, error } = await sellToken({
          token_address: pendingTrade.tokenAddress,
          amount_percent: 100, // Sell all for now
        })
        
        if (error) {
          showToast(`שגיאה במכירה: ${error}`, 'error')
        } else if (data?.success) {
          showToast('מכירה בוצעה בהצלחה!', 'success')
          setTokenAddress('')
          setAmount('')
          await loadWalletInfo()
          await loadTradeHistory()
        } else {
          showToast(data?.message || 'מכירה נכשלה', 'error')
        }
      }
    } catch (error) {
      showToast('שגיאה בביצוע Trade', 'error')
    } finally {
      setLoading(false)
      setPendingTrade(null)
    }
  }

  const isValidSolanaAddress = (address: string): boolean => {
    if (!address || address.trim().length === 0) return false
    // Solana address format: base58, 32-44 characters
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
    return solanaAddressRegex.test(address.trim())
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

                {/* Preview */}
                {preview && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">תצוגה מקדימה:</h4>
                    <div className="space-y-1 text-sm">
                      {preview.price && (
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">מחיר נוכחי:</span>
                          <span className="font-medium text-blue-900 dark:text-blue-100">${preview.price.toFixed(8)}</span>
                        </div>
                      )}
                      {preview.tokens && (
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">כמות טוקנים:</span>
                          <span className="font-medium text-blue-900 dark:text-blue-100">{preview.tokens.toFixed(4)}</span>
                        </div>
                      )}
                      {preview.fee && (
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">עמלה משוערת:</span>
                          <span className="font-medium text-blue-900 dark:text-blue-100">${preview.fee.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Token Address Validation */}
                {tokenAddress && !isValidSolanaAddress(tokenAddress) && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      ⚠️ כתובת טוקן לא תקינה. אנא בדוק את הכתובת.
                    </p>
                  </div>
                )}

                {/* Balance Warning */}
                {tradeType === 'buy' && walletInfo && amount && parseFloat(amount) > walletInfo.balance_usd && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      ⚠️ הסכום גדול מהיתרה הזמינה (${walletInfo.balance_usd.toFixed(2)})
                    </p>
                  </div>
                )}

                {/* Execute Button */}
                <button
                  onClick={handleExecuteTrade}
                  disabled={loading || !tokenAddress || !amount || parseFloat(amount) <= 0 || !isValidSolanaAddress(tokenAddress)}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    tradeType === 'buy'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {tradeType === 'buy' ? 'קונה...' : 'מוכר...'}
                    </span>
                  ) : (
                    tradeType === 'buy' ? 'קנה עכשיו' : 'מכור עכשיו'
                  )}
                </button>
              </div>
            </div>

            {/* Info Panel */}
            <div className="space-y-6">
              {/* Wallet Balance */}
              <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  יתרת ארנק
                </h3>
                {walletInfo ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">כתובת ארנק</p>
                      <p className="text-xs font-mono text-slate-900 dark:text-slate-100 break-all">
                        {walletInfo.address}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-400">יתרה (SOL):</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {walletInfo.balance_sol?.toFixed(4) || '0.0000'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">יתרה (USD):</span>
                      <span className="text-xl font-bold text-green-600 dark:text-green-400">
                        ${walletInfo.balance_usd?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <button
                      onClick={loadWalletInfo}
                      className="w-full mt-3 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                    >
                      <RefreshCw className="w-4 h-4 inline-block ml-2" />
                      רענון
                    </button>
                  </div>
                ) : (
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
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                  פעולות מהירות
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setAmount('50')
                      setTradeType('buy')
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-sm font-medium text-right"
                  >
                    קנה $50
                  </button>
                  <button
                    onClick={() => {
                      setAmount('100')
                      setTradeType('buy')
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-sm font-medium text-right"
                  >
                    קנה $100
                  </button>
                  <button
                    onClick={() => {
                      setAmount('200')
                      setTradeType('buy')
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-sm font-medium text-right"
                  >
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

              {/* Trade History */}
              <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    היסטוריית עסקאות
                  </h3>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    {showHistory ? 'הסתר' : 'הצג'}
                  </button>
                </div>
                {showHistory && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tradeHistory.length > 0 ? (
                      tradeHistory.map((trade, index) => (
                        <div
                          key={index}
                          className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-sm"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-medium ${
                              trade.trade_type === 'BUY' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {trade.trade_type === 'BUY' ? 'קנייה' : 'מכירה'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(trade.created_at).toLocaleDateString('he-IL')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {trade.token_symbol} - ${trade.value_usd?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                        אין היסטוריית עסקאות
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Trade Confirmation Modal */}
        {pendingTrade && (
          <ConfirmModal
            isOpen={showTradeConfirm}
            onClose={() => {
              setShowTradeConfirm(false)
              setPendingTrade(null)
            }}
            onConfirm={executeTradeConfirmed}
            title={pendingTrade.type === 'buy' ? 'אישור קנייה' : 'אישור מכירה'}
            message={
              pendingTrade.type === 'buy'
                ? `האם אתה בטוח שברצונך לקנות טוקן זה?\n\nכתובת: ${pendingTrade.tokenAddress.slice(0, 8)}...${pendingTrade.tokenAddress.slice(-8)}\nסכום: $${parseFloat(pendingTrade.amount).toFixed(2)}\n${dcaEnabled ? 'אסטרטגיית DCA פעילה - הקנייה תתבצע ב-3 שלבים' : ''}`
                : `האם אתה בטוח שברצונך למכור את כל הטוקנים?\n\nכתובת: ${pendingTrade.tokenAddress.slice(0, 8)}...${pendingTrade.tokenAddress.slice(-8)}`
            }
            confirmText={pendingTrade.type === 'buy' ? 'כן, קנה' : 'כן, מכור'}
            cancelText="ביטול"
            confirmColor={pendingTrade.type === 'buy' ? 'green' : 'red'}
            requireCheckbox={true}
            checkboxLabel="אני מבין את הסיכונים ואתה אחראי לכל ההחלטות"
            isLoading={loading}
          />
        )}
        </div>
      </DashboardLayout>
    </ErrorBoundary>
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
