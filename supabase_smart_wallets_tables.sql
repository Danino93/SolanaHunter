-- ============================================================================
-- טבלאות Smart Wallets + Token History עבור SolanaHunter  
-- ============================================================================
-- צריך להריץ את זה ב-Supabase Dashboard > SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. טבלת Smart Wallets עם Trust Scores
-- ============================================================================
CREATE TABLE smart_wallets (
    address TEXT PRIMARY KEY,
    nickname TEXT,
    trust_score INTEGER DEFAULT 50,  -- 0-100
    total_trades INTEGER DEFAULT 0,
    successful_trades INTEGER DEFAULT 0,
    failed_trades INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 0.0,
    average_roi FLOAT DEFAULT 0.0,
    discovered_from TEXT,  -- 'manual', 'first_buyer', 'performance'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for smart_wallets
CREATE INDEX idx_smart_wallets_trust_score ON smart_wallets(trust_score);
CREATE INDEX idx_smart_wallets_success_rate ON smart_wallets(success_rate);
CREATE INDEX idx_smart_wallets_discovered_from ON smart_wallets(discovered_from);

-- ============================================================================
-- 2. טבלת היסטוריית טוקנים
-- ============================================================================
CREATE TABLE scanned_tokens_history (
    address TEXT PRIMARY KEY,
    symbol TEXT,
    name TEXT,
    first_seen TIMESTAMP WITH TIME ZONE,
    final_score INTEGER,
    grade TEXT,
    category TEXT,
    safety_score INTEGER,
    holder_score INTEGER,
    liquidity_score INTEGER,
    volume_score INTEGER,
    smart_money_score INTEGER,
    price_action_score INTEGER,
    liquidity_sol FLOAT,
    volume_24h FLOAT,
    price_usd FLOAT,
    market_cap FLOAT,
    holder_count INTEGER,
    smart_money_count INTEGER,
    source TEXT,  -- 'dexscreener', 'helius', 'pumpfun'
    status TEXT DEFAULT 'active',  -- 'active', 'success', 'failure', 'scam'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for scanned_tokens_history  
CREATE INDEX idx_scanned_tokens_final_score ON scanned_tokens_history(final_score);
CREATE INDEX idx_scanned_tokens_first_seen ON scanned_tokens_history(first_seen);
CREATE INDEX idx_scanned_tokens_status ON scanned_tokens_history(status);
CREATE INDEX idx_scanned_tokens_source ON scanned_tokens_history(source);
CREATE INDEX idx_scanned_tokens_smart_money_count ON scanned_tokens_history(smart_money_count);

-- ============================================================================
-- 3. טבלת קשרים בין Smart Wallets לטוקנים
-- ============================================================================
CREATE TABLE wallet_token_holdings (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    token_address TEXT NOT NULL,
    first_detected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (wallet_address) REFERENCES smart_wallets(address) ON DELETE CASCADE,
    FOREIGN KEY (token_address) REFERENCES scanned_tokens_history(address) ON DELETE CASCADE,
    UNIQUE(wallet_address, token_address)
);

-- Indexes for wallet_token_holdings
CREATE INDEX idx_wallet_holdings_wallet ON wallet_token_holdings(wallet_address);
CREATE INDEX idx_wallet_holdings_token ON wallet_token_holdings(token_address);
CREATE INDEX idx_wallet_holdings_active ON wallet_token_holdings(is_active);

-- ============================================================================
-- 4. טריגרים לעדכון אוטומטי של updated_at
-- ============================================================================

-- Trigger for smart_wallets
CREATE OR REPLACE FUNCTION update_smart_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- אוטומטי: חישוב success_rate
    IF NEW.total_trades > 0 THEN
        NEW.success_rate = (NEW.successful_trades::FLOAT / NEW.total_trades::FLOAT) * 100;
    ELSE
        NEW.success_rate = 0.0;
    END IF;
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_smart_wallets_updated_at_trigger 
    BEFORE UPDATE ON smart_wallets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_smart_wallets_updated_at();

-- ============================================================================
-- 5. פונקציות עזר לניהול Smart Wallets
-- ============================================================================

-- פונקציה להוספת Smart Wallet חדש
CREATE OR REPLACE FUNCTION add_smart_wallet(
    p_address TEXT,
    p_nickname TEXT DEFAULT NULL,
    p_discovered_from TEXT DEFAULT 'manual'
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO smart_wallets (address, nickname, discovered_from)
    VALUES (p_address, p_nickname, p_discovered_from)
    ON CONFLICT (address) DO NOTHING;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- פונקציה לעדכון ציון Trust Score
CREATE OR REPLACE FUNCTION update_trust_score(
    p_address TEXT,
    p_was_successful BOOLEAN
) RETURNS VOID AS $$
BEGIN
    UPDATE smart_wallets 
    SET 
        total_trades = total_trades + 1,
        successful_trades = successful_trades + (CASE WHEN p_was_successful THEN 1 ELSE 0 END),
        failed_trades = failed_trades + (CASE WHEN NOT p_was_successful THEN 1 ELSE 0 END),
        -- Trust Score adjustment: +5 for success, -3 for failure
        trust_score = GREATEST(0, LEAST(100, 
            trust_score + (CASE WHEN p_was_successful THEN 5 ELSE -3 END)
        ))
    WHERE address = p_address;
END;
$$ LANGUAGE plpgsql;

-- פונקציה לרישום Token חדש
CREATE OR REPLACE FUNCTION log_scanned_token(
    p_address TEXT,
    p_symbol TEXT,
    p_name TEXT,
    p_final_score INTEGER,
    p_grade TEXT,
    p_category TEXT,
    p_safety_score INTEGER DEFAULT NULL,
    p_holder_score INTEGER DEFAULT NULL,
    p_liquidity_score INTEGER DEFAULT NULL,
    p_volume_score INTEGER DEFAULT NULL,
    p_smart_money_score INTEGER DEFAULT NULL,
    p_price_action_score INTEGER DEFAULT NULL,
    p_liquidity_sol FLOAT DEFAULT NULL,
    p_volume_24h FLOAT DEFAULT NULL,
    p_price_usd FLOAT DEFAULT NULL,
    p_market_cap FLOAT DEFAULT NULL,
    p_holder_count INTEGER DEFAULT NULL,
    p_smart_money_count INTEGER DEFAULT NULL,
    p_source TEXT DEFAULT 'unknown'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO scanned_tokens_history (
        address, symbol, name, first_seen, final_score, grade, category,
        safety_score, holder_score, liquidity_score, volume_score, 
        smart_money_score, price_action_score, liquidity_sol, volume_24h, 
        price_usd, market_cap, holder_count, smart_money_count, source
    )
    VALUES (
        p_address, p_symbol, p_name, NOW(), p_final_score, p_grade, p_category,
        p_safety_score, p_holder_score, p_liquidity_score, p_volume_score,
        p_smart_money_score, p_price_action_score, p_liquidity_sol, p_volume_24h,
        p_price_usd, p_market_cap, p_holder_count, p_smart_money_count, p_source
    )
    ON CONFLICT (address) DO UPDATE SET
        final_score = EXCLUDED.final_score,
        grade = EXCLUDED.grade,
        category = EXCLUDED.category,
        safety_score = EXCLUDED.safety_score,
        holder_score = EXCLUDED.holder_score,
        liquidity_score = EXCLUDED.liquidity_score,
        volume_score = EXCLUDED.volume_score,
        smart_money_score = EXCLUDED.smart_money_score,
        price_action_score = EXCLUDED.price_action_score,
        liquidity_sol = EXCLUDED.liquidity_sol,
        volume_24h = EXCLUDED.volume_24h,
        price_usd = EXCLUDED.price_usd,
        market_cap = EXCLUDED.market_cap,
        holder_count = EXCLUDED.holder_count,
        smart_money_count = EXCLUDED.smart_money_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. תוספת Comments לתיעוד
-- ============================================================================
COMMENT ON TABLE smart_wallets IS 'Smart Money wallets with trust scores and performance tracking';
COMMENT ON COLUMN smart_wallets.trust_score IS 'Trust score 0-100, updated based on performance';
COMMENT ON COLUMN smart_wallets.success_rate IS 'Success rate percentage, auto-calculated';
COMMENT ON COLUMN smart_wallets.discovered_from IS 'How this wallet was discovered';

COMMENT ON TABLE scanned_tokens_history IS 'Complete history of all tokens scanned by the bot';
COMMENT ON COLUMN scanned_tokens_history.final_score IS 'Final bot score 0-100';
COMMENT ON COLUMN scanned_tokens_history.status IS 'Token status: active, success, failure, scam';

COMMENT ON TABLE wallet_token_holdings IS 'Relationship between smart wallets and tokens they hold';

-- ============================================================================
-- 7. Sample Data (אופציונלי)
-- ============================================================================

-- הוספת כמה Smart Wallets לדוגמא (אופציונלי)
-- SELECT add_smart_wallet('wallet_address_1', 'Whale Hunter', 'manual');
-- SELECT add_smart_wallet('wallet_address_2', 'Diamond Hands', 'first_buyer');

-- בדיקה שהכל עובד
SELECT 'Smart Wallets tables created successfully!' as result;