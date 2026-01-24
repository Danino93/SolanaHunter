# 🔧 Railway Port Fix - SolanaHunter Backend

**תאריך:** 2026-01-24  
**בעיה:** Backend קורס ב-Railway כי לא מאזין על PORT הנכון  
**פתרון:** ✅ תוקן!

---

## ✅ **מה תוקן:**

### **1. `backend/main.py` (שורה 1126):**
**לפני:**
```python
uvicorn.run(api_app, host="0.0.0.0", port=8000, log_level="info")
```

**אחרי:**
```python
import os
port = int(os.environ.get("PORT", 8000))
uvicorn.run(api_app, host="0.0.0.0", port=port, log_level="info")
```

### **2. `backend/api/main.py` (שורה 85-87):**
**לפני:**
```python
def run_server(host: str = "0.0.0.0", port: int = 8000):
    uvicorn.run(app, host=host, port=port)
```

**אחרי:**
```python
def run_server(host: str = "0.0.0.0", port: int = None):
    if port is None:
        port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host=host, port=port)
```

### **3. קבצים חדשים:**
- ✅ `backend/Procfile` - הוראות הרצה ל-Railway
- ✅ `backend/railway.json` - קונפיגורציה ל-Railway

---

## 🚀 **איך להעלות:**

### **שלב 1: Commit & Push**
```bash
cd backend
git add .
git commit -m "fix: bind uvicorn to Railway PORT environment variable"
git push origin main
```

### **שלב 2: Railway Auto-Deploy**
- Railway יזהה את ה-push
- יתחיל build חדש אוטומטית
- ינסה להריץ את השרת על ה-PORT הנכון

### **שלב 3: בדיקה**
אחרי שהסטטוס משתנה ל-🟢 **Running**:

```bash
# בדוק health endpoint
curl https://solanahunter-production.up.railway.app/health

# תשובה צפויה:
{"status":"healthy"}
```

### **שלב 4: עדכן Frontend**
ב-Vercel Dashboard → Environment Variables:
```
NEXT_PUBLIC_API_URL=https://solanahunter-production.up.railway.app
```

ואז **Redeploy** את ה-Frontend.

---

## 🔍 **איך לבדוק שהכל עובד:**

### **1. בדוק Backend:**
```bash
# Health check
curl https://solanahunter-production.up.railway.app/health

# Get tokens
curl https://solanahunter-production.up.railway.app/api/tokens?limit=5
```

### **2. בדוק Frontend:**
1. פתח `https://solana-hunter.vercel.app`
2. פתח DevTools → Network
3. בדוק שה-API calls עוברים ל-Backend
4. בדוק שאין CORS errors

---

## 📊 **מה קרה:**

### **לפני התיקון:**
```
Railway מזריק: PORT=54321
האפליקציה מנסה: port=8000 (hardcoded)
❌ קונפליקט → Crash!
```

### **אחרי התיקון:**
```
Railway מזריק: PORT=54321
האפליקציה קוראת: os.environ.get("PORT", 8000)
✅ משתמש ב-54321 → עובד!
```

---

## 🎯 **הכל מוכן!**

עכשיו:
1. ✅ Commit & Push את השינויים
2. ✅ המתן ל-Railway Deploy
3. ✅ בדוק את ה-health endpoint
4. ✅ עדכן את ה-Frontend URL
5. ✅ **סיימנו!** 🎉

---

**הכל תוקן! 🚀**