"""
Configuration Management
Modern, type-safe configuration with Pydantic
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
    
    @validator("solana_rpc_url", always=True)
    def build_rpc_url(cls, v, values):
        """Build RPC URL if not provided"""
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
