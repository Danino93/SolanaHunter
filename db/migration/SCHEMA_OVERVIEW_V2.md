# 📊 סקירת Schema V2.0 - SolanaHunter Database

## 🆕 מה חדש בגרסה 2.0?

**תאריך עדכון**: ינואר 2026  
**גרסה**: 2.0 - Claude AI Upgrades  
**מיגרציה**: `002_claude_ai_upgrades.sql`

---

## 🗂️ מבנה כללי V2.0

המסד נתונים מורכב מ-**4 טבלאות עיקריות חדשות** + הטבלאות הקיימות:

```
🆕 NEW V2.0 TABLES:
performance_tracking (מעקב ביצועים)
  ├── smart_wallets (Smart Money עם Trust Scores)
  ├── scanned_tokens_history (היסטוריה מלאה)
  └── wallet_token_holdings (קשרים)

📊 V2.0 ANALYTICS VIEWS:
smart_wallets_stats
bot_performance_summary

🤖 V2.0 SMART FUNCTIONS:
add_smart_wallet()
update_trust_score()
log_scanned_token()
```

---

## 📋 טבלאות V2.0 מפורטות

### 🧠 1. **performance_tracking** - מערכת למידה
**גרסה**: 2.0 (חדש!)  
**תפקיד:** עוקב אחרי כל טוכן שהבוט המליץ עליו ומודד ביצועים

**עמודות עיקריות:**
```sql
address TEXT PRIMARY KEY              -- כתובת הטוכן
symbol TEXT NOT NULL                 -- סימבול (BONK, SOL)
entry_price FLOAT NOT NULL           -- מחיר בכניסה (USD)
entry_time TIMESTAMP WITH TIME ZONE -- זמן הכניסה
entry_score INTEGER NOT NULL         -- ציון הבוט (0-100)
smart_wallets JSONB                  -- Smart Wallets שהחזיקו
current_price FLOAT                  -- מחיר נוכחי (מתעדכן כל 5 דקות)
roi FLOAT                           -- תשואה באחוזים
status TEXT DEFAULT 'ACTIVE'         -- ACTIVE, SUCCESS, FAILURE, EXPIRED
exit_price FLOAT                     -- מחיר יציאה (אם הסתיים)
exit_time TIMESTAMP                  -- זמן יציאה
```

**Indexes:**
- `idx_performance_status` - מיון לפי סטטוס
- `idx_performance_entry_time` - מיון לפי זמן כניסה
- `idx_performance_roi` - מיון לפי תשואה
- `idx_performance_entry_score` - מיון לפי ציון

**שימוש:**
```sql
-- כל הטוכנים הפעילים
SELECT * FROM performance_tracking WHERE status = 'ACTIVE';

-- טוכנים מוצלחים (50%+ רווח)
SELECT * FROM performance_tracking WHERE status = 'SUCCESS' ORDER BY roi DESC;
```

---

### 🎯 2. **smart_wallets** - Smart Money V2.0
**גרסה**: 2.0 (שדרוג מהפכני!)  
**תפקיד:** Smart Money wallets עם Trust Scores דינמיים שמתעדכנים לפי ביצועים

**עמודות עיקריות:**
```sql
address TEXT PRIMARY KEY             -- כתובת הארנק
nickname TEXT                        -- כינוי ידידותי (אופציונלי)
trust_score INTEGER DEFAULT 50      -- ציון אמון 0-100 (מתחיל ב-50)
total_trades INTEGER DEFAULT 0      -- סה"כ עסקאות שהבוט עקב אחריהן
successful_trades INTEGER DEFAULT 0 -- עסקאות מוצלחות (50%+ רווח)
failed_trades INTEGER DEFAULT 0     -- עסקאות כושלות (20%- הפסד)
success_rate FLOAT DEFAULT 0.0      -- אחוז הצלחה (מחושב אוטומטית!)
average_roi FLOAT DEFAULT 0.0       -- ROI ממוצע
discovered_from TEXT DEFAULT 'manual' -- איך התגלה: manual, first_buyer, performance
```

