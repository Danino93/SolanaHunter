/**
 * Token Detail Modal Component
 * 
 * 📋 מה הקומפוננטה הזו עושה:
 * -------------------
 * Modal להצגת פרטים מלאים של טוקן.
 * 
 * תכונות:
 * - פרטי טוקן מלאים
 * - Charts
 * - Quick actions (Buy, Watch, Favorite)
 * - Links ל-DexScreener/Solscan
 * - ניתוח מפורט
 */

'use client'

import { useState, useEffect } from 'react'
import { X, ExternalLink, TrendingUp, Heart, Eye, DollarSign, RefreshCw } from 'lucide-react'
import TokenChart from './TokenChart'
import { analyzeToken, getTokenMarketCapHistory, TokenMarketCapHistory } from '@/lib/api'
import { showToast } from './Toast'
import { formatMarketCap } from '@/lib/formatters'

interface Token {
  id: string
  address: string
  symbol: string
  name: string
  score: number
  safety_score: number
  holder_score: number
  smart_money_score: number
  grade: string
  category: string
  analyzed_at: string
  holder_count?: number
  top_10_percentage?: number
  ownership_renounced?: boolean
  liquidity_locked?: boolean
  mint_authority_disabled?: boolean
  // New fields
  token_created_at?: string
  token_age_hours?: number
  last_scanned_at?: string
  price_usd?: number
  volume_24h?: number
  liquidity_sol?: number
  market_cap?: number
  change24h?: number
  scan_priority?: number
  scan_count?: number
}

interface TokenDetailModalProps {
  token: Token | null
  onClose: () => void
  onBuy?: (address: string) => void
  onWatch?: (address: string) => void
  onFavorite?: (address: string) => void
  onAnalyze?: (token: Token) => Promise<void> | void
}

