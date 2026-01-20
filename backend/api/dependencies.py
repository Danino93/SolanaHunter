"""
API Dependencies - Shared dependencies for FastAPI routes

📋 מה הקובץ הזה עושה:
-------------------
מספק dependencies משותפים לכל ה-routes:
- SolanaHunter instance
- Supabase client
- וכו'
"""

from typing import Optional
from core.config import settings
from database.supabase_client import get_supabase_client

# Global SolanaHunter instance - יוזרק מ-main.py
_solanahunter_instance: Optional[object] = None


def set_solanahunter_instance(instance):
    """Set the global SolanaHunter instance"""
    global _solanahunter_instance
    _solanahunter_instance = instance


def get_solanahunter() -> Optional[object]:
    """Get the global SolanaHunter instance"""
    return _solanahunter_instance


def get_supabase():
    """Get Supabase client"""
    return get_supabase_client()
