/**
 * Simple Authentication System
 * 
 * 📋 מה הקובץ הזה עושה:
 * -------------------
 * מערכת אימות פשוטה עם username וסיסמה.
 * 
 * ⚠️ הערה: זה לא production-grade auth! זה רק למטרות הגנה בסיסית.
 * לפרויקט אמיתי, השתמש ב-Supabase Auth או NextAuth.
 */

const VALID_CREDENTIALS = {
  username: 'danino93',
  password: 'DANINO151548e1d',
}

export function validateCredentials(username: string, password: string): boolean {
  return username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password
}

export function setAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('solanahunter_auth', 'authenticated')
  }
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('solanahunter_auth')
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('solanahunter_auth') === 'authenticated'
}
