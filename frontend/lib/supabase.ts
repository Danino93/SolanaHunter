/**
 * Supabase Client Setup
 * 
 * 📋 מה הקובץ הזה עושה:
 * -------------------
 * זה הקובץ שמגדיר את חיבור Supabase לדשבורד.
 * 
 * משתמש ב-Supabase Client כדי להתחבר למסד הנתונים
 * ולקבל נתונים בזמן אמת על טוקנים.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// בדיקה אם Supabase מוגדר
const isSupabaseConfigured = 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_URL !== '' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== ''

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase credentials not configured. Dashboard will use mock data.')
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  : null

export { isSupabaseConfigured }
