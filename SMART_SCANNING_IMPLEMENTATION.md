# ✅ יישום סריקה חכמה - Smart Scanning Implementation

**תאריך:** 2026-01-25  
**סטטוס:** ✅ הושלם  
**גרסה:** 1.0

---

## 📋 **סיכום השינויים**

הוספנו מערכת סריקה חכמה שמאפשרת:
1. ✅ מעקב אחרי גיל המטבע (מתי נוצר)
2. ✅ ניהול סריקות חכם (מתי לבדוק שוב)
3. ✅ עדיפויות סריקה (איזה טוקנים חשובים יותר)
4. ✅ חיסכון במשאבים (רק מה שצריך נסרק)

---

## 🔧 **שינויים בקוד**

### **1. `backend/database/supabase_client.py`**

#### **שינויים ב-`save_token()`:**

**הוספנו:**
- ✅ `token_created_at` - מתי המטבע נוצר (מ-`token.get("created_at")`)
- ✅ `token_age_hours` - גיל המטבע בשעות (מחושב אוטומטית)
- ✅ `last_scanned_at` - מתי הסריקה האחרונה (עכשיו)
- ✅ `next_scan_at` - מתי לבדוק שוב (חישוב חכם)
- ✅ `scan_priority` - עדיפות סריקה (0-100)

**לוגיקת חישוב `next_scan_at` ו-`scan_priority`:**

```python
# מטבעות חדשים מאוד (0-2 שעות) עם ציון גבוה
if token_age_hours < 2 and final_score >= 85:
    scan_priority = 100
    next_scan_at = now + 5 minutes

# מטבעות חדשים (2-24 שעות) עם ציון גבוה
elif token_age_hours < 24 and final_score >= 80:
    scan_priority = 70
    next_scan_at = now + 30 minutes

# מטבעות עם ציון בינוני
elif final_score >= 60:
    scan_priority = 40
    next_scan_at = now + 2 hours

# מטבעות ישנים או ציון נמוך
else:
    scan_priority = 10
    next_scan_at = now + 24 hours
```

#### **פונקציות חדשות:**

**`get_tokens_to_rescan(limit=50)`**
- מחזיר טוקנים שצריך לבדוק שוב (`next_scan_at <= now`)
- ממוין לפי `scan_priority` (גבוה יותר = קודם)
- חוסך משאבים - רק מה שצריך נסרק

**`get_new_tokens(max_age_hours=48, limit=100)`**
- מחזיר רק מטבעות חדשים (גיל < 48 שעות)
- ממוין לפי תאריך יצירה + עדיפות

---

## 🗄️ **שינויים ב-Supabase Database**

### **שדות חדשים ב-`scanned_tokens_history`:**

| שדה | סוג | תיאור |
|-----|-----|-------|
| `token_created_at` | TIMESTAMP WITH TIME ZONE | מתי המטבע נוצר בפועל |
| `token_age_hours` | INTEGER | גיל המטבע בשעות (מחושב אוטומטית) |
| `last_scanned_at` | TIMESTAMP WITH TIME ZONE | מתי הסריקה האחרונה |
| `next_scan_at` | TIMESTAMP WITH TIME ZONE | מתי לבדוק שוב |
| `scan_priority` | INTEGER | עדיפות סריקה (0-100) |
| `scan_count` | INTEGER | מספר פעמים שנסרק |

### **Indexes חדשים:**

1. **`idx_scanned_tokens_next_scan`** - לסריקה חכמה
2. **`idx_scanned_tokens_scan_priority`** - למיון לפי עדיפות
3. **`idx_scanned_tokens_created_at`** - לטוקנים חדשים
4. **`idx_scanned_tokens_age_hours`** - לחיפוש לפי גיל
5. **`idx_scanned_tokens_last_scanned`** - לבדיקת תדירות

### **Triggers חדשים:**

1. **`trigger_update_scan_count`** - מעדכן `scan_count` אוטומטית בעדכון
2. **`trigger_calculate_token_age`** - מחשב `token_age_hours` אוטומטית

---

## 📝 **SQL שצריך להריץ ב-Supabase**

### **קובץ SQL:**
📁 `db/migration/003_smart_scanning_fields.sql`

### **איך להריץ:**

#### **אפשרות 1: דרך Supabase Dashboard**
1. לך ל-Supabase Dashboard → SQL Editor
2. העתק את כל התוכן מ-`003_smart_scanning_fields.sql`
3. הדבק ב-SQL Editor
4. לחץ "Run"

#### **אפשרות 2: דרך psql (אם יש לך גישה)**
```bash
psql -h [your-supabase-host] -U postgres -d postgres -f db/migration/003_smart_scanning_fields.sql
```

### **מה ה-SQL עושה:**

1. ✅ מוסיף 6 שדות חדשים לטבלה
2. ✅ יוצר 5 indexes לביצועים טובים
3. ✅ יוצר 2 triggers לעדכונים אוטומטיים
4. ✅ מעדכן נתונים קיימים (אם יש)
5. ✅ מוסיף הערות לתיעוד

---

## 🚀 **איך להשתמש במערכת החדשה**

### **1. סריקת טוקנים חדשים:**

