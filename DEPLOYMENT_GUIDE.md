# 🚀 מדריך העלאה לשרתים - SolanaHunter

**הכל על העלאה לשרתים אמיתיים (Railway + Vercel)**

---

## 📋 מה GitHub Actions בודק (CI)

GitHub Actions **לא מעלה** את הקוד לשרתים - הוא רק **בודק** שהכל תקין!

### מה הוא בודק:

#### ✅ Backend Tests:
- מבנה הפרויקט (כל התיקיות קיימות)
- כל המודולים ניתנים ל-import
- Code quality (Black, Ruff, MyPy)
- Type checking
- אין שגיאות syntax

#### ✅ Frontend Tests:
- מבנה הפרויקט
- TypeScript compilation (`npm run build`)
- Linting
- כל הקבצים קיימים

### מה הוא **לא** עושה:
- ❌ לא מעלה לשרתים
- ❌ לא מריץ את הבוט
- ❌ לא בודק חיבורים ל-APIs אמיתיים

---

## 🎯 העלאה לשרתים אמיתיים

### Backend → Railway

#### 1. הכנה:
```bash
# ודא שיש לך:
# - Railway account (https://railway.app)
# - GitHub repository מחובר
```

#### 2. יצירת Project ב-Railway:
1. לך ל: https://railway.app
2. לחץ על "New Project"
3. בחר "Deploy from GitHub repo"
4. בחר את ה-repo שלך: `Danino93/SolanaHunter`
5. בחר "Backend" (או צור service חדש)

#### 3. הגדרת Build:
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `python main.py` (או `uvicorn api.main:app --host 0.0.0.0 --port $PORT`)

#### 4. Environment Variables:
הוסף את כל המשתנים מ-`backend/.env`:
- `HELIUS_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `WALLET_PRIVATE_KEY` (אם יש)
- וכל השאר...

#### 5. Deploy:
- Railway יבנה ויעלה אוטומטית
- תקבל URL: `https://your-app.railway.app`

---

### Frontend → Vercel

#### 1. הכנה:
```bash
# ודא שיש לך:
# - Vercel account (https://vercel.com)
# - GitHub repository מחובר
```

#### 2. יצירת Project ב-Vercel:
1. לך ל: https://vercel.com
2. לחץ על "Add New..." → "Project"
3. Import את ה-repo: `Danino93/SolanaHunter`
4. הגדרות:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (אוטומטי)
   - **Output Directory:** `.next` (אוטומטי)

#### 3. Environment Variables:
הוסף את כל המשתנים מ-`frontend/.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` (כתובת ה-Railway backend)

#### 4. Deploy:
- Vercel יבנה ויעלה אוטומטית
- תקבל URL: `https://your-app.vercel.app`

---

## ✅ בדיקה שהכל מוכן

### לפני העלאה:

#### Backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python verify_setup.py
```

#### Frontend:
```bash
cd frontend
npm install
npm run build  # זה מה ש-GitHub בודק!
```

אם שני אלה עוברים - הכל מוכן! ✅

---

## 🔄 סינכרון אוטומטי

### Railway:
- ✅ **אוטומטי!** כל push ל-`main` → deploy אוטומטי
- או: Deploy Manual (לחץ על "Deploy" ב-Railway)

### Vercel:
- ✅ **אוטומטי!** כל push ל-`main` → deploy אוטומטי
- או: Deploy Manual (לחץ על "Deploy" ב-Vercel)

---

## 📝 מה צריך לעשות עכשיו

### 1. בדוק שהכל עובד מקומית:
```bash
# Backend
cd backend
python main.py  # צריך לרוץ בלי שגיאות

# Frontend (בטרמינל אחר)
cd frontend
npm run dev  # צריך לרוץ על http://localhost:3000
```

### 2. ודא ש-GitHub Actions עובר:
- לך ל-GitHub → Actions
- תראה ✅ ירוק על כל הבדיקות

### 3. העלה ל-Railway:
- צור project חדש
- חבר ל-GitHub repo
- הוסף environment variables
- Deploy!

### 4. העלה ל-Vercel:
- צור project חדש
- חבר ל-GitHub repo
- הוסף environment variables
- Deploy!

---

## ⚠️ חשוב לדעת

### מה GitHub Actions בודק:
- ✅ הקוד מתקמפל (build)
- ✅ אין שגיאות syntax
- ✅ כל הקבצים קיימים
- ✅ TypeScript types תקינים

### מה GitHub Actions **לא** בודק:
- ❌ חיבורים ל-APIs אמיתיים
- ❌ שהבוט רץ בפועל
- ❌ שהדשבורד עובד עם Supabase אמיתי

### מה צריך לבדוק ידנית:
1. ✅ Backend רץ מקומית (`python main.py`)
2. ✅ Frontend build עובד (`npm run build`)
3. ✅ Environment variables מוגדרים נכון
4. ✅ חיבורים ל-APIs עובדים

---

## 🎯 סיכום

### האם הקוד מוכן לבילד?
**כן!** ✅
- אם GitHub Actions עובר → הקוד מוכן
- אם `npm run build` עובד מקומית → מוכן
- אם `python main.py` רץ → מוכן

### האם הכל יסתנכרן?
**כן!** ✅
- Railway + Vercel מחוברים ל-GitHub
- כל push ל-`main` → deploy אוטומטי
- Environment variables נשמרים ב-Railway/Vercel (לא ב-GitHub!)

### מה GitHub בודק?
**CI (Continuous Integration)** - בדיקות אוטומטיות:
- Build
- Linting
- Type checking
- Imports
- מבנה הפרויקט

**לא CD (Continuous Deployment)** - זה צריך להגדיר ב-Railway/Vercel!

---

## 🚀 צעדים הבאים

1. ✅ ודא ש-GitHub Actions עובר (ירוק)
2. ✅ בדוק שהכל עובד מקומית
3. 🎯 צור Railway project
4. 🎯 צור Vercel project
5. 🎯 הוסף environment variables
6. 🎯 Deploy!

**בהצלחה! 🚀**
