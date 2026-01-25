/**
 * TokenTable Component
 * Advanced sortable table with filtering and pagination
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronUp, 
  ChevronDown, 
  Filter, 
  Download, 
  Eye,
  TrendingUp,
  TrendingDown,
  Copy,
  ExternalLink,
  Search,
  RefreshCw
} from 'lucide-react'
import { 
  formatPrice, 
  formatPercent, 
  formatAddress, 
  formatTimeAgo,
  getPercentColor,
  copyToClipboard
} from '@/lib/formatters'
import { getGradeColor } from '@/lib/theme'
import AnimatedCard from './AnimatedCard'
import TrendChart from './TrendChart'

interface Token {
  address: string
  symbol: string
  name: string
  price: number
  change24h: number
  volume24h: number
  liquidity: number
  marketCap: number
  score: number
  grade: string
  category: string
  holders: number
  smartMoney: number
  lastSeen: string
  trend: number[]
}

interface TokenTableProps {
  tokens: Token[]
  onTokenClick?: (token: Token) => void
  onTokenAnalyze?: (token: Token) => Promise<void> | void
  showFilters?: boolean
  showPagination?: boolean
  pageSize?: number
  className?: string
}

type SortField = keyof Token | null
type SortDirection = 'asc' | 'desc'

export default function TokenTable({
  tokens,
  onTokenClick,
  onTokenAnalyze,
  showFilters = true,
  showPagination = true,
  pageSize = 20,
  className = '',
}: TokenTableProps) {
  const [analyzingToken, setAnalyzingToken] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('score')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    minScore: 0,
    maxScore: 100,
    category: 'all',
    grade: 'all',
  })

  const handleAnalyze = async (token: Token, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    if (analyzingToken) return
    
    setAnalyzingToken(token.address)
    try {
      if (onTokenAnalyze) {
        await onTokenAnalyze(token)
      }
    } finally {
      setAnalyzingToken(null)
    }
  }

  // Sort function
  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1)
  }, [sortField])

  // Filter and sort tokens
  const filteredAndSortedTokens = useMemo(() => {
    let filtered = tokens

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(token =>
        token.name.toLowerCase().includes(searchLower) ||
        token.symbol.toLowerCase().includes(searchLower) ||
        token.address.toLowerCase().includes(searchLower)
      )
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(token => token.category === filters.category)
    }

    if (filters.grade !== 'all') {
      filtered = filtered.filter(token => token.grade === filters.grade)
    }

    filtered = filtered.filter(token =>
      token.score >= filters.minScore && token.score <= filters.maxScore
    )

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aVal = a[sortField]
        const bVal = b[sortField]
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
        }
        
        return 0
      })
    }

    return filtered
  }, [tokens, filters, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTokens.length / pageSize)
  const paginatedTokens = showPagination
    ? filteredAndSortedTokens.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      )
    : filteredAndSortedTokens

  // Handle copy address
  const handleCopyAddress = async (address: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await copyToClipboard(address)
  }

  // Handle open explorer
  const handleOpenExplorer = (address: string, e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`https://solscan.io/token/${address}`, '_blank')
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-blue-500"
          >
            {sortDirection === 'asc' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </motion.div>
        )}
      </div>
    </th>
  )

  return (
    <AnimatedCard className={`overflow-hidden ${className}`} noPadding>
      {/* Header with Filters */}
      {showFilters && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חפש טוקנים..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex items-center space-x-4">
              {/* Score Range */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ציון:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minScore}
                  onChange={(e) => setFilters(prev => ({ ...prev, minScore: Number(e.target.value) }))}
                  className="w-20"
                />
                <span className="text-xs text-gray-500">{filters.minScore}-{filters.maxScore}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.maxScore}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxScore: Number(e.target.value) }))}
                  className="w-20"
                />
              </div>

              {/* Export Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Download className="w-4 h-4 mr-2" />
                ייצא
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <SortableHeader field="name">טוקן</SortableHeader>
              <SortableHeader field="price">מחיר</SortableHeader>
              <SortableHeader field="change24h">שינוי 24 שעות</SortableHeader>
              <SortableHeader field="volume24h">נפח</SortableHeader>
              <SortableHeader field="liquidity">נזילות</SortableHeader>
              <SortableHeader field="score">ציון</SortableHeader>
              <SortableHeader field="holders">מחזיקים</SortableHeader>
              <SortableHeader field="smartMoney">ארנקים חכמים</SortableHeader>
              <SortableHeader field="lastSeen">נראה לאחרונה</SortableHeader>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <AnimatePresence>
              {paginatedTokens.map((token, index) => {
                const gradeColor = getGradeColor(token.grade)
                
                return (
                  <motion.tr
                    key={token.address}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onTokenClick?.(token)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    {/* Token Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                            {token.symbol.slice(0, 2)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {token.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {token.symbol} • {formatAddress(token.address)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatPrice(token.price)}
                      </div>
                      <div className="w-16 h-8">
                        <TrendChart 
                          data={token.trend} 
                          trend={token.change24h >= 0 ? 'up' : 'down'}
                          height={24}
                          width={48}
                        />
                      </div>
                    </td>

                    {/* 24h Change */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center text-sm font-medium ${getPercentColor(token.change24h)}`}>
                        {token.change24h >= 0 ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {formatPercent(Math.abs(token.change24h))}
                      </div>
                    </td>

                    {/* Volume */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatPrice(token.volume24h)}
                    </td>

                    {/* Liquidity */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatPrice(token.liquidity)}
                    </td>

                    {/* Score */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-bold text-gray-900 dark:text-white mr-2">
                          {token.score}/100
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gradeColor.badge}`}>
                          {token.grade}
                        </span>
                      </div>
                    </td>

                    {/* Holders */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {token.holders.toLocaleString()}
                    </td>

                    {/* Smart Money */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {token.smartMoney > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            🤖 {token.smartMoney}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Last Seen */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(token.lastSeen)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Analyze button - only show for tokens with score 0 or F grade */}
                        {(token.score === 0 || token.grade === 'F') && onTokenAnalyze && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleAnalyze(token, e)}
                            disabled={analyzingToken === token.address}
                            className={`text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 ${
                              analyzingToken === token.address ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title="נתח עכשיו"
                          >
                            <RefreshCw className={`w-4 h-4 ${analyzingToken === token.address ? 'animate-spin' : ''}`} />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleCopyAddress(token.address, e)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="העתק כתובת"
                        >
                          <Copy className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleOpenExplorer(token.address, e)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="צפה ב-Explorer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onTokenClick?.(token)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="צפה בפרטים"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              מציג {(currentPage - 1) * pageSize + 1} עד {Math.min(currentPage * pageSize, filteredAndSortedTokens.length)} מתוך {filteredAndSortedTokens.length} תוצאות
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                קודם
              </motion.button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + Math.max(1, currentPage - 2)
                if (pageNum > totalPages) return null
                
                return (
                  <motion.button
                    key={pageNum}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </motion.button>
                )
              })}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                הבא
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAndSortedTokens.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">לא נמצאו טוקנים</h3>
            <p className="text-sm">נסה לשנות את החיפוש או את הפילטרים</p>
          </div>
        </div>
      )}
    </AnimatedCard>
  )
}