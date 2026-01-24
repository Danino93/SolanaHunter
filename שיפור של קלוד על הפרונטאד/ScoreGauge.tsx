/**
 * ScoreGauge Component
 * Beautiful circular gauge for displaying token scores
 */

'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import CountUp from 'react-countup'
import { getScoreGradient, getGradeColor } from '@/lib/theme'

interface ScoreGaugeProps {
  score: number
  grade?: string
  category?: string
  size?: number
  strokeWidth?: number
  showLabels?: boolean
  animated?: boolean
}

export default function ScoreGauge({
  score,
  grade,
  category,
  size = 200,
  strokeWidth = 12,
  showLabels = true,
  animated = true,
}: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score)
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayScore(score), 100)
      return () => clearTimeout(timer)
    }
  }, [score, animated])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (displayScore / 100) * circumference
  const gradientId = `scoreGradient-${Math.random()}`

  // Get color based on score
  const getColor = () => {
    if (score >= 95) return { start: '#8b5cf6', end: '#ec4899' } // purple-pink
    if (score >= 85) return { start: '#10b981', end: '#059669' } // green
    if (score >= 75) return { start: '#3b82f6', end: '#6366f1' } // blue
    if (score >= 60) return { start: '#f59e0b', end: '#f97316' } // amber-orange
    return { start: '#ef4444', end: '#dc2626' } // red
  }

  const colors = getColor()

  return (
    <div className="flex flex-col items-center">
      {/* SVG Gauge */}
      <motion.div
        className="relative"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: [0.68, -0.55, 0.265, 1.55] }}
      >
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Gradient Definition */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="100%" stopColor={colors.end} />
            </linearGradient>
            
            {/* Glow Filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Background Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />
          
          {/* Progress Circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            filter="url(#glow)"
          />
        </svg>
        
        {/* Score Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {animated ? (
              <CountUp
                end={score}
                duration={1.5}
                separator=","
              />
            ) : (
              score
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            / 100
          </div>
        </div>
      </motion.div>
      
      {/* Labels */}
      {showLabels && (grade || category) && (
        <motion.div
          className="mt-4 text-center space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {grade && (
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getGradeColor(grade).badge}`}>
              Grade {grade}
            </div>
          )}
          
          {category && (
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {category}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
