-- ============================================
-- SolanaHunter V2.0 - Claude AI Upgrades
-- ============================================
-- 
-- 📋 מה הקובץ הזה עושה:
-- -------------------
-- מוסיף את כל השדרוגים שפיתח Claude AI לבוט SolanaHunter:
-- 1. מערכת למידה (Performance Tracking)
-- 2. Smart Wallets עם Trust Scores  
-- 3. היסטוריית טוכנים מלאה
-- 4. פונקציות חכמות לניהול
-- 
-- 🚀 מה חדש בגרסה 2.0:
-- -------------------
-- • מערכת ציון מתקדמת: Safety(25) + Holders(20) + Liquidity(25) + Volume(15) + SmartMoney(10) + PriceAction(5) = 100
-- • מעקב ביצועים בזמן אמת - הבוט לומד מהצלחות וכישלונות
-- • Smart Wallets עם Trust Scores דינמיים
-- • זיהוי Rug Pull בזמן אמת
-- • תיעוד מלא של כל הטוכנים שנסרקו
-- 
-- 📅 יצירה: ינואר 2026
-- 🤖 מפתח: Claude AI + Cursor
-- 
-- שימוש:
-- 1. העתק את כל התוכן הזה
-- 2. פתח את Supabase Dashboard > SQL Editor
-- 3. הדבק והרץ את כל ה-SQL
-- 4. בדוק שהכל הצליח בהודעות בסוף
-- 
-- ⚠️ הערות חשובות:
-- - ה-SQL הזה בטוח - לא ייכשל גם אם חלק כבר קיים
-- - כל הטבלאות יווצרו רק אם הן לא קיימות
-- - פונקציות יוחלפו אם הן כבר קיימות
-- - בסוף יש בדיקה מה בדיוק נוצר
-- ============================================

-- ============================================
-- 🧠 SECTION 1: PERFORMANCE TRACKING SYSTEM
-- ============================================
-- מערכת למידה שעוקבת אחרי כל טוכן שהבוט המליץ עליו
-- מודדת ROI, מעדכנת Trust Scores, ולומדת מטעויות

