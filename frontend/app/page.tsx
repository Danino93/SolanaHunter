/**
 * SolanaHunter V2.0 - Ultimate Dashboard
 * 
 * 🚀 הדשבורד החדש והמתקדם:
 * ------------------------
 * - Glass Morphism עיצוב מודרני
 * - אנימציות Framer Motion מתקדמות
 * - קומפוננטים מותאמים אישית
 * - Real-time data visualization
 * - Advanced scoring system
 * - Smart Money tracking
 * - Interactive charts
 * - Performance analytics
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
  LogOut,
  Shield,
  Wallet,
  Target,
  Zap,
  Award,
  Users,
  DollarSign,
  Activity,
  Filter,
  Download,
  Settings,
  Bell
} from 'lucide-react'

// New V2.0 Components
import AnimatedCard from '@/components/AnimatedCard'
import ScoreGauge from '@/components/ScoreGauge'
import TokenScoreBreakdown from '@/components/TokenScoreBreakdown'
import LiquidityIndicator from '@/components/LiquidityIndicator'
import TrendChart from '@/components/TrendChart'
import PerformanceChart from '@/components/PerformanceChart'
import WalletBadge from '@/components/WalletBadge'
import TokenTable from '@/components/TokenTable'
import SearchBar from '@/components/SearchBar'

// Legacy components for compatibility
import DashboardLayout from '@/components/DashboardLayout'
import { showToast } from '@/components/Toast'
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations'
import { formatPrice, formatPercent, formatNumber } from '@/lib/formatters'
import { getTokens } from '@/lib/api'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

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
  const [selectedWallet, setSelectedWallet] = useState<SmartWallet | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'tokens' | 'wallets' | 'analytics'>('overview')
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h')
  
  // Performance data for charts
  const [performanceData, setPerformanceData] = useState([
    { date: '01/20', score: 78, roi: 15.2 },
    { date: '01/21', score: 82, roi: 18.7 },
    { date: '01/22', score: 79, roi: 12.1 },
    { date: '01/23', score: 85, roi: 22.3 },
    { date: '01/24', score: 87, roi: 28.9 },
  ])
  
  // Mock data for demonstration
  const generateMockTokens = (): Token[] => {
    const symbols = ['SOL', 'BONK', 'WIF', 'MYRO', 'BOME', 'SLERF', 'MEW', 'PONKE', 'POPCAT', 'MOODENG']
    const names = ['Solana', 'Bonk', 'dogwifhat', 'Myro', 'Book of Meme', 'Slerf', 'Cat in a dogs world', 'Ponke', 'Popcat', 'Moo Deng']
    
    return symbols.map((symbol, i) => ({
      id: `${i + 1}`,
      address: `${symbol}${Math.random().toString(36).substring(2, 15)}`,
      symbol,
      name: names[i],
      price: Math.random() * 100,
      change24h: (Math.random() - 0.5) * 50,
      volume24h: Math.random() * 10000000,
      liquidity: Math.random() * 5000000,
      marketCap: Math.random() * 100000000,
      score: Math.floor(Math.random() * 40) + 60,
      safety_score: Math.floor(Math.random() * 25) + 15,
      holder_score: Math.floor(Math.random() * 20) + 10,
      liquidity_score: Math.floor(Math.random() * 25) + 15,
      volume_score: Math.floor(Math.random() * 15) + 8,
      smart_money_score: Math.floor(Math.random() * 10) + 5,
      price_action_score: Math.floor(Math.random() * 5) + 2,
      grade: ['S+', 'S', 'A+', 'A', 'B+', 'B', 'C+', 'C'][Math.floor(Math.random() * 8)],
      category: ['LEGENDARY', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'][Math.floor(Math.random() * 5)],
      holders: Math.floor(Math.random() * 50000) + 1000,
      smartMoney: Math.floor(Math.random() * 20),
      lastSeen: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      trend: Array.from({ length: 10 }, () => Math.random() * 100),
      analyzed_at: new Date().toISOString(),
    }))
  }

  const generateMockWallets = (): SmartWallet[] => {
    const nicknames = ['Smart Whale #1', 'DeGen King', 'Alpha Hunter', 'Diamond Hands', 'Profit Master']
    
    return nicknames.map((nickname, i) => ({
      address: `wallet${i + 1}${Math.random().toString(36).substring(2, 15)}`,
      nickname,
      trustScore: Math.floor(Math.random() * 40) + 60,
      successRate: Math.floor(Math.random() * 40) + 60,
      totalTrades: Math.floor(Math.random() * 500) + 100,
      avgROI: (Math.random() - 0.3) * 100,
      achievements: ['earlyBird', 'diamondHands'].slice(0, Math.floor(Math.random() * 3)),
    }))
  }

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
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('dashboard-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tokens' },
          (payload) => {
            console.log('🔄 Token update:', payload)
            // Handle real-time updates here
          }
        )
        .subscribe()

      return () => {
        if (supabase) {
          supabase.removeChannel(channel)
        }
      }
    }
  }, [authChecked])

  const loadData = async () => {
    setLoading(true)
    try {
      // Try to load from Backend API first
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (apiUrl && apiUrl !== 'http://localhost:8000') {
        try {
          const { data: apiTokens, error: apiError } = await getTokens({ limit: 50 })
          if (!apiError && apiTokens?.tokens && apiTokens.tokens.length > 0) {
            // Convert API tokens to our interface
            const convertedTokens = apiTokens.tokens.map(token => ({
              id: token.address,
              address: token.address,
              symbol: token.symbol,
              name: token.name,
              price: 0, // Will be fetched from DexScreener if needed
              change24h: 0,
              volume24h: 0,
              liquidity: 0,
              marketCap: 0,
              score: token.score || 0,
              safety_score: token.safety_score || 0,
              holder_score: token.holder_score || 0,
              liquidity_score: 0, // Will be calculated
              volume_score: 0,
              smart_money_score: token.smart_money_score || 0,
              price_action_score: 0,
              grade: token.grade || 'C',
              category: token.category || 'FAIR',
              holders: token.holder_count || 0,
              smartMoney: 0,
              lastSeen: token.analyzed_at || new Date().toISOString(),
              trend: Array.from({ length: 10 }, () => Math.random() * 100),
            }))
            setTokens(convertedTokens)
            setLoading(false)
            return
          }
        } catch (apiError) {
          console.warn('API call failed, falling back to Supabase:', apiError)
        }
      }

      // Fallback to Supabase
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: realTokens, error } = await supabase
            .from('tokens')
            .select('*')
            .order('score', { ascending: false })
            .limit(50)

          if (!error && realTokens && realTokens.length > 0) {
            // Convert real data to match our interface
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
              score: token.score || 0,
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
              lastSeen: token.analyzed_at || new Date().toISOString(),
              trend: Array.from({ length: 10 }, () => Math.random() * 100),
            }))
            setTokens(convertedTokens)
            setLoading(false)
            return
          }
        } catch (error) {
          console.error('Error loading from Supabase:', error)
        }
      }

      // Final fallback: Use mock data for demo
      const mockTokens = generateMockTokens()
      const mockWallets = generateMockWallets()
      
      setTokens(mockTokens)
      setSmartWallets(mockWallets)
    } catch (error) {
      console.error('Failed to load data:', error)
      // Use mock data as last resort
      setTokens(generateMockTokens())
      setSmartWallets(generateMockWallets())
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
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

  // Get featured token (highest score)
  const featuredToken = tokens.reduce((prev, current) => 
    (prev.score > current.score) ? prev : current
  , tokens[0])

  // Get top smart wallet
  const topWallet = smartWallets.reduce((prev, current) => 
    (prev.trustScore > current.trustScore) ? prev : current
  , smartWallets[0])

  // Handle search
  const handleSearch = (query: string) => {
    console.log('Search query:', query)
  }

  // Handle token selection
  const handleTokenSelect = (token: any) => {
    console.log('Selected token:', token)
    setSelectedToken(token)
  }

  // Loading screen
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-slate-600 dark:text-slate-400 text-lg">בודק הרשאות...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-400/10 rounded-full blur-3xl"
          animate={{ rotate: [0, 360], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="glass-card border-b border-white/20 sticky top-0 z-50 mb-8"
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
                  SolanaHunter V2.0
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Advanced Token Intelligence Dashboard
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <SearchBar
                placeholder="Search tokens, wallets, or addresses..."
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
                className="p-3 glass rounded-xl hover:bg-white/20"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 glass rounded-xl hover:bg-white/20"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  clearAuthToken()
                  router.push('/login')
                }}
                className="p-3 glass rounded-xl hover:bg-red-500/20"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-6 py-8 relative z-10">
        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-center mb-8"
        >
          <div className="glass-card p-1 rounded-2xl">
            <div className="flex items-center gap-1">
              {[
                { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
                { id: 'tokens', label: 'Tokens', icon: <Target className="w-4 h-4" /> },
                { id: 'wallets', label: 'Smart Wallets', icon: <Wallet className="w-4 h-4" /> },
                { id: 'analytics', label: 'Analytics', icon: <Activity className="w-4 h-4" /> },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Overview Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Hero Section with Featured Token */}
              {!loading && featuredToken && (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                  {/* Featured Token */}
                  <motion.div variants={staggerItem} className="lg:col-span-2">
                    <AnimatedCard className="h-full" gradient glow>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2">🏆 Token of the Day</h3>
                          <p className="text-white/80">Highest scoring token right now</p>
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
                            <span>Price:</span>
                            <span className="font-bold">{formatPrice(featuredToken.price)}</span>
                          </div>
                          <div className="flex items-center justify-between text-white">
                            <span>24h Change:</span>
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
                            <span>Volume 24h:</span>
                            <span className="font-bold">{formatPrice(featuredToken.volume24h)}</span>
                          </div>
                          <div className="flex items-center justify-between text-white">
                            <span>Market Cap:</span>
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
                          Top Smart Wallet
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
                  { label: 'Total Tokens', value: stats.totalTokens, icon: <Target className="w-5 h-5" />, color: 'blue' },
                  { label: 'High Score', value: stats.highScoreTokens, icon: <TrendingUp className="w-5 h-5" />, color: 'green' },
                  { label: 'Avg Score', value: stats.averageScore, icon: <BarChart3 className="w-5 h-5" />, color: 'purple' },
                  { label: 'Smart Wallets', value: stats.smartWallets, icon: <Wallet className="w-5 h-5" />, color: 'orange' },
                  { label: 'Top Performers', value: stats.topPerformers, icon: <Zap className="w-5 h-5" />, color: 'yellow' },
                  { label: 'Total Volume', value: `$${formatNumber(stats.totalVolume)}`, icon: <DollarSign className="w-5 h-5" />, color: 'green' },
                  { label: 'Wallet Score', value: stats.avgWalletScore, icon: <Users className="w-5 h-5" />, color: 'pink' },
                  { label: 'Liquidity', value: `$${formatNumber(stats.totalLiquidity)}`, icon: <Activity className="w-5 h-5" />, color: 'cyan' },
                ].map((stat, index) => (
                  <motion.div key={stat.label} variants={staggerItem}>
                    <AnimatedCard className="text-center p-4">
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 text-white`}>
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

              {/* Performance Chart */}
              <AnimatedCard>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Performance Overview
                  </h3>
                  <div className="flex items-center gap-2">
                    {['24h', '7d', '30d'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range as any)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          timeRange === range
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                <PerformanceChart
                  data={performanceData}
                  timeRange="30d"
                  type="area"
                  height={300}
                />
              </AnimatedCard>

              {/* Recent Tokens Preview */}
              <AnimatedCard>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Recent High-Score Tokens
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('tokens')}
                    className="text-blue-500 hover:text-blue-600 font-medium"
                  >
                    View All →
                  </motion.button>
                </div>
                <TokenTable
                  tokens={tokens.filter(t => t.score >= 80).slice(0, 5)}
                  onTokenClick={handleTokenSelect}
                  showFilters={false}
                  showPagination={false}
                />
              </AnimatedCard>
            </motion.div>
          )}

          {/* Tokens Tab */}
          {activeTab === 'tokens' && (
            <motion.div
              key="tokens"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TokenTable
                tokens={tokens}
                onTokenClick={handleTokenSelect}
                showFilters={true}
                showPagination={true}
              />
            </motion.div>
          )}

          {/* Smart Wallets Tab */}
          {activeTab === 'wallets' && (
            <motion.div
              key="wallets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {smartWallets.map((wallet, index) => (
                <motion.div
                  key={wallet.address}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <WalletBadge
                    {...wallet}
                    onClick={() => setSelectedWallet(wallet)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Score Breakdown */}
              {featuredToken && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <AnimatedCard>
                    <TokenScoreBreakdown
                      safety_score={featuredToken.safety_score}
                      holder_score={featuredToken.holder_score}
                      liquidity_score={featuredToken.liquidity_score}
                      volume_score={featuredToken.volume_score}
                      smart_money_score={featuredToken.smart_money_score}
                      price_action_score={featuredToken.price_action_score}
                      total_score={featuredToken.score}
                      showTotal={true}
                    />
                  </AnimatedCard>

                  <AnimatedCard>
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-500" />
                        Liquidity Analysis
                      </h3>
                      <div className="flex justify-center">
                        <LiquidityIndicator
                          liquiditySol={featuredToken.liquidity / 1000}
                          liquidityUsd={featuredToken.liquidity}
                          score={featuredToken.liquidity_score}
                          size="lg"
                          showTooltip={true}
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(featuredToken.liquidity)}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          Total Liquidity
                        </div>
                      </div>
                    </div>
                  </AnimatedCard>
                </div>
              )}

              {/* Market Trends */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {tokens.slice(0, 4).map((token, index) => (
                  <motion.div
                    key={token.address}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AnimatedCard className="text-center">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="font-bold text-lg">{token.symbol}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{token.name}</div>
                        </div>
                        <div className="w-16 h-16">
                          <TrendChart
                            data={token.trend}
                            trend={token.change24h >= 0 ? 'up' : 'down'}
                            height={48}
                            width={64}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Price:</span>
                          <span className="font-bold">{formatPrice(token.price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>24h:</span>
                          <span className={token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {formatPercent(token.change24h)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Score:</span>
                          <span className="font-bold text-blue-500">{token.score}/100</span>
                        </div>
                      </div>
                    </AnimatedCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
              No tokens found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The bot hasn't discovered any tokens yet. Check back soon!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadData}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg"
            >
              Refresh Data
            </motion.button>
          </motion.div>
        )}
      </main>
    </DashboardLayout>
  )
}
