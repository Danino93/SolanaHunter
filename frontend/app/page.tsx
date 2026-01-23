/**
 * SolanaHunter Dashboard - Main Page
 * 
 * 📋 מה הקובץ הזה עושה:
 * -------------------
 * זה הדף הראשי של הדשבורד - מציג את כל הטוקנים שנמצאו ונותחו.
 * 
 * תכונות:
 * - טבלה יפה עם כל הטוקנים (ממוינת לפי ציון)
 * - כרטיסי סטטיסטיקה (כמה טוקנים, ציון ממוצע, וכו')
 * - פילטרים (ציון, תאריך)
 * - חיפוש לפי סימבול
 * - עדכונים בזמן אמת (כשיש Supabase)
 * - עיצוב מודרני עם TailwindCSS
 * - Dark mode support
 * - Responsive design
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { isAuthenticated, clearAuthToken } from '@/lib/auth'
import { format } from 'date-fns'
import { 
  TrendingUp, 
  Search, 
  Filter, 
  RefreshCw, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Sparkles,
  LogOut,
  Shield,
  Calendar,
  X,
  DollarSign,
  Eye,
  Heart,
  Download
} from 'lucide-react'
import TokenChart from '@/components/TokenChart'
import DashboardLayout from '@/components/DashboardLayout'
import TokenDetailModal from '@/components/TokenDetailModal'
import { showToast } from '@/components/Toast'
import { TableSkeleton, TableRowSkeleton } from '@/components/SkeletonLoader'

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
}

export default function Dashboard() {
  const router = useRouter()
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score')
  const [authChecked, setAuthChecked] = useState(false)
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  
  // Export functions
  const exportToCSV = () => {
    const data = filteredTokens.map(token => ({
      symbol: token.symbol,
      name: token.name,
      address: token.address,
      score: token.score,
      grade: token.grade,
      safety_score: token.safety_score,
      holder_score: token.holder_score,
      smart_money_score: token.smart_money_score,
      analyzed_at: token.analyzed_at
    }))
    
    const csv = [
      ['Symbol', 'Name', 'Address', 'Score', 'Grade', 'Safety Score', 'Holder Score', 'Smart Money Score', 'Analyzed At'],
      ...data.map(t => [
        t.symbol,
        t.name,
        t.address,
        t.score.toString(),
        t.grade,
        t.safety_score.toString(),
        t.holder_score.toString(),
        t.smart_money_score.toString(),
        t.analyzed_at
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `solana-tokens-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showToast('הנתונים יוצאו בהצלחה!', 'success')
  }
  
  const exportToJSON = () => {
    const data = filteredTokens.map(token => ({
      symbol: token.symbol,
      name: token.name,
      address: token.address,
      score: token.score,
      grade: token.grade,
      safety_score: token.safety_score,
      holder_score: token.holder_score,
      smart_money_score: token.smart_money_score,
      analyzed_at: token.analyzed_at
    }))
    
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `solana-tokens-${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showToast('הנתונים יוצאו בהצלחה!', 'success')
  }

  // בדיקת אימות - תמיד רץ
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    } else {
      setAuthChecked(true)
    }
  }, [router])

  // טען טוקנים רק אחרי בדיקת אימות
  useEffect(() => {
    if (!authChecked) return // לא לטעון עד שבדיקת האימות הסתיימה
    
    loadTokens()
    
    // האזן לעדכונים בזמן אמת (אם Supabase מוגדר)
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('tokens-changes')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'tokens' 
          },
          (payload) => {
            console.log('🆕 New token detected via Realtime:', payload.new)
            // הוסף את הטוקן החדש לרשימה (בלי refresh מלא)
            const newToken = payload.new as Token
            setTokens((prev) => {
              // בדוק אם הטוקן כבר קיים
              if (prev.some(t => t.address === newToken.address)) {
                return prev
              }
              // הוסף בהתחלה (הכי חדש)
              return [newToken, ...prev]
            })
          }
        )
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'tokens' 
          },
          (payload) => {
            console.log('🔄 Token updated via Realtime:', payload.new)
            // עדכן את הטוקן הקיים
            const updatedToken = payload.new as Token
            setTokens((prev) => 
              prev.map(t => t.address === updatedToken.address ? updatedToken : t)
            )
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

  const loadTokens = async () => {
    setLoading(true)
    try {
      // אם Supabase לא מוגדר, השתמש ב-mock data
      if (!isSupabaseConfigured || !supabase) {
        // Mock data למטרות פיתוח
        setTokens([
          {
            id: '1',
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            symbol: 'USDC',
            name: 'USD Coin',
            score: 95,
            safety_score: 100,
            holder_score: 20,
            smart_money_score: 15,
            grade: 'A+',
            category: 'EXCELLENT',
            analyzed_at: new Date().toISOString(),
            holder_count: 1000000,
            top_10_percentage: 15.5,
          },
        ])
        setLoading(false)
        return
      }

      if (!supabase) {
        setTokens([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .order(sortBy === 'score' ? 'score' : 'analyzed_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error loading tokens:', error)
        setTokens([])
      } else {
        setTokens(data || [])
      }
    } catch (error) {
      console.error('Failed to load tokens:', error)
      setTokens([])
    } finally {
      setLoading(false)
    }
  }

  // פילטרים וחיפוש
  const filteredTokens = tokens.filter((token) => {
    const matchesSearch = 
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesScore = token.score >= minScore
    return matchesSearch && matchesScore
  })

  // סטטיסטיקות
  const stats = {
    total: tokens.length,
    highScore: tokens.filter((t) => t.score >= 85).length,
    averageScore: tokens.length > 0 
      ? Math.round(tokens.reduce((sum, t) => sum + t.score, 0) / tokens.length)
      : 0,
    excellent: tokens.filter((t) => t.category === 'EXCELLENT').length,
  }

  // צבע לפי ציון
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 85) return 'text-blue-500'
    if (score >= 75) return 'text-yellow-500'
    if (score >= 60) return 'text-orange-500'
    return 'text-red-500'
  }

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-500/20 text-green-500'
    if (grade.startsWith('B')) return 'bg-blue-500/20 text-blue-500'
    if (grade.startsWith('C')) return 'bg-yellow-500/20 text-yellow-500'
    return 'bg-red-500/20 text-red-500'
  }

  // לא להציג כלום עד שבדיקת האימות הסתיימה - אחרי כל ה-hooks!
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-slate-600 dark:text-slate-400">בודק הרשאות...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="relative">
      {/* Animated Background Elements - עוד יותר מרהיב! */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        {/* Floating particles effect */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400/40 rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-40 w-2 h-2 bg-purple-400/40 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-pink-400/40 rounded-full animate-ping" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Header - עוד יותר יפה! */}
      <header className="border-b border-slate-200/50 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sticky top-0 z-50 shadow-lg relative">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    SolanaHunter
                  </h1>
                  <div className="relative group">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-slate-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      מאובטח
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  AI-Powered Token Discovery Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Export Data Dropdown */}
              <div className="relative group">
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  title="ייצא נתונים"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden md:inline">ייצא נתונים</span>
                </button>
                <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button
                    onClick={exportToCSV}
                    className="w-full text-right px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-xl transition-colors"
                  >
                    ייצא ל-CSV
                  </button>
                  <button
                    onClick={exportToJSON}
                    className="w-full text-right px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-b-xl transition-colors"
                  >
                    ייצא ל-JSON
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  clearAuthToken()
                  router.push('/login')
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-500/20 text-slate-700 dark:text-slate-300 hover:bg-slate-500/30 transition-all duration-200"
                title="התנתק"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <button
                onClick={loadTokens}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="font-medium">רענן</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
          <StatCard
            title="סה״כ טוקנים"
            value={stats.total}
            icon={<BarChart3 className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="ציון גבוה (85+)"
            value={stats.highScore}
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="ציון ממוצע"
            value={stats.averageScore}
            icon={<BarChart3 className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            title="מצוינים"
            value={stats.excellent}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="yellow"
          />
        </div>

        {/* Filters & Search */}
        <div className="bg-white/80 backdrop-blur-lg dark:bg-slate-800/80 rounded-2xl p-6 mb-6 border border-slate-200/50 dark:border-slate-700 shadow-xl animate-fade-in">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="חפש לפי סימבול, שם או כתובת..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm focus:shadow-md"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 min-w-[60px]">
                מינימום: {minScore}
              </span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'score' | 'date')}
              className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm focus:shadow-md"
            >
              <option value="score">מיון לפי ציון</option>
              <option value="date">מיון לפי תאריך</option>
            </select>
          </div>
        </div>

        {/* Tokens Table - עוד יותר מרהיב! */}
        <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl border border-slate-200/50 dark:border-slate-700 shadow-2xl overflow-hidden animate-fade-in hover:shadow-3xl transition-shadow duration-300">
          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">טוקן</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">ציון</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Grade</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">מחיר</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">פירוט</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">נותח</th>
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
          ) : filteredTokens.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 dark:text-slate-400">
                {tokens.length === 0 
                  ? 'אין טוקנים עדיין. הבוט עדיין לא מצא טוקנים חדשים.'
                  : 'לא נמצאו טוקנים התואמים לפילטרים שלך.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                      טוקן
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                      ציון
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Grade
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                      מחיר
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                      פירוט
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                      נותח
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredTokens.map((token, index) => (
                    <tr
                      key={token.id}
                      className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/30 dark:hover:from-slate-800/50 dark:hover:to-slate-700/30 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <span className="relative z-10">{token.symbol.charAt(0)}</span>
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 animate-pulse opacity-50"></div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {token.symbol}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {token.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className={`text-3xl font-bold ${getScoreColor(token.score)} drop-shadow-sm`}>
                              {token.score}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">/100</span>
                          </div>
                          {/* Progress bar */}
                          <div className="flex-1 max-w-[120px] h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className={`h-full transition-all duration-700 ${
                                token.score >= 90 ? 'bg-gradient-to-r from-green-400 via-green-500 to-green-600' :
                                token.score >= 85 ? 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600' :
                                token.score >= 75 ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600' :
                                'bg-gradient-to-r from-red-400 via-red-500 to-red-600'
                              }`}
                              style={{ width: `${token.score}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getGradeColor(token.grade)}`}
                        >
                          {token.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32 h-12">
                          <TokenChart tokenAddress={token.address} symbol={token.symbol} score={token.score} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 dark:text-slate-400">Safety:</span>
                            <span className="font-medium">{token.safety_score}/100</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 dark:text-slate-400">Holders:</span>
                            <span className="font-medium">{token.holder_score}/20</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 dark:text-slate-400">Smart Money:</span>
                            <span className="font-medium">{token.smart_money_score}/15</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <Clock className="w-4 h-4" />
                          {format(new Date(token.analyzed_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Quick Actions */}
                          <button
                            onClick={() => {
                              router.push(`/trading?token=${token.address}&action=buy`)
                              showToast('מעבר לדף המסחר...', 'info')
                            }}
                            className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
                            title="קנה"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedToken(token)
                              showToast('פתיחת פרטי טוקן...', 'info')
                            }}
                            className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
                            title="צפה בפרטים"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              showToast('נוסף למועדפים!', 'success')
                            }}
                            className="p-2 rounded-lg bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
                            title="הוסף למועדפים"
                          >
                            <Heart className="w-4 h-4" />
                          </button>
                          {/* External Links */}
                          <a
                            href={`https://dexscreener.com/solana/${token.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
                            title="DexScreener"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
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

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'yellow'
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  }

  const gradientClasses = {
    blue: 'from-blue-500/20 to-blue-600/10',
    green: 'from-green-500/20 to-green-600/10',
    purple: 'from-purple-500/20 to-purple-600/10',
    yellow: 'from-yellow-500/20 to-yellow-600/10',
  }

  return (
    <div className="group relative bg-white/80 backdrop-blur-lg dark:bg-slate-800/80 rounded-xl p-6 border border-slate-200/50 dark:border-slate-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      
      <div className="relative flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      <p className="relative text-3xl font-bold text-slate-900 dark:text-slate-100 group-hover:scale-110 transition-transform duration-300 inline-block">
        {value}
      </p>
    </div>
  )
}
