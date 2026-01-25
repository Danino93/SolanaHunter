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
  LayoutDashboard,
  Coins,
  Wallet,
  LineChart,
  Plus,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import CountUp from 'react-countup'

// V2.0 Components
import AnimatedCard from '@/components/AnimatedCard'
import ScoreGauge from '@/components/ScoreGauge'
import TokenScoreBreakdown from '@/components/TokenScoreBreakdown'
import LiquidityIndicator from '@/components/LiquidityIndicator'
import TrendChart from '@/components/TrendChart'
import PerformanceChart from '@/components/PerformanceChart'
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
  const [activeTab, setActiveTab] = useState('overview')
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [carouselPaused, setCarouselPaused] = useState(false)
  const [floatingMenuOpen, setFloatingMenuOpen] = useState(false)
  

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    } else {
      setAuthChecked(true)
    }
  }, [router])

  // Auto-scroll carousel
  useEffect(() => {
    if (carouselPaused || tokens.length === 0) return
    
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev < Math.min(4, tokens.length - 1) ? prev + 1 : 0))
    }, 5000) // Change slide every 5 seconds
    
    return () => clearInterval(interval)
  }, [carouselPaused, tokens.length])

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
      .from('scanned_tokens_history')  // ✅ זה השינוי היחיד!
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
          {/* Tabs Navigation */}
          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
            <Tabs.List className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
              <Tabs.Trigger
                value="overview"
                className="flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                <LayoutDashboard className="w-4 h-4" />
                סקירה כללית
              </Tabs.Trigger>
              <Tabs.Trigger
                value="tokens"
                className="flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                <Coins className="w-4 h-4" />
                טוקנים
              </Tabs.Trigger>
              <Tabs.Trigger
                value="wallets"
                className="flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                <Wallet className="w-4 h-4" />
                ארנקים חכמים
              </Tabs.Trigger>
              <Tabs.Trigger
                value="analytics"
                className="flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                <LineChart className="w-4 h-4" />
                אנליטיקה
              </Tabs.Trigger>
            </Tabs.List>

            {/* Tab: Overview */}
            <Tabs.Content value="overview" className="space-y-8">
              {/* Hero Section - עם CountUp animations ו-Pulse glow effects */}
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 lg:p-12"
              >
                {/* Animated Background */}
                <motion.div
                  className="absolute inset-0 opacity-20"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                  style={{
                    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)',
                  }}
                />
                
                <div className="relative z-10">
                  <motion.h2
                    variants={staggerItem}
                    className="text-4xl lg:text-5xl font-bold text-white mb-4"
                  >
                    🚀 דשבורד גילוי טוקנים מתקדם
                  </motion.h2>
                  <motion.p
                    variants={staggerItem}
                    className="text-xl text-white/90 mb-8"
                  >
                    נתונים בזמן אמת • ניתוח מתקדם • גילוי מוקדם
                  </motion.p>

                  {/* Live Stats Cards */}
                  <motion.div
                    variants={staggerContainer}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    {[
                      { label: 'סה"כ טוקנים', value: stats.totalTokens, icon: <Target className="w-6 h-6" />, color: 'from-blue-400 to-cyan-400' },
                      { label: 'ציון ממוצע', value: stats.averageScore, icon: <BarChart3 className="w-6 h-6" />, color: 'from-purple-400 to-pink-400' },
                      { label: 'שיעור הצלחה', value: stats.totalTokens > 0 ? Math.round((stats.highScoreTokens / stats.totalTokens) * 100) : 0, suffix: '%', icon: <TrendingUp className="w-6 h-6" />, color: 'from-green-400 to-emerald-400' },
                      { label: 'סה"כ נפח', value: stats.totalVolume, prefix: '$', format: true, icon: <DollarSign className="w-6 h-6" />, color: 'from-yellow-400 to-orange-400' },
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        variants={staggerItem}
                        className="relative"
                      >
                        <AnimatedCard className="bg-white/10 backdrop-blur-lg border-white/20 text-white" glow>
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                              {stat.icon}
                            </div>
                            <div className="text-3xl font-bold">
                              {stat.prefix}
                              <CountUp
                                end={stat.value}
                                duration={2}
                                decimals={stat.format ? 2 : 0}
                                separator=","
                              />
                              {stat.suffix}
                            </div>
                            <div className="text-sm text-white/80">{stat.label}</div>
                          </div>
                          {/* Pulse Glow Effect */}
                          <motion.div
                            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color} opacity-0`}
                            animate={{
                              opacity: [0, 0.3, 0],
                              scale: [1, 1.05, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: index * 0.5,
                            }}
                          />
                        </AnimatedCard>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>

              {/* Quick Stats Bar - מיני כרטיסים */}
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="overflow-x-auto"
              >
                <div className="flex gap-4 min-w-max pb-2">
                  {[
                    { label: 'שינוי 24 שעות', value: '+12.5%', icon: <TrendingUp className="w-5 h-5" />, color: 'green', gradient: 'from-green-500 to-emerald-500' },
                    { label: 'טוקנים חדשים', value: stats.totalTokens > 0 ? `+${Math.min(stats.totalTokens, 99)}` : '0', icon: <Sparkles className="w-5 h-5" />, color: 'blue', gradient: 'from-blue-500 to-cyan-500' },
                    { label: 'טוקנים חמים', value: stats.topPerformers, icon: <Flame className="w-5 h-5" />, color: 'orange', gradient: 'from-orange-500 to-red-500' },
                    { label: 'ארנקים פעילים', value: stats.smartWallets, icon: <Users className="w-5 h-5" />, color: 'purple', gradient: 'from-purple-500 to-pink-500' },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      variants={staggerItem}
                      className="flex-shrink-0"
                    >
                      <AnimatedCard className="min-w-[180px] text-center p-4">
                        <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${stat.gradient} text-white mb-2`}>
                          {stat.icon}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                          {stat.value}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {stat.label}
                        </div>
                      </AnimatedCard>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Featured Token & Top Smart Wallet */}
              {!loading && featuredToken && (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                  {/* Token of the Day */}
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
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4"
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

              {/* Performance Overview */}
              <AnimatedCard>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                  סקירת ביצועים
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">סה"כ טוקנים נסרקו</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTokens}</p>
                      </div>
                      <Target className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">טוקנים עם ציון גבוה</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.highScoreTokens}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">ציון ממוצע</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageScore}/100</p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-purple-500" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">ארנקים חכמים פעילים</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.smartWallets}</p>
                      </div>
                      <Users className="w-8 h-8 text-orange-500" />
                    </div>
                  </div>
                </div>
              </AnimatedCard>

              {/* Featured Tokens Carousel - Top 5 tokens עם auto-scroll */}
              {tokens.length > 0 && (
                <AnimatedCard>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-purple-500" />
                      טוקנים מובילים
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCarouselIndex((prev) => (prev > 0 ? prev - 1 : Math.min(4, tokens.length - 1)))}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setCarouselIndex((prev) => (prev < Math.min(4, tokens.length - 1) ? prev + 1 : 0))}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-xl">
                    <motion.div
                      className="flex gap-4"
                      animate={{
                        x: `-${carouselIndex * 100}%`,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                      }}
                      onHoverStart={() => setCarouselPaused(true)}
                      onHoverEnd={() => setCarouselPaused(false)}
                    >
                      {tokens
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 5)
                        .map((token, index) => (
                          <motion.div
                            key={token.id}
                            className="flex-shrink-0 w-full"
                            whileHover={{ scale: 1.02 }}
                          >
                            <div
                              className="p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-xl transition-all"
                              onClick={() => handleTokenSelect(token)}
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{token.symbol}</h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{token.name}</p>
                                </div>
                                <ScoreGauge
                                  score={token.score}
                                  grade={token.grade}
                                  category={token.category}
                                  size={80}
                                  showLabels={true}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">מחיר</p>
                                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(token.price)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">שינוי 24 שעות</p>
                                  <p className={`text-lg font-bold ${token.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatPercent(token.change24h)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">נפח 24 שעות</p>
                                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(token.volume24h)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">שווי שוק</p>
                                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(token.marketCap)}</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </motion.div>
                  </div>
                </AnimatedCard>
              )}

              {/* Charts Section - 3 עמודות */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Market Overview - Line chart */}
                <AnimatedCard>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-blue-500" />
                    סקירת שוק
                  </h3>
                  <div className="h-64">
                    {tokens.length > 0 ? (
                      <PerformanceChart
                        data={tokens.slice(0, 7).map((token, index) => ({
                          date: `יום ${index + 1}`,
                          score: token.score,
                          volume: token.volume24h,
                        }))}
                        type="line"
                        height={250}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        אין נתונים זמינים
                      </div>
                    )}
                  </div>
                </AnimatedCard>

                {/* Volume Trend - Bar chart */}
                <AnimatedCard>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-500" />
                    מגמת נפח
                  </h3>
                  <div className="h-64">
                    {tokens.length > 0 ? (
                      <PerformanceChart
                        data={tokens.slice(0, 7).map((token, index) => ({
                          date: token.symbol,
                          volume: token.volume24h,
                        }))}
                        type="area"
                        height={250}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        אין נתונים זמינים
                      </div>
                    )}
                  </div>
                </AnimatedCard>

                {/* Score Distribution - Donut chart */}
                <AnimatedCard>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-500" />
                    התפלגות ציונים
                  </h3>
                  <div className="h-64 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-4 w-full">
                      {[
                        { label: 'מצוין (85+)', count: tokens.filter(t => t.score >= 85).length, color: 'from-green-500 to-emerald-500' },
                        { label: 'טוב (70-84)', count: tokens.filter(t => t.score >= 70 && t.score < 85).length, color: 'from-blue-500 to-cyan-500' },
                        { label: 'בינוני (60-69)', count: tokens.filter(t => t.score >= 60 && t.score < 70).length, color: 'from-amber-500 to-orange-500' },
                        { label: 'נמוך (<60)', count: tokens.filter(t => t.score < 60).length, color: 'from-red-500 to-rose-500' },
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <div className={`h-20 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-2`}>
                            <span className="text-3xl font-bold text-white">{item.count}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimatedCard>
              </div>

              {/* Recent High-Score Tokens */}
              <AnimatedCard>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                    טוקנים עם ציון גבוה לאחרונה
                  </h2>
                  <button className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                    הצג הכל →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tokens
                    .filter(t => t.score >= 85)
                    .slice(0, 6)
                    .map((token) => (
                      <motion.div
                        key={token.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => handleTokenSelect(token)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{token.symbol}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{token.name}</p>
                          </div>
                          <ScoreGauge
                            score={token.score}
                            grade={token.grade}
                            category={token.category}
                            size={60}
                            showLabels={false}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">מחיר</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{formatPrice(token.price)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">שינוי 24h</p>
                            <p className={`font-semibold ${token.change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatPercent(token.change24h)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  {tokens.filter(t => t.score >= 85).length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                      אין טוקנים עם ציון גבוה כרגע
                    </div>
                  )}
                </div>
              </AnimatedCard>
            </Tabs.Content>

            {/* Tab: Tokens */}
            <Tabs.Content value="tokens" className="space-y-8">
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
            </Tabs.Content>

            {/* Tab: Smart Wallets */}
            <Tabs.Content value="wallets" className="space-y-8">
              <AnimatedCard>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-purple-500" />
                    ארנקים חכמים
                  </h2>
                </div>
                {smartWallets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {smartWallets.map((wallet) => (
                      <motion.div
                        key={wallet.address}
                        whileHover={{ scale: 1.02 }}
                        className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-gray-200 dark:border-gray-700"
                      >
                        <WalletBadge
                          address={wallet.address}
                          nickname={wallet.nickname}
                          trustScore={wallet.trustScore}
                          successRate={wallet.successRate}
                          totalTrades={wallet.totalTrades}
                          avgROI={wallet.avgROI}
                          achievements={wallet.achievements}
                          size="md"
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">אין ארנקים חכמים זמינים כרגע</p>
                  </div>
                )}
              </AnimatedCard>
            </Tabs.Content>

            {/* Tab: Analytics */}
            <Tabs.Content value="analytics" className="space-y-8">
              <AnimatedCard>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <LineChart className="w-6 h-6 text-blue-500" />
                  אנליטיקה וביצועים
                </h2>
                
                {/* Performance Chart */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">גרף ביצועים</h3>
                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <PerformanceChart
                      data={tokens.map((token, index) => ({
                        date: `טוקן ${index + 1}`,
                        score: token.score,
                        volume: token.volume24h,
                      }))}
                      timeRange="30d"
                      type="area"
                      height={300}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">ביצועים כללים</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">סה"כ טוקנים</span>
                        <span className="font-bold text-gray-900 dark:text-white">{stats.totalTokens}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">ציון ממוצע</span>
                        <span className="font-bold text-gray-900 dark:text-white">{stats.averageScore}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">טוקנים עם ציון גבוה</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{stats.highScoreTokens}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">נפח ונזילות</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">סה"כ נפח 24h</span>
                        <span className="font-bold text-gray-900 dark:text-white">${formatNumber(stats.totalVolume)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">סה"כ נזילות</span>
                        <span className="font-bold text-gray-900 dark:text-white">${formatNumber(stats.totalLiquidity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">טוקנים מובילים</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">{stats.topPerformers}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Smart Wallets Stats */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">ארנקים חכמים</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">סה"כ ארנקים</span>
                      <span className="font-bold text-gray-900 dark:text-white">{stats.smartWallets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">ציון ממוצע</span>
                      <span className="font-bold text-gray-900 dark:text-white">{stats.avgWalletScore}/100</span>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </Tabs.Content>
          </Tabs.Root>

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

        {/* Floating Action Button - Quick actions */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-8 left-8 z-50"
        >
          <motion.div
            className="relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.button
              className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-2xl flex items-center justify-center"
              whileHover={{ boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)' }}
              onClick={() => {
                setFloatingMenuOpen(!floatingMenuOpen)
              }}
            >
              <Plus className="w-8 h-8" />
            </motion.button>

            {/* Menu Items */}
            <AnimatePresence>
              {floatingMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-20 left-0 space-y-2"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, x: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      loadData()
                      setFloatingMenuOpen(false)
                      showToast('סריקה חדשה התחילה', 'success')
                    }}
                    className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Search className="w-5 h-5 text-blue-500" />
                    <span>סרוק עכשיו</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, x: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setActiveTab('wallets')
                      setFloatingMenuOpen(false)
                    }}
                    className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Wallet className="w-5 h-5 text-purple-500" />
                    <span>הוסף ארנק</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, x: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const dataStr = JSON.stringify(tokens, null, 2)
                      const dataBlob = new Blob([dataStr], { type: 'application/json' })
                      const url = URL.createObjectURL(dataBlob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = `solana-hunter-tokens-${new Date().toISOString()}.json`
                      link.click()
                      URL.revokeObjectURL(url)
                      setFloatingMenuOpen(false)
                      showToast('נתונים יוצאו בהצלחה', 'success')
                    }}
                    className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Download className="w-5 h-5 text-green-500" />
                    <span>ייצא נתונים</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
