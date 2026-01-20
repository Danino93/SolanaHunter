# 🔗 Backend-Frontend Integration Plan

**תאריך:** 2025-01-20  
**מטרה:** חיבור מלא בין הדשבורד לבאקנד

---

## 📊 מה יש כבר

### ✅ Backend:
- [x] Supabase client - שומר טוקנים
- [x] Token scanner - סורק טוקנים
- [x] Analyzer - מנתח טוקנים
- [x] Telegram bot - תקשורת
- [x] פונקציות ב-`main.py` שמספקות נתונים

### ✅ Frontend:
- [x] Dashboard עם Sidebar
- [x] 6 דפים (Dashboard, Portfolio, Trading, Analytics, Bot Control, Settings)
- [x] Supabase client - קורא טוקנים
- [x] Real-time updates

---

## ❌ מה חסר

### 1. **FastAPI Server** ❌
- אין REST API endpoints
- הכל עובד דרך Telegram bot בלבד
- צריך ליצור FastAPI server עם endpoints

### 2. **API Endpoints** ❌
צריך ליצור endpoints ל:

#### **Tokens:**
- `GET /api/tokens` - רשימת טוקנים
- `GET /api/tokens/{address}` - פרטי טוקן
- `GET /api/tokens/search?q={query}` - חיפוש

#### **Portfolio:**
- `GET /api/portfolio` - פוזיציות פעילות
- `GET /api/portfolio/stats` - סטטיסטיקות תיק
- `POST /api/portfolio/positions` - יצירת פוזיציה

#### **Trading:**
- `POST /api/trading/buy` - קנייה
- `POST /api/trading/sell` - מכירה
- `GET /api/trading/history` - היסטוריית trades

#### **Bot Control:**
- `GET /api/bot/status` - מצב הבוט
- `POST /api/bot/start` - הפעלה
- `POST /api/bot/stop` - עצירה
- `POST /api/bot/pause` - השהייה
- `GET /api/bot/stats` - סטטיסטיקות

#### **Analytics:**
- `GET /api/analytics/performance` - ביצועים
- `GET /api/analytics/trades` - ניתוח trades
- `GET /api/analytics/roi` - ROI

#### **Settings:**
- `GET /api/settings` - קבלת הגדרות
- `POST /api/settings` - עדכון הגדרות

---

## 🎯 תוכנית עבודה

### **Phase 1: FastAPI Server Setup** (עכשיו)
1. ✅ יצירת `backend/api/` directory
2. ✅ יצירת `backend/api/main.py` - FastAPI app
3. ✅ יצירת `backend/api/routes/` - כל ה-routes
4. ✅ CORS configuration
5. ✅ שילוב עם `main.py` (SolanaHunter class)

### **Phase 2: Basic Endpoints** (עכשיו)
1. ✅ `GET /api/tokens` - רשימת טוקנים
2. ✅ `GET /api/bot/status` - מצב הבוט
3. ✅ `GET /api/bot/stats` - סטטיסטיקות

### **Phase 3: Frontend Integration** (עכשיו במקביל)
1. ✅ יצירת `frontend/lib/api.ts` - API client
2. ✅ עדכון Dashboard - קריאה מ-API במקום Supabase ישירות
3. ✅ עדכון Bot Control - קריאה מ-API
4. ✅ עדכון Analytics - קריאה מ-API

### **Phase 4: Advanced Features** (אחר כך)
1. ⏳ Portfolio endpoints
2. ⏳ Trading endpoints
3. ⏳ Settings endpoints
4. ⏳ Real-time updates דרך WebSocket

---

## 📁 מבנה קבצים חדש

```
backend/
├── api/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── dependencies.py      # Shared dependencies
│   └── routes/
│       ├── __init__.py
│       ├── tokens.py        # Token endpoints
│       ├── portfolio.py     # Portfolio endpoints
│       ├── trading.py        # Trading endpoints
│       ├── bot.py           # Bot control endpoints
│       ├── analytics.py     # Analytics endpoints
│       └── settings.py      # Settings endpoints
```

```
frontend/
├── lib/
│   ├── api.ts              # API client (חדש)
│   ├── supabase.ts         # (קיים)
│   └── auth.ts             # (קיים)
```

---

## 🔧 Implementation Details

### **Backend API:**
- FastAPI עם async/await
- Pydantic models ל-request/response validation
- Error handling מלא
- CORS enabled
- Authentication (JWT או API key)

### **Frontend API Client:**
- TypeScript types
- Error handling
- Loading states
- Retry logic

---

## ✅ Checklist

### Backend:
- [ ] יצירת FastAPI server
- [ ] Token endpoints
- [ ] Bot control endpoints
- [ ] Portfolio endpoints (mock data)
- [ ] Trading endpoints (mock data)
- [ ] Analytics endpoints (mock data)
- [ ] Settings endpoints
- [ ] CORS configuration
- [ ] Error handling
- [ ] Documentation

### Frontend:
- [ ] API client
- [ ] עדכון Dashboard
- [ ] עדכון Bot Control
- [ ] עדכון Portfolio
- [ ] עדכון Trading
- [ ] עדכון Analytics
- [ ] עדכון Settings
- [ ] Error handling
- [ ] Loading states

---

## 🚀 התחלה

בואו נתחיל ב-Phase 1 + Phase 2 במקביל!
