# 📊 סקירת Schema - SolanaHunter Database

## 🗂️ מבנה כללי

המסד נתונים מורכב מ-8 טבלאות עיקריות:

```
tokens (טבלה ראשית)
  ├── trades (טרנזקציות)
  ├── positions (פוזיציות)
  ├── alerts (התראות)
  ├── watched_tokens (מעקב)
  └── favorites (מועדפים)

smart_wallets (ארנקים חכמים)
bot_stats (סטטיסטיקות)
```

## 📋 טבלאות מפורטות

### 1. **tokens** - טבלה ראשית

**תפקיד:** שמירת כל הטוקנים שנסרקו ונותחו

**עמודות עיקריות:**
- `address` (TEXT, UNIQUE) - כתובת הטוקן
- `symbol`, `name` - שם הטוקן
- `final_score` (0-100) - ציון סופי
- `safety_score`, `holder_score`, `smart_money_score` - ציונים חלקיים
- `ownership_renounced`, `liquidity_locked` - בדיקות בטיחות
- `holder_count`, `smart_money_count` - ניתוח מחזיקים
- `status` - 'active', 'dead', 'rug_pull'

**Indexes:**
- `idx_tokens_address` - חיפוש לפי כתובת
- `idx_tokens_score` - מיון לפי ציון
- `idx_tokens_created` - מיון לפי תאריך יצירה

### 2. **smart_wallets** - ארנקים חכמים

**תפקיד:** שמירת ארנקים שזוהו כ-Smart Money

**עמודות עיקריות:**
- `wallet_address` (TEXT, PRIMARY KEY) - כתובת הארנק
- `total_trades`, `profitable_trades` - סטטיסטיקות
- `success_rate` (0-100) - אחוז הצלחה
- `avg_profit_pct` - רווח ממוצע באחוזים
- `is_active` - האם הארנק פעיל

**קשרים:**
- אין Foreign Keys (טבלה עצמאית)

### 3. **trades** - טרנזקציות

**תפקיד:** שמירת כל הקניות והמכירות

**עמודות עיקריות:**
- `id` (UUID, PRIMARY KEY)
- `token_address` (TEXT, FK → tokens.address)
- `type` - 'buy' או 'sell'
- `amount_usd`, `amount_tokens`, `price` - פרטי הטרנזקציה
- `tx_signature` (TEXT, UNIQUE) - חתימת הטרנזקציה
- `profit_usd`, `profit_pct` - רווח/הפסד (למכירות)
- `strategy` - 'dca', 'market', 'limit'

**קשרים:**
- `token_address` → `tokens.address`

**Indexes:**
- `idx_trades_token` - חיפוש לפי טוקן
- `idx_trades_executed` - מיון לפי תאריך
- `idx_trades_tx_signature` - חיפוש לפי חתימה

### 4. **positions** - פוזיציות פעילות

**תפקיד:** שמירת פוזיציות פתוחות

**עמודות עיקריות:**
- `id` (UUID, PRIMARY KEY)
- `token_address` (TEXT, FK → tokens.address)
- `token_symbol`, `token_mint` - פרטי הטוקן
- `amount_tokens`, `entry_price` - פרטי הכניסה
- `stop_loss_price`, `take_profit_1_price`, `take_profit_2_price` - יעדי יציאה
- `status` - 'open', 'closed', 'stop_loss', 'take_profit', 'time_limit', 'emergency_exit'
- `unrealized_pnl_usd`, `unrealized_pnl_pct` - P&L לא ממומש
- `expires_at` - תאריך תפוגה (7 ימים)

**קשרים:**
- `token_address` → `tokens.address`

**Indexes:**
- `idx_positions_token` - חיפוש לפי טוקן
- `idx_positions_status` - חיפוש לפי סטטוס
- `idx_positions_expires` - חיפוש לפי תאריך תפוגה

### 5. **alerts** - התראות

**תפקיד:** שמירת כל ההתראות שנשלחו

**עמודות עיקריות:**
- `id` (UUID, PRIMARY KEY)
- `type` - 'high_score', 'stop_loss', 'take_profit', 'time_limit', 'emergency', 'trade_executed'
- `token_address` (TEXT, FK → tokens.address)
- `message` - תוכן ההתראה
- `sent_at`, `sent_via` - מתי ואיך נשלחה
- `user_action` - 'buy', 'ignore', 'watch', 'no_action'
- `is_read` - האם נקראה

