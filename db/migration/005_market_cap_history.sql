-- ============================================================================
-- Migration 005: Market Cap History Tracking
-- ============================================================================
-- 
-- 📋 מה הקובץ הזה עושה:
-- --------------------
-- יוצר טבלת היסטוריה של market cap כדי לעקוב אחרי השינוי בשווי המטבע:
-- 1. שמירת market cap בכל סריקה
-- 2. השוואה בין השווי בבדיקה הראשונה לשווי הנוכחי
-- 3. מעקב אחרי צמיחה/ירידה של המטבע
-- 
-- תאריך: 2026-01-25
-- ============================================================================

-- ============================================================================
-- 1. יצירת טבלת token_market_cap_history
-- ============================================================================

CREATE TABLE IF NOT EXISTS token_market_cap_history (
    id BIGSERIAL PRIMARY KEY,
    token_address TEXT NOT NULL,
    market_cap NUMERIC(20, 2) NOT NULL,
    price_usd NUMERIC(20, 8) NOT NULL,
    volume_24h NUMERIC(20, 2),
    liquidity_sol NUMERIC(20, 2),
    final_score INTEGER,
    grade TEXT,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key reference to scanned_tokens_history
    CONSTRAINT fk_token_address 
        FOREIGN KEY (token_address) 
        REFERENCES scanned_tokens_history(address) 
        ON DELETE CASCADE
);

-- ============================================================================
-- 2. יצירת Indexes לביצועים טובים יותר
-- ============================================================================

-- Index לחיפוש לפי token_address (הכי חשוב)
CREATE INDEX IF NOT EXISTS idx_market_cap_history_token_address 
ON token_market_cap_history(token_address);

-- Index לחיפוש לפי תאריך סריקה (לניתוח היסטורי)
CREATE INDEX IF NOT EXISTS idx_market_cap_history_scanned_at 
ON token_market_cap_history(scanned_at DESC);

-- Index משולב לחיפוש מהיר של היסטוריה לפי טוקן
CREATE INDEX IF NOT EXISTS idx_market_cap_history_token_scanned 
ON token_market_cap_history(token_address, scanned_at DESC);

-- ============================================================================
-- 3. יצירת View להצגת השווי בבדיקה הראשונה vs נוכחי
-- ============================================================================

CREATE OR REPLACE VIEW token_market_cap_comparison AS
SELECT 
    t.address,
    t.symbol,
    t.name,
    t.final_score,
    t.grade,
    
    -- שווי בבדיקה הראשונה
    first_scan.market_cap AS first_market_cap,
    first_scan.price_usd AS first_price_usd,
    first_scan.scanned_at AS first_scanned_at,
    
    -- שווי נוכחי (הסריקה האחרונה)
    latest_scan.market_cap AS current_market_cap,
    latest_scan.price_usd AS current_price_usd,
    latest_scan.scanned_at AS current_scanned_at,
    
    -- חישוב שינוי
    CASE 
        WHEN first_scan.market_cap > 0 THEN
            ROUND(((latest_scan.market_cap - first_scan.market_cap) / first_scan.market_cap * 100)::NUMERIC, 2)
        ELSE 0
    END AS market_cap_change_pct,
    
    CASE 
        WHEN first_scan.price_usd > 0 THEN
            ROUND(((latest_scan.price_usd - first_scan.price_usd) / first_scan.price_usd * 100)::NUMERIC, 2)
        ELSE 0
    END AS price_change_pct,
    
    -- מספר סריקות
    COUNT(DISTINCT h.scanned_at) AS scan_count,
    
    -- תאריך יצירת המטבע
    t.token_created_at,
    t.token_age_hours
    
FROM scanned_tokens_history t
LEFT JOIN LATERAL (
    SELECT market_cap, price_usd, scanned_at
    FROM token_market_cap_history
    WHERE token_address = t.address
    ORDER BY scanned_at ASC
    LIMIT 1
) first_scan ON true
LEFT JOIN LATERAL (
    SELECT market_cap, price_usd, scanned_at
    FROM token_market_cap_history
    WHERE token_address = t.address
    ORDER BY scanned_at DESC
    LIMIT 1
) latest_scan ON true
LEFT JOIN token_market_cap_history h ON h.token_address = t.address
GROUP BY 
    t.address, t.symbol, t.name, t.final_score, t.grade,
    t.token_created_at, t.token_age_hours,
    first_scan.market_cap, first_scan.price_usd, first_scan.scanned_at,
    latest_scan.market_cap, latest_scan.price_usd, latest_scan.scanned_at;

