"""
Supabase Client - Database Operations

📋 מה הקובץ הזה עושה:
-------------------
מנהל את החיבור ל-Supabase ושומר טוקנים למסד הנתונים.

תכונות:
- חיבור ל-Supabase
- שמירת טוקנים נותחו
- עדכון טוקנים קיימים
- שאילתות בסיסיות
"""

from typing import Optional, Dict, List
from datetime import datetime, timezone
import httpx
from core.config import settings
from utils.logger import get_logger

logger = get_logger("supabase")


class SupabaseClient:
    """Client for Supabase database operations"""
    
    def __init__(self):
        self.url = settings.supabase_url
        self.key = settings.supabase_key
        self.service_key = settings.supabase_service_key
        self._client: Optional[httpx.AsyncClient] = None
        
        if not self.url or not self.key:
            logger.warning("⚠️ Supabase not configured - database operations disabled")
            logger.warning(f"   SUPABASE_URL: {'Set' if self.url else 'Missing'}")
            logger.warning(f"   SUPABASE_KEY: {'Set' if self.key else 'Missing'}")
            self.enabled = False
        else:
            # Clean up URL - remove trailing slash and /rest/v1 if present
            url = self.url.strip().rstrip('/')
            if url.endswith('/rest/v1'):
                url = url[:-8]
            self.url = url
            self.enabled = True
            self._base_url = f"{self.url}/rest/v1"
            logger.info(f"✅ Supabase configured: {self.url}")
    
    async def __aenter__(self):
        """Async context manager entry"""
        if self.enabled:
            try:
                self._client = httpx.AsyncClient(
                    base_url=self._base_url,
                    headers={
                        "apikey": self.key,
                        "Authorization": f"Bearer {self.key}",
                        "Content-Type": "application/json",
                        "Prefer": "return=representation"
                    },
                    timeout=30.0
                )
                logger.debug(f"✅ Supabase client initialized: {self._base_url}")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Supabase client: {e}")
                logger.error(f"   URL: {self._base_url}")
                self._client = None
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self._client:
            await self._client.aclose()
            self._client = None
    
    async def save_token(self, token: Dict) -> bool:
        """
        Save or update a token in the database
        
        Args:
            token: Token dictionary with all analysis data
            
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled or not self._client:
            return False
        
        try:
            # Prepare token data for database
            token_data = {
                "address": token.get("address"),
                "symbol": token.get("symbol", "UNKNOWN"),
                "name": token.get("name", ""),
                "final_score": token.get("final_score", 0),
                "safety_score": token.get("safety_score", 0),
                "holder_score": token.get("holder_score", 0),
                "smart_money_score": token.get("final_score", 0) - token.get("safety_score", 0) - token.get("holder_score", 0),  # Calculate from final
                "grade": token.get("grade", "F"),
                "category": token.get("category", "POOR"),
                "holder_count": token.get("holder_count", 0),
                "top_10_percentage": token.get("top_10_percentage", 0.0),
                "ownership_renounced": token.get("ownership_renounced", False),
                "liquidity_locked": token.get("liquidity_locked", False),
                "mint_authority_disabled": token.get("mint_authority_disabled", False),
                "last_analyzed_at": datetime.now(timezone.utc).isoformat(),
            }
            
            # Upsert (insert or update if exists)
            # Supabase REST API: Use POST with Prefer header for upsert
            # The on_conflict parameter tells Supabase which column to check for conflicts
            # Note: The 'address' column must have a UNIQUE constraint in the database
            headers = {
                "Prefer": "resolution=merge-duplicates,return=representation"
            }
            response = await self._client.post(
                "/tokens",
                json=token_data,
                headers=headers,
                params={"on_conflict": "address"}
            )
            
            if response.status_code in (200, 201):
                logger.info(f"✅ Saved token {token.get('symbol', 'UNKNOWN')} to Supabase (status: {response.status_code})")
                return True
            else:
                logger.warning(f"⚠️ Failed to save token {token.get('symbol', 'UNKNOWN')}: {response.status_code} - {response.text[:200]}")
                return False
                
        except Exception as e:
            error_msg = str(e)
            if "Name or service not known" in error_msg or "Errno -2" in error_msg:
                logger.error(f"❌ DNS Error - Cannot resolve Supabase URL: {self.url}")
                logger.error(f"   Check SUPABASE_URL in Railway: should be 'https://[project].supabase.co'")
            else:
                logger.error(f"❌ Error saving token to database: {e}")
            return False
    
    async def get_tokens(self, limit: int = 100, min_score: Optional[int] = None) -> List[Dict]:
        """
        Get tokens from database
        
        Args:
            limit: Maximum number of tokens to return
            min_score: Minimum score filter
            
        Returns:
            List of token dictionaries
        """
        if not self.enabled or not self._client:
            return []
        
        try:
            params = {
                "order": "last_analyzed_at.desc",
                "limit": limit
            }
            
            if min_score is not None:
                params["final_score"] = f"gte.{min_score}"
            
            response = await self._client.get("/tokens", params=params)
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"⚠️ Failed to get tokens: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"❌ Error getting tokens from database: {e}")
            return []


# Global instance
_supabase_client: Optional[SupabaseClient] = None


def get_supabase_client() -> SupabaseClient:
    """Get or create Supabase client instance"""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = SupabaseClient()
    return _supabase_client
