"""
Configuration Management
Modern, type-safe configuration with Pydantic

📋 מה הקובץ הזה עושה:
-------------------
זה הקובץ שמנהל את כל ההגדרות של הבוט (API keys, הגדרות, וכו').

הקובץ הזה:
1. קורא את כל המשתנים מ-.env file
2. בודק שהכל תקין (validation)
3. מספק הגדרות ברירת מחדל
4. מאפשר גישה נוחה לכל ההגדרות דרך settings object

🔧 משתנים חשובים:
- HELIUS_API_KEY - מפתח API ל-Helius (חובה!)
- TELEGRAM_BOT_TOKEN - טוקן בוט טלגרם
- TELEGRAM_CHAT_ID - ID של הצ'אט שלך
- ALERT_THRESHOLD - סף התראה (ברירת מחדל: 85)
- SCAN_INTERVAL_SECONDS - תדירות סריקה (ברירת מחדל: 300 = 5 דקות)

💡 איך זה עובד:
1. קורא את הקובץ .env מהתיקייה
2. משתמש ב-Pydantic לבדיקת תקינות
3. יוצר Settings object עם כל ההגדרות
4. כל הקוד משתמש ב-settings.xxx כדי לגשת להגדרות

📝 הערות:
- כל המשתנים חייבים להיות ב-.env file
- יש קובץ env.example עם כל המשתנים הנדרשים
- אם משתנה חסר, הבוט יכשל בהפעלה (חוץ מאופציונליים)
- ⚠️ לעולם אל תעלה את .env ל-GitHub! (יש ב-.gitignore)
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field, validator
from pydantic_settings import SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with validation"""

    # Allow extra env vars (e.g., legacy WHATSAPP_* entries) without crashing
    model_config = SettingsConfigDict(
        # Support both running from `backend/` and from repo root
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    # ============================================
    # Solana RPC & APIs
    # ============================================
    helius_api_key: str = Field(..., env="HELIUS_API_KEY")
    solana_rpc_url: Optional[str] = Field(None, env="SOLANA_RPC_URL")
    rpc_endpoint: Optional[str] = Field(None, env="RPC_ENDPOINT")  # NEW
    
    @validator("solana_rpc_url", always=True)
    def build_rpc_url(cls, v, values):
        """Build RPC URL if not provided"""
        if not v and "helius_api_key" in values:
            return f"https://mainnet.helius-rpc.com/?api-key={values['helius_api_key']}"
        return v
    
    @validator("rpc_endpoint", always=True)
    def build_rpc_endpoint(cls, v, values):
        """Build RPC endpoint if not provided"""
        if not v and "helius_api_key" in values:
            return f"https://mainnet.helius-rpc.com/?api-key={values['helius_api_key']}"
        return v
    
    # ============================================
    # Database (Supabase)
    # ============================================
    # Optional for Week 1-2 (we can wire DB later)
    supabase_url: Optional[str] = Field(None, env="SUPABASE_URL")
    supabase_key: Optional[str] = Field(None, env="SUPABASE_KEY")
    supabase_service_key: Optional[str] = Field(None, env="SUPABASE_SERVICE_KEY")
    
    # ============================================
    # Telegram Bot API
    # ============================================
    telegram_bot_token: Optional[str] = Field(None, env="TELEGRAM_BOT_TOKEN")
    telegram_chat_id: Optional[str] = Field(None, env="TELEGRAM_CHAT_ID")
    
    # ============================================
    # Wallet (⚠️ DEDICATED BOT WALLET ONLY!)
    # ============================================
    wallet_private_key: Optional[str] = Field(None, env="WALLET_PRIVATE_KEY")
    
    # כתובת יעד להעברת רווחים (הארנק האישי שלך ב-Phantom)
    # הבוט יעביר כסף לכתובת הזו רק אם יש יותר מ-WALLET_AUTO_TRANSFER_THRESHOLD
    # או אם תבקש ידנית דרך /withdraw
    wallet_destination_address: Optional[str] = Field(None, env="WALLET_DESTINATION_ADDRESS")
    
    # Reserve קבוע - תמיד נשאר בארנק הבוט (ל-fees, קניות, וכו')
    # ברירת מחדל: 0.1 SOL
    wallet_reserve_sol: float = Field(0.1, env="WALLET_RESERVE_SOL")
    
    # Auto-transfer threshold - רק אם יש יותר מ-X SOL, יעביר אוטומטית
    # ברירת מחדל: 1.0 SOL (אם יש יותר מ-1 SOL, יעביר את העודף)
    # אם 0 או לא מוגדר, לא יעביר אוטומטית (רק ידנית)
    wallet_auto_transfer_threshold: float = Field(0.0, env="WALLET_AUTO_TRANSFER_THRESHOLD")
    
    # ============================================
    # AI Services (Optional)
    # ============================================
    anthropic_api_key: Optional[str] = Field(None, env="ANTHROPIC_API_KEY")
    openai_api_key: Optional[str] = Field(None, env="OPENAI_API_KEY")
    
    # ============================================
    # Bot Configuration
    # ============================================
    log_level: str = Field("INFO", env="LOG_LEVEL")
    scan_interval_seconds: int = Field(300, env="SCAN_INTERVAL_SECONDS")
    alert_threshold: int = Field(85, env="ALERT_THRESHOLD")
    max_position_size_pct: float = Field(5.0, env="MAX_POSITION_SIZE_PCT")
    stop_loss_pct: float = Field(15.0, env="STOP_LOSS_PCT")
    
    # ============================================
    # External APIs (Optional)
    # ============================================
    birdeye_api_key: Optional[str] = Field(None, env="BIRDEYE_API_KEY")
    solscan_api_key: Optional[str] = Field(None, env="SOLSCAN_API_KEY")
    
    # (legacy Config removed; model_config above is the v2 way)


# Global settings instance
settings = Settings()
