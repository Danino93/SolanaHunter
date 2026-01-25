-- ============================================================================
-- Migration 003: Smart Scanning Fields
-- ============================================================================
-- 
-- 📋 מה הקובץ הזה עושה:
-- --------------------
-- מוסיף שדות חדשים לטבלת scanned_tokens_history כדי לאפשר:
-- 1. מעקב אחרי גיל המטבע (token_created_at, token_age_hours)
-- 2. ניהול סריקות חכם (last_scanned_at, next_scan_at, scan_priority)
-- 3. ספירת סריקות (scan_count)
-- 
-- תאריך: 2026-01-25
-- ============================================================================

-- ============================================================================
-- 1. הוספת שדות חדשים לטבלת scanned_tokens_history
-- ============================================================================

-- תאריך יצירת המטבע (מתי המטבע נוצר בפועל)
ALTER TABLE scanned_tokens_history 
ADD COLUMN IF NOT EXISTS token_created_at TIMESTAMP WITH TIME ZONE;

-- גיל המטבע בשעות (לחישוב מהיר)
ALTER TABLE scanned_tokens_history 
ADD COLUMN IF NOT EXISTS token_age_hours INTEGER;

-- תאריך הסריקה האחרונה
ALTER TABLE scanned_tokens_history 
ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMP WITH TIME ZONE;

-- תאריך הסריקה הבאה (מתי לבדוק שוב)
ALTER TABLE scanned_tokens_history 
ADD COLUMN IF NOT EXISTS next_scan_at TIMESTAMP WITH TIME ZONE;

-- עדיפות סריקה (0-100) - גבוה יותר = חשוב יותר
ALTER TABLE scanned_tokens_history 
ADD COLUMN IF NOT EXISTS scan_priority INTEGER DEFAULT 0;

-- מספר פעמים שנסרק (incremented בכל סריקה)
ALTER TABLE scanned_tokens_history 
ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 1;

-- ============================================================================
-- 2. יצירת Indexes לביצועים טובים יותר
-- ============================================================================

-- Index לסריקה חכמה - טוקנים שצריך לבדוק שוב
CREATE INDEX IF NOT EXISTS idx_scanned_tokens_next_scan 
ON scanned_tokens_history(next_scan_at) 
WHERE next_scan_at IS NOT NULL;

-- Index לעדיפות סריקה - מיין לפי עדיפות
CREATE INDEX IF NOT EXISTS idx_scanned_tokens_scan_priority 
ON scanned_tokens_history(scan_priority DESC) 
WHERE scan_priority > 0;

-- Index לטוקנים חדשים - לפי תאריך יצירה
CREATE INDEX IF NOT EXISTS idx_scanned_tokens_created_at 
ON scanned_tokens_history(token_created_at DESC) 
WHERE token_created_at IS NOT NULL;

-- Index לגיל המטבע - לחיפוש מהיר
CREATE INDEX IF NOT EXISTS idx_scanned_tokens_age_hours 
ON scanned_tokens_history(token_age_hours) 
WHERE token_age_hours IS NOT NULL;

-- Index לסריקה אחרונה - לבדיקת תדירות
CREATE INDEX IF NOT EXISTS idx_scanned_tokens_last_scanned 
ON scanned_tokens_history(last_scanned_at DESC);

-- ============================================================================
-- 3. יצירת Function לעדכון scan_count אוטומטי
-- ============================================================================

-- Function לעדכון scan_count בעת עדכון טוקן
CREATE OR REPLACE FUNCTION update_scan_count()
RETURNS TRIGGER AS $$
BEGIN
    -- אם זה עדכון (לא insert חדש), הגדל את scan_count
    IF TG_OP = 'UPDATE' THEN
        NEW.scan_count = COALESCE(OLD.scan_count, 0) + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger לעדכון scan_count אוטומטי
