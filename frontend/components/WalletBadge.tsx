/**
 * WalletBadge Component
 * Smart wallet badge with trust score and performance indicators
 */

'use client'

import { motion } from 'framer-motion'
import { Copy, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react'
import { getTrustScoreColor, achievements } from '@/lib/theme'
import { formatAddress, formatTrustScore, formatPercent, copyToClipboard } from '@/lib/formatters'
import { useState } from 'react'

interface WalletBadgeProps {
  address: string
  nickname?: string
  trustScore: number
  successRate: number
  totalTrades: number
  avgROI: number
  achievements?: string[]
  onClick?: () => void
  showFullAddress?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function WalletBadge({
  address,
  nickname,
  trustScore,
  successRate,
  totalTrades,
  avgROI,
  achievements: walletAchievements = [],
  onClick,
  showFullAddress = false,
  size = 'md',
}: WalletBadgeProps) {
  const [copied, setCopied] = useState(false)
  const trustColor = getTrustScoreColor(trustScore)
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const success = await copyToClipboard(address)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openExplorer = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`https://solscan.io/account/${address}`, '_blank')
  }

  const sizes = {
    sm: {
      container: 'p-3',
      text: 'text-sm',
      badge: 'text-xs px-2 py-1',
      icon: 'w-4 h-4',
    },
    md: {
      container: 'p-4',
      text: 'text-base',
      badge: 'text-xs px-2.5 py-1',
      icon: 'w-5 h-5',
    },
    lg: {
      container: 'p-6',
      text: 'text-lg',
      badge: 'text-sm px-3 py-1.5',
      icon: 'w-6 h-6',
    },
  }

  const sizeClasses = sizes[size]

  return (
    <motion.div
      className={`${sizeClasses.container} bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {/* Nickname */}
          {nickname && (
            <h3 className={`${sizeClasses.text} font-semibold text-gray-900 dark:text-white truncate`}>
              {nickname}
            </h3>
          )}
          
          {/* Address */}
          <div className="flex items-center space-x-2 mt-1">
            <code className="text-xs font-mono text-gray-600 dark:text-gray-400">
              {showFullAddress ? address : formatAddress(address)}
            </code>
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Copy className={sizeClasses.icon} />
            </button>
            <button
              onClick={openExplorer}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ExternalLink className={sizeClasses.icon} />
            </button>
          </div>
        </div>

        {/* Trust Score */}
        <div className="text-right">
          <motion.div
            className={`inline-flex items-center ${sizeClasses.badge} rounded-full font-medium text-white`}
            style={{ backgroundColor: trustColor }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
          >
            🤖 {trustScore}
          </motion.div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Trust Score
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        {/* Success Rate */}
        <div className="text-center">
          <div className={`${sizeClasses.text} font-bold text-gray-900 dark:text-white`}>
            {formatPercent(successRate, false)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Success Rate
          </div>
        </div>

        {/* Total Trades */}
        <div className="text-center">
          <div className={`${sizeClasses.text} font-bold text-gray-900 dark:text-white`}>
            {totalTrades}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Total Trades
          </div>
        </div>

        {/* Average ROI */}
        <div className="text-center">
          <div className={`flex items-center justify-center ${sizeClasses.text} font-bold`}>
            {avgROI >= 0 ? (
              <TrendingUp className={`${sizeClasses.icon} mr-1 text-green-500`} />
            ) : (
              <TrendingDown className={`${sizeClasses.icon} mr-1 text-red-500`} />
            )}
            <span className={avgROI >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {formatPercent(avgROI)}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Avg ROI
          </div>
        </div>
      </div>

      {/* Achievements */}
      {walletAchievements.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Achievements</div>
          <div className="flex flex-wrap gap-2">
            {walletAchievements.slice(0, 3).map((achievementKey) => {
              const achievement = achievements[achievementKey as keyof typeof achievements]
              if (!achievement) return null
              
              return (
                <motion.div
                  key={achievementKey}
                  className={`inline-flex items-center text-xs px-2 py-1 rounded-full text-white ${achievement.color}`}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                  title={achievement.description}
                >
                  {achievement.icon} {achievement.name}
                </motion.div>
              )
            })}
            {walletAchievements.length > 3 && (
              <div className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                +{walletAchievements.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Copy Confirmation */}
      {copied && (
        <motion.div
          className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          Copied!
        </motion.div>
      )}
    </motion.div>
  )
}