# 📊 ניתוח מקורות הנתונים לדשבורד - Data Sources Analysis

**תאריך:** 2026-01-25  
**סטטוס:** ✅ זרימת הנתונים מזוהה ומתועדת

---

## 🔍 **סיכום מקורות הנתונים:**

הדשבורד שלך מקבל נתונים מ-**2 מקורות עיקריים**, בסדר עדיפות:

### **1. 🚀 Backend API (Railway) - מקור ראשי**

**מיקום בקוד:**
- **קובץ:** `frontend/lib/api.ts` (שורה 15)
- **פונקציה:** `getTokens()` (שורה 106-120)
- **קריאה:** `frontend/app/page.tsx` (שורה 188)

**פרטים:**
- **כתובת:** `https://solanahunter-production.up.railway.app`
- **Endpoint:** `/api/tokens?limit=50`
- **מקור:** משתנה סביבה `NEXT_PUBLIC_API_URL` (מוגדר ב-`frontend/.env`)
- **סטטוס:** ⚠️ כרגע נכשל עם שגיאת 500 (Internal Server Error)

**איך זה עובד:**
```typescript
// frontend/app/page.tsx - שורה 181-227
const loadData = async () => {
  // 1. מנסה לטעון מ-Backend API קודם
  const { data: apiTokens, error: apiError } = await getTokens({ limit: 50 })
  
  if (!apiError && apiTokens?.tokens && apiTokens.tokens.length > 0) {
    // ✅ הצליח - משתמש בנתונים מה-API
    setTokens(convertedTokens)
    return
  }
  
  // 2. אם נכשל, עובר ל-Supabase (fallback)
  // ...
}
```

