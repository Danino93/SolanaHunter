/**
 * Theme Toggle Component
 * 
 * 📋 מה הקומפוננטה הזו עושה:
 * -------------------
 * כפתור להחלפה בין light/dark mode.
 * 
 * תכונות:
 * - Toggle בין light/dark
 * - שמירת העדפה ב-localStorage
 * - Icons יפים (Sun/Moon)
 * - Smooth transition
 */

'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // בדוק את ה-preference הנוכחי
    const darkMode = document.documentElement.classList.contains('dark') ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(darkMode)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    
    if (newIsDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
      title={isDark ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
    >
      {isDark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  )
}
