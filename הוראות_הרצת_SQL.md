# 🗄️ הוראות יצירת טבלת Performance Tracking ב-Supabase

## 📋 מה צריך לעשות:
יצירת טבלה חדשה ב-Supabase לשמירת נתונים על ביצועי הטוקנים

---

## 🔧 צעדים:

### 1. כניסה ל-Supabase Dashboard
- היכנס ל: https://app.supabase.com/
- בחר את הפרויקט שלך: **acyquhybesnmgsgxcmgc**

### 2. פתיחת SQL Editor
- בתפריט השמאלי, לחץ על **"SQL Editor"**
- לחץ על **"New query"**

### 3. הרצת הSQL
- העתק את כל התוכן מהקובץ `supabase_performance_table.sql`
- הדבק ב-SQL Editor
- לחץ על **"Run"** (או Ctrl+Enter)

### 4. אימות הצלחה
אתה אמור לראות:
```
performance_tracking table created successfully!
```

### 5. בדיקה נוספת (אופציונלי)
- עבור ל: **Table Editor**
- תראה טבלה חדשה בשם **"performance_tracking"**
- הטבלה תהיה ריקה (זה תקין!)

---

## ✅ אחרי שסיימת:
- [x] הטבלה נוצרה בהצלחה
- [x] אין שגיאות ב-SQL Editor
- [x] הטבלה מופיעה ב-Table Editor

---

## 🚨 אם יש בעיות:
- ודא שאתה מחובר לפרויקט הנכון
- ודא שיש לך הרשאות admin
- אם יש שגיאה - העתק אותה ותשלח לי

---

## 📊 מבנה הטבלה שנוצרה:
| שדה | סוג | תיאור |
|------|-----|--------|
| `address` | TEXT | כתובת הטוקן (מפתח ראשי) |
| `symbol` | TEXT | סימבול הטוקן |
| `entry_price` | FLOAT | מחיר בכניסה (USD) |
| `entry_time` | TIMESTAMP | זמן כניסה |
| `entry_score` | INTEGER | ציון הבוט (0-100) |
| `smart_wallets` | JSONB | רשימת Smart Wallets |
| `current_price` | FLOAT | מחיר נוכחי |
| `roi` | FLOAT | תשואה (%) |
| `status` | TEXT | סטטוס (ACTIVE/SUCCESS/FAILURE) |
| `exit_price` | FLOAT | מחיר יציאה |
| `exit_time` | TIMESTAMP | זמן יציאה |

**אחרי שתריץ את זה, אמור לי שהכל הצליח ונמשיך לבדיקות!** 🚀