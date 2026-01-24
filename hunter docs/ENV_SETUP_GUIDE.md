# 📋 מדריך הגדרת קבצי .env

מדריך מלא להגדרת קבצי הסביבה (`.env`) לפרויקט SolanaHunter.

---

## 📁 מבנה הקבצים

```
SolanaHunter/
├── backend/
│   └── .env              ← העתק מ-env.example
└── frontend/
    └── .env.local        ← העתק מ-env.example
```

---

## 🔧 Backend (.env)

### מיקום:
```
backend/.env
```

### איך ליצור:
1. לך לתיקיית `backend/`
2. העתק את `env.example` ל-`.env`:
   ```bash
   cp env.example .env
   ```
3. פתח את `.env` בעורך טקסט
4. מלא את כל הערכים (ראה למטה)

### משתנים חובה:
- ✅ **HELIUS_API_KEY** - מפתח API ל-Helius (חובה!)

### משתנים מומלצים:
- 🟡 **SUPABASE_URL** - כתובת Supabase שלך
- 🟡 **SUPABASE_KEY** - Anon Key מ-Supabase
- 🟡 **SUPABASE_SERVICE_KEY** - Service Key מ-Supabase
- 🟡 **TELEGRAM_BOT_TOKEN** - טוקן בוט טלגרם
- 🟡 **TELEGRAM_CHAT_ID** - ID הצ'אט שלך

### משתנים אופציונליים:
- ⚪ **WALLET_PRIVATE_KEY** - Private Key של הארנק (Day 15+)
- ⚪ **BIRDEYE_API_KEY** - מפתח Birdeye (אופציונלי)
- ⚪ **SOLSCAN_API_KEY** - מפתח Solscan (אופציונלי)

---

## 🎨 Frontend (.env.local)

### מיקום:
```
frontend/.env.local
```

### איך ליצור:
1. לך לתיקיית `frontend/`
2. העתק את `env.example` ל-`.env.local`:
   ```bash
   cp env.example .env.local
   ```
3. פתח את `.env.local` בעורך טקסט
4. מלא את כל הערכים (ראה למטה)

### משתנים מומלצים:
- 🟡 **NEXT_PUBLIC_SUPABASE_URL** - כתובת Supabase שלך
- 🟡 **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Anon Key מ-Supabase

### משתנים אופציונליים:
- ⚪ **NEXT_PUBLIC_API_URL** - כתובת Backend API (ברירת מחדל: http://localhost:8000)

---

## 🔑 איך להשיג את הערכים

### 1. Helius API Key
1. לך ל: https://helius.dev/
2. הירשם/התחבר
3. צור API key חדש
4. העתק את ה-key ל-`HELIUS_API_KEY`

### 2. Supabase Credentials
1. לך ל-Supabase Dashboard: https://app.supabase.com/
2. בחר את הפרויקט שלך (או צור חדש)
3. לך ל: **Settings** > **API**
4. העתק:
   - **Project URL** → `SUPABASE_URL` (ב-backend) ו-`NEXT_PUBLIC_SUPABASE_URL` (ב-frontend)
   - **anon public** key → `SUPABASE_KEY` (ב-backend) ו-`NEXT_PUBLIC_SUPABASE_ANON_KEY` (ב-frontend)
   - **service_role** key → `SUPABASE_SERVICE_KEY` (רק ב-backend!)

### 3. Telegram Bot Token
1. פתח טלגרם
2. חפש: `@BotFather`
3. שלח: `/newbot`
4. עקוב אחר ההוראות
5. העתק את ה-Token ל-`TELEGRAM_BOT_TOKEN`

### 4. Telegram Chat ID
1. פתח טלגרם
2. חפש: `@userinfobot`
3. שלח הודעה (כל הודעה)
4. העתק את ה-Chat ID ל-`TELEGRAM_CHAT_ID`

### 5. Wallet Private Key
1. פתח Phantom Wallet
2. לך ל: **Settings** > **Security & Privacy**
3. לחץ על: **Export Private Key**
4. הזן את הסיסמה
5. העתק את ה-Private Key (Base58 format) ל-`WALLET_PRIVATE_KEY`
6. ⚠️ **חשוב**: השתמש רק בארנק ייעודי לבוט!

---

## ✅ בדיקה

### Backend:
```bash
cd backend
python verify_setup.py
```

### Frontend:
```bash
cd frontend
npm run dev
# פתח http://localhost:3000
```

---

## ⚠️ אבטחה

1. **לעולם אל תעלה את `.env` או `.env.local` ל-GitHub!**
2. הקבצים אמורים להיות ב-`.gitignore` (אמור להיות כבר שם)
3. **SUPABASE_SERVICE_KEY** - רק ב-backend! לעולם אל תחשוף ב-frontend!
4. **WALLET_PRIVATE_KEY** - שמור במקום בטוח! אם מישהו ישיג אותו, הוא יכול לגנוב את הכסף!

---

## 📝 הערות

- כל המשתנים עם `your_*_here` חייבים להיות מוחלפים בערכים אמיתיים
- משתנים אופציונליים יכולים להישאר ריקים (אבל לא מומלץ)
- Next.js קורא אוטומטית מ-`.env.local` ב-frontend
- Backend קורא מ-`.env` בתיקיית `backend/`

---

## 🆘 בעיות נפוצות

### "Field required: helius_api_key"
- **פתרון**: ודא ש-`HELIUS_API_KEY` מוגדר ב-`backend/.env`

### "Supabase not configured"
- **פתרון**: ודא ש-`NEXT_PUBLIC_SUPABASE_URL` ו-`NEXT_PUBLIC_SUPABASE_ANON_KEY` מוגדרים ב-`frontend/.env.local`

### "Cannot connect to backend"
- **פתרון**: ודא שה-backend רץ על `http://localhost:8000` או עדכן את `NEXT_PUBLIC_API_URL`

---

**בהצלחה! 🚀**
