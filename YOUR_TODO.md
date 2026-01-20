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
- [X ] יצירת .env מהקובץ env.example
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
- [ ] ⚠️ **עקוב אחרי המדריך:** `PHANTOM_WALLET_SETUP.md`
- [ ] צור ארנק ייעודי לבוט ב-Phantom
- [ ] שמור את ה-Secret Phrase במקום בטוח!
- [ ] שלח 0.5-1 SOL לארנק החדש (מהארנק הראשי)
- [ ] ייצא Private Key (Settings → Security & Privacy → Export Private Key)
- [ ] הוסף ל-.env: `WALLET_PRIVATE_KEY=your_private_key_base58_here`
- [ ] הרץ `python verify_setup.py` כדי לבדוק שהכל עובד
- [x] ✅ **הקוד מוכן!** - WalletManager נוצר ומוכן לשימוש

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

## 🔌 רשימת APIs - מה יש ומה חסר

### ⚠️ חובה (חייבים לעבוד):

#### 1. Helius API (Solana RPC) ⚠️ **חובה!**
- **מה זה:** חיבור ל-Solana blockchain
- **למה צריך:** סריקת טוקנים, קריאת נתונים מהבלוקצ'יין
- **איך להשיג:**
  1. לך ל: https://helius.dev/
  2. הירשם/התחבר
  3. צור API key חדש
  4. Free tier: 250,000 requests/day (מספיק!)
- **משתנה ב-.env:** `HELIUS_API_KEY=your_helius_api_key_here`
- **סטטוס:**יש
- **קישור:** https://helius.dev/

#### 2. Telegram Bot API ✅ **יש לך כבר!**
- **מה זה:** בוט טלגרם להתראות ופקודות
- **למה צריך:** תקשורת עם הבוט, התראות בזמן אמת
- **איך להשיג:**
  1. פתח Telegram
  2. חפש @BotFather
  3. שלח `/newbot`
  4. קבל Bot Token
  5. מצא Chat ID שלך
- **משתנים ב-.env:**
  - `TELEGRAM_BOT_TOKEN=123456789:ABCdef...`
  - `TELEGRAM_CHAT_ID=123456789`
- **סטטוס:** יש
- **קישור:** https://core.telegram.org/bots/api

#### 3. Supabase (Database) ⚠️ **חובה!**
- **מה זה:** מסד נתונים PostgreSQL + Realtime
- **למה צריך:** שמירת טוקנים, עדכונים בזמן אמת
- **איך להשיג:**
  1. לך ל: https://supabase.com/
  2. הירשם/התחבר
  3. צור פרויקט חדש "solanahunter"
  4. קבל API credentials:
     - Settings → API
     - Project URL
     - anon/public key
     - service_role key (אופציונלי)
- **משתנים ב-.env:**
  - `SUPABASE_URL=https://xxxxx.supabase.co`
  - `SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - `SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (אופציונלי)
- **סטטוס:** צריך
- **קישור:** https://supabase.com/

#### 4. Phantom Wallet (Private Key) ⚠️ **חובה ל-Day 15+!**
- **מה זה:** ארנק ייעודי לבוט
- **למה צריך:** ביצוע טרנזקציות, קנייה/מכירה
- **איך להשיג:**
  1. צור ארנק חדש ב-Phantom (אל תשתמש בארנק הראשי!)
  2. ייצא Private Key (Settings → Security → Export Private Key)
  3. שמור במקום בטוח!
- **משתנה ב-.env:** `WALLET_PRIVATE_KEY=your_private_key_base58_here`
- **סטטוס:** צריך
- **מדריך:** `PHANTOM_WALLET_SETUP.md`

---

### 📊 אופציונלי (יכול לעבוד בלעדיהם):

#### 5. Birdeye API (מחירים) 📊 **אופציונלי**
- **מה זה:** מחירים בזמן אמת, נתוני שוק
- **למה צריך:** מחירים מדויקים, volume, market cap
- **איך להשיג:**
  1. לך ל: https://birdeye.so/
  2. הירשם/התחבר
  3. צור API key
  4. Free tier: 100 requests/minute
