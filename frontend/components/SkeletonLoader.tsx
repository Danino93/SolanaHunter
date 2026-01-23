/**
 * Skeleton Loader Component
 * 
 * 📋 מה הקומפוננטה הזו עושה:
 * -------------------
 * Skeleton screens יפים במקום spinners - UX טוב יותר!
 * 
 * תכונות:
 * - Skeleton למטבלה
 * - Skeleton לכרטיסים
 * - Skeleton לסטטיסטיקות
 * - Animations חלקות
 */

'use client'

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse"
        >
          <div className="w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          </div>
          <div className="w-20 h-8 bg-slate-300 dark:bg-slate-700 rounded" />
          <div className="w-16 h-8 bg-slate-300 dark:bg-slate-700 rounded" />
          <div className="w-24 h-8 bg-slate-300 dark:bg-slate-700 rounded" />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700 shadow-xl animate-pulse">
      <div className="space-y-4">
        <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-1/3" />
        <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded w-1/2" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      </div>
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/50 dark:border-slate-700 shadow-xl animate-pulse"
        >
          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/2 mb-4" />
          <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="space-y-2">
            <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-24" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-16" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded w-24" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-32" />
      </td>
      <td className="px-6 py-4">
        <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded w-20" />
      </td>
    </tr>
  )
}
