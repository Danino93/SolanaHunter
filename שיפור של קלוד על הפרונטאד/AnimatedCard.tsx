/**
 * AnimatedCard Component
 * Beautiful card with glass morphism, animations, and hover effects
 */

'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cardHover } from '@/lib/animations'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  gradient?: boolean
  glow?: boolean
  noPadding?: boolean
}

export default function AnimatedCard({
  children,
  className = '',
  onClick,
  gradient = false,
  glow = false,
  noPadding = false,
}: AnimatedCardProps) {
  const baseClasses = `
    relative overflow-hidden
    ${gradient ? 'glass-card' : 'bg-white dark:bg-gray-800'}
    ${!noPadding ? 'p-6 lg:p-8' : ''}
    rounded-2xl
    border border-gray-200 dark:border-gray-700
    ${onClick ? 'cursor-pointer' : ''}
    ${glow ? 'shadow-glow' : 'shadow-lg'}
    transition-all duration-300
  `

  return (
    <motion.div
      className={`${baseClasses} ${className}`}
      variants={cardHover}
      initial="initial"
      whileHover={onClick ? "hover" : undefined}
      whileTap={onClick ? "tap" : undefined}
      onClick={onClick}
    >
      {/* Gradient Overlay (optional) */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Glow effect on hover */}
      {glow && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 pointer-events-none"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  )
}
