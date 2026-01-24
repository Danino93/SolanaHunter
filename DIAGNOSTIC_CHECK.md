# 🔍 בדיקת אבחון - מה באמת קורה?

**תאריך:** 2026-01-24  
**מטרה:** להבין מה הבעיה האמיתית לפני תיקונים

---

## 📊 **מה צריך לבדוק:**

### **1. האם הבוט שומר טוקנים ב-Supabase?**

**איפה לבדוק:**
- Railway Logs → חפש: `✅ Saved token SYMBOL to database`
- Supabase Dashboard → Table Editor → `tokens` → בדוק אם יש טוקנים

**מה הקוד עושה:**
```python
# backend/main.py - שורה 347-357
if self.supabase and self.supabase.enabled:
    async with self.supabase:
        saved = await self.supabase.save_token(token)
        if saved:
            logger.debug(f"✅ Saved {token['symbol']} to database")
```

**איך לבדוק:**
1. לך ל-Railway → Logs
2. חפש: `Saved.*to database`
3. אם אתה רואה הודעות כאלה → הבוט שומר! ✅
4. אם לא → יש בעיה עם Supabase configuration

---

### **2. האם ה-API קורא מ-Supabase?**

**איפה לבדוק:**
- Railway Logs → חפש שגיאות ב-`/api/tokens`
- נסה: `https://solanahunter-production.up.railway.app/api/tokens?limit=10`
- בדוק אם מחזיר נתונים

**מה הקוד עושה:**
```python
# backend/api/routes/tokens.py - שורה 33-50
supabase = get_supabase_client()
if not supabase.enabled:
    return {"tokens": [], "total": 0}

async with supabase:
    tokens = await supabase.get_tokens(limit=limit, min_score=min_score)
    return {"tokens": tokens, "total": len(tokens)}
```

**איך לבדוק:**
1. פתח: `https://solanahunter-production.up.railway.app/api/tokens?limit=10`
2. אם אתה רואה JSON עם `tokens` → ה-API עובד! ✅
3. אם אתה רואה `{"tokens": [], "total": 0}` → Supabase לא מוגדר או ריק
4. אם אתה רואה שגיאה → יש בעיה

---

### **3. האם CORS מוגדר נכון?**

**איפה לבדוק:**
- Frontend Console → חפש: `CORS policy`
- נסה לקרוא ל-API מה-Frontend

**מה הקוד עושה:**
```python
# backend/api/main.py - שורה 37-49
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://solana-hunter.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    ...
)
```

**איך לבדוק:**
1. פתח Frontend → Console
2. אם אתה רואה `CORS policy` error → CORS לא עובד ❌
3. אם אתה לא רואה שגיאה → CORS עובד! ✅

---

### **4. האם Supabase מוגדר נכון?**

**איפה לבדוק:**
- Railway Environment Variables → חפש: `SUPABASE_URL`, `SUPABASE_KEY`
- Supabase Dashboard → בדוק שהפרויקט פעיל

**מה הקוד עושה:**
```python
# backend/database/supabase_client.py - שורה 27-38
def __init__(self):
    self.url = settings.supabase_url
    self.key = settings.supabase_key
    if not self.url or not self.key:
        logger.warning("⚠️ Supabase not configured - database operations disabled")
        self.enabled = False
    else:
        self.enabled = True
```

**איך לבדוק:**
1. לך ל-Railway → Settings → Variables
2. בדוק שיש: `SUPABASE_URL` ו-`SUPABASE_KEY`
3. אם אין → זה הבעיה! ❌
4. אם יש → בדוק שהערכים נכונים

---

## 🎯 **תוכנית בדיקה:**

### **שלב 1: בדוק Railway Logs**
```bash
1. לך ל-Railway → Logs
2. חפש: "Saved.*to database"
3. חפש: "Supabase not configured"
4. חפש: "Failed to save"
```

### **שלב 2: בדוק Supabase Dashboard**
```bash
1. לך ל-Supabase Dashboard
2. לך ל-Table Editor → tokens
3. בדוק אם יש טוקנים בטבלה
4. אם יש → הבוט שומר! ✅
5. אם אין → יש בעיה
```

### **שלב 3: בדוק API ישירות**
```bash
1. פתח: https://solanahunter-production.up.railway.app/api/tokens?limit=10
2. אם אתה רואה JSON עם tokens → API עובד! ✅
3. אם אתה רואה [] → Supabase ריק או לא מוגדר
```

### **שלב 4: בדוק Frontend**
```bash
1. פתח: https://solana-hunter.vercel.app
2. פתח Console (F12)
3. בדוק אם יש CORS errors
4. בדוק אם יש WebSocket errors (זה OK - לא קריטי)
```

---

## ✅ **מה צריך לעשות:**

### **אם הבוט לא שומר ב-Supabase:**
1. בדוק Railway Environment Variables → `SUPABASE_URL`, `SUPABASE_KEY`
2. בדוק Supabase Dashboard → שהפרויקט פעיל
3. בדוק Railway Logs → חפש שגיאות

### **אם ה-API לא קורא מ-Supabase:**
1. בדוק Railway Logs → חפש שגיאות ב-`/api/tokens`
2. בדוק Supabase Dashboard → שיש טוקנים בטבלה
3. נסה לקרוא ל-API ישירות

### **אם CORS לא עובד:**
1. בדוק ש-`backend/api/main.py` כולל את ה-CORS configuration
2. בדוק ש-Railway deployed את הקוד החדש
3. נסה לעשות commit & push

---

## 📊 **סיכום:**

**לפני שאני משנה דברים, אני צריך לדעת:**
1. ✅ האם הבוט שומר טוקנים ב-Supabase? (Railway Logs)
2. ✅ האם יש טוקנים ב-Supabase? (Supabase Dashboard)
3. ✅ האם ה-API קורא מ-Supabase? (נסה ישירות)
4. ✅ האם CORS עובד? (Frontend Console)

**אחרי שנדע את התשובות, נוכל לתקן את הבעיה האמיתית!**

---

**בואו נבדוק יחד! 🔍**