-- ============================================================================
-- 4. יצירת Function לשמירת market cap history אוטומטית
-- ============================================================================

CREATE OR REPLACE FUNCTION save_market_cap_history()
RETURNS TRIGGER AS $$
BEGIN
    -- שמור היסטוריה רק אם market_cap השתנה או זה הסריקה הראשונה
    IF NEW.market_cap IS NOT NULL AND NEW.market_cap > 0 THEN
        INSERT INTO token_market_cap_history (
            token_address,
            market_cap,
            price_usd,
            volume_24h,
            liquidity_sol,
            final_score,
            grade,
            scanned_at
        )
        VALUES (
            NEW.address,
            NEW.market_cap,
            NEW.price_usd,
            NEW.volume_24h,
            NEW.liquidity_sol,
            NEW.final_score,
            NEW.grade,
            NEW.last_scanned_at
        )
        ON CONFLICT DO NOTHING;  -- אם כבר יש רשומה באותו זמן, אל תכפול
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger לשמירת היסטוריה אוטומטית
DROP TRIGGER IF EXISTS trigger_save_market_cap_history ON scanned_tokens_history;
CREATE TRIGGER trigger_save_market_cap_history
    AFTER INSERT OR UPDATE ON scanned_tokens_history
    FOR EACH ROW
    WHEN (NEW.market_cap IS NOT NULL AND NEW.market_cap > 0)
    EXECUTE FUNCTION save_market_cap_history();

-- ============================================================================
-- 5. הערות לתיעוד
-- ============================================================================

COMMENT ON TABLE token_market_cap_history IS 
'היסטוריית market cap של מטבעות - נשמר בכל סריקה';

COMMENT ON COLUMN token_market_cap_history.token_address IS 
'כתובת המטבע (Foreign key ל-scanned_tokens_history)';

COMMENT ON COLUMN token_market_cap_history.market_cap IS 
'שווי שוק במעודכן USD';

COMMENT ON COLUMN token_market_cap_history.scanned_at IS 
'מתי נסרק (מתאים ל-last_scanned_at ב-scanned_tokens_history)';

COMMENT ON VIEW token_market_cap_comparison IS 
'השוואה בין השווי בבדיקה הראשונה לשווי הנוכחי - מאפשר לראות אם הבוט חכם';

-- ============================================================================
-- 6. עדכון נתונים קיימים (אם יש)
-- ============================================================================

-- העתק market_cap קיים מהיסטוריה (אם יש)
INSERT INTO token_market_cap_history (
    token_address,
    market_cap,
    price_usd,
    volume_24h,
    liquidity_sol,
    final_score,
    grade,
    scanned_at
)
SELECT 
    address,
    market_cap,
    price_usd,
    volume_24h,
    liquidity_sol,
    final_score,
    grade,
    COALESCE(last_scanned_at, first_seen, created_at, NOW())
FROM scanned_tokens_history
WHERE market_cap IS NOT NULL 
  AND market_cap > 0
  AND NOT EXISTS (
      SELECT 1 
      FROM token_market_cap_history 
      WHERE token_address = scanned_tokens_history.address
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. עדכון טוקנים קיימים לסריקה מחדש (כדי לקבל market_cap)
-- ============================================================================

-- עדכן את next_scan_at של כל הטוקנים ללא market_cap
-- כך שהבוט יסרוק אותם מחדש מהר
UPDATE scanned_tokens_history
SET 
    next_scan_at = NOW(),
    scan_priority = 100
WHERE (market_cap IS NULL OR market_cap = 0)
  AND last_scanned_at < NOW() - INTERVAL '1 hour';

-- ============================================================================
-- ✅ סיום
-- ============================================================================

-- בדיקה שהכל עבד
DO $$
DECLARE
    tokens_to_rescan INTEGER;
BEGIN
    SELECT COUNT(*) INTO tokens_to_rescan
    FROM scanned_tokens_history
    WHERE (market_cap IS NULL OR market_cap = 0)
      AND last_scanned_at < NOW() - INTERVAL '1 hour';
    
    RAISE NOTICE '✅ Migration 005 completed successfully!';
    RAISE NOTICE '   Created table: token_market_cap_history';
    RAISE NOTICE '   Created view: token_market_cap_comparison';
    RAISE NOTICE '   Created trigger: trigger_save_market_cap_history';
    RAISE NOTICE '   Updated % tokens for rescanning to get market_cap', tokens_to_rescan;
    RAISE NOTICE '   Now tracking market cap history for smart bot analysis!';
END $$;