**קשרים:**
- `token_address` → `tokens.address`

**Indexes:**
- `idx_alerts_token` - חיפוש לפי טוקן
- `idx_alerts_type` - חיפוש לפי סוג
- `idx_alerts_sent` - מיון לפי תאריך

### 6. **watched_tokens** - טוקנים במעקב

**תפקיד:** טוקנים שהמשתמש עוקב אחריהם

**עמודות:**
- `token_address` (TEXT, PRIMARY KEY, FK → tokens.address)
- `added_at` - מתי נוסף למעקב

**קשרים:**
- `token_address` → `tokens.address` (ON DELETE CASCADE)

### 7. **favorites** - מועדפים

**תפקיד:** טוקנים שהמשתמש סימן כמועדפים

**עמודות:**
- `token_address` (TEXT, PRIMARY KEY, FK → tokens.address)
- `added_at` - מתי נוסף למועדפים

**קשרים:**
- `token_address` → `tokens.address` (ON DELETE CASCADE)

### 8. **bot_stats** - סטטיסטיקות

**תפקיד:** סטטיסטיקות יומיות של הבוט

**עמודות:**
- `id` (UUID, PRIMARY KEY)
- `date` (DATE, UNIQUE) - תאריך
- `tokens_scanned`, `tokens_analyzed` - סטטיסטיקות סריקה
- `alerts_sent` - התראות שנשלחו
- `trades_executed`, `total_volume_usd` - סטטיסטיקות מסחר
- `profitable_trades`, `total_profit_usd` - ביצועים

## 🔍 Views

### 1. **active_positions_view**
מציג את כל הפוזיציות הפעילות עם P&L מעודכן

**עמודות:**
- כל העמודות מ-`positions`
- `symbol`, `name`, `final_score` מ-`tokens`
- `pnl_usd`, `pnl_pct` - מחושבים

### 2. **top_tokens_view**
מציג את הטופ 100 טוקנים לפי ציון

**עמודות:**
- כל העמודות מ-`tokens`
- `rank` - דירוג (1-100)

### 3. **trade_performance_view**
סיכום ביצועים לפי טוקן

**עמודות:**
- `token_symbol`
- `total_trades` - סה"כ טרנזקציות
- `total_bought_usd`, `total_sold_usd` - סכומים
- `total_profit_usd`, `avg_profit_pct` - רווחים
- `winning_trades`, `losing_trades` - סטטיסטיקות

## 🔗 קשרים בין טבלאות

```
tokens (1) ──→ (N) trades
tokens (1) ──→ (N) positions
tokens (1) ──→ (N) alerts
tokens (1) ──→ (1) watched_tokens
tokens (1) ──→ (1) favorites
```

## 📊 דוגמאות שאילתות

### קבלת טופ 10 טוקנים
```sql
SELECT * FROM top_tokens_view LIMIT 10;
```

### קבלת פוזיציות פעילות
```sql
SELECT * FROM active_positions_view;
```

### קבלת ביצועים לפי טוקן
```sql
SELECT * FROM trade_performance_view 
ORDER BY total_profit_usd DESC;
```

### חיפוש טוקן לפי כתובת
```sql
SELECT * FROM tokens 
WHERE address = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
```

### קבלת התראות אחרונות
```sql
SELECT * FROM alerts 
ORDER BY sent_at DESC 
LIMIT 20;
```

## 🔧 תחזוקה

### ניקוי טבלאות ישנות
```sql
-- מחיקת טוקנים ישנים (יותר מ-30 יום)
DELETE FROM tokens 
WHERE last_analyzed_at < NOW() - INTERVAL '30 days';

-- מחיקת התראות ישנות (יותר מ-90 יום)
DELETE FROM alerts 
WHERE sent_at < NOW() - INTERVAL '90 days';
```

### עדכון סטטיסטיקות
```sql
-- עדכון P&L של פוזיציות
UPDATE positions 
SET 
  current_value_usd = amount_tokens * current_price,
  unrealized_pnl_usd = (amount_tokens * current_price) - entry_value_usd,
  unrealized_pnl_pct = ((amount_tokens * current_price) - entry_value_usd) / entry_value_usd * 100
WHERE status = 'open';
```

---

**זה הכל! 🚀**
