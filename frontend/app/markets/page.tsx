/**
 * Live Markets Page - DexScreener Integration
 * 
 * 📋 מה הדף הזה עושה:
 * -------------------
 * מציג מטבעות אונליין מ-DexScreener ישירות בדשבורד.
 * 
 * תכונות:
 * - טוקנים טרנדיים (לפי volume)
 * - טוקנים חדשים (24h)
 * - חיפוש טוקנים
 * - פרטי טוקן מלאים
 * - עדכונים בזמן אמת
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'
import { TableSkeleton, TableRowSkeleton } from '@/components/SkeletonLoader'
import { 
  TrendingUp, 
  TrendingDown,
  Search, 
  RefreshCw, 
  ExternalLink,
  Sparkles,
  Clock,
  DollarSign,
  Zap,
  BarChart3,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react'
import { showToast } from '@/components/Toast'

interface DexToken {
  pair_address: string
  token_address?: string
  symbol: string
  name?: string
  price_usd: number
  volume_24h: number
  price_change_24h: number
  price_change_24h_pct?: number
  liquidity_usd: number
  dex?: string
  url: string
  created_at?: string
}

export default function MarketsPage() {
  const router = useRouter()
  const [tokens, setTokens] = useState<DexToken[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<DexToken[]>([])
  const [searching, setSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<'trending' | 'new' | 'search'>('trending')
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    } else {
      setAuthChecked(true)
    }
  }, [router])

  useEffect(() => {
    if (!authChecked) return
    
    if (activeTab === 'trending') {
      loadTrending()
    } else if (activeTab === 'new') {
      loadNew()
    }
  }, [authChecked, activeTab])

  const loadTrending = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/dexscreener/trending?limit=50')
      if (response.ok) {
        const data = await response.json()
        setTokens(data.tokens || [])
      } else {
        showToast('אופס, שגיאה בטעינת טוקנים טרנדיים', 'error')
      }
    } catch (error) {
      console.error('Error loading trending tokens:', error)
      showToast('אופס, שגיאה בטעינת טוקנים טרנדיים', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadNew = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/dexscreener/new?limit=50')
      if (response.ok) {
        const data = await response.json()
        setTokens(data.tokens || [])
      } else {
        showToast('אופס, שגיאה בטעינת טוקנים חדשים', 'error')
      }
    } catch (error) {
      console.error('Error loading new tokens:', error)
      showToast('אופס, שגיאה בטעינת טוקנים חדשים', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      showToast('נא להכניס מילת חיפוש', 'warning')
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`http://localhost:8000/api/dexscreener/search?q=${encodeURIComponent(searchTerm)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.tokens || [])
        setActiveTab('search')
      } else {
        showToast('אופס, שגיאה בחיפוש', 'error')
      }
    } catch (error) {
      console.error('Error searching tokens:', error)
      showToast('אופס, שגיאה בחיפוש', 'error')
    } finally {
      setSearching(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const formatPrice = (price: number) => {
    if (price < 0.000001) return price.toExponential(2)
    if (price < 1) return price.toFixed(6)
    return price.toFixed(2)
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

  const displayTokens = activeTab === 'search' ? searchResults : tokens

  return (
    <DashboardLayout>
      <div className="relative">
        {/* Header */}
        <header className="border-b border-slate-200/50 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sticky top-0 z-50 shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Zap className="w-7 h-7 text-yellow-500" />
                  שווקים חיים
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  מטבעות אונליין מ-DexScreener בזמן אמת
                </p>
              </div>
              <button
                onClick={() => {
                  if (activeTab === 'trending') loadTrending()
                  else if (activeTab === 'new') loadNew()
                }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                רענן
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('trending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'trending'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                טרנדיים
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'new'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                חדשים (24h)
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'search'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Search className="w-4 h-4 inline mr-2" />
                חיפוש
              </button>
            </div>

            {/* Search Bar */}
            {activeTab === 'search' && (
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="חפש טוקן לפי סימבול או שם..."
                    className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'חפש'}
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Tokens Table */}
          <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl border border-slate-200/50 dark:border-slate-700 shadow-2xl overflow-hidden">
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">טוקן</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">מחיר</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">שינוי 24h</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">נפח 24h</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">נזילות</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : displayTokens.length === 0 ? (
              <div className="p-12 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  {activeTab === 'search' ? 'לא נמצאו תוצאות' : 'אין מטבעות כרגע'}
                </p>
                {activeTab === 'search' && (
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    נסה לחפש עם שם אחר
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-100/80 to-blue-50/50 dark:from-slate-900/80 dark:to-blue-900/20 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">#</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">מטבע</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">מחיר</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">שינוי 24h</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Volume 24h</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Liquidity</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">DEX</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {displayTokens.map((token, index) => (
                      <tr
                        key={token.pair_address}
                        className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/30 dark:hover:from-slate-800/50 dark:hover:to-slate-700/30 transition-all duration-300"
                      >
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                              {token.symbol.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {token.symbol}
                              </div>
                              {token.name && (
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                  {token.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-semibold">
                          ${formatPrice(token.price_usd)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {token.price_change_24h >= 0 ? (
                              <>
                                <ArrowUpRight className="w-4 h-4 text-green-500" />
                                <span className="text-green-500 font-bold">
                                  +{token.price_change_24h_pct?.toFixed(2) || token.price_change_24h.toFixed(2)}%
                                </span>
                              </>
                            ) : (
                              <>
                                <ArrowDownRight className="w-4 h-4 text-red-500" />
                                <span className="text-red-500 font-bold">
                                  {token.price_change_24h_pct?.toFixed(2) || token.price_change_24h.toFixed(2)}%
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
                          {formatNumber(token.volume_24h)}
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
                          {formatNumber(token.liquidity_usd)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium">
                            {token.dex || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={token.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-sm font-medium"
                          >
                            <ExternalLink className="w-4 h-4" />
                            DexScreener
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          {displayTokens.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">סה"כ מטבעות</p>
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {displayTokens.length}
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">סה"כ Volume 24h</p>
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {formatNumber(displayTokens.reduce((sum, t) => sum + t.volume_24h, 0))}
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">סה"כ Liquidity</p>
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {formatNumber(displayTokens.reduce((sum, t) => sum + t.liquidity_usd, 0))}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  )
}
