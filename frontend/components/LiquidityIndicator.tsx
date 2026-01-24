/**
 * LiquidityIndicator Component
 * Beautiful liquid animation showing liquidity status
 */

'use client'

import { motion } from 'framer-motion'
import { Droplet } from 'lucide-react'
import { getLiquidityStatus } from '@/lib/theme'
import { formatSOL, formatPrice } from '@/lib/formatters'

interface LiquidityIndicatorProps {
  liquiditySol: number
  liquidityUsd?: number
  score?: number
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

export default function LiquidityIndicator({
  liquiditySol,
  liquidityUsd,
  score,
  size = 'md',
  showTooltip = true,
}: LiquidityIndicatorProps) {
  const status = getLiquidityStatus(liquiditySol)
  const percentage = Math.min((liquiditySol / 100) * 100, 100)
  
  const sizes = {
    sm: { container: 'w-16 h-16', icon: 'w-6 h-6', text: 'text-xs' },
    md: { container: 'w-24 h-24', icon: 'w-8 h-8', text: 'text-sm' },
    lg: { container: 'w-32 h-32', icon: 'w-10 h-10', text: 'text-base' },
  }
  
  const colorMap = {
    green: 'from-green-400 to-emerald-600',
    blue: 'from-blue-400 to-cyan-600',
    amber: 'from-amber-400 to-orange-600',
    orange: 'from-orange-400 to-red-600',
    red: 'from-red-400 to-rose-600',
  }
  
  const badgeColorMap = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  return (
    <div className="relative group">
      {/* Liquid Container */}
      <div className={`${sizes[size].container} relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700`}>
        {/* Liquid Fill */}
        <motion.div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t ${colorMap[status.color as keyof typeof colorMap]}`}
          initial={{ height: '0%' }}
          animate={{ height: `${percentage}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          {/* Wave Animation */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            }}
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
        
        {/* Icon & Percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Droplet className={`${sizes[size].icon} text-white drop-shadow-lg`} />
          <span className={`${sizes[size].text} font-bold text-white drop-shadow-lg mt-1`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      
      {/* Status Badge */}
      <div className="mt-2 text-center">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeColorMap[status.color as keyof typeof badgeColorMap] || badgeColorMap.green}`}>
          {status.icon} {status.label}
        </span>
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
          <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-lg">
            <div className="font-semibold">{formatSOL(liquiditySol)}</div>
            {liquidityUsd && (
              <div className="text-gray-300 dark:text-gray-600">{formatPrice(liquidityUsd)}</div>
            )}
            {score && (
              <div className="mt-1 text-gray-300 dark:text-gray-600">Score: {score}/25</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}