**Indexes:**
- `idx_smart_wallets_trust_score` - מיון לפי ציון אמון
- `idx_smart_wallets_success_rate` - מיון לפי אחוז הצלחה
- `idx_smart_wallets_discovered_from` - מיון לפי מקור גילוי

**🤖 עדכון אוטומטי:**
- `success_rate` מחושב אוטומטית בכל עדכון
- `trust_score` מתעדכן אוטומטית: +5 להצלחה, -3 לכישלון

**שימוש:**
```sql
-- Top Smart Wallets לפי ציון אמון
SELECT * FROM smart_wallets ORDER BY trust_score DESC LIMIT 10;

-- Smart Wallets שהתגלו אוטומטית
SELECT * FROM smart_wallets WHERE discovered_from = 'performance';
```

---

### 📚 3. **scanned_tokens_history** - תיעוד מלא
**גרסה**: 2.0 (חדש!)  
**תפקיד:** תיעוד מלא של כל הטוכנים שנסרקו עם מערכת הציון החדשה

**עמודות עיקריות:**
```sql
address TEXT PRIMARY KEY             -- כתובת הטוכן
symbol TEXT, name TEXT              -- זיהוי הטוכן
first_seen TIMESTAMP DEFAULT NOW()  -- מתי נראה לראשונה

-- 🆕 מערכת ציון חדשה (100 נקודות!)
final_score INTEGER                  -- ציון סופי 0-100
grade TEXT                          -- S+, S, A+, A, B+, B, C+, C, F
category TEXT                       -- LEGENDARY, EXCELLENT, GOOD, FAIR, POOR
safety_score INTEGER                -- בטיחות 0-25 (היה 0-60)
holder_score INTEGER                -- מחזיקים 0-20
liquidity_score INTEGER             -- נזילות 0-25 (חדש! 🔥)
volume_score INTEGER                -- volume 0-15 (חדש! 🔥)
smart_money_score INTEGER           -- smart money 0-10 (היה 0-15)
price_action_score INTEGER          -- momentum 0-5 (חדש! 🔥)

-- נתוני שוק מתקדמים
liquidity_sol FLOAT                 -- נזילות ב-SOL
volume_24h FLOAT                    -- volume 24h ב-USD
price_usd FLOAT                     -- מחיר ב-USD
market_cap FLOAT                    -- שווי שוק
holder_count INTEGER                -- מספר מחזיקים
smart_money_count INTEGER           -- מספר Smart Money wallets

-- מטה-דאטה
source TEXT DEFAULT 'dexscreener'   -- dexscreener, helius, pumpfun
status TEXT DEFAULT 'active'        -- active, success, failure, scam
```

**Indexes:**
- `idx_scanned_tokens_final_score` - מיון לפי ציון סופי
- `idx_scanned_tokens_first_seen` - מיון לפי זמן גילוי
- `idx_scanned_tokens_liquidity_score` - מיון לפי ציון נזילות
- `idx_scanned_tokens_status` - מיון לפי סטטוס
- `idx_scanned_tokens_source` - מיון לפי מקור

**שימוש:**
```sql
-- טוכנים עם ציון גבוה מהיום האחרון
SELECT * FROM scanned_tokens_history 
WHERE final_score >= 85 AND first_seen >= NOW() - INTERVAL '1 day'
ORDER BY final_score DESC;

-- טוכנים עם נזילות גבוהה
SELECT * FROM scanned_tokens_history 
WHERE liquidity_score >= 20 
ORDER BY liquidity_sol DESC;
```

---

### 🔗 4. **wallet_token_holdings** - קשרים חכמים
**גרסה**: 2.0 (חדש!)  
**תפקיד:** מעקב אחרי קשרים בין Smart Wallets לטוכנים שהם מחזיקים

**עמודות עיקריות:**
```sql
id SERIAL PRIMARY KEY               -- מזהה יחיד
wallet_address TEXT NOT NULL       -- כתובת הארנק
token_address TEXT NOT NULL        -- כתובת הטוכן
first_detected TIMESTAMP DEFAULT NOW() -- מתי זוהה לראשונה
last_seen TIMESTAMP DEFAULT NOW()      -- מתי נראה לאחרונה
is_active BOOLEAN DEFAULT TRUE     -- האם עדיין מחזיק
```

