/**
 * Sidebar Navigation Component
 * 
 * 📋 מה הקומפוננטה הזו עושה:
 * -------------------
 * Sidebar לניווט בין כל הדפים בדשבורד.
 * 
 * תכונות:
 * - ניווט בין דפים (Dashboard, Portfolio, Trading, Analytics, Bot Control, Settings)
 * - אינדיקטור של דף פעיל
 * - Icons יפים לכל דף
 * - Responsive (מתקפל במובייל)
 * - עיצוב מרהיב עם gradients
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  BarChart3,
  Bot,
  Settings,
  Sparkles,
  LogOut
} from 'lucide-react'
import { clearAuthToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import ThemeToggle from './ThemeToggle'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  badge?: number
}

const navigation: NavItem[] = [
  { name: 'דשבורד', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'תיק השקעות', href: '/portfolio', icon: <Wallet className="w-5 h-5" /> },
  { name: 'מסחר', href: '/trading', icon: <TrendingUp className="w-5 h-5" /> },
  { name: 'אנליטיקה', href: '/analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { name: 'ניהול בוט', href: '/bot', icon: <Bot className="w-5 h-5" /> },
  { name: 'הגדרות', href: '/settings', icon: <Settings className="w-5 h-5" /> },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = () => {
    clearAuthToken()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 right-4 z-50 md:hidden p-2 rounded-lg bg-slate-800 text-white shadow-lg"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed right-0 top-0 h-full w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-l border-slate-700/50 shadow-2xl z-40 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
      >
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              SolanaHunter
            </h1>
            <p className="text-xs text-slate-400">מרכז בקרה</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg'
                    : 'hover:bg-slate-700/50 border border-transparent'
                }
              `}
            >
              <div
                className={`
                  transition-colors duration-200
                  ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}
                `}
              >
                {item.icon}
              </div>
              <span
                className={`
                  font-medium transition-colors duration-200
                  ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}
                `}
              >
                {item.name}
              </span>
              {item.badge && (
                <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500 text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50 space-y-2">
        <div className="flex items-center justify-center mb-2">
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">התנתק</span>
        </button>
      </div>
    </div>
    </>
  )
}
