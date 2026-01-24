/**
 * SearchBar Component
 * Smart search with autocomplete and keyboard navigation
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, TrendingUp, Wallet, Clock } from 'lucide-react'
import { formatAddress, formatPrice } from '@/lib/formatters'

interface SearchResult {
  id: string
  type: 'token' | 'wallet' | 'recent'
  title: string
  subtitle?: string
  price?: number
  change24h?: number
  score?: number
  address?: string
  icon?: string
}

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  onSelect?: (result: SearchResult) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function SearchBar({
  placeholder = 'חפש טוקנים, כתובות או ארנקים חכמים...',
  onSearch,
  onSelect,
  className = '',
  size = 'md',
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const sizes = {
    sm: {
      input: 'h-10 text-sm px-4',
      icon: 'w-4 h-4',
      container: 'max-w-md',
    },
    md: {
      input: 'h-12 text-base px-5',
      icon: 'w-5 h-5',
      container: 'max-w-xl',
    },
    lg: {
      input: 'h-14 text-lg px-6',
      icon: 'w-6 h-6',
      container: 'max-w-2xl',
    },
  }

  const sizeClasses = sizes[size]

  // Mock search function - replace with real API call
  const mockSearch = useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
    if (!searchQuery.trim()) return []
    
    setIsLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Mock results
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'token',
        title: 'Solana',
        subtitle: 'SOL',
        price: 95.67,
        change24h: 12.5,
        score: 95,
        address: 'So11111111111111111111111111111111111111112',
        icon: '🟣',
      },
      {
        id: '2',
        type: 'token',
        title: 'Bonk',
        subtitle: 'BONK',
        price: 0.00002345,
        change24h: -5.2,
        score: 78,
        address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        icon: '🐕',
      },
      {
        id: '3',
        type: 'wallet',
        title: 'Smart Whale #1',
        subtitle: formatAddress('Ae7xG9pT8kL9Bq2Zx3MnFp4Rs5Vw7Yh8Qj6Tk2Xl9Bp3'),
        score: 92,
        address: 'Ae7xG9pT8kL9Bq2Zx3MnFp4Rs5Vw7Yh8Qj6Tk2Xl9Bp3',
        icon: '🐋',
      },
    ]
    
    setIsLoading(false)
    return mockResults.filter(result => 
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [])

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim()) {
        const searchResults = await mockSearch(query)
        setResults(searchResults)
        setIsOpen(true)
        setSelectedIndex(-1)
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300) // Debounce

    return () => clearTimeout(timeoutId)
  }, [query, mockSearch])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        } else if (query.trim()) {
          onSearch?.(query)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleSelect = (result: SearchResult) => {
    setQuery(result.title)
    setIsOpen(false)
    setSelectedIndex(-1)
    onSelect?.(result)
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${sizeClasses.container} ${className}`} ref={resultsRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className={`${sizeClasses.icon} text-gray-400`} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(true)}
          className={`
            ${sizeClasses.input}
            w-full pl-12 pr-12
            bg-white dark:bg-gray-800
            border-2 border-gray-200 dark:border-gray-700
            rounded-xl
            text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            focus:border-blue-500 dark:focus:border-blue-400
            focus:ring-2 focus:ring-blue-500/20
            transition-all duration-200
            shadow-lg
          `}
        />

        {/* Clear Button */}
        {query && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className={sizeClasses.icon} />
          </motion.button>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            <div className={`${sizeClasses.icon.includes('w-4') ? 'w-4 h-4' : sizeClasses.icon.includes('w-5') ? 'w-5 h-5' : 'w-6 h-6'} animate-spin rounded-full border-2 border-blue-500 border-t-transparent`} />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto"
          >
            {results.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelect(result)}
                className={`
                  px-4 py-3 cursor-pointer transition-all duration-150
                  ${index === selectedIndex 
                    ? 'bg-blue-50 dark:bg-blue-900/20' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                  ${index === 0 ? 'rounded-t-xl' : ''}
                  ${index === results.length - 1 ? 'rounded-b-xl' : 'border-b border-gray-100 dark:border-gray-700'}
                `}
              >
                <div className="flex items-center space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {result.type === 'token' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        {result.icon || result.title[0]}
                      </div>
                    )}
                    {result.type === 'wallet' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {result.type === 'recent' && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {result.title}
                        </h4>
                        {result.subtitle && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Price */}
                        {result.price && (
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatPrice(result.price)}
                            </div>
                            {result.change24h && (
                              <div className={`text-xs flex items-center ${
                                result.change24h >= 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                <TrendingUp className={`w-3 h-3 mr-1 ${result.change24h < 0 ? 'rotate-180' : ''}`} />
                                {Math.abs(result.change24h).toFixed(2)}%
                              </div>
                            )}
                          </div>
                        )}

                        {/* Score */}
                        {result.score && (
                          <div className="text-right">
                            <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              {result.score}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Score
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results */}
      <AnimatePresence>
        {isOpen && !isLoading && query && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 p-4 text-center"
          >
            <div className="text-gray-500 dark:text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">לא נמצאו תוצאות עבור "{query}"</p>
              <p className="text-xs mt-1">נסה לחפש טוקנים, כתובות או ארנקים</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}