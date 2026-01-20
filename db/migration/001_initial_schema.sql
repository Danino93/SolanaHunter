-- ============================================
-- SolanaHunter Database Schema
-- ============================================
-- 
-- 📋 מה הקובץ הזה עושה:
-- -------------------
-- יוצר את כל הטבלאות הנדרשות לפרויקט SolanaHunter
-- 
-- שימוש:
-- 1. העתק את כל התוכן הזה
-- 2. פתח את Supabase Dashboard
-- 3. לך ל-SQL Editor
-- 4. הדבק והרץ את כל ה-SQL
-- 
-- ⚠️ חשוב:
-- - ודא שיש לך הרשאות ליצור טבלאות
-- - אם יש טבלאות קיימות, ייתכן שתצטרך למחוק אותן קודם
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TOKENS TABLE
-- ============================================
-- טבלה ראשית לשמירת כל הטוקנים שנסרקו ונותחו

CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT UNIQUE NOT NULL,
  symbol TEXT,
  name TEXT,
  decimals INTEGER,
  supply BIGINT,
  
  -- Scores (0-100)
  safety_score INTEGER DEFAULT 0,
  holder_score INTEGER DEFAULT 0,
  smart_money_score INTEGER DEFAULT 0,
  final_score INTEGER DEFAULT 0,
  
  -- Grade & Category
  grade TEXT,  -- A+, A, B+, B, C+, C, D, F
  category TEXT,  -- EXCELLENT, GOOD, FAIR, POOR
  
  -- Analysis results
  ownership_renounced BOOLEAN DEFAULT FALSE,
  liquidity_locked BOOLEAN DEFAULT FALSE,
  mint_authority_disabled BOOLEAN DEFAULT FALSE,
  
  -- Holder analysis
  holder_count INTEGER DEFAULT 0,
  top_10_percentage FLOAT DEFAULT 0.0,
  smart_money_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active',  -- active, dead, rug_pull, suspended
  
  -- Timestamps
  created_at TIMESTAMP,
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_analyzed_at TIMESTAMP DEFAULT NOW(),
  
  -- Extra data (JSON)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT valid_score CHECK (final_score >= 0 AND final_score <= 100),
  CONSTRAINT valid_safety_score CHECK (safety_score >= 0 AND safety_score <= 100),
  CONSTRAINT valid_holder_score CHECK (holder_score >= 0 AND holder_score <= 100),
  CONSTRAINT valid_smart_money_score CHECK (smart_money_score >= 0 AND smart_money_score <= 100)
);

