-- ============================================================================
-- בדיקה מה כבר קיים ב-Supabase
-- ============================================================================
-- הרץ את זה ב-SQL Editor כדי לראות מה יש ומה חסר

-- בדיקת טבלאות קיימות
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'smart_wallets',
        'scanned_tokens_history', 
        'wallet_token_holdings',
        'performance_tracking'
    )
ORDER BY table_name;

-- בדיקת פונקציות קיימות
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN (
        'add_smart_wallet',
        'update_trust_score', 
        'log_scanned_token',
        'update_smart_wallets_updated_at',
        'update_updated_at_column'
    )
ORDER BY routine_name;