**מה הנתונים כוללים:**
- `address` - כתובת הטוקן
- `symbol` - סמל הטוקן
- `name` - שם הטוקן
- `final_score` / `score` - ציון סופי
- `safety_score` - ציון בטיחות
- `holder_score` - ציון מחזיקים
- `smart_money_score` - ציון כסף חכם
- `grade` - דרגה (A, B, C, וכו')
- `category` - קטגוריה
- `holder_count` - מספר מחזיקים
- `last_analyzed_at` - תאריך ניתוח אחרון

---

### **2. 💾 Supabase Database - Fallback**

**מיקום בקוד:**
- **קובץ:** `frontend/lib/supabase.ts` (שורה 14-36)
- **קריאה:** `frontend/app/page.tsx` (שורה 230-273)

**פרטים:**
- **כתובת:** `https://acyquhybesnmgsgxcmgc.supabase.co`
- **טבלה:** `scanned_tokens_history`
- **מקור:** משתני סביבה:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **סטטוס:** ✅ עובד (משמש כ-fallback)

**איך זה עובד:**
```typescript
// frontend/app/page.tsx - שורה 230-273
// Fallback to Supabase (only if API failed)
if (isSupabaseConfigured && supabase) {
  const { data: realTokens, error } = await supabase
    .from('scanned_tokens_history')  // ✅ טבלה זו!
    .select('*')
    .order('final_score', { ascending: false })
    .limit(50)
  
  if (!error && realTokens && realTokens.length > 0) {
    // ✅ הצליח - משתמש בנתונים מ-Supabase
    setTokens(convertedTokens)
    return
  }
}
```

**מה הנתונים כוללים:**
- אותם שדות כמו מה-API
- נתונים נשמרים ע"י ה-Backend כשהוא סורק טוקנים חדשים

---

### **3. 🔄 Real-time Updates (אופציונלי - לא עובד כרגע)**

**מיקום בקוד:**
- **קובץ:** `frontend/app/page.tsx` (שורה 143-178)

**פרטים:**
- **מטרה:** עדכונים בזמן אמת כשטוקנים חדשים נסרקים
- **טבלה:** `tokens` (לא `scanned_tokens_history`)
- **סטטוס:** ❌ לא עובד (שגיאות WebSocket)

**איך זה אמור לעבוד:**
```typescript
// frontend/app/page.tsx - שורה 143-178
const channel = supabase
  .channel('dashboard-updates')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'tokens' },
    (payload) => {
      console.log('🔄 עדכון טוקן:', payload)
      loadData() // רענון אוטומטי
    }
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('✅ Supabase real-time connected')
    }
  })
```

**למה זה לא עובד:**
- שגיאות WebSocket connection
- יכול להיות בעיית רשת, firewall, או Supabase project לא פעיל
- **זה לא קריטי** - האפליקציה עובדת גם בלי זה

---

## 📋 **סדר עדיפות טעינת נתונים:**

```
1. 🥇 Backend API (Railway)
   └─> https://solanahunter-production.up.railway.app/api/tokens
       └─> אם נכשל ↓
       
2. 🥈 Supabase Database
   └─> scanned_tokens_history table
       └─> אם נכשל ↓
       
3. 🥉 Empty State
   └─> מציג "אין נתונים זמינים"
```

---

## 🔧 **הגדרות Environment Variables:**

### **Frontend (`frontend/.env`):**
```env
# Backend API
NEXT_PUBLIC_API_URL=https://solanahunter-production.up.railway.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://acyquhybesnmgsgxcmgc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Backend (`backend/.env`):**
```env
# Supabase (לשמירת נתונים)
SUPABASE_URL=https://acyquhybesnmgsgxcmgc.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚠️ **בעיות נוכחיות:**

### **1. Backend API Error 500:**
```
GET https://solanahunter-production.up.railway.app/api/tokens?limit=50
500 (Internal Server Error)
```

**למה זה קורה:**
- שגיאת שרת פנימית ב-Backend
- יכול להיות בעיה ב-database connection, query, או logic

**מה לעשות:**
1. בדוק את לוגי ה-Backend ב-Railway
2. ודא שה-Backend רץ ופעיל
3. בדוק את ה-database connection

**השפעה:**
- ✅ האפליקציה עדיין עובדת (משתמשת ב-Supabase fallback)
- ⚠️ אבל הנתונים יכולים להיות לא מעודכנים

---

### **2. Supabase Real-time לא עובד:**
```
WebSocket connection to 'wss://acyquhybesnmgsgxcmgc.supabase.co/realtime/v1/websocket' failed
```

**למה זה קורה:**
- בעיית רשת או Supabase real-time לא מופעל
- **זה לא קריטי** - האפליקציה עובדת גם בלי זה

**השפעה:**
- ❌ אין עדכונים אוטומטיים בזמן אמת
- ✅ אבל הנתונים נטענים בהצלחה מ-Supabase REST API

---

## ✅ **מה עובד:**

1. ✅ **Supabase Fallback** - עובד מצוין
2. ✅ **טעינת נתונים ראשונית** - עובדת
3. ✅ **הצגת נתונים בדשבורד** - עובדת
4. ✅ **רענון ידני** - עובד (כפתור "רענן")

---

## 📝 **המלצות:**

### **לתיקון מיידי:**
1. **תקן את שגיאת 500 ב-Backend API:**
   - בדוק את לוגי Railway
   - ודא שה-database connection תקין
   - בדוק את ה-API endpoint `/api/tokens`

### **לשיפור עתידי:**
1. **הפעל Supabase Real-time:**
   - בדוק את הגדרות Supabase project
   - ודא ש-real-time מופעל לטבלת `tokens`
   - זה יאפשר עדכונים אוטומטיים בדשבורד

2. **הוסף Error Handling טוב יותר:**
   - הצג הודעות שגיאה ברורות למשתמש
   - הוסף retry logic
   - הוסף loading states טובים יותר

---

## 🗺️ **מפת זרימת הנתונים:**

```
┌─────────────────────────────────────────────────────────┐
│                    Dashboard (Frontend)                 │
│                  frontend/app/page.tsx                  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ loadData()
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│  Backend API     │              │   Supabase DB    │
│  (Railway)       │              │  (Fallback)      │
│                  │              │                  │
│  /api/tokens     │              │  scanned_tokens  │
│  ❌ Error 500     │              │  _history        │
│                  │              │  ✅ Working      │
└──────────────────┘              └──────────────────┘
        │                                   │
        │                                   │
        └─────────────────┬─────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Token Data Array    │
              │   (50 tokens)         │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Dashboard Display   │
              │   (Cards, Tables,     │
              │    Charts, etc.)      │
              └───────────────────────┘
```

---

## 📚 **קבצים רלוונטיים:**

### **Frontend:**
- `frontend/app/page.tsx` - הדשבורד הראשי (טעינת נתונים)
- `frontend/lib/api.ts` - API client (קריאות ל-Backend)
- `frontend/lib/supabase.ts` - Supabase client (קריאות ל-DB)
- `frontend/.env` - משתני סביבה

### **Backend:**
- `backend/api/main.py` - API endpoints
- `backend/scanner/token_scanner.py` - סריקת טוקנים
- `backend/database/supabase_client.py` - שמירה ל-Supabase
- `backend/.env` - משתני סביבה

---

**סיכום:** הדשבורד שלך משתמש ב-**Backend API** כמקור ראשי, ו-**Supabase** כ-fallback. 

**⚠️ בעיה שזוהתה ותוקנה:** הבאקנד שמר ל-`tokens` אבל הדשבורד קרא מ-`scanned_tokens_history` - זה גרם לנתונים לא מסונכרנים!

**✅ תיקון:** עכשיו הכל משתמש ב-`scanned_tokens_history` - ראה `SYNC_FIX.md` לפרטים.

**📌 הערה:** אם עדיין יש שגיאת 500 ב-API, הנתונים יגיעו מ-Supabase fallback, אבל עכשיו הם מסונכרנים!
