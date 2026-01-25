# 📋 סיכום שינויים ב-Supabase - מה צריך להוסיף

**תאריך:** 2026-01-25  
**גרסה:** 1.0

---

## 🎯 **מה צריך להוסיף ב-Supabase**

### **1. שדות חדשים לטבלת `scanned_tokens_history`:**

| שם שדה | סוג | תיאור | Default |
|---------|-----|-------|---------|
| `token_created_at` | TIMESTAMP WITH TIME ZONE | מתי המטבע נוצר בפועל | NULL |
| `token_age_hours` | INTEGER | גיל המטבע בשעות | NULL |
| `last_scanned_at` | TIMESTAMP WITH TIME ZONE | מתי הסריקה האחרונה | NULL |
| `next_scan_at` | TIMESTAMP WITH TIME ZONE | מתי לבדוק שוב | NULL |
| `scan_priority` | INTEGER | עדיפות סריקה (0-100) | 0 |
| `scan_count` | INTEGER | מספר פעמים שנסרק | 1 |

### **2. Indexes חדשים:**

1. `idx_scanned_tokens_next_scan` - לסריקה חכמה
2. `idx_scanned_tokens_scan_priority` - למיון לפי עדיפות
3. `idx_scanned_tokens_created_at` - לטוקנים חדשים
4. `idx_scanned_tokens_age_hours` - לחיפוש לפי גיל
5. `idx_scanned_tokens_last_scanned` - לבדיקת תדירות

### **3. Triggers חדשים:**

1. `trigger_update_scan_count` - מעדכן `scan_count` אוטומטית
2. `trigger_calculate_token_age` - מחשב `token_age_hours` אוטומטית

---

## 📄 **SQL שצריך להריץ**

### **קובץ SQL:**
📁 `db/migration/003_smart_scanning_fields.sql`

### **איך להריץ:**

1. **פתח Supabase Dashboard**
2. **לך ל-SQL Editor**
3. **העתק את כל התוכן** מ-`db/migration/003_smart_scanning_fields.sql`
4. **הדבק ב-SQL Editor**
5. **לחץ "Run"**

### **או דרך psql:**
```bash
psql -h [your-supabase-host] -U postgres -d postgres -f db/migration/003_smart_scanning_fields.sql
```

---

## ✅ **בדיקה שהכל עבד**

### **בדוק שהשדות נוספו:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'scanned_tokens_history' 
AND column_name IN (
    'token_created_at', 
    'token_age_hours', 
    'last_scanned_at', 
    'next_scan_at', 
    'scan_priority', 
    'scan_count'
);
```

**צריך לראות 6 שורות.**

### **בדוק שה-indexes נוצרו:**
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'scanned_tokens_history' 
AND indexname LIKE 'idx_scanned_tokens%';
```

**צריך לראות 5 indexes.**

### **בדוק שה-triggers עובדים:**
```sql
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'scanned_tokens_history';
```

**צריך לראות 2 triggers.**

---

## 📝 **הערות חשובות**

1. ✅ ה-SQL בטוח להריץ - לא ימחק נתונים קיימים
2. ✅ ה-SQL מעדכן נתונים קיימים (אם יש)
3. ✅ ה-triggers יעבדו אוטומטית אחרי ההרצה
4. ✅ אין צורך ב-backup (אבל תמיד מומלץ)

---

## 🚀 **אחרי הרצת ה-SQL**

1. ✅ Deploy את ה-Backend (הקוד כבר מוכן)
2. ✅ בדוק שהטוקנים החדשים נשמרים עם כל השדות
3. ✅ בדוק ש-`get_tokens_to_rescan()` מחזיר טוקנים

---

**📚 לפרטים נוספים:** ראה `SMART_SCANNING_IMPLEMENTATION.md`
