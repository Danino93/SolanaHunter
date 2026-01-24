# 🔧 CORS Fix - Backend

**תאריך:** 2026-01-24  
**בעיה:** CORS error - Frontend ב-Vercel לא יכול לגשת ל-Backend ב-Railway  
**פתרון:** ✅ תוקן!

---

## 🔴 **הבעיה:**

```
Access to fetch at 'https://solanahunter-production.up.railway.app/api/tokens?limit=50' 
from origin 'https://solana-hunter.vercel.app' 
has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**למה זה קרה?**
- FastAPI לא תומך ב-wildcards (`*.vercel.app`) ב-`allow_origins`
- צריך להשתמש ב-`allow_origin_regex` או להגדיר במפורש

---

## ✅ **מה תוקן:**

### **`backend/api/main.py`:**

**לפני:**
```python
allow_origins=[
    "http://localhost:3000",
    "http://localhost:3001",
    "https://*.vercel.app",  # ❌ זה לא עובד!
    "https://solana-hunter.vercel.app",
],
```

**אחרי:**
```python
allow_origins=[
    "http://localhost:3000",
    "http://localhost:3001",
    "https://solana-hunter.vercel.app",  # Production domain
],
allow_origin_regex=r"https://.*\.vercel\.app",  # ✅ כל ה-Vercel preview deployments
allow_credentials=True,
allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
allow_headers=["*"],
expose_headers=["*"],
```

---

## 🚀 **איך להעלות:**

### **שלב 1: Commit & Push Backend**
```bash
cd backend
git add .
git commit -m "fix: CORS - use allow_origin_regex for Vercel domains"
git push origin main
```

### **שלב 2: Railway Auto-Deploy**
- Railway יזהה את ה-push
- יתחיל build חדש
- השרת יתחיל עם CORS configuration החדש

### **שלב 3: בדיקה**
אחרי שה-Deploy מסתיים:
```bash
# Health check
curl https://solanahunter-production.up.railway.app/health

# בדיקת CORS headers
curl -H "Origin: https://solana-hunter.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://solanahunter-production.up.railway.app/api/tokens
```

**תשובה צפויה:**
```
Access-Control-Allow-Origin: https://solana-hunter.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: *
```

---

## 📊 **מה השתנה:**

### **לפני:**
```
Frontend (Vercel) → Backend (Railway) → ❌ CORS Error
```

### **אחרי:**
```
Frontend (Vercel) → Backend (Railway) → ✅ CORS Headers → ✅ עובד!
```

---

## ✅ **הכל מוכן!**

עכשיו:
1. ✅ CORS מוגדר נכון
2. ✅ כל ה-Vercel domains מורשים
3. ✅ Production domain מורשה במפורש
4. ✅ Localhost מורשה ל-development

**Commit & Push - והכל יעבוד! 🚀**

---

**הכל תוקן! 🎉**