DROP TRIGGER IF EXISTS trigger_update_scan_count ON scanned_tokens_history;
CREATE TRIGGER trigger_update_scan_count
    BEFORE UPDATE ON scanned_tokens_history
    FOR EACH ROW
    WHEN (OLD.address = NEW.address)  -- רק בעדכון, לא ב-insert
    EXECUTE FUNCTION update_scan_count();

-- ============================================================================
-- 4. יצירת Function לחישוב token_age_hours אוטומטי
-- ============================================================================

-- Function לחישוב גיל המטבע בשעות
CREATE OR REPLACE FUNCTION calculate_token_age_hours()
RETURNS TRIGGER AS $$
BEGIN
    -- חשב גיל בשעות אם יש token_created_at
    IF NEW.token_created_at IS NOT NULL THEN
        NEW.token_age_hours = EXTRACT(EPOCH FROM (NOW() - NEW.token_created_at)) / 3600;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger לחישוב גיל אוטומטי
DROP TRIGGER IF EXISTS trigger_calculate_token_age ON scanned_tokens_history;
CREATE TRIGGER trigger_calculate_token_age
    BEFORE INSERT OR UPDATE ON scanned_tokens_history
    FOR EACH ROW
    WHEN (NEW.token_created_at IS NOT NULL)
    EXECUTE FUNCTION calculate_token_age_hours();

-- ============================================================================
-- 5. עדכון נתונים קיימים (אם יש)
-- ============================================================================

-- עדכן last_scanned_at לטוקנים קיימים (אם לא מוגדר)
UPDATE scanned_tokens_history
SET last_scanned_at = COALESCE(last_scanned_at, first_seen, created_at, NOW())
WHERE last_scanned_at IS NULL;

-- חשב token_age_hours לטוקנים קיימים שיש להם token_created_at
UPDATE scanned_tokens_history
SET token_age_hours = EXTRACT(EPOCH FROM (NOW() - token_created_at)) / 3600
WHERE token_created_at IS NOT NULL AND token_age_hours IS NULL;

-- הגדר next_scan_at לטוקנים קיימים לפי הציון
UPDATE scanned_tokens_history
SET 
    next_scan_at = CASE
        WHEN final_score >= 85 THEN NOW() + INTERVAL '30 minutes'
        WHEN final_score >= 60 THEN NOW() + INTERVAL '2 hours'
        ELSE NOW() + INTERVAL '24 hours'
    END,
    scan_priority = CASE
        WHEN final_score >= 85 THEN 80
        WHEN final_score >= 60 THEN 40
        ELSE 10
    END
WHERE next_scan_at IS NULL;

-- ============================================================================
-- 6. הערות לתיעוד
-- ============================================================================

COMMENT ON COLUMN scanned_tokens_history.token_created_at IS 
'תאריך יצירת המטבע בפועל (מתי המטבע נוצר בבלוקצ''יין)';

COMMENT ON COLUMN scanned_tokens_history.token_age_hours IS 
'גיל המטבע בשעות - מחושב אוטומטית מ-token_created_at';

COMMENT ON COLUMN scanned_tokens_history.last_scanned_at IS 
'מתי הסריקה האחרונה של הטוקן (מתעדכן בכל save_token)';

COMMENT ON COLUMN scanned_tokens_history.next_scan_at IS 
'מתי לבדוק את הטוקן שוב (מחושב לפי ציון וגיל)';

COMMENT ON COLUMN scanned_tokens_history.scan_priority IS 
'עדיפות סריקה (0-100) - גבוה יותר = חשוב יותר לסרוק';

COMMENT ON COLUMN scanned_tokens_history.scan_count IS 
'מספר פעמים שהטוקן נסרק (מתעדכן אוטומטית בעדכון)';

-- ============================================================================
-- ✅ סיום
-- ============================================================================

-- בדיקה שהכל עבד
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 003 completed successfully!';
    RAISE NOTICE '   Added fields: token_created_at, token_age_hours, last_scanned_at, next_scan_at, scan_priority, scan_count';
    RAISE NOTICE '   Created indexes for smart scanning';
    RAISE NOTICE '   Created triggers for automatic calculations';
END $$;
