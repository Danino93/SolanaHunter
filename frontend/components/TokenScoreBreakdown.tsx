/**
 * TokenScoreBreakdown Component
 * Animated score breakdown showing individual components
 */

'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { scoreComponentColors } from '@/lib/theme'
import { staggerContainer, staggerItem } from '@/lib/animations'

interface TokenScoreBreakdownProps {
  safety_score: number
  holder_score: number
  liquidity_score: number
  volume_score: number
  smart_money_score: number
  price_action_score: number
  total_score: number
  showTotal?: boolean
  animated?: boolean
  className?: string
}

interface ScoreBarProps {
  label: string
  score: number
  maxScore: number
  color: string
  icon: string
  animated?: boolean
  delay?: number
}

function ScoreBar({ label, score, maxScore, color, icon, animated = true, delay = 0 }: ScoreBarProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const percentage = Math.max(0, Math.min(100, (score / maxScore) * 100))

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedScore(score)
      }, delay)
      return () => clearTimeout(timer)
    } else {
      setAnimatedScore(score)
    }
  }, [score, animated, delay])

  return (
    <motion.div
      variants={staggerItem}
      className="space-y-2"
    >
      {/* Label and Score */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{icon}</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
        </div>
        <motion.span
          className="font-bold text-gray-900 dark:text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: delay + 0.5 }}
        >
          {animatedScore}/{maxScore}
        </motion.span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        {/* Background Bar */}
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          {/* Animated Progress */}
          <motion.div
            className="h-full rounded-full shadow-sm"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: delay + 0.2 }}
          />
        </div>

        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 h-3 rounded-full opacity-30"
          style={{ backgroundColor: color, filter: 'blur(4px)' }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: delay + 0.2 }}
        />

        {/* Score Indicator */}
        <motion.div
          className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full border-2 border-white dark:border-gray-900 shadow-lg"
          style={{ backgroundColor: color, left: `${percentage}%`, marginLeft: '-4px' }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: delay + 1 }}
        />
      </div>
    </motion.div>
  )
}

export default function TokenScoreBreakdown({
  safety_score,
  holder_score,
  liquidity_score,
  volume_score,
  smart_money_score,
  price_action_score,
  total_score,
  showTotal = true,
  animated = true,
  className = '',
}: TokenScoreBreakdownProps) {
  const scores = [
    {
      key: 'safety',
      label: scoreComponentColors.safety.label,
      score: safety_score,
      maxScore: 25,
      color: scoreComponentColors.safety.color,
      icon: scoreComponentColors.safety.icon,
    },
    {
      key: 'holder',
      label: scoreComponentColors.holder.label,
      score: holder_score,
      maxScore: 20,
      color: scoreComponentColors.holder.color,
      icon: scoreComponentColors.holder.icon,
    },
    {
      key: 'liquidity',
      label: scoreComponentColors.liquidity.label,
      score: liquidity_score,
      maxScore: 25,
      color: scoreComponentColors.liquidity.color,
      icon: scoreComponentColors.liquidity.icon,
    },
    {
      key: 'volume',
      label: scoreComponentColors.volume.label,
      score: volume_score,
      maxScore: 15,
      color: scoreComponentColors.volume.color,
      icon: scoreComponentColors.volume.icon,
    },
    {
      key: 'smartMoney',
      label: scoreComponentColors.smartMoney.label,
      score: smart_money_score,
      maxScore: 10,
      color: scoreComponentColors.smartMoney.color,
      icon: scoreComponentColors.smartMoney.icon,
    },
    {
      key: 'priceAction',
      label: scoreComponentColors.priceAction.label,
      score: price_action_score,
      maxScore: 5,
      color: scoreComponentColors.priceAction.color,
      icon: scoreComponentColors.priceAction.icon,
    },
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Score Breakdown
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Detailed analysis of token scoring components
        </p>
      </motion.div>

      {/* Score Bars */}
      <motion.div
        className="space-y-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {scores.map((scoreItem, index) => (
          <ScoreBar
            key={scoreItem.key}
            label={scoreItem.label}
            score={scoreItem.score}
            maxScore={scoreItem.maxScore}
            color={scoreItem.color}
            icon={scoreItem.icon}
            animated={animated}
            delay={index * 0.1}
          />
        ))}
      </motion.div>

      {/* Total Score */}
      {showTotal && (
        <motion.div
          className="pt-4 border-t border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎯</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Total Score
              </span>
            </div>
            <motion.div
              className="text-right"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {total_score}/100
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Combined Rating
              </div>
            </motion.div>
          </div>

          {/* Total Progress Bar */}
          <div className="mt-3 relative">
            <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${total_score}%` }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 1.2 }}
              />
            </div>
            
            {/* Glow effect for total */}
            <motion.div
              className="absolute inset-0 h-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30 blur-sm"
              initial={{ width: 0 }}
              animate={{ width: `${total_score}%` }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 1.2 }}
            />
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <motion.div
        className="text-xs text-gray-400 dark:text-gray-500 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.5 }}
      >
        Higher scores indicate better token quality and lower risk
      </motion.div>
    </div>
  )
}