- **משתנה ב-.env:** `BIRDEYE_API_KEY=your_birdeye_key_here`
- **סטטוס:** צריך
- **קישור:** https://birdeye.so/

#### 6. Solscan API (Blockchain Explorer) 📊 **אופציונלי**
- **מה זה:** נתוני blockchain, מחזיקים, טרנזקציות
- **למה צריך:** ניתוח מחזיקים, היסטוריית טרנזקציות
- **איך להשיג:**
  1. לך ל: https://solscan.io/
  2. הירשם/התחבר
  3. צור API key (אם יש)
  4. או להשתמש ב-public API (ללא key)
- **משתנה ב-.env:** `SOLSCAN_API_KEY=your_solscan_key_here` (אופציונלי)
- **סטטוס:** צריף
- **קישור:** https://solscan.io/

#### 7. DexScreener API (Charts) 📊 **אופציונלי**
- **מה זה:** גרפים, נתוני שוק, טוקנים חדשים
- **למה צריך:** גילוי טוקנים, גרפים
- **איך להשיג:**
  - **חינם!** אין צורך ב-API key
  - Public API: https://api.dexscreener.com/
- **משתנה ב-.env:** אין צורך (public API)
- **סטטוס:**צריך
- **קישור:** https://docs.dexscreener.com/

#### 8. Jupiter API (Swaps) ⚠️ **חובה ל-Day 16+!**
- **מה זה:** DEX Aggregator - ביצוע swaps
- **למה צריך:** קנייה/מכירה של טוקנים
- **איך להשיג:**
  - **חינם!** אין צורך ב-API key
  - Public API: https://quote-api.jup.ag/v6/
- **משתנה ב-.env:** אין צורך (public API)
- **סטטוס:** [צריך
- **קישור:** https://station.jup.ag/docs/apis/swap-api

---

### 🤖 לעתיד (אופציונלי):

#### 9. Anthropic Claude API (AI) 🤖 **לעתיד**
- **מה זה:** AI לניתוח טוקנים, החלטות חכמות
- **למה צריך:** ניתוח מתקדם, המלצות
- **איך להשיג:**
  1. לך ל: https://console.anthropic.com/
  2. הירשם/התחבר
  3. צור API key
  4. יש free tier (מוגבל)
- **משתנה ב-.env:** `ANTHROPIC_API_KEY=your_anthropic_key_here`
- **סטטוס:** [ ] יש לי | [ ] צריך לארגן | [ ] לא צריך כרגע
- **קישור:** https://console.anthropic.com/

#### 10. OpenAI API (AI) 🤖 **לעתיד**
- **מה זה:** AI חלופי ל-Claude
- **למה צריך:** ניתוח מתקדם, המלצות
- **איך להשיג:**
  1. לך ל: https://platform.openai.com/
  2. הירשם/התחבר
  3. צור API key
  4. יש free tier (מוגבל)
- **משתנה ב-.env:** `OPENAI_API_KEY=your_openai_key_here`
- **סטטוס:** [ ] יש לי | [ ] צריך לארגן | [ ] לא צריך כרגע
- **קישור:** https://platform.openai.com/

---

## 📋 סיכום - מה צריך עכשיו:

### ⚠️ חובה (עכשיו):
1. [ ] **Helius API** - חיבור ל-Solana blockchain
2. [ ] **Supabase** - מסד נתונים
3. [ ] **Phantom Wallet** - ארנק ייעודי (Day 15+)

### ✅ יש לך כבר:
1. [x] **Telegram Bot** - בוט טלגרם
2. [x] **DexScreener** - חינם, אין צורך ב-key
3. [x] **Jupiter** - חינם, אין צורך ב-key

### 📊 אופציונלי (יכול לחכות):
1. [ ] **Birdeye API** - מחירים (יכול להשתמש ב-DexScreener)
2. [ ] **Solscan API** - blockchain explorer (יכול להשתמש ב-public API)

### 🤖 לעתיד:
1. [ ] **Anthropic Claude API** - AI (לעתיד)
2. [ ] **OpenAI API** - AI (לעתיד)

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

**עדכון אחרון:** 2025-01-20  
**סטטוס:** Day 15 הושלם - Wallet Integration ✅
