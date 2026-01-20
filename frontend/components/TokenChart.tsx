/**
 * Token Price Chart Component
 * 
 * 📋 מה הקומפוננטה הזו עושה:
 * -------------------
 * מציגה mini chart של מחיר הטוקן (mock data כרגע).
 * 
 * בעתיד, זה יחבר ל-API אמיתי כמו DexScreener או Birdeye
 * כדי להציג מחירים אמיתיים.
 */

'use client'

import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

interface TokenChartProps {
  tokenAddress: string
  symbol: string
  className?: string
}

// Mock price data - בעתיד זה יבוא מ-API
const generateMockData = (): Array<{ time: string; price: number }> => {
  const data = []
  const basePrice = 0.001 + Math.random() * 0.01
  let currentPrice = basePrice
  
  for (let i = 23; i >= 0; i--) {
    // Simulate price movement
    const change = (Math.random() - 0.5) * 0.3
    currentPrice = Math.max(0.0001, currentPrice * (1 + change))
    
    data.push({
      time: `${i}h`,
      price: currentPrice,
    })
  }
  
  return data
}

export default function TokenChart({ tokenAddress, symbol, className = '' }: TokenChartProps) {
  const data = generateMockData()
  const currentPrice = data[data.length - 1].price
  const previousPrice = data[0].price
  const change = ((currentPrice - previousPrice) / previousPrice) * 100
  const isPositive = change >= 0

  return (
    <div className={`relative ${className}`}>
      <ResponsiveContainer width="100%" height={40}>
        <LineChart data={data}>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
                    <p className="text-slate-300">{payload[0].payload.time}</p>
                    <p className="text-white font-semibold">
                      ${(payload[0].value as number).toFixed(6)}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={isPositive ? '#10b981' : '#ef4444'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="absolute top-0 right-0 text-xs font-semibold">
        <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}
