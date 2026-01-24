/**
 * TokenScoreBreakdown Component
 * Visual breakdown of all score components with progress bars and icons
 */

'use client'

import { motion } from 'framer-motion'
import { Shield, Users, Droplet, BarChart3, Brain, TrendingUp } from 'lucide-react'
import { scoreComponentColors } from '@/lib/theme'
import { staggerContainer, staggerItem } from '@/lib/animations'

interface TokenScoreBreakdownProps {
  safety_score?: number
  holder_score?: number
  liquidity_score?: number
  volume_score?: number
  smart_money_score?: number
  price_action_score?: number
  total_score?: number
  showTotal?: boolean
}

interface ScoreBarProps {
  label: string
  score: number
  maxScore: number
  color: string
  icon: any
  delay?: number
}

function ScoreBar({ label, score, maxScore, color, icon: Icon, delay = 0 }: ScoreBarProps) {
  const percentage = (score / maxScore) * 100

  return (
    <motion.div
      className="space-y-2"
      variants={staggerItem}
    >
      {/* Label & Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
        </div>
        <span className="text-sm font-bold text-gray-900 dark:text-white">
          {score}/{maxScore}
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ 
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
            boxShadow: `0 0 10px ${color}40`
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: 1, 
            delay: delay,
            ease: 'easeOut' 
          }}
        />
        
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{
            duration: 1.5,
            delay: delay + 0.5,
            ease: 'easeInOut',
          }}
        />
      </div>
    </motion.div>
  )
}

export default function TokenScoreBreakdown({
  safety_score = 0,
  holder_score = 0,
  liquidity_score = 0,
  volume_score = 0,
  smart_money_score = 0,
  price_action_score = 0,
  total_score = 0,
  showTotal = true,
}: TokenScoreBreakdownProps) {
  const components = [
    {
      label: scoreComponentColors.safety.label,
      score: safety_score,
      maxScore: 25,
      color: scoreComponentColors.safety.color,
      icon: Shield,
    },
    {
      label: scoreComponentColors.holder.label,
      score: holder_score,
      maxScore: 20,
      color: scoreComponentColors.holder.color,
      icon: Users,
    },
    {
      label: scoreComponentColors.liquidity.label,
      score: liquidity_score,
      maxScore: 25,
      color: scoreComponentColors.liquidity.color,
      icon: Droplet,
    },
    {
      label: scoreComponentColors.volume.label,
      score: volume_score,
      maxScore: 15,
      color: scoreComponentColors.volume.color,
      icon: BarChart3,
    },
    {
      label: scoreComponentColors.smartMoney.label,
      score: smart_money_score,
      maxScore: 10,
      color: scoreComponentColors.smartMoney.color,
      icon: Brain,
    },
    {
      label: scoreComponentColors.priceAction.label,
      score: price_action_score,
      maxScore: 5,
      color: scoreComponentColors.priceAction.color,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Total Score (if shown) */}
      {showTotal && total_score > 0 && (
        <motion.div
          className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Total Score
          </span>
          <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {total_score}/100
          </span>
        </motion.div>
      )}
      
      {/* Score Breakdown */}
      <motion.div
        className="space-y-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {components.map((component, index) => (
          <ScoreBar
            key={component.label}
            {...component}
            delay={index * 0.1}
          />
        ))}
      </motion.div>
      
      {/* Legend */}
      <motion.div
        className="pt-4 border-t border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Each component is scored individually and combined for the total score
        </p>
      </motion.div>
    </div>
  )
}
