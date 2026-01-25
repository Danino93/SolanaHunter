# ✅ רשימת בדיקה לפני Deploy

**תאריך:** 2026-01-25  
**סטטוס:** ✅ מוכן ל-Deploy

---

## ✅ **מה נבדק:**

- ✅ SQL הורצה בהצלחה ב-Supabase
- ✅ שדות חדשים נוספו לטבלה
- ✅ Backend מעודכן עם כל השדות החדשים
- ✅ Frontend משתמש ב-`scanned_tokens_history` (תוקן קודם)
- ✅ אין שגיאות linter
- ✅ הכל מסונכרן

---

## 🚀 **הוראות Deploy:**

### **1. Commit Backend:**

```bash
cd backend
git add database/supabase_client.py
git commit -m "feat: Add smart scanning with token age tracking and priority-based rescanning

- Add token_created_at, token_age_hours, last_scanned_at, next_scan_at, scan_priority, scan_count fields
- Implement smart rescanning logic based on token age and score
- Add get_tokens_to_rescan() and get_new_tokens() functions
- Calculate scan priority: new tokens (0-2h) with high score = priority 100
- Calculate next_scan_at: high priority = 5min, medium = 30min, low = 24h"
git push origin main
```

### **2. בדיקה אחרי Deploy:**

#### **בדוק בלוגים של Railway:**
```
✅ Saved token [SYMBOL] to scanned_tokens_history (status: 200)
```

#### **בדוק ב-Supabase:**
```sql
-- בדוק שטוקנים חדשים נשמרים עם כל השדות
SELECT 
    address, 
    symbol, 
    token_created_at, 
    token_age_hours, 
    last_scanned_at, 
    next_scan_at, 
    scan_priority,
    scan_count
FROM scanned_tokens_history 
ORDER BY first_seen DESC 
LIMIT 5;
```

#### **בדוק בדשבורד:**
- טוקנים חדשים מופיעים
- הנתונים מעודכנים
- אין שגיאות בקונסול

---

## 📋 **קבצים שעודכנו:**

### **Backend:**
- ✅ `backend/database/supabase_client.py` - הוספת שדות ופונקציות

### **Database:**
- ✅ `db/migration/003_smart_scanning_fields.sql` - הורצה ב-Supabase

### **תיעוד:**
- ✅ `SMART_SCANNING_IMPLEMENTATION.md` - מדריך מפורט
- ✅ `SUPABASE_CHANGES_SUMMARY.md` - סיכום קצר
- ✅ `DEPLOY_CHECKLIST.md` - מסמך זה

---

## 🎯 **מה אמור לקרות אחרי Deploy:**

1. ✅ טוקנים חדשים נשמרים עם `token_created_at`, `token_age_hours`, וכו'
2. ✅ `last_scanned_at` מתעדכן בכל סריקה
3. ✅ `next_scan_at` ו-`scan_priority` מחושבים אוטומטית
4. ✅ `scan_count` מתעדכן אוטומטית (ע"י trigger)
5. ✅ `token_age_hours` מחושב אוטומטית (ע"י trigger)

---

## ⚠️ **אם משהו לא עובד:**

1. **בדוק את הלוגים** - האם יש שגיאות?
2. **בדוק ב-Supabase** - האם השדות קיימים?
3. **בדוק את ה-triggers** - האם הם פעילים?
4. **בדוק את הקוד** - האם `save_token()` נקרא?

---

**✅ הכל מוכן - אפשר לעשות Deploy!**
