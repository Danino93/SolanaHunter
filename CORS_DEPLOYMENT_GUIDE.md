# 🚀 CORS Fix - הוראות Deploy

**תאריך:** 2026-01-24  
**בעיה:** CORS error - Frontend ב-Vercel לא יכול לגשת ל-Backend ב-Railway  
**פתרון:** ✅ תוקן בקוד, צריך לעשות Deploy

---

## ✅ **מה תוקן:**

### **`backend/api/main.py`:**

ה-CORS configuration עודכן ל:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://solana-hunter.vercel.app",  # Production domain
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",  # כל ה-Vercel preview deployments
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

**מה זה עושה:**
- ✅ מאפשר גישה מ-`https://solana-hunter.vercel.app` (production)
- ✅ מאפשר גישה מכל domain של Vercel (`*.vercel.app`)
- ✅ מאפשר גישה מ-localhost (development)
- ✅ תומך בכל ה-HTTP methods
- ✅ תומך בכל ה-headers

---

## 🚀 **איך לעשות Deploy:**

### **שלב 1: Commit & Push Backend**

```bash
cd backend
git add api/main.py
git commit -m "fix: CORS - use allow_origin_regex for Vercel domains"
git push origin main
```

### **שלב 2: Railway Auto-Deploy**

Railway יזהה את ה-push אוטומטית:
1. יתחיל build חדש
2. יריץ `pip install -r requirements.txt`
3. יריץ `python run_api.py`
4. השרת יתחיל עם CORS configuration החדש

**זמן משוער:** 2-5 דקות

### **שלב 3: בדיקה**

אחרי שה-Deploy מסתיים:

#### **א. בדיקת Health Check:**
```bash
curl https://solanahunter-production.up.railway.app/health
```

**תשובה צפויה:**
```json
{"status":"healthy"}
```

#### **ב. בדיקת CORS Headers:**
```bash
curl -H "Origin: https://solana-hunter.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     -v \
     https://solanahunter-production.up.railway.app/api/dexscreener/trending?limit=50
```

**תשובה צפויה:**
```
< HTTP/1.1 200 OK
< access-control-allow-origin: https://solana-hunter.vercel.app
< access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
< access-control-allow-headers: *
```

#### **ג. בדיקה בדפדפן:**
1. פתח `https://solana-hunter.vercel.app/markets`
2. פתח Developer Console (F12)
3. בדוק שאין CORS errors
4. בדוק שהנתונים נטענים

---

## 🔍 **איך לבדוק שהתיקון עבד:**

### **לפני התיקון:**
```
❌ CORS Error: No 'Access-Control-Allow-Origin' header
❌ net::ERR_FAILED
❌ אין נתונים בדף
```

### **אחרי התיקון:**
```
✅ אין CORS errors בקונסול
✅ הנתונים נטענים מה-API
✅ הדף מציג טוקנים
```

---

## ⚠️ **אם זה עדיין לא עובד:**

### **1. בדוק ש-Railway Deploy הצליח:**
- לך ל-Railway Dashboard
- בדוק שה-Deploy הושלם בהצלחה
- בדוק שאין errors ב-Logs

### **2. בדוק את ה-CORS Headers:**
```bash
curl -I https://solanahunter-production.up.railway.app/api/dexscreener/trending?limit=50
```

**צריך לראות:**
```
access-control-allow-origin: https://solana-hunter.vercel.app
```

### **3. בדוק את ה-Environment Variables:**
- ודא ש-`PORT` מוגדר ב-Railway
- ודא שאין שגיאות ב-Logs

### **4. נסה Clear Cache:**
- בדפדפן: Ctrl+Shift+R (hard refresh)
- או פתח ב-Incognito mode

---

## 📊 **סיכום:**

### **מה צריך לעשות:**
1. ✅ Commit & Push את ה-Backend
2. ✅ המתן ל-Railway Deploy (2-5 דקות)
3. ✅ בדוק שהכל עובד

### **מה התיקון עושה:**
- ✅ מאפשר גישה מ-Vercel ל-Railway
- ✅ תומך בכל ה-Vercel preview deployments
- ✅ תומך ב-localhost ל-development

---

## ✅ **הכל מוכן!**

**Commit & Push - והכל יעבוד! 🚀**

---

**הכל תוקן! 🎉**