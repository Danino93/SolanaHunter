-- ============================================================================
-- טבלת Performance Tracking עבור SolanaHunter
-- ============================================================================
-- צריך להריץ את זה ב-Supabase Dashboard > SQL Editor
-- ============================================================================

-- יצירת הטבלה הראשית
CREATE TABLE performance_tracking (
    address TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    entry_price FLOAT NOT NULL,
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    entry_score INTEGER NOT NULL,
    smart_wallets JSONB,
    current_price FLOAT,
    roi FLOAT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    exit_price FLOAT,
    exit_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת Indexes לביצועים טובים
CREATE INDEX idx_performance_status ON performance_tracking(status);
CREATE INDEX idx_performance_entry_time ON performance_tracking(entry_time);
CREATE INDEX idx_performance_roi ON performance_tracking(roi);
CREATE INDEX idx_performance_entry_score ON performance_tracking(entry_score);

-- הוספת trigger לעדכון updated_at אוטומטי
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_performance_tracking_updated_at 
    BEFORE UPDATE ON performance_tracking 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- הוספת comment לתיעוד
COMMENT ON TABLE performance_tracking IS 'מעקב אחרי ביצועי הטוקנים שהבוט המליץ עליהם';
COMMENT ON COLUMN performance_tracking.address IS 'כתובת הטוקן (מפתח ראשי)';
COMMENT ON COLUMN performance_tracking.symbol IS 'סימבול הטוקן';
COMMENT ON COLUMN performance_tracking.entry_price IS 'מחיר בכניסה (USD)';
COMMENT ON COLUMN performance_tracking.entry_time IS 'זמן כניסה';
COMMENT ON COLUMN performance_tracking.entry_score IS 'ציון שהבוט נתן (0-100)';
COMMENT ON COLUMN performance_tracking.smart_wallets IS 'רשימת Smart Wallets שהחזיקו בטוקן';
COMMENT ON COLUMN performance_tracking.current_price IS 'מחיר נוכחי (USD)';
COMMENT ON COLUMN performance_tracking.roi IS 'תשואה באחוזים';
COMMENT ON COLUMN performance_tracking.status IS 'סטטוס: ACTIVE, SUCCESS, FAILURE, EXPIRED';
COMMENT ON COLUMN performance_tracking.exit_price IS 'מחיר ביציאה (אם הסתיים)';
COMMENT ON COLUMN performance_tracking.exit_time IS 'זמן יציאה (אם הסתיים)';

-- בדיקה שהטבלה נוצרה
SELECT 'performance_tracking table created successfully!' as result;