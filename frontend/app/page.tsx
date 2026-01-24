/**
 * SolanaHunter Dashboard - דף ראשי
 * 
 * 🚀 הדשבורד הראשי:
 * ------------------------
 * - רשימת טוקנים עם קומפוננטות מתקדמות
 * - חיפוש ופילטרים
 * - תצוגת טוקן מוביל
 * - סטטיסטיקות
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { isAuthenticated, clearAuthToken } from '@/lib/auth'
import { 
  TrendingUp, 
  TrendingDown,
  RefreshCw, 
  AlertCircle,
  BarChart3,
  Sparkles,
  Target,
  Zap,
  Award,
  Users,
  DollarSign,
  Activity,
} from 'lucide-react'

// V2.0 Components
import AnimatedCard from '@/components/AnimatedCard'
import ScoreGauge from '@/components/ScoreGauge'
import TokenScoreBreakdown from '@/components/TokenScoreBreakdown'
import LiquidityIndicator from '@/components/LiquidityIndicator'
import TrendChart from '@/components/TrendChart'
import WalletBadge from '@/components/WalletBadge'
import TokenTable from '@/components/TokenTable'
import SearchBar from '@/components/SearchBar'

import DashboardLayout from '@/components/DashboardLayout'
import { showToast } from '@/components/Toast'
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations'
import { formatPrice, formatPercent, formatNumber } from '@/lib/formatters'
import { getTokens } from '@/lib/api'

interface Token {
  id: string
  address: string
  symbol: string
  name: string
  price: number
  change24h: number
  volume24h: number
  liquidity: number
  marketCap: number
  score: number
  safety_score: number
  holder_score: number
  liquidity_score: number
  volume_score: number
  smart_money_score: number
  price_action_score: number
  grade: string
  category: string
  holders: number
  smartMoney: number
  lastSeen: string
  trend: number[]
  analyzed_at?: string
  holder_count?: number
  top_10_percentage?: number
}

interface SmartWallet {
  address: string
  nickname?: string
  trustScore: number
  successRate: number
  totalTrades: number
  avgROI: number
  achievements: string[]
}

export default function Dashboard() {
  const router = useRouter()
  const [tokens, setTokens] = useState<Token[]>([])
  const [smartWallets, setSmartWallets] = useState<SmartWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    } else {
      setAuthChecked(true)
    }
  }, [router])

  // Load data after authentication
  useEffect(() => {
    if (!authChecked) return
    
    loadData()
    
    // Set up real-time updates if Supabase is configured
    // Note: Real-time subscriptions might fail in production due to network restrictions
    // This is optional and won't break the app if it fails
    if (isSupabaseConfigured && supabase) {
      try {
        const channel = supabase
          .channel('dashboard-updates')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tokens' },
            (payload) => {
              console.log('🔄 עדכון טוקן:', payload)
              // Reload data when token is updated
              loadData()
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Supabase real-time connected')
            } else if (status === 'CHANNEL_ERROR') {
              // This is OK - real-time is optional
              console.warn('⚠️ Supabase real-time connection failed (this is OK, app will still work)')
            }
          })

        return () => {
          if (supabase && channel) {
            try {
              supabase.removeChannel(channel)
            } catch (e) {
              // Ignore cleanup errors
            }
          }
        }
      } catch (error) {
        // Real-time is optional, don't break the app if it fails
        console.warn('⚠️ Supabase real-time setup failed (this is OK):', error)
      }
    }
  }, [authChecked])

  const loadData = async () => {
    setLoading(true)
    try {
      // Try to load from Backend API first (always try, even in production)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (apiUrl) {
        try {
          const { data: apiTokens, error: apiError } = await getTokens({ limit: 50 })
          if (!apiError && apiTokens?.tokens && apiTokens.tokens.length > 0) {
            // Convert API tokens to our interface
            const convertedTokens = apiTokens.tokens.map(token => ({
              id: token.address,
              address: token.address,
              symbol: token.symbol,
              name: token.name,
              price: 0,
              change24h: 0,
              volume24h: 0,
              liquidity: 0,
              marketCap: 0,
              score: token.final_score || token.score || 0,
              safety_score: token.safety_score || 0,
              holder_score: token.holder_score || 0,
              liquidity_score: 0,
              volume_score: 0,
              smart_money_score: token.smart_money_score || 0,
              price_action_score: 0,
              grade: token.grade || 'C',
              category: token.category || 'FAIR',
              holders: token.holder_count || 0,
              smartMoney: 0,
              lastSeen: token.last_analyzed_at || token.analyzed_at || new Date().toISOString(),
              trend: [], // Trend data will come from API later
            }))
            setTokens(convertedTokens)
            setSmartWallets([]) // Smart wallets will come from API later
            setLoading(false)
            return
          } else if (apiError) {
            console.error('שגיאה ב-API:', apiError)
            showToast(`שגיאה בטעינת נתונים: ${apiError}`, 'error')
          }
        } catch (apiError) {
          console.error('שיחה ל-API נכשלה:', apiError)
          showToast('שגיאה בחיבור לשרת', 'error')
        }
      }

      // Fallback to Supabase (only if API failed)
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: realTokens, error } = await supabase
            .from('tokens')
            .select('*')
            .order('final_score', { ascending: false })
            .limit(50)

          if (!error && realTokens && realTokens.length > 0) {
            const convertedTokens = realTokens.map(token => ({
              id: token.address,
              address: token.address,
              symbol: token.symbol,
              name: token.name,
              price: 0,
              change24h: 0,
              volume24h: 0,
              liquidity: 0,
              marketCap: 0,
              score: token.final_score || token.score || 0,
              safety_score: token.safety_score || 0,
              holder_score: token.holder_score || 0,
              liquidity_score: 0,
              volume_score: 0,
              smart_money_score: token.smart_money_score || 0,
              price_action_score: 0,
              grade: token.grade || 'C',
              category: token.category || 'FAIR',
              holders: token.holder_count || 0,
              smartMoney: 0,
              lastSeen: token.last_analyzed_at || token.analyzed_at || new Date().toISOString(),
              trend: [], // Trend data will come from API later
            }))
            setTokens(convertedTokens)
            setSmartWallets([]) // Smart wallets will come from Supabase later
            setLoading(false)
            return
          } else if (error) {
            console.error('שגיאה ב-Supabase:', error)
          }
        } catch (supabaseError) {
          console.error('שגיאה ב-Supabase:', supabaseError)
        }
      }

      // No data available from any source
      console.warn('אין נתונים זמינים - לא מ-API ולא מ-Supabase')
      setTokens([])
      setSmartWallets([])
    } catch (error) {
      console.error('שגיאה בטעינת נתונים:', error)
      showToast('שגיאה בטעינת נתונים מהשרת', 'error')
      setTokens([])
      setSmartWallets([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const stats = {
    totalTokens: tokens.length,
    highScoreTokens: tokens.filter(t => t.score >= 85).length,
    averageScore: tokens.length > 0 
      ? Math.round(tokens.reduce((sum, t) => sum + t.score, 0) / tokens.length)
      : 0,
    totalVolume: tokens.reduce((sum, t) => sum + t.volume24h, 0),
    smartWallets: smartWallets.length,
    avgWalletScore: smartWallets.length > 0
      ? Math.round(smartWallets.reduce((sum, w) => sum + w.trustScore, 0) / smartWallets.length)
      : 0,
    topPerformers: tokens.filter(t => t.change24h > 10).length,
    totalLiquidity: tokens.reduce((sum, t) => sum + t.liquidity, 0),
  }

  // Get featured token (highest score) - only if we have tokens
  const featuredToken = tokens.length > 0 
    ? tokens.reduce((prev, current) => 
        (current.score > prev.score) ? current : prev
      , tokens[0])
    : null

  // Get top smart wallet - only if we have wallets
  const topWallet = smartWallets.length > 0
    ? smartWallets.reduce((prev, current) => 
        (current.trustScore > prev.trustScore) ? current : prev
      , smartWallets[0])
    : null

  const handleSearch = (query: string) => {
    console.log('חיפוש:', query)
  }

  const handleTokenSelect = (token: any) => {
    setSelectedToken(token)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo & Title */}
              <div className="flex items-center gap-4">
                <motion.div 
                  className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    SolanaHunter
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    דשבורד גילוי טוקנים מתקדם
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-2xl mx-8">
                <SearchBar
                  placeholder="חפש טוקנים, ארנקים או כתובות..."
                  onSearch={handleSearch}
                  onSelect={handleTokenSelect}
                  size="md"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={loadData}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>רענן</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.header>

        <main className="container mx-auto px-6 py-8">
          {/* Featured Token & Stats */}
          {!loading && featuredToken && (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8"
            >
              {/* Featured Token */}
              <motion.div variants={staggerItem} className="lg:col-span-2">
                <AnimatedCard className="h-full" gradient glow>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">🏆 טוקן היום</h3>
                      <p className="text-white/80">הטוקן עם הציון הגבוה ביותר כרגע</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">#{featuredToken.symbol}</div>
                      <div className="text-white/80">{featuredToken.name}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <ScoreGauge
                        score={featuredToken.score}
                        grade={featuredToken.grade}
                        category={featuredToken.category}
                        size={180}
                        showLabels={true}
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-white">
                        <span>מחיר:</span>
                        <span className="font-bold">{formatPrice(featuredToken.price)}</span>
                      </div>
                      <div className="flex items-center justify-between text-white">
                        <span>שינוי 24 שעות:</span>
                        <div className="flex items-center gap-1">
                          {featuredToken.change24h >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                          <span className={featuredToken.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {formatPercent(Math.abs(featuredToken.change24h))}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-white">
                        <span>נפח 24 שעות:</span>
                        <span className="font-bold">{formatPrice(featuredToken.volume24h)}</span>
                      </div>
                      <div className="flex items-center justify-between text-white">
                        <span>שווי שוק:</span>
                        <span className="font-bold">{formatPrice(featuredToken.marketCap)}</span>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              </motion.div>

              {/* Top Smart Wallet */}
              {topWallet && (
                <motion.div variants={staggerItem}>
                  <AnimatedCard className="h-full">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-500" />
                      ארנק חכם מוביל
                    </h3>
                    <WalletBadge
                      address={topWallet.address}
                      nickname={topWallet.nickname}
                      trustScore={topWallet.trustScore}
                      successRate={topWallet.successRate}
                      totalTrades={topWallet.totalTrades}
                      avgROI={topWallet.avgROI}
                      achievements={topWallet.achievements}
                      size="lg"
                    />
                  </AnimatedCard>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Stats Grid */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8"
          >
            {[
              { label: 'סה"כ טוקנים', value: stats.totalTokens, icon: <Target className="w-5 h-5" />, color: 'blue', gradient: 'bg-gradient-to-r from-blue-500 to-blue-600' },
              { label: 'ציון גבוה', value: stats.highScoreTokens, icon: <TrendingUp className="w-5 h-5" />, color: 'green', gradient: 'bg-gradient-to-r from-green-500 to-green-600' },
              { label: 'ציון ממוצע', value: stats.averageScore, icon: <BarChart3 className="w-5 h-5" />, color: 'purple', gradient: 'bg-gradient-to-r from-purple-500 to-purple-600' },
              { label: 'ארנקים חכמים', value: stats.smartWallets, icon: <Users className="w-5 h-5" />, color: 'orange', gradient: 'bg-gradient-to-r from-orange-500 to-orange-600' },
              { label: 'מובילים', value: stats.topPerformers, icon: <Zap className="w-5 h-5" />, color: 'yellow', gradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600' },
              { label: 'סה"כ נפח', value: `$${formatNumber(stats.totalVolume)}`, icon: <DollarSign className="w-5 h-5" />, color: 'green', gradient: 'bg-gradient-to-r from-green-500 to-green-600' },
              { label: 'ציון ארנק', value: stats.avgWalletScore, icon: <Users className="w-5 h-5" />, color: 'pink', gradient: 'bg-gradient-to-r from-pink-500 to-pink-600' },
              { label: 'נזילות', value: `$${formatNumber(stats.totalLiquidity)}`, icon: <Activity className="w-5 h-5" />, color: 'cyan', gradient: 'bg-gradient-to-r from-cyan-500 to-cyan-600' },
            ].map((stat, index) => (
              <motion.div key={stat.label} variants={staggerItem}>
                <AnimatedCard className="text-center p-4">
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`p-2 rounded-lg ${stat.gradient} text-white`}>
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </div>
                </AnimatedCard>
              </motion.div>
            ))}
          </motion.div>

          {/* Tokens Table */}
          <AnimatedCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                רשימת טוקנים
              </h2>
            </div>
            <TokenTable
              tokens={tokens}
              onTokenClick={handleTokenSelect}
              showFilters={true}
              showPagination={true}
            />
          </AnimatedCard>

          {/* Loading State */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-20"
            >
              <div className="text-center">
                <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-600 dark:text-gray-400 text-lg">טוען נתונים...</p>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && tokens.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                אין נתונים זמינים
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                לא הצלחנו לטעון נתונים מהשרת.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                ודא שהבוט רץ ושהחיבור לשרת תקין.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadData}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl"
              >
                נסה שוב
              </motion.button>
            </motion.div>
          )}
        </main>
      </div>
    </DashboardLayout>
  )
}