export default function TokenDetailModal({
  token,
  onClose,
  onBuy,
  onWatch,
  onFavorite,
  onAnalyze,
}: TokenDetailModalProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [marketCapHistory, setMarketCapHistory] = useState<TokenMarketCapHistory | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (token) {
      loadMarketCapHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token?.address])

  const loadMarketCapHistory = async () => {
    if (!token?.address) return
    setLoadingHistory(true)
    try {
      const { data, error } = await getTokenMarketCapHistory(token.address)
      if (error) {
        console.error('Error loading market cap history:', error)
      } else if (data) {
        setMarketCapHistory(data)
      }
    } catch (error) {
      console.error('Error loading market cap history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  if (!token) return null

  // Type guard - TypeScript doesn't understand the early return
  const safeToken = token

  const handleAnalyze = async () => {
    if (analyzing) return
    setAnalyzing(true)
    try {
      showToast('מנתח מטבע...', 'info')
      const { data, error } = await analyzeToken(token.address)
      if (error) {
        showToast('אופס, שגיאה בניתוח', 'error')
      } else {
        showToast('ניתוח הושלם בהצלחה!', 'success')
        if (onAnalyze) {
          onAnalyze(token)
        }
        // Close modal and reload
        onClose()
      }
    } catch (error) {
      console.error('Error analyzing token:', error)
      showToast('אופס, שגיאה בניתוח', 'error')
    } finally {
      setAnalyzing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 85) return 'text-blue-500'
    if (score >= 75) return 'text-yellow-500'
    if (score >= 60) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
              {safeToken.symbol.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {safeToken.symbol}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">{safeToken.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Score & Grade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">ציון כולל</p>
              <p className={`text-3xl font-bold ${getScoreColor(safeToken.score)}`}>
                {safeToken.score}/100
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                {safeToken.grade} - {safeToken.category}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Safety Score</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {safeToken.safety_score}/100
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Holder Score</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {safeToken.holder_score}/20
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Price Chart
            </h3>
            <TokenChart 
              tokenAddress={safeToken.address} 
              symbol={safeToken.symbol} 
              score={safeToken.score}
            />
          </div>

          {/* Market Data */}
          {(safeToken.price_usd !== undefined || safeToken.volume_24h !== undefined || safeToken.liquidity_sol !== undefined) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {safeToken.price_usd !== undefined && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">מחיר</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    ${safeToken.price_usd.toFixed(8)}
                  </p>
                  {safeToken.change24h !== undefined && (
                    <p className={`text-sm mt-1 ${safeToken.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {safeToken.change24h >= 0 ? '↑' : '↓'} {Math.abs(safeToken.change24h).toFixed(2)}%
                    </p>
                  )}
                </div>
              )}
              {safeToken.volume_24h !== undefined && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">נפח 24 שעות</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    ${safeToken.volume_24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}
              {safeToken.liquidity_sol !== undefined && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">נזילות</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {safeToken.liquidity_sol.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Token Info & Timing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                מידע על המטבע
              </h3>
              <div className="space-y-2">
                {safeToken.token_created_at && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <span className="text-sm text-slate-600 dark:text-slate-400">תאריך יצירה</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {new Date(safeToken.token_created_at).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                {safeToken.token_age_hours !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <span className="text-sm text-slate-600 dark:text-slate-400">גיל המטבע</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {safeToken.token_age_hours < 24 
                        ? `${safeToken.token_age_hours} שעות`
                        : `${Math.floor(safeToken.token_age_hours / 24)} ימים`
                      }
                    </span>
                  </div>
                )}
                {safeToken.last_scanned_at && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <span className="text-sm text-slate-600 dark:text-slate-400">סריקה אחרונה</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {new Date(safeToken.last_scanned_at).toLocaleDateString('he-IL', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                {safeToken.scan_count !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <span className="text-sm text-slate-600 dark:text-slate-400">מספר סריקות</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {safeToken.scan_count}
                    </span>
                  </div>
                )}
                {safeToken.scan_priority !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <span className="text-sm text-slate-600 dark:text-slate-400">עדיפות סריקה</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {safeToken.scan_priority}/100
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                ניתוח בטיחות
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-sm text-slate-600 dark:text-slate-400">בעלות</span>
                  <span className={`font-medium ${safeToken.ownership_renounced ? 'text-green-500' : 'text-red-500'}`}>
                    {safeToken.ownership_renounced ? '✅ הועבר' : '❌ לא הועבר'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-sm text-slate-600 dark:text-slate-400">נעילת נזילות</span>
                  <span className={`font-medium ${safeToken.liquidity_locked ? 'text-green-500' : 'text-red-500'}`}>
                    {safeToken.liquidity_locked ? '✅ נעול' : '❌ לא נעול'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Mint Authority</span>
                  <span className={`font-medium ${safeToken.mint_authority_disabled ? 'text-green-500' : 'text-red-500'}`}>
                    {safeToken.mint_authority_disabled ? '✅ מושבת' : '❌ פעיל'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Holder Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                ניתוח מחזיקים
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-sm text-slate-600 dark:text-slate-400">מספר מחזיקים</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {safeToken.holder_count?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Top 10%</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {safeToken.top_10_percentage?.toFixed(2) || 'N/A'}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Smart Money Score</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {safeToken.smart_money_score}/15
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                ניתוח אחרון
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-sm text-slate-600 dark:text-slate-400">תאריך ניתוח</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {safeToken.analyzed_at 
                      ? new Date(safeToken.analyzed_at).toLocaleDateString('he-IL', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'N/A'
                    }
                  </span>
                </div>
                {safeToken.market_cap !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <span className="text-sm text-slate-600 dark:text-slate-400">שווי שוק נוכחי</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatMarketCap(safeToken.market_cap)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Market Cap History Comparison - NEW! */}
          {marketCapHistory && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                השוואת שווי שוק - בדיקה ראשונה vs נוכחי
              </h3>
              {loadingHistory ? (
                <div className="text-center py-4 text-slate-600 dark:text-slate-400">
                  טוען נתונים...
                </div>
              ) : marketCapHistory.first_scan ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Scan */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">בבדיקה הראשונה</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                      {formatMarketCap(marketCapHistory.first_scan.market_cap)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                      ${marketCapHistory.first_scan.price_usd.toFixed(8)}
                    </p>
                    {marketCapHistory.first_scan.scanned_at && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                        {new Date(marketCapHistory.first_scan.scanned_at).toLocaleDateString('he-IL', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                  
                  {/* Current Scan */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">בסריקה הנוכחית</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                      {formatMarketCap(marketCapHistory.current_scan.market_cap)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                      ${marketCapHistory.current_scan.price_usd.toFixed(8)}
                    </p>
                    {marketCapHistory.current_scan.scanned_at && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                        {new Date(marketCapHistory.current_scan.scanned_at).toLocaleDateString('he-IL', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-600 dark:text-slate-400">
                  {marketCapHistory.message || 'אין היסטוריה עדיין - זה הסריקה הראשונה'}
                </div>
              )}
              
              {/* Change Summary */}
              {marketCapHistory.first_scan && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">שינוי בשווי שוק</span>
                    <span className={`text-lg font-bold ${
                      marketCapHistory.change.market_cap_change_pct >= 0 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      {marketCapHistory.change.market_cap_change_pct >= 0 ? '↑' : '↓'} 
                      {Math.abs(marketCapHistory.change.market_cap_change_pct).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">שינוי במחיר</span>
                    <span className={`text-lg font-bold ${
                      marketCapHistory.change.price_change_pct >= 0 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      {marketCapHistory.change.price_change_pct >= 0 ? '↑' : '↓'} 
                      {Math.abs(marketCapHistory.change.price_change_pct).toFixed(2)}%
                    </span>
                  </div>
                  {marketCapHistory.scan_count > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">מספר סריקות</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {marketCapHistory.scan_count}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Address & Links */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">כתובת טוקן</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg text-sm font-mono">
                {safeToken.address}
              </code>
              <a
                href={`https://solscan.io/token/${safeToken.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                title="פתח ב-Solscan"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href={`https://dexscreener.com/solana/${safeToken.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                title="פתח ב-DexScreener"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            {/* Analyze button - show for tokens with score 0 or F grade */}
            {(safeToken.score === 0 || safeToken.grade === 'F') && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 ${analyzing ? 'animate-spin' : ''}`} />
                {analyzing ? 'מנתח...' : 'נתח עכשיו'}
              </button>
            )}
            {onBuy && (
              <button
                onClick={() => {
                  onBuy(safeToken.address)
                  onClose()
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all font-medium"
              >
                <DollarSign className="w-5 h-5" />
                קנה עכשיו
              </button>
            )}
            {onWatch && (
              <button
                onClick={() => onWatch(safeToken.address)}
                className="px-4 py-3 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                title="הוסף למעקב"
              >
                <Eye className="w-5 h-5" />
              </button>
            )}
            {onFavorite && (
              <button
                onClick={() => onFavorite(safeToken.address)}
                className="px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                title="הוסף למועדפים"
              >
                <Heart className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
