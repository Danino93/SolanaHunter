/**
 * TrendChart Component
 * Mini sparkline chart for showing trends
 */

'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface TrendChartProps {
  data: number[]
  trend?: 'up' | 'down' | 'neutral'
  height?: number
  width?: number
  strokeWidth?: number
  showArea?: boolean
}

export default function TrendChart({
  data,
  trend = 'neutral',
  height = 60,
  width = 120,
  strokeWidth = 2,
  showArea = true,
}: TrendChartProps) {
  const { pathD, areaD, min, max } = useMemo(() => {
    if (!data || data.length === 0) return { pathD: '', areaD: '', min: 0, max: 0 }
    
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return { x, y }
    })
    
    const pathD = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ')
    
    const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`
    
    return { pathD, areaD, min, max }
  }, [data, height, width])

  const colors = {
    up: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.2)' },
    down: { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.2)' },
    neutral: { stroke: '#6b7280', fill: 'rgba(107, 114, 128, 0.2)' },
  }

  const color = colors[trend]

  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded"
        style={{ width, height }}
      >
        <span className="text-xs text-gray-400">No data</span>
      </div>
    )
  }

  return (
    <motion.svg
      width={width}
      height={height}
      className="overflow-visible"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <defs>
        <linearGradient id={`gradient-${trend}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color.stroke} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color.stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Area Fill */}
      {showArea && (
        <motion.path
          d={areaD}
          fill={`url(#gradient-${trend})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      )}
      
      {/* Line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={color.stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />
    </motion.svg>
  )
}