-- יצירת טבלת מעקב ביצועים (רק אם לא קיימת)
CREATE TABLE IF NOT EXISTS performance_tracking (
    address TEXT PRIMARY KEY,              -- כתובת הטוכן (מפתח ראשי)
    symbol TEXT NOT NULL,                  -- סימבול הטוכן (BONK, SOL, וכו')
    entry_price FLOAT NOT NULL,            -- מחיר בכניסה (USD)
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,  -- זמן כניסה
    entry_score INTEGER NOT NULL,          -- ציון שהבוט נתן (0-100)
    smart_wallets JSONB,                   -- רשימת Smart Wallets שהחזיקו
    current_price FLOAT,                   -- מחיר נוכחי (מתעדכן כל 5 דקות)
    roi FLOAT,                            -- תשואה באחוזים
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUCCESS, FAILURE, EXPIRED
    exit_price FLOAT,                     -- מחיר ביציאה (אם הסתיים)
    exit_time TIMESTAMP WITH TIME ZONE,   -- זמן יציאה (אם הסתיים)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- הוספת הערות לתיעוד
COMMENT ON TABLE performance_tracking IS 'מעקב אחרי ביצועי הטוכנים שהבוט המליץ עליהם - מערכת הלמידה של הבוט';
COMMENT ON COLUMN performance_tracking.entry_score IS 'הציון שהבוט נתן לטוכן (0-100) בזמן ההמלצה';
COMMENT ON COLUMN performance_tracking.roi IS 'תשואה באחוזים - חיובי=רווח, שלילי=הפסד';
COMMENT ON COLUMN performance_tracking.status IS 'ACTIVE=עדיין עוקב, SUCCESS=50%+ רווח, FAILURE=-20% הפסד';
COMMENT ON COLUMN performance_tracking.smart_wallets IS 'רשימת כתובות Smart Wallets שהחזיקו בטוכן הזה';

-- ============================================
-- 🎯 SECTION 2: SMART WALLETS SYSTEM  
-- ============================================
-- מערכת Smart Wallets עם Trust Scores דינמיים
-- הבוט לומד מאילו ארנקים לסמוך יותר

-- יצירת טבלת Smart Wallets (רק אם לא קיימת)
CREATE TABLE IF NOT EXISTS smart_wallets (
    address TEXT PRIMARY KEY,             -- כתובת הארנק (מפתח ראשי)
    nickname TEXT,                        -- כינוי ידידותי (אופציונלי)
    trust_score INTEGER DEFAULT 50,       -- ציון אמון 0-100 (התחלה: 50)
    total_trades INTEGER DEFAULT 0,       -- סה"כ עסקאות שהבוט עקב אחריהן
    successful_trades INTEGER DEFAULT 0,  -- עסקאות מוצלחות (50%+ רווח)
    failed_trades INTEGER DEFAULT 0,      -- עסקאות כושלות (20%- הפסד) 
    success_rate FLOAT DEFAULT 0.0,       -- אחוז הצלחה (מחושב אוטומטית)
    average_roi FLOAT DEFAULT 0.0,        -- ROI ממוצע
    discovered_from TEXT DEFAULT 'manual', -- איך התגלה: manual, first_buyer, performance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- הוספת הערות לתיעוד
COMMENT ON TABLE smart_wallets IS 'Smart Money wallets עם ציוני אמון שמתעדכנים לפי ביצועים';
COMMENT ON COLUMN smart_wallets.trust_score IS 'ציון אמון 0-100: עולה עם הצלחות (+5), יורד עם כישלונות (-3)';
COMMENT ON COLUMN smart_wallets.success_rate IS 'אחוז הצלחה שמחושב אוטומטית: successful_trades/total_trades * 100';
COMMENT ON COLUMN smart_wallets.discovered_from IS 'manual=הוסף ידנית, first_buyer=זוהה כקונה ראשון, performance=התגלה בביצועים';

-- ============================================
-- 📚 SECTION 3: TOKEN HISTORY SYSTEM
-- ============================================
-- תיעוד מלא של כל הטוכנים שהבוט סרק עם כל הנתונים

-- יצירת טבלת היסטוריית טוכנים (רק אם לא קיימת)
CREATE TABLE IF NOT EXISTS scanned_tokens_history (
    address TEXT PRIMARY KEY,             -- כתובת הטוכן
    symbol TEXT,                          -- סימבול
    name TEXT,                           -- שם מלא
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- מתי נראה לראשונה
    
    -- ציונים (בהתאם למערכת החדשה)
    final_score INTEGER,                  -- ציון סופי 0-100
    grade TEXT,                          -- דירוג: S+, S, A+, A, B+, B, C+, C, F
    category TEXT,                       -- קטגוריה: LEGENDARY, EXCELLENT, GOOD, FAIR, POOR
    safety_score INTEGER,                -- ציון בטיחות 0-25
    holder_score INTEGER,                -- ציון מחזיקים 0-20  
    liquidity_score INTEGER,             -- ציון נזילות 0-25 (חדש!)
    volume_score INTEGER,                -- ציון volume 0-15 (חדש!)
    smart_money_score INTEGER,           -- ציון smart money 0-10
    price_action_score INTEGER,          -- ציון price action 0-5 (חדש!)
    
    -- נתוני שוק
    liquidity_sol FLOAT,                 -- נזילות ב-SOL
    volume_24h FLOAT,                    -- volume 24h ב-USD
    price_usd FLOAT,                     -- מחיר ב-USD
    market_cap FLOAT,                    -- שווי שוק
    holder_count INTEGER,                -- מספר מחזיקים
    smart_money_count INTEGER,           -- מספר Smart Money wallets
    
    -- מטה-דאטה
    source TEXT DEFAULT 'dexscreener',   -- מקור: dexscreener, helius, pumpfun
    status TEXT DEFAULT 'active',        -- active, success, failure, scam
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- הוספת הערות לתיעוד
COMMENT ON TABLE scanned_tokens_history IS 'היסטוריה מלאה של כל הטוכנים שהבוט סרק עם כל הנתונים';
COMMENT ON COLUMN scanned_tokens_history.final_score IS 'ציון סופי 0-100 במערכת החדשה';
COMMENT ON COLUMN scanned_tokens_history.liquidity_score IS 'ציון נזילות 0-25 - חדש בגרסה 2.0!';
COMMENT ON COLUMN scanned_tokens_history.volume_score IS 'ציון volume 0-15 - חדש בגרסה 2.0!';
COMMENT ON COLUMN scanned_tokens_history.price_action_score IS 'ציון momentum 0-5 - חדש בגרסה 2.0!';
COMMENT ON COLUMN scanned_tokens_history.status IS 'active=פעיל, success=הצליח, failure=נכשל, scam=זוהה כמרמה';

-- ============================================
-- 🔗 SECTION 4: RELATIONSHIPS TABLE
-- ============================================
-- קשרים בין Smart Wallets לטוכנים שהם מחזיקים

-- יצירת טבלת קשרים (רק אם לא קיימת)
CREATE TABLE IF NOT EXISTS wallet_token_holdings (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,         -- כתובת הארנק
    token_address TEXT NOT NULL,          -- כתובת הטוכן  
    first_detected TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- מתי זוהה לראשונה
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),      -- מתי נראה לאחרונה
    is_active BOOLEAN DEFAULT TRUE,       -- האם עדיין מחזיק
    UNIQUE(wallet_address, token_address) -- מונע כפילויות
);

COMMENT ON TABLE wallet_token_holdings IS 'קשרים בין Smart Wallets לטוכנים - מי מחזיק מה ומתי';

-- ============================================
-- 📊 SECTION 5: INDEXES FOR PERFORMANCE
-- ============================================
-- אינדקסים לביצועים מהירים של השאילתות

-- Indexes למערכת Performance Tracking (בדיקה אם לא קיימים)
DO $$
BEGIN
    -- Performance tracking indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_performance_status') THEN
        CREATE INDEX idx_performance_status ON performance_tracking(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_performance_entry_time') THEN
        CREATE INDEX idx_performance_entry_time ON performance_tracking(entry_time);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_performance_roi') THEN
        CREATE INDEX idx_performance_roi ON performance_tracking(roi);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_performance_entry_score') THEN
        CREATE INDEX idx_performance_entry_score ON performance_tracking(entry_score);
    END IF;

    -- Smart wallets indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_smart_wallets_trust_score') THEN
        CREATE INDEX idx_smart_wallets_trust_score ON smart_wallets(trust_score);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_smart_wallets_success_rate') THEN
        CREATE INDEX idx_smart_wallets_success_rate ON smart_wallets(success_rate);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_smart_wallets_discovered_from') THEN
        CREATE INDEX idx_smart_wallets_discovered_from ON smart_wallets(discovered_from);
    END IF;

    -- Token history indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_scanned_tokens_final_score') THEN
        CREATE INDEX idx_scanned_tokens_final_score ON scanned_tokens_history(final_score);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_scanned_tokens_first_seen') THEN
        CREATE INDEX idx_scanned_tokens_first_seen ON scanned_tokens_history(first_seen);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_scanned_tokens_status') THEN
        CREATE INDEX idx_scanned_tokens_status ON scanned_tokens_history(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_scanned_tokens_source') THEN
        CREATE INDEX idx_scanned_tokens_source ON scanned_tokens_history(source);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_scanned_tokens_liquidity_score') THEN
        CREATE INDEX idx_scanned_tokens_liquidity_score ON scanned_tokens_history(liquidity_score);
    END IF;

    -- Wallet holdings indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_wallet_holdings_wallet') THEN
        CREATE INDEX idx_wallet_holdings_wallet ON wallet_token_holdings(wallet_address);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_wallet_holdings_token') THEN
        CREATE INDEX idx_wallet_holdings_token ON wallet_token_holdings(token_address);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_wallet_holdings_active') THEN
        CREATE INDEX idx_wallet_holdings_active ON wallet_token_holdings(is_active);
    END IF;
END $$;

-- ============================================
-- ⚡ SECTION 6: TRIGGERS & AUTO-UPDATES
-- ============================================
-- טריגרים לעדכון אוטומטי של נתונים

-- טריגר לעדכון updated_at בperformance_tracking
CREATE OR REPLACE FUNCTION update_performance_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

-- יצירת הטריגר (מחק אם קיים ותיצר מחדש)
DROP TRIGGER IF EXISTS update_performance_tracking_updated_at_trigger ON performance_tracking;
CREATE TRIGGER update_performance_tracking_updated_at_trigger 
    BEFORE UPDATE ON performance_tracking 
    FOR EACH ROW 
    EXECUTE FUNCTION update_performance_tracking_updated_at();

-- טריגר חכם לsmart_wallets - מעדכן updated_at וחושב success_rate אוטומטית
CREATE OR REPLACE FUNCTION update_smart_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- חישוב אוטומטי של success_rate
    IF NEW.total_trades > 0 THEN
        NEW.success_rate = (NEW.successful_trades::FLOAT / NEW.total_trades::FLOAT) * 100;
    ELSE
        NEW.success_rate = 0.0;
    END IF;
    RETURN NEW;
END;
$$ language plpgsql;

-- יצירת הטריגר (מחק אם קיים ותיצר מחדש)
DROP TRIGGER IF EXISTS update_smart_wallets_updated_at_trigger ON smart_wallets;
CREATE TRIGGER update_smart_wallets_updated_at_trigger 
    BEFORE UPDATE ON smart_wallets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_smart_wallets_updated_at();

-- ============================================
-- 🛠️ SECTION 7: SMART FUNCTIONS
-- ============================================
-- פונקציות חכמות לניהול המערכת

-- פונקציה להוספת Smart Wallet חדש (בטוח)
CREATE OR REPLACE FUNCTION add_smart_wallet(
    p_address TEXT,
    p_nickname TEXT DEFAULT NULL,
    p_discovered_from TEXT DEFAULT 'manual'
) RETURNS BOOLEAN AS $$
DECLARE
    wallet_exists BOOLEAN;
BEGIN
    -- בדוק אם הארנק כבר קיים
    SELECT EXISTS(SELECT 1 FROM smart_wallets WHERE address = p_address) INTO wallet_exists;
    
    IF NOT wallet_exists THEN
        INSERT INTO smart_wallets (address, nickname, discovered_from)
        VALUES (p_address, p_nickname, p_discovered_from);
        RETURN TRUE;  -- נוסף בהצלחה
    ELSE
        RETURN FALSE; -- כבר קיים
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_smart_wallet IS 'מוסיף Smart Wallet חדש - מחזיר TRUE אם נוסף, FALSE אם כבר קיים';

-- פונקציה לעדכון Trust Score (הלב של מערכת הלמידה!)
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
        -- חישוב Trust Score חדש: +5 להצלחה, -3 לכישלון
        trust_score = GREATEST(0, LEAST(100, 
            trust_score + (CASE WHEN p_was_successful THEN 5 ELSE -3 END)
        ))
    WHERE address = p_address;
    
    -- אם הארנק לא קיים, תוסיף אותו
    IF NOT FOUND THEN
        PERFORM add_smart_wallet(p_address, NULL, 'performance');
        -- עדכן שוב אחרי ההוספה
        PERFORM update_trust_score(p_address, p_was_successful);
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_trust_score IS 'מעדכן Trust Score של Smart Wallet: +5 להצלחה, -3 לכישלון';

-- פונקציה לרישום טוכן חדש בהיסטוריה
CREATE OR REPLACE FUNCTION log_scanned_token(
    p_address TEXT,
    p_symbol TEXT,
    p_name TEXT DEFAULT NULL,
    p_final_score INTEGER DEFAULT NULL,
    p_grade TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_safety_score INTEGER DEFAULT NULL,
    p_holder_score INTEGER DEFAULT NULL,
    p_liquidity_score INTEGER DEFAULT NULL,  -- חדש!
    p_volume_score INTEGER DEFAULT NULL,     -- חדש!
    p_smart_money_score INTEGER DEFAULT NULL,
    p_price_action_score INTEGER DEFAULT NULL, -- חדש!
    p_liquidity_sol FLOAT DEFAULT NULL,
    p_volume_24h FLOAT DEFAULT NULL,
    p_price_usd FLOAT DEFAULT NULL,
    p_market_cap FLOAT DEFAULT NULL,
    p_holder_count INTEGER DEFAULT NULL,
    p_smart_money_count INTEGER DEFAULT NULL,
    p_source TEXT DEFAULT 'dexscreener'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO scanned_tokens_history (
        address, symbol, name, final_score, grade, category,
        safety_score, holder_score, liquidity_score, volume_score, 
        smart_money_score, price_action_score, liquidity_sol, volume_24h, 
        price_usd, market_cap, holder_count, smart_money_count, source
    )
    VALUES (
        p_address, p_symbol, p_name, p_final_score, p_grade, p_category,
        p_safety_score, p_holder_score, p_liquidity_score, p_volume_score,
        p_smart_money_score, p_price_action_score, p_liquidity_sol, p_volume_24h,
        p_price_usd, p_market_cap, p_holder_count, p_smart_money_count, p_source
    )
    ON CONFLICT (address) DO UPDATE SET
        -- עדכן את הנתונים אם הטוכן כבר קיים
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
        smart_money_count = EXCLUDED.smart_money_count,
        source = EXCLUDED.source;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_scanned_token IS 'רושם טוכן חדש בהיסטוריה עם כל הנתונים - תומך במערכת הציון החדשה';

-- ============================================
-- 🔗 SECTION 8: FOREIGN KEYS & CONSTRAINTS
-- ============================================
-- קשרים בין הטבלאות (אם עדיין לא קיימים)

DO $$
BEGIN
    -- קשר בין wallet_token_holdings ל-smart_wallets
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'wallet_token_holdings_wallet_address_fkey'
    ) THEN
        ALTER TABLE wallet_token_holdings 
        ADD CONSTRAINT wallet_token_holdings_wallet_address_fkey 
        FOREIGN KEY (wallet_address) REFERENCES smart_wallets(address) ON DELETE CASCADE;
    END IF;
    
    -- קשר בין wallet_token_holdings ל-scanned_tokens_history  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'wallet_token_holdings_token_address_fkey'
    ) THEN
        ALTER TABLE wallet_token_holdings 
        ADD CONSTRAINT wallet_token_holdings_token_address_fkey 
        FOREIGN KEY (token_address) REFERENCES scanned_tokens_history(address) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 📈 SECTION 9: USEFUL VIEWS FOR ANALYTICS
-- ============================================
-- Views שימושיים לאנליטיקות

-- View לסטטיסטיקות Smart Wallets
CREATE OR REPLACE VIEW smart_wallets_stats AS
SELECT 
    sw.address,
    sw.nickname,
    sw.trust_score,
    sw.total_trades,
    sw.successful_trades,
    sw.success_rate,
    sw.discovered_from,
    COUNT(wth.token_address) as tokens_held,
    sw.created_at
FROM smart_wallets sw
LEFT JOIN wallet_token_holdings wth ON sw.address = wth.wallet_address AND wth.is_active = true
GROUP BY sw.address, sw.nickname, sw.trust_score, sw.total_trades, sw.successful_trades, 
         sw.success_rate, sw.discovered_from, sw.created_at
ORDER BY sw.trust_score DESC;

COMMENT ON VIEW smart_wallets_stats IS 'סטטיסטיקות Smart Wallets עם מספר הטוכנים שהם מחזיקים';

-- View לביצועי הבוט
CREATE OR REPLACE VIEW bot_performance_summary AS
SELECT 
    COUNT(*) as total_tracked,
    COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as successes,
    COUNT(CASE WHEN status = 'FAILURE' THEN 1 END) as failures,
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
    ROUND(AVG(CASE WHEN status IN ('SUCCESS', 'FAILURE') THEN roi END), 2) as avg_roi,
    ROUND(COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(CASE WHEN status IN ('SUCCESS', 'FAILURE') THEN 1 END), 0), 1) as success_rate_pct
FROM performance_tracking;

COMMENT ON VIEW bot_performance_summary IS 'סיכום ביצועי הבוט - Success Rate, ROI ממוצע, וכו';

-- ============================================
-- 🎯 SECTION 10: SAMPLE DATA (אופציונלי)
-- ============================================
-- דאטה לדוגמה (אופציונלי - רק אם רוצים לבדוק)

-- להוספת Smart Wallet לדוגמה (הסר את ההערות אם רוצה)
-- SELECT add_smart_wallet('So11111111111111111111111111111111111111112', 'Test Wallet', 'manual');

-- ============================================
-- ✅ SECTION 11: MIGRATION VERIFICATION
-- ============================================================================
-- בדיקה שהכל הצליח + סיכום מה נוצר

-- בדיקה אחרונה של כל מה שנוצר
SELECT 
    '🎉 SolanaHunter V2.0 Migration Completed Successfully!' as status;

-- רשימת הטבלאות החדשות
SELECT 
    'Tables created/verified: ' || string_agg(table_name, ', ') as tables_summary
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'performance_tracking', 
        'smart_wallets', 
        'scanned_tokens_history', 
        'wallet_token_holdings'
    );

-- רשימת הפונקציות החדשות
SELECT 
    'Functions created: ' || string_agg(routine_name, ', ') as functions_summary
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN (
        'add_smart_wallet', 
        'update_trust_score', 
        'log_scanned_token',
        'update_smart_wallets_updated_at',
        'update_performance_tracking_updated_at'
    );

-- רשימת הViews החדשים
SELECT 
    'Views created: ' || string_agg(table_name, ', ') as views_summary
FROM information_schema.views
WHERE table_schema = 'public'
    AND table_name IN ('smart_wallets_stats', 'bot_performance_summary');

-- ספירת Indexes שנוצרו
SELECT 
    'Indexes created: ' || COUNT(*) as indexes_count
FROM pg_indexes 
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';

-- הודעה אחרונה
SELECT 
    '🚀 Ready to run SolanaHunter V2.0 with AI-powered learning system!' as final_message;

-- ============================================================================
-- 🎊 MIGRATION 002 COMPLETED!
-- ============================================================================
-- 
-- מה שיש לך עכשיו:
-- ✅ מערכת למידה מלאה (Performance Tracking)
-- ✅ Smart Wallets עם Trust Scores דינמיים  
-- ✅ מערכת ציון מתקדמת (Safety+Holders+Liquidity+Volume+SmartMoney+PriceAction)
-- ✅ תיעוד מלא של כל הטוכנים שנסרקו
-- ✅ פונקציות חכמות לניהול
-- ✅ Views לאנליטיקות
-- ✅ Indexes לביצועים מהירים
-- 
-- הבוט שלך עכשיו:
-- 🧠 לומד מהצלחות וכישלונות
-- 🎯 נותן משקל לSmart Wallets לפי ביצועים
-- 🚨 מזהה Rug Pulls
-- 📊 מתעד הכל לאנליטיקות
-- 
-- גרסה: 2.0
-- תאריך: ינואר 2026  
-- מפתח: Claude AI + Cursor
-- ============================================================================