# 🔗 SolanaHunter V2.0 - Integration Guide
## מדריך אינטגרציה מלא בין Frontend ל-Backend

**דומיין:** `solana-hunter.vercel.app`  
**תאריך:** 2026-01-24

---

## ✅ **מה כבר מוכן:**

### **1. Environment Variables ב-Vercel:**
- ✅ `NEXT_PUBLIC_API_URL` - כתובת Backend API
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - כתובת Supabase
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anon Key

### **2. Backend API:**
- ✅ FastAPI server עם CORS מוגדר
- ✅ כל ה-endpoints מוכנים
- ✅ CORS מאפשר קריאות מ-`solana-hunter.vercel.app`

### **3. Frontend:**
- ✅ API Client מוכן (`lib/api.ts`)
- ✅ Supabase Client מוכן (`lib/supabase.ts`)
- ✅ כל הקומפוננטים משתמשים ב-API

---

## 🔧 **הגדרות Backend (Railway)**

### **1. CORS Configuration:**
ה-CORS ב-Backend כבר מוגדר לכלול:
```python
allow_origins=[
    "http://localhost:3000",
    "https://*.vercel.app",
    "https://solana-hunter.vercel.app",  # ✅ הוסף
]
```

### **2. Environment Variables ב-Railway:**
ודא שיש לך:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `HELIUS_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- וכל השאר...

### **3. API Base URL:**
ה-Backend צריך להיות זמין ב:
- **Production:** `https://solanahunter.railway.app` (או URL אחר)
- **Development:** `http://localhost:8000`

---

## 🌐 **הגדרות Frontend (Vercel)**

### **1. Environment Variables:**
ב-Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://solanahunter.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://acyquhybesnmgsgxcmgc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **2. Domain Configuration:**
- **Vercel Domain:** `solana-hunter.vercel.app`
- **Custom Domain:** (אם יש)

---

## 🔄 **API Endpoints - אינטגרציה**

### **Tokens API:**
```typescript
// Get all tokens
GET https://solanahunter.railway.app/api/tokens?limit=50&min_score=80

// Get token by address
GET https://solanahunter.railway.app/api/tokens/{address}

// Search tokens
GET https://solanahunter.railway.app/api/tokens/search?q=BONK
```

### **Bot Control API:**
```typescript
// Get bot status
GET https://solanahunter.railway.app/api/bot/status

// Start bot
POST https://solanahunter.railway.app/api/bot/start

// Stop bot
POST https://solanahunter.railway.app/api/bot/stop
```

### **Portfolio API:**
```typescript
// Get positions
GET https://solanahunter.railway.app/api/portfolio

// Get portfolio stats
GET https://solanahunter.railway.app/api/portfolio/stats
```

### **Trading API:**
```typescript
// Buy token
POST https://solanahunter.railway.app/api/trading/buy
Body: { token_address: "...", amount_usd: 100 }

// Sell token
POST https://solanahunter.railway.app/api/trading/sell
Body: { token_address: "...", amount_percent: 50 }
```

### **Analytics API:**
```typescript
// Get performance
GET https://solanahunter.railway.app/api/analytics/performance

// Get ROI
GET https://solanahunter.railway.app/api/analytics/roi
```

### **DexScreener API:**
```typescript
// Get trending tokens
GET https://solanahunter.railway.app/api/dexscreener/trending?limit=20

// Get new tokens
GET https://solanahunter.railway.app/api/dexscreener/new?limit=20
```

---

## 🧪 **בדיקת האינטגרציה**

### **1. בדיקת Backend API:**
```bash
# Health check
curl https://solanahunter.railway.app/health

# Get tokens
curl https://solanahunter.railway.app/api/tokens?limit=5
```

### **2. בדיקת Frontend:**
1. פתח `https://solana-hunter.vercel.app`
2. פתח DevTools → Network
3. בדוק שה-API calls עוברים ל-Backend
4. בדוק שאין CORS errors

### **3. בדיקת Supabase:**
1. פתח DevTools → Console
2. בדוק שאין שגיאות Supabase
3. בדוק שה-real-time updates עובדים

---

## 🐛 **Troubleshooting**

### **בעיה: CORS Error**
**תסמינים:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**פתרון:**
1. ודא שה-Backend CORS כולל את `solana-hunter.vercel.app`
2. ודא שה-Backend רץ ו-accessible
3. בדוק שה-API URL נכון ב-Vercel

### **בעיה: API לא מגיב**
**תסמינים:**
- Timeout errors
- Network errors
- 500 errors

**פתרון:**
1. בדוק שה-Backend רץ ב-Railway
2. בדוק את ה-logs ב-Railway Dashboard
3. ודא שה-Environment Variables מוגדרים נכון

### **בעיה: Supabase לא עובד**
**תסמינים:**
- "Supabase credentials not configured"
- No data loading

**פתרון:**
1. ודא ש-`NEXT_PUBLIC_SUPABASE_URL` מוגדר ב-Vercel
2. ודא ש-`NEXT_PUBLIC_SUPABASE_ANON_KEY` מוגדר ב-Vercel
3. בדוק שה-keys נכונים

---

## 📊 **Data Flow**

### **1. Token Discovery:**
```
Backend (Railway) → Scans Tokens → Saves to Supabase
                                    ↓
Frontend (Vercel) → Reads from Supabase → Displays in Dashboard
```

### **2. Real-time Updates:**
```
Backend → New Token → Supabase Realtime → Frontend Updates
```

### **3. Trading Actions:**
```
Frontend → API Call → Backend → Solana Blockchain → Update Supabase → Frontend Updates
```

---

## 🔐 **Security Checklist**

- ✅ CORS מוגדר נכון
- ✅ Environment Variables ב-Vercel (לא ב-code)
- ✅ Supabase Anon Key (לא Service Key)
- ✅ API endpoints עם authentication (אם צריך)
- ✅ HTTPS everywhere

---

## 🚀 **Next Steps**

לאחר שהאינטגרציה עובדת:
1. ✅ בדוק את כל ה-endpoints
2. ✅ בדוק Real-time updates
3. ✅ בדוק Trading actions
4. ✅ בדוק Performance
5. ✅ הגדר Monitoring

---

## 📞 **Support**

אם יש בעיות:
1. בדוק את ה-logs ב-Vercel Dashboard
2. בדוק את ה-logs ב-Railway Dashboard
3. בדוק את ה-Console בדפדפן
4. בדוק את ה-Network tab

**הכל מוכן לאינטגרציה! 🎉**