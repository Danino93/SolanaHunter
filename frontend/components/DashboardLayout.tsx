/**
 * Dashboard Layout Component
 * 
 * 📋 מה הקומפוננטה הזו עושה:
 * -------------------
 * Layout משותף לכל הדפים בדשבורד - כולל Sidebar ו-Header.
 * 
 * תכונות:
 * - Sidebar קבועה בצד
 * - Content area מותאם
 * - Responsive design
 * - עיצוב מרהיב
 */

'use client'

import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 mr-0 md:mr-64 overflow-y-auto">
        <div className="min-h-screen">
          {children}
        </div>
      </div>
    </div>
  )
}