**Foreign Keys:**
- `wallet_address` → `smart_wallets(address)`
- `token_address` → `scanned_tokens_history(address)`

**Indexes:**
- `idx_wallet_holdings_wallet` - חיפוש לפי ארנק
- `idx_wallet_holdings_token` - חיפוש לפי טוכן
- `idx_wallet_holdings_active` - רק החזקות פעילות

**שימוש:**
```sql
-- מה ארנק ספציפי מחזיק
SELECT * FROM wallet_token_holdings 
WHERE wallet_address = 'So11111...' AND is_active = true;

-- איזה Smart Wallets מחזיקים בטוכן ספציפי
SELECT sw.nickname, sw.trust_score
FROM wallet_token_holdings wth
JOIN smart_wallets sw ON sw.address = wth.wallet_address
WHERE wth.token_address = 'DezXAZ8z7...' AND wth.is_active = true;
```

---

## 📊 Views אנליטיים V2.0

### 🎯 **smart_wallets_stats** - סטטיסטיקות Smart Wallets
**גרסה**: 2.0 (חדש!)

```sql
CREATE VIEW smart_wallets_stats AS
SELECT 
    sw.address,
    sw.nickname,
    sw.trust_score,
    sw.total_trades,
    sw.success_rate,
    COUNT(wth.token_address) as tokens_held,  -- כמה טוכנים מחזיק
    sw.created_at
FROM smart_wallets sw
LEFT JOIN wallet_token_holdings wth ON sw.address = wth.wallet_address 
    AND wth.is_active = true
GROUP BY sw.address, sw.nickname, sw.trust_score, sw.total_trades, 
         sw.success_rate, sw.created_at
ORDER BY sw.trust_score DESC;
```

**שימוש:**
```sql
-- Top 10 Smart Wallets
SELECT * FROM smart_wallets_stats LIMIT 10;
```

---

### 📈 **bot_performance_summary** - ביצועי הבוט
**גרסה**: 2.0 (חדש!)

```sql
CREATE VIEW bot_performance_summary AS
SELECT 
    COUNT(*) as total_tracked,
    COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as successes,
    COUNT(CASE WHEN status = 'FAILURE' THEN 1 END) as failures,
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
    ROUND(AVG(roi), 2) as avg_roi,
    ROUND(COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(CASE WHEN status IN ('SUCCESS', 'FAILURE') THEN 1 END), 0), 1) 
          as success_rate_pct
FROM performance_tracking;
```

**שימוש:**
```sql
-- ביצועי הבוט הכלליים
SELECT * FROM bot_performance_summary;
-- תוצאה: total_tracked=45, successes=28, success_rate_pct=62.2, avg_roi=34.7
```

---

## 🤖 פונקציות חכמות V2.0

### 🛠️ **add_smart_wallet()** - הוספת Smart Wallet
**גרסה**: 2.0 (חדש!)

```sql
-- הוספת ארנק חדש
SELECT add_smart_wallet('So11111...', 'Whale Hunter', 'manual');

-- הוספה אוטומטית (למערכת הלמידה)
SELECT add_smart_wallet('ABC123...', NULL, 'performance');
```

**פרמטרים:**
- `p_address`: כתובת הארנק
- `p_nickname`: כינוי (אופציונלי)
- `p_discovered_from`: מקור הגילוי

**החזרה:** `TRUE` אם נוסף, `FALSE` אם כבר קיים

---

### 📈 **update_trust_score()** - עדכון ציון אמון
**גרסה**: 2.0 (הלב של מערכת הלמידה!)

```sql
-- עדכון אחרי הצלחה (+5 נקודות)
SELECT update_trust_score('So11111...', TRUE);

-- עדכון אחרי כישלון (-3 נקודות)
SELECT update_trust_score('So11111...', FALSE);
```

**איך זה עובד:**
1. מעדכן `total_trades`, `successful_trades`, `failed_trades`
2. מחשב `trust_score` חדש: +5 להצלחה, -3 לכישלון
3. `success_rate` מתעדכן אוטומטית בטריגר
4. אם הארנק לא קיים - יוסיף אותו אוטומטית!