```python
# בקוד ה-scan loop
tokens = await self.scanner.discover_new_tokens(hours=24)

for token in tokens:
    # הניתוח הרגיל...
    
    # שמירה - עכשיו כוללת את כל השדות החדשים!
    await self.supabase.save_token(token)
```

**מה קורה:**
- ✅ `token_created_at` נשמר מ-`token["created_at"]`
- ✅ `token_age_hours` מחושב אוטומטית
- ✅ `last_scanned_at` = עכשיו
- ✅ `next_scan_at` ו-`scan_priority` מחושבים לפי ציון וגיל

### **2. סריקה חכמה - רק מה שצריך:**

```python
# במקום לסרוק הכל, סרוק רק מה שצריך
tokens_to_rescan = await self.supabase.get_tokens_to_rescan(limit=50)

for token in tokens_to_rescan:
    # עדכן את הטוקן
    # ...
    await self.supabase.save_token(token)  # next_scan_at יתעדכן
```

**יתרונות:**
- ⚡ חיסכון במשאבים - רק טוקנים שצריך
- ⚡ עדיפות חכמה - טוקנים חשובים קודם
- ⚡ עדכון תכוף יותר לטוקנים עם ציון גבוה

### **3. קבלת טוקנים חדשים בלבד:**

```python
# רק מטבעות חדשים (גיל < 48 שעות)
new_tokens = await self.supabase.get_new_tokens(max_age_hours=48, limit=100)
```

---

## 📊 **דוגמאות לשימוש**

### **דוגמה 1: סריקה משולבת (חדשים + עדכונים)**

```python
async def smart_scan_loop(self):
    """סריקה חכמה - חדשים + עדכונים"""
    
    # 1. טוקנים חדשים (תמיד)
    new_tokens = await self.scanner.discover_new_tokens(hours=48)
    
    # 2. טוקנים שצריך לבדוק שוב
    tokens_to_rescan = await self.supabase.get_tokens_to_rescan(limit=50)
    
    # 3. שלב את הכל
    all_tokens = new_tokens + tokens_to_rescan
    
    # 4. ניתוח
    for token in all_tokens:
        # ... ניתוח ...
        await self.supabase.save_token(token)
```

### **דוגמה 2: עדכון עדיפויות לפי ביצועים**

```python
# אם טוקן הצליח (ROI > 50%), העלה עדיפות
if tracked_token.roi > 50:
    # עדכן את הטוקן עם עדיפות גבוהה יותר
    token["scan_priority"] = 90
    token["next_scan_at"] = (now + timedelta(minutes=15)).isoformat()
    await self.supabase.save_token(token)
```

---

## ✅ **בדיקות**

### **לאחר הרצת ה-SQL:**

1. **בדוק שהשדות נוספו:**
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

2. **בדוק שה-indexes נוצרו:**
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'scanned_tokens_history' 
AND indexname LIKE 'idx_scanned_tokens%';
```

3. **בדוק שה-triggers עובדים:**
```sql
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'scanned_tokens_history';
```

---

## 📈 **תוצאות צפויות**

### **לפני:**
- ❌ כל טוקן נסרק כל פעם (בזבוז)
- ❌ אין מעקב אחרי גיל המטבע
- ❌ אין עדיפויות - הכל שווה

### **אחרי:**
- ✅ סריקה חכמה - רק מה שצריך
- ✅ מעקב אחרי גיל - מטבעות חדשים קודם
- ✅ עדיפויות - טוקנים חשובים יותר נסרקים תכוף יותר
- ✅ חיסכון במשאבים - פחות סריקות מיותרות

---

## 🔄 **תהליך העדכון**

### **שלב 1: הרצת SQL**
```bash
# העתק את db/migration/003_smart_scanning_fields.sql
# והרץ ב-Supabase Dashboard → SQL Editor
```

### **שלב 2: Deploy Backend**
```bash
cd backend
git add database/supabase_client.py
git commit -m "feat: Add smart scanning fields and logic"
git push origin main
```

### **שלב 3: בדיקה**
- בדוק שהטוקנים החדשים נשמרים עם כל השדות
- בדוק ש-`get_tokens_to_rescan()` מחזיר טוקנים
- בדוק שה-triggers עובדים

---

## 📚 **קבצים שנוצרו/שונו**

### **קבצים חדשים:**
- ✅ `db/migration/003_smart_scanning_fields.sql` - SQL migration
- ✅ `SMART_SCANNING_IMPLEMENTATION.md` - מסמך זה

### **קבצים שעודכנו:**
- ✅ `backend/database/supabase_client.py` - הוספת שדות ופונקציות

---

## 🎯 **סיכום**

✅ **הושלם:**
- הוספת שדות חדשים ל-`save_token()`
- חישוב חכם של `next_scan_at` ו-`scan_priority`
- פונקציות חדשות: `get_tokens_to_rescan()`, `get_new_tokens()`
- SQL migration מלא עם indexes ו-triggers

📋 **מה צריך לעשות:**
1. להריץ את ה-SQL ב-Supabase (קובץ: `db/migration/003_smart_scanning_fields.sql`)
2. לעשות deploy ל-Backend
3. לבדוק שהכל עובד

🚀 **התוצאה:** מערכת סריקה חכמה שמשתמשת במשאבים בצורה יעילה יותר!
