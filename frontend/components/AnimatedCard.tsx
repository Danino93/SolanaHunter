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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 dark:from-blue-400/5 dark:via-purple-400/5 dark:to-pink-400/5" />
      )}
      
      {/* Glow Effect (optional) */}
      {glow && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Corner Decoration */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-20">
        <div className="absolute top-2 right-2 w-3 h-3 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-pulse" />
        <div className="absolute top-4 right-6 w-2 h-2 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full animate-pulse delay-150" />
        <div className="absolute top-6 right-4 w-1.5 h-1.5 bg-gradient-to-br from-pink-400 to-red-500 rounded-full animate-pulse delay-300" />
      </div>
    </motion.div>
  )
}