---

### 📝 **log_scanned_token()** - תיעוד טוכן
**גרסה**: 2.0 (תומך במערכת הציון החדשה!)

```sql
SELECT log_scanned_token(
    'DezXAZ8z7Pnr...',  -- כתובת
    'BONK',             -- סימבול
    'Bonk Inu',         -- שם
    87,                 -- ציון סופי
    'A',                -- דירוג
    'EXCELLENT',        -- קטגוריה
    22, 18, 25, 12, 8, 2, -- ציונים חלקיים (חדש!)
    1234.5,             -- נזילות SOL
    567890.0,           -- volume 24h
    0.00001234,         -- מחיר USD
    5670000.0,          -- market cap
    15420,              -- holder count
    3,                  -- smart money count
    'dexscreener'       -- מקור
);
```

**מה הפונקציה עושה:**
- רושמת טוכן בהיסטוריה עם כל הנתונים
- תומכת במערכת הציון החדשה (100 נקודות)
- אם הטוכן כבר קיים - מעדכנת את הנתונים

---

## ⚡ טריגרים אוטומטיים V2.0

### 🔄 **Smart Wallets Auto-Update**
```sql
-- מתעדכן אוטומטית בכל UPDATE:
-- 1. updated_at = NOW()
-- 2. success_rate = (successful_trades / total_trades) * 100
```

### 🔄 **Performance Tracking Auto-Update**
```sql
-- מתעדכן אוטומטית בכל UPDATE:
-- 1. updated_at = NOW()
```

---

## 🔍 שאילתות שימושיות V2.0

### 🎯 **מציאת טוכנים מעולים**
```sql
SELECT s.symbol, s.final_score, s.liquidity_sol, s.volume_24h,
       CASE WHEN p.status = 'SUCCESS' THEN p.roi ELSE NULL END as actual_roi
FROM scanned_tokens_history s
LEFT JOIN performance_tracking p ON s.address = p.address
WHERE s.final_score >= 85
ORDER BY s.final_score DESC;
```

### 🧠 **ביצועי Smart Wallets**
```sql
SELECT sw.nickname, sw.trust_score, sw.success_rate,
       COUNT(wth.token_address) as tokens_held,
       AVG(p.roi) as avg_roi_from_recommendations
FROM smart_wallets sw
LEFT JOIN wallet_token_holdings wth ON sw.address = wth.wallet_address
LEFT JOIN performance_tracking p ON wth.token_address = p.address
WHERE sw.trust_score >= 60
GROUP BY sw.address, sw.nickname, sw.trust_score, sw.success_rate
ORDER BY sw.trust_score DESC;
```

### 📊 **אנליזת מקורות**
```sql
SELECT source,
       COUNT(*) as total_tokens,
       AVG(final_score) as avg_score,
       AVG(liquidity_sol) as avg_liquidity
FROM scanned_tokens_history
WHERE first_seen >= NOW() - INTERVAL '7 days'
GROUP BY source
ORDER BY avg_score DESC;
```

---

## 🎊 סיכום V2.0

### 🆕 **מה חדש:**
- 🧠 **4 טבלאות חדשות** עם מערכת למידה
- 📊 **מערכת ציון 100 נקודות** (במקום 95)
- 🎯 **Trust Scores דינמיים** לSmart Wallets
- 🚨 **מעקב ביצועים בזמן אמת**
- 📈 **Views אנליטיים מתקדמים**
- 🤖 **פונקציות חכמות** לניהול אוטומטי

### ⚡ **ביצועים:**
- 12 indexes חדשים לשאילתות מהירות
- טריגרים אוטומטיים לעדכון נתונים
- Foreign keys לשמירה על תקינות הנתונים

### 🎯 **התוצאה:**
בוט שלא רק מזהה טוכנים טובים, אלא **לומד מהביצועים ומשתפר כל יום**!

---

**גרסה**: 2.0  
**תאריך**: ינואר 2026  
**מפתח**: Claude AI + Cursor  
**מיגרציה**: `002_claude_ai_upgrades.sql`  

🚀 **Ready for the future of Solana trading!**