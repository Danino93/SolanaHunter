# 📊 SolanaHunter Database Migration

## 📋 מה זה?

זה התיקייה שמכילה את כל ה-migrations למסד הנתונים של SolanaHunter.

## 🗂️ קבצים

- `001_initial_schema.sql` - ה-migration הראשוני - יוצר את כל הטבלאות

## 🚀 איך להשתמש?

### שלב 1: הכנה

1. פתח את [Supabase Dashboard](https://app.supabase.com)
2. בחר את הפרויקט שלך
3. לך ל-**SQL Editor** (בתפריט השמאלי)

### שלב 2: הרצת Migration

1. פתח את הקובץ `001_initial_schema.sql`
2. העתק את **כל התוכן** (Ctrl+A, Ctrl+C)
3. הדבק ב-SQL Editor של Supabase
4. לחץ על **Run** (או F5)

### שלב 3: בדיקה

1. לך ל-**Table Editor** ב-Supabase
2. ודא שכל הטבלאות הבאות קיימות:
   - ✅ `tokens`
   - ✅ `smart_wallets`
   - ✅ `trades`
   - ✅ `positions`
   - ✅ `alerts`
   - ✅ `watched_tokens`
   - ✅ `favorites`
   - ✅ `bot_stats`

## 📊 טבלאות שנוצרות

### 1. **tokens** - טבלה ראשית
שמירת כל הטוקנים שנסרקו ונותחו

**עמודות עיקריות:**
- `address` - כתובת הטוקן (UNIQUE)
- `symbol`, `name` - שם הטוקן
- `final_score`, `safety_score`, `holder_score` - ציונים
- `ownership_renounced`, `liquidity_locked` - בדיקות בטיחות
- `holder_count`, `smart_money_count` - ניתוח מחזיקים

### 2. **smart_wallets** - ארנקים חכמים
שמירת ארנקים שזוהו כ-Smart Money

**עמודות עיקריות:**
- `wallet_address` - כתובת הארנק (PRIMARY KEY)
- `total_trades`, `profitable_trades` - סטטיסטיקות
- `success_rate`, `avg_profit_pct` - ביצועים

### 3. **trades** - טרנזקציות
שמירת כל הקניות והמכירות

**עמודות עיקריות:**
- `type` - 'buy' או 'sell'
- `amount_usd`, `amount_tokens`, `price` - פרטי הטרנזקציה
- `tx_signature` - חתימת הטרנזקציה (UNIQUE)
- `profit_usd`, `profit_pct` - רווח/הפסד (למכירות)

### 4. **positions** - פוזיציות פעילות
שמירת פוזיציות פתוחות

**עמודות עיקריות:**
- `token_address`, `token_symbol` - פרטי הטוקן
- `amount_tokens`, `entry_price` - פרטי הכניסה
- `stop_loss_price`, `take_profit_1_price`, `take_profit_2_price` - יעדי יציאה
- `status` - 'open', 'closed', 'stop_loss', וכו'
- `unrealized_pnl_usd`, `unrealized_pnl_pct` - P&L לא ממומש

### 5. **alerts** - התראות
שמירת כל ההתראות שנשלחו

**עמודות עיקריות:**
- `type` - סוג ההתראה ('high_score', 'stop_loss', וכו')
- `token_address`, `message` - פרטי ההתראה
- `sent_at`, `sent_via` - מתי ואיך נשלחה
- `user_action` - מה המשתמש עשה ('buy', 'ignore', וכו')

### 6. **watched_tokens** - טוקנים במעקב
טוקנים שהמשתמש עוקב אחריהם

### 7. **favorites** - מועדפים
טוקנים שהמשתמש סימן כמועדפים

### 8. **bot_stats** - סטטיסטיקות
סטטיסטיקות יומיות של הבוט

## 🔍 Views שנוצרות

### 1. **active_positions_view**
מציג את כל הפוזיציות הפעילות עם P&L מעודכן

### 2. **top_tokens_view**
מציג את הטופ 100 טוקנים לפי ציון

### 3. **trade_performance_view**
סיכום ביצועים לפי טוקן

## ⚠️ הערות חשובות

1. **אם יש טבלאות קיימות:**
   - אם כבר יש לך טבלאות עם שמות דומים, ייתכן שתצטרך למחוק אותן קודם
   - או לשנות את השמות בטבלאות הקיימות

2. **Foreign Keys:**
   - הטבלאות מחוברות ביניהן עם Foreign Keys
   - אם תמחק טוקן מ-`tokens`, זה ישפיע על `trades` ו-`positions`

3. **Indexes:**
   - כל הטבלאות עם indexes למהירות
   - זה יעזור לשאילתות להיות מהירות יותר

4. **JSONB:**
   - עמודות `metadata` הן מסוג JSONB
   - זה מאפשר שמירת נתונים גמישים

## 🔧 Troubleshooting

### שגיאה: "relation already exists"
**פתרון:** הטבלה כבר קיימת. אפשר:
- למחוק את הטבלה קודם: `DROP TABLE IF EXISTS tokens CASCADE;`
- או להשתמש ב-`CREATE TABLE IF NOT EXISTS` (כבר קיים בקוד)

### שגיאה: "permission denied"
**פתרון:** ודא שיש לך הרשאות ליצור טבלאות ב-Supabase

### שגיאה: "extension uuid-ossp does not exist"
**פתרון:** זה אמור להיפתר אוטומטית עם `CREATE EXTENSION IF NOT EXISTS`

## 📝 מה הלאה?

לאחר שהרצת את ה-migration:

1. ✅ ודא שכל הטבלאות נוצרו
2. ✅ בדוק את ה-indexes
3. ✅ בדוק את ה-views
4. ✅ עדכן את ה-`.env` עם `SUPABASE_URL` ו-`SUPABASE_KEY`
5. ✅ הרץ את הבוט ובדוק שטוקנים נשמרים

## 🆘 עזרה

אם יש בעיות:
1. בדוק את ה-logs ב-Supabase Dashboard
2. בדוק את ה-SQL Editor לראות שגיאות
3. ודא שה-`.env` מוגדר נכון

---

**מוכן לשימוש! 🚀**
