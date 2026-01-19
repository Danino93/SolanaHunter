# 📋 אלירן - TODO List
## משימות אישיות שלך (מחוץ לקוד)

**תאריך יצירה:** 2025-01-19  
**עדכון אחרון:** 2025-01-19

---

## ⚠️ דחוף - עכשיו!

### ✅ Day 1: Setup
- [ ] הוספת HELIUS_API_KEY ל-env.example
- [ ] **יצירת קובץ .env אמיתי**
  ```bash
  cd backend
  copy env.example .env  # Windows
  ```
  **הערה:** כבר נוצר אוטומטית, אבל תבדוק שיש לך!
- [ ] התקנת dependencies
  ```bash
  cd backend
  pip install -r requirements.txt
  ```
  **הערה:** כבר הותקנו, אבל תבדוק!
- [ ] בדיקת setup
  ```bash
  cd backend
  python verify_setup.py
  ```
- [ ] הרצת הבוט הראשונה
  ```bash
  cd backend
  python main.py
  ```
  **בדוק:** האם הבוט סורק טוקנים? רואה טבלה יפה?

---

## 📅 Week 1: The Brain (ימים 1-7)

### Day 1 (היום) - Setup + First Scan
- [x] הוספת HELIUS_API_KEY
- [ ] יצירת .env מהקובץ env.example
- [ ] התקנת dependencies
- [ ] בדיקת שהבוט רץ
- [ ] בדיקה שהסריקה עובדת

### Day 2 - Contract Safety Checker
**אין משימות חיצוניות** - הכל בקוד

### Day 3 - Holder Analysis
**אין משימות חיצוניות** - הכל בקוד

### Day 4 - Scoring Algorithm
**אין משימות חיצוניות** - הכל בקוד

### Day 5 - Database Setup (Supabase)
- [ ] הירשם ל-Supabase (אם אין לך כבר)
  - לך ל-https://supabase.com/
  - הירשם/התחבר
- [ ] צור פרויקט חדש בשם "solanahunter"
  - בחר Region קרוב אליך (Europe West מומלץ)
  - שמור את הסיסמה של ה-Database!
- [ ] קבל את ה-API credentials
  - Settings → API
  - העתק:
    - Project URL
    - anon/public key
- [ ] הוסף ל-.env:
  ```
  SUPABASE_URL=https://xxxxx.supabase.co
  SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- [ ] צור את הטבלאות ב-SQL Editor
  - SQL Editor → New Query
  - העתק את ה-SQL מ-TECHNICAL_ARCHITECTURE.md
  - Run Query

### Day 6 - Smart Money Tracking
- [ ] מצא 10 ארנקים חכמים (Smart Money Wallets)
  - לך ל-Solscan.io
  - חפש טוקנים שעשו x100+ בעבר
  - תראה מי קנה מוקדם (first buyers)
  - העתק את כתובות הארנקים
  - שמור אותם (אני אשלב אותם בקוד)

### Day 7 - Main Loop + Logging
- [ ] הירשם ל-Railway (אם אין לך)
  - לך ל-https://railway.app/
  - הירשם עם GitHub
- [ ] צור פרויקט חדש
  - New Project → Deploy from GitHub repo
  - בחר את ה-repo שלך
- [ ] הגדר Environment Variables ב-Railway
  - Project → Variables
  - הוסף את כל ה-variables מ-.env
- [ ] Deploy והרץ 24/7

---

## 📅 Week 2: The Mouth (ימים 8-14)

### Day 8 - Telegram Bot Setup
- [ ] פתח Telegram
- [ ] חפש @BotFather
- [ ] שלח /newbot
- [ ] תן שם לבוט (למשל: "SolanaHunter Bot")
- [ ] תן username (למשל: "solanahunter_bot")
- [ ] קבל את ה-Bot Token
- [ ] הוסף ל-.env:
  ```
  TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
  TELEGRAM_CHAT_ID=123456789
  ```
- [ ] איך למצוא CHAT_ID:
  - שלח הודעה לבוט שלך
  - לך ל: https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
  - מצא את "chat":{"id":123456789}
- [ ] בדוק שההודעה מגיעה
  - הרץ את הבוט
  - בדוק בטלגרם

### Day 9 - Alert System
**אין משימות חיצוניות** - הכל בקוד

### Day 10 - Two-Way Chat
**אין משימות חיצוניות** - הכל בקוד
- Telegram Bot API תומך ב-polling (אוטומטי)
- לא צריך webhook setup!

### Day 11 - Rich Messages
**אין משימות חיצוניות** - הכל בקוד

### Day 12 - Dashboard (Next.js)
- [ ] צור פרויקט Next.js
  ```bash
  npx create-next-app@latest solanahunter-dashboard
  cd solanahunter-dashboard
  ```
- [ ] Deploy ל-Vercel
  - לך ל-https://vercel.com/
  - הירשם עם GitHub
  - Import Project → בחר את ה-repo
  - Deploy

### Day 13 - Real-Time Updates
**אין משימות חיצוניות** - הכל בקוד

### Day 14 - Polish UI
**אין משימות חיצוניות** - הכל בקוד

---

## 📅 Week 3: The Hands (ימים 15-21)

### Day 15 - Phantom Wallet Integration
- [ ] ⚠️ צור ארנק ייעודי לבוט!
  - פתח Phantom
  - Create New Wallet
  - **שמור את ה-Secret Phrase!**
  - זה לא הארנק הראשי שלך!
- [ ] שלח 0.5-1 SOL לארנק החדש
  - מהארנק הראשי שלך
  - רק לבדיקות!
- [ ] ייצא Private Key
  - Settings → Security & Privacy
  - Export Private Key
  - העתק את ה-Private Key
- [ ] הוסף ל-.env:
  ```
  WALLET_PRIVATE_KEY=your_private_key_base58_here
  ```
- [ ] ⚠️ שמור את ה-Private Key במקום בטוח!

### Day 16 - Jupiter Integration
**אין משימות חיצוניות** - הכל בקוד

### Day 17 - Buy Strategy (DCA)
**אין משימות חיצוניות** - הכל בקוד

### Day 18 - Stop Loss
**אין משימות חיצוניות** - הכל בקוד

### Day 19 - Take Profit
**אין משימות חיצוניות** - הכל בקוד

### Day 20 - Telegram Trade Controls
**אין משימות חיצוניות** - הכל בקוד

### Day 21 - Portfolio Tracker
**אין משימות חיצוניות** - הכל בקוד

---

## 🔒 אבטחה - חשוב!

- [ ] ⚠️ לעולם אל תעלה את .env ל-GitHub!
- [ ] ⚠️ אל תשתמש בארנק הראשי שלך לבוט!
- [ ] ⚠️ התחל עם סכומים קטנים ($10-20)
- [ ] ⚠️ שמור backup של Private Keys במקום בטוח

---

## 📝 הערות אישיות

_מקום להערות שלך, רעיונות, שאלות וכו'_

---

## ✅ Checklist שבועי

### שבוע 1:
- [ ] Day 1: Setup ✅
- [ ] Day 5: Supabase
- [ ] Day 6: Smart Wallets
- [ ] Day 7: Railway Deploy

### שבוע 2:
- [ ] Day 8: Telegram Bot
- [ ] Day 10: Two-Way Chat
- [ ] Day 12: Dashboard Deploy

### שבוע 3:
- [ ] Day 15: Wallet Setup

---

**עדכון אחרון:** 2025-01-19  
**סטטוס:** Day 1 - בעבודה