-- Indexes for tokens
CREATE INDEX IF NOT EXISTS idx_tokens_address ON tokens(address);
CREATE INDEX IF NOT EXISTS idx_tokens_score ON tokens(final_score DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_created ON tokens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);
CREATE INDEX IF NOT EXISTS idx_tokens_analyzed ON tokens(last_analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_symbol ON tokens(symbol);

-- ============================================
-- 2. SMART_WALLETS TABLE
-- ============================================
-- טבלה לשמירת ארנקים חכמים (Smart Money)

CREATE TABLE IF NOT EXISTS smart_wallets (
  wallet_address TEXT PRIMARY KEY,
  nickname TEXT,
  
  -- Performance metrics
  total_trades INTEGER DEFAULT 0,
  profitable_trades INTEGER DEFAULT 0,
  success_rate FLOAT DEFAULT 0.0,
  
  -- Profit stats
  avg_profit_pct FLOAT DEFAULT 0.0,
  biggest_win_pct FLOAT DEFAULT 0.0,
  total_profit_usd FLOAT DEFAULT 0.0,
  
  -- Tracking
  tracked_since TIMESTAMP DEFAULT NOW(),
  last_trade_at TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT NOW(),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Extra data
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT valid_success_rate CHECK (success_rate >= 0 AND success_rate <= 100),
  CONSTRAINT valid_avg_profit CHECK (avg_profit_pct >= -100 AND avg_profit_pct <= 10000)
);

-- Indexes for smart_wallets
CREATE INDEX IF NOT EXISTS idx_smart_wallets_active ON smart_wallets(is_active);
CREATE INDEX IF NOT EXISTS idx_smart_wallets_success_rate ON smart_wallets(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_smart_wallets_last_seen ON smart_wallets(last_seen_at DESC);

-- ============================================
-- 3. TRADES TABLE
-- ============================================
-- טבלה לשמירת כל הטרנזקציות (קנייה ומכירה)

CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Token reference
  token_address TEXT REFERENCES tokens(address) ON DELETE SET NULL,
  token_symbol TEXT,
  
  -- Trade details
  type TEXT NOT NULL,  -- 'buy' or 'sell'
  amount_usd FLOAT NOT NULL,
  amount_tokens FLOAT NOT NULL,
  price FLOAT NOT NULL,
  
  -- Execution
  executed_at TIMESTAMP DEFAULT NOW(),
  tx_signature TEXT UNIQUE,
  
  -- Performance (for sells)
  entry_price FLOAT,  -- מחיר כניסה (רק למכירות)
  profit_usd FLOAT,  -- רווח/הפסד ב-USD
  profit_pct FLOAT,  -- רווח/הפסד באחוזים
  
  -- Strategy info
  strategy TEXT,  -- 'dca', 'market', 'limit'
  stage INTEGER,  -- שלב ב-DCA (1, 2, 3)
  
  -- Status
  status TEXT DEFAULT 'completed',  -- completed, failed, pending
  
  -- Extra data
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT valid_trade_type CHECK (type IN ('buy', 'sell')),
  CONSTRAINT valid_amount CHECK (amount_usd > 0 AND amount_tokens > 0),
  CONSTRAINT valid_price CHECK (price > 0)
);

-- Indexes for trades
CREATE INDEX IF NOT EXISTS idx_trades_token ON trades(token_address);
CREATE INDEX IF NOT EXISTS idx_trades_executed ON trades(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_type ON trades(type);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_tx_signature ON trades(tx_signature);

-- ============================================
-- 4. POSITIONS TABLE
-- ============================================
-- טבלה לשמירת פוזיציות פעילות

CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Token reference
  token_address TEXT REFERENCES tokens(address) ON DELETE SET NULL,
  token_symbol TEXT NOT NULL,
  token_mint TEXT NOT NULL,  -- כתובת הטוקן (למקרה ש-token_address NULL)
  
  -- Position details
  amount_tokens FLOAT NOT NULL,
  entry_price FLOAT NOT NULL,
  entry_value_usd FLOAT NOT NULL,
  
  -- Risk management
  stop_loss_price FLOAT,
  stop_loss_pct FLOAT DEFAULT 0.15,  -- 15% stop loss
  take_profit_1_price FLOAT,  -- x2 target
  take_profit_2_price FLOAT,  -- x5 target
  trailing_stop_active BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT DEFAULT 'open',  -- open, partial, closed, stop_loss, take_profit, time_limit, emergency_exit
  opened_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  
  -- Performance (updated in real-time)
  current_price FLOAT,
  current_value_usd FLOAT,
  unrealized_pnl_usd FLOAT DEFAULT 0.0,
  unrealized_pnl_pct FLOAT DEFAULT 0.0,
  realized_pnl_usd FLOAT DEFAULT 0.0,
  
  -- Time limits
  time_limit_days INTEGER DEFAULT 7,  -- 7 days max
  expires_at TIMESTAMP,
  
  -- Transactions
  buy_transactions TEXT[],  -- Array of transaction signatures
  
  -- Extra data
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT valid_amount CHECK (amount_tokens > 0),
  CONSTRAINT valid_entry_price CHECK (entry_price > 0),
  CONSTRAINT valid_status CHECK (status IN ('open', 'partial', 'closed', 'stop_loss', 'take_profit', 'time_limit', 'emergency_exit'))
);

-- Indexes for positions
CREATE INDEX IF NOT EXISTS idx_positions_token ON positions(token_address);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_opened ON positions(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_expires ON positions(expires_at);

-- ============================================
-- 5. ALERTS TABLE
-- ============================================
-- טבלה לשמירת התראות שנשלחו

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Alert details
  type TEXT NOT NULL,  -- 'high_score', 'stop_loss', 'take_profit', 'time_limit', 'emergency', 'trade_executed'
  token_address TEXT REFERENCES tokens(address) ON DELETE SET NULL,
  token_symbol TEXT,
  message TEXT NOT NULL,
  
  -- Scores (for high_score alerts)
  final_score INTEGER,
  safety_score INTEGER,
  
  -- Delivery
  sent_at TIMESTAMP DEFAULT NOW(),
  sent_via TEXT DEFAULT 'telegram',  -- 'telegram', 'email', 'sms'
  sent_to TEXT,  -- recipient identifier
  
  -- User interaction
  user_action TEXT,  -- 'buy', 'ignore', 'watch', 'no_action'
  action_at TIMESTAMP,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Extra data
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT valid_alert_type CHECK (type IN ('high_score', 'stop_loss', 'take_profit', 'time_limit', 'emergency', 'trade_executed', 'other'))
);

-- Indexes for alerts
CREATE INDEX IF NOT EXISTS idx_alerts_token ON alerts(token_address);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_sent ON alerts(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(is_read);

-- ============================================
-- 6. WATCHED_TOKENS TABLE (Optional)
-- ============================================
-- טבלה לשמירת טוקנים במעקב

CREATE TABLE IF NOT EXISTS watched_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_address TEXT REFERENCES tokens(address) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  
  PRIMARY KEY (token_address)
);

-- Indexes for watched_tokens
CREATE INDEX IF NOT EXISTS idx_watched_tokens_added ON watched_tokens(added_at DESC);

-- ============================================
-- 7. FAVORITES TABLE (Optional)
-- ============================================
-- טבלה לשמירת טוקנים מועדפים

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_address TEXT REFERENCES tokens(address) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  
  PRIMARY KEY (token_address)
);

-- Indexes for favorites
CREATE INDEX IF NOT EXISTS idx_favorites_added ON favorites(added_at DESC);

-- ============================================
-- 8. BOT_STATS TABLE (Optional)
-- ============================================
-- טבלה לשמירת סטטיסטיקות כלליות של הבוט

CREATE TABLE IF NOT EXISTS bot_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE DEFAULT CURRENT_DATE,
  
  -- Scan stats
  tokens_scanned INTEGER DEFAULT 0,
  tokens_analyzed INTEGER DEFAULT 0,
  high_score_count INTEGER DEFAULT 0,
  
  -- Alert stats
  alerts_sent INTEGER DEFAULT 0,
  
  -- Trade stats
  trades_executed INTEGER DEFAULT 0,
  total_volume_usd FLOAT DEFAULT 0.0,
  
  -- Performance
  profitable_trades INTEGER DEFAULT 0,
  total_profit_usd FLOAT DEFAULT 0.0,
  
  -- Updated timestamp
  updated_at TIMESTAMP DEFAULT NOW(),
  
  PRIMARY KEY (id)
);

-- Indexes for bot_stats
CREATE INDEX IF NOT EXISTS idx_bot_stats_date ON bot_stats(date DESC);

-- ============================================
-- VIEWS (Optional - for easier queries)
-- ============================================

-- View: Active positions with current P&L
CREATE OR REPLACE VIEW active_positions_view AS
SELECT 
  p.*,
  t.symbol,
  t.name,
  t.final_score,
  (p.current_value_usd - p.entry_value_usd) as pnl_usd,
  ((p.current_value_usd - p.entry_value_usd) / p.entry_value_usd * 100) as pnl_pct
FROM positions p
LEFT JOIN tokens t ON p.token_address = t.address
WHERE p.status = 'open';

-- View: Top tokens by score
CREATE OR REPLACE VIEW top_tokens_view AS
SELECT 
  *,
  ROW_NUMBER() OVER (ORDER BY final_score DESC, last_analyzed_at DESC) as rank
FROM tokens
WHERE status = 'active'
ORDER BY final_score DESC, last_analyzed_at DESC
LIMIT 100;

-- View: Trade performance summary
CREATE OR REPLACE VIEW trade_performance_view AS
SELECT 
  token_symbol,
  COUNT(*) as total_trades,
  SUM(CASE WHEN type = 'buy' THEN amount_usd ELSE 0 END) as total_bought_usd,
  SUM(CASE WHEN type = 'sell' THEN amount_usd ELSE 0 END) as total_sold_usd,
  SUM(CASE WHEN type = 'sell' THEN profit_usd ELSE 0 END) as total_profit_usd,
  AVG(CASE WHEN type = 'sell' THEN profit_pct ELSE NULL END) as avg_profit_pct,
  COUNT(CASE WHEN type = 'sell' AND profit_usd > 0 THEN 1 END) as winning_trades,
  COUNT(CASE WHEN type = 'sell' AND profit_usd <= 0 THEN 1 END) as losing_trades
FROM trades
WHERE status = 'completed'
GROUP BY token_symbol;

-- ============================================
-- FUNCTIONS (Optional - for automation)
-- ============================================

-- Function: Update position P&L
CREATE OR REPLACE FUNCTION update_position_pnl()
RETURNS TRIGGER AS $$
BEGIN
  -- This would be called when current_price is updated
  -- For now, it's a placeholder
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE tokens IS 'טבלה ראשית לשמירת כל הטוקנים שנסרקו ונותחו';
COMMENT ON TABLE smart_wallets IS 'טבלה לשמירת ארנקים חכמים (Smart Money)';
COMMENT ON TABLE trades IS 'טבלה לשמירת כל הטרנזקציות (קנייה ומכירה)';
COMMENT ON TABLE positions IS 'טבלה לשמירת פוזיציות פעילות';
COMMENT ON TABLE alerts IS 'טבלה לשמירת התראות שנשלחו';
COMMENT ON TABLE watched_tokens IS 'טבלה לשמירת טוקנים במעקב';
COMMENT ON TABLE favorites IS 'טבלה לשמירת טוקנים מועדפים';
COMMENT ON TABLE bot_stats IS 'טבלה לשמירת סטטיסטיקות כלליות של הבוט';

-- ============================================
-- END OF MIGRATION
-- ============================================
-- 
-- ✅ כל הטבלאות נוצרו בהצלחה!
-- 
-- 📝 הערות:
-- - כל הטבלאות עם constraints ו-indexes
-- - Foreign keys מוגדרים נכון
-- - Timestamps עם DEFAULT NOW()
-- - JSONB fields ל-metadata גמיש
-- 
-- 🔍 איך לבדוק:
-- 1. לך ל-Supabase Dashboard
-- 2. פתח את Table Editor
-- 3. ודא שכל הטבלאות מופיעות
-- 
-- 🚀 מוכן לשימוש!
