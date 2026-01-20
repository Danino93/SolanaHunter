# 📋 הוראות התקנה - Supabase Database

## 🎯 מטרה

להכין את מסד הנתונים ב-Supabase לפרויקט SolanaHunter.

## 📝 שלבים

### שלב 1: הכנת Supabase

1. **היכנס ל-Supabase:**
   - לך ל-[https://app.supabase.com](https://app.supabase.com)
   - התחבר לחשבון שלך

2. **צור פרויקט חדש (אם אין):**
   - לחץ על "New Project"
   - בחר שם לפרויקט (למשל: "SolanaHunter")
   - בחר Region (מומלץ: קרוב אליך)
   - בחר Database Password (שמור אותו!)
   - לחץ "Create new project"

3. **המתן ליצירת הפרויקט:**
   - זה יכול לקחת 1-2 דקות
   - כשזה מסתיים, תראה את ה-Dashboard

### שלב 2: קבלת Credentials

1. **לך ל-Settings → API:**
   - בתפריט השמאלי, לחץ על "Settings" (⚙️)
   - לחץ על "API"

2. **העתק את הנתונים הבאים:**
   - **Project URL** - זה ה-`SUPABASE_URL`
   - **anon public key** - זה ה-`SUPABASE_KEY`
   - **service_role key** - זה ה-`SUPABASE_SERVICE_KEY` (⚠️ סודי!)

3. **שמור אותם:**
   - העתק אותם לקובץ `.env` שלך (אם עדיין לא)
   - או שמור אותם זמנית במחברת

### שלב 3: הרצת Migration

1. **פתח את SQL Editor:**
   - בתפריט השמאלי, לחץ על "SQL Editor"
   - לחץ על "New query"

2. **העתק את ה-SQL:**
   - פתח את הקובץ `001_initial_schema.sql`
   - העתק את כל התוכן (Ctrl+A, Ctrl+C)

3. **הדבק ב-SQL Editor:**
   - הדבק ב-SQL Editor (Ctrl+V)
   - ודא שהכל הודבק נכון

4. **הרץ את ה-SQL:**
   - לחץ על "Run" (או F5)
   - או לחץ על הכפתור "Run" בפינה הימנית העליונה

5. **בדוק את התוצאות:**
   - אם הכל עבד, תראה "Success. No rows returned"
   - אם יש שגיאות, תראה הודעת שגיאה

### שלב 4: בדיקת הטבלאות

1. **לך ל-Table Editor:**
   - בתפריט השמאלי, לחץ על "Table Editor"

2. **ודא שכל הטבלאות קיימות:**
   - ✅ `tokens`
   - ✅ `smart_wallets`
   - ✅ `trades`
   - ✅ `positions`
   - ✅ `alerts`
   - ✅ `watched_tokens`
   - ✅ `favorites`
   - ✅ `bot_stats`

3. **בדוק את המבנה:**
   - לחץ על כל טבלה
   - ודא שיש את כל העמודות

### שלב 5: עדכון .env

1. **פתח את `backend/.env`:**
   - או צור קובץ חדש אם אין

2. **הוסף את השורות הבאות:**
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **החלף את הערכים:**
   - `SUPABASE_URL` - מה-Project URL שהעתקת
   - `SUPABASE_KEY` - מה-anon public key
   - `SUPABASE_SERVICE_KEY` - מה-service_role key

### שלב 6: בדיקה

1. **הרץ את הבוט:**
   ```bash
   cd backend
   python main.py
   ```

2. **בדוק שהטבלאות מתמלאות:**
   - לך ל-Supabase Dashboard
   - לך ל-Table Editor → `tokens`
   - ודא שטוקנים נשמרים

## ✅ Checklist

- [ ] פרויקט Supabase נוצר
- [ ] Credentials הועתקו
- [ ] Migration הורצה בהצלחה
- [ ] כל הטבלאות קיימות
- [ ] `.env` עודכן עם Credentials
- [ ] הבוט רץ וטוקנים נשמרים

## 🆘 בעיות נפוצות

### "relation already exists"
**פתרון:** הטבלה כבר קיימת. אפשר למחוק אותה קודם:
```sql
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS smart_wallets CASCADE;
-- וכו' לכל הטבלאות
```

### "permission denied"
**פתרון:** ודא שאתה משתמש ב-service_role key, לא ב-anon key

### "extension uuid-ossp does not exist"
**פתרון:** זה אמור להיפתר אוטומטית. אם לא, הרץ:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## 📞 עזרה נוספת

אם יש בעיות:
1. בדוק את ה-logs ב-Supabase Dashboard
2. בדוק את ה-SQL Editor לראות שגיאות
3. ודא שה-`.env` מוגדר נכון
4. בדוק את ה-documentation של Supabase

---

**בהצלחה! 🚀**
