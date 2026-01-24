/**
 * ScoreGauge Component
 * Circular gauge displaying token score with animations and grade
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { getScoreGradient, getGradeColor } from '@/lib/theme'
import { getScoreEmoji } from '@/lib/formatters'

interface ScoreGaugeProps {
  score: number
  grade: string
  category: string
  size?: number
  showLabels?: boolean
  animated?: boolean
  className?: string
}

export default function ScoreGauge({
  score,
  grade,
  category,
  size = 200,
  showLabels = true,
  animated = true,
  className = '',
}: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const gradeColor = getGradeColor(grade)
  const gradientClass = getScoreGradient(score)
  const emoji = getScoreEmoji(score)
  
  // Animate score on mount
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedScore(score)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setAnimatedScore(score)
    }
  }, [score, animated])

  // Calculate stroke dash array for circle
  const radius = (size / 2) - 20
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Main SVG Circle */}
      <motion.svg
        width={size}
        height={size}
        className="transform -rotate-90"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreGradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
          className="drop-shadow-lg"
        />
        
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className={`stop-current ${gradientClass.split(' ')[0].replace('from-', 'text-')}`} />
            <stop offset="100%" className={`stop-current ${gradientClass.split(' ')[1].replace('to-', 'text-')}`} />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Score Number */}
        <motion.div
          className="text-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <motion.span
            className={`text-4xl lg:text-5xl font-bold ${gradeColor.text}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            {animatedScore}
          </motion.span>
          <motion.span
            className="text-xl lg:text-2xl text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
          >
            /100
          </motion.span>
        </motion.div>

        {/* Grade */}
        <motion.div
          className={`mt-2 px-3 py-1 rounded-full text-sm font-bold ${gradeColor.badge}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.6 }}
        >
          {grade} {emoji}
        </motion.div>
      </div>

      {/* Labels */}
      <AnimatePresence>
        {showLabels && (
          <motion.div
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5, delay: 1.8 }}
          >
            <div className="text-center">
              <div className={`text-sm font-medium ${gradeColor.text}`}>
                {category}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Token Rating
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glow Effect */}
      <motion.div
        className={`absolute inset-0 rounded-full ${gradeColor.glow} opacity-20`}
        animate={{ 
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Pulse Ring */}
      <motion.div
        className={`absolute inset-0 rounded-full border-2 ${gradeColor.border} opacity-30`}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}