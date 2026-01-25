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
from datetime import datetime, timezone, timedelta
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
        Save or update a token in the database (scanned_tokens_history table)
        
        Features:
        - Saves token creation time (token_created_at)
        - Calculates token age in hours
        - Sets last_scanned_at to current time
        - Calculates next_scan_at based on score and age
        - Sets scan_priority for smart rescanning
        
        Args:
            token: Token dictionary with all analysis data
            
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled or not self._client:
            return False
        
        try:
            # Calculate smart_money_score if not provided
            smart_money_score = token.get("smart_money_score")
            if smart_money_score is None:
                # Calculate from final_score - safety_score - holder_score
                smart_money_score = max(0, token.get("final_score", 0) - token.get("safety_score", 0) - token.get("holder_score", 0))
            
            # Get token creation time
            token_created_at = token.get("created_at")
            if isinstance(token_created_at, str):
                try:
                    token_created_at = datetime.fromisoformat(token_created_at.replace('Z', '+00:00'))
                except:
                    token_created_at = None
            elif isinstance(token_created_at, datetime):
                pass  # Already datetime
            else:
                token_created_at = None
            
            # Calculate token age in hours
            now = datetime.now(timezone.utc)
            token_age_hours = None
            if token_created_at:
                if isinstance(token_created_at, datetime):
                    if token_created_at.tzinfo is None:
                        token_created_at = token_created_at.replace(tzinfo=timezone.utc)
                    age_delta = now - token_created_at
                    token_age_hours = int(age_delta.total_seconds() / 3600)
            
            # Calculate scan priority and next_scan_at based on score and age
            final_score = token.get("final_score", 0)
            scan_priority = 0
            next_scan_at = None
            
            if token_age_hours is not None:
                # Very new tokens (0-2 hours) with high score = highest priority
                if token_age_hours < 2 and final_score >= 85:
                    scan_priority = 100
                    next_scan_at = (now + timedelta(minutes=5)).isoformat()
                # New tokens (2-24 hours) with high score = high priority
                elif token_age_hours < 24 and final_score >= 80:
                    scan_priority = 70
                    next_scan_at = (now + timedelta(minutes=30)).isoformat()
                # Medium score tokens = medium priority
                elif final_score >= 60:
                    scan_priority = 40
                    next_scan_at = (now + timedelta(hours=2)).isoformat()
                # Low score or old tokens = low priority
                else:
                    scan_priority = 10
                    next_scan_at = (now + timedelta(hours=24)).isoformat()
            else:
                # If we don't know token age, use score only
                if final_score >= 85:
                    scan_priority = 80
                    next_scan_at = (now + timedelta(minutes=30)).isoformat()
                elif final_score >= 60:
                    scan_priority = 40
                    next_scan_at = (now + timedelta(hours=2)).isoformat()
                else:
                    scan_priority = 10
                    next_scan_at = (now + timedelta(hours=24)).isoformat()
            
            # Prepare token data for scanned_tokens_history table
            # Note: first_seen is not included - it will use DEFAULT NOW() for new tokens
            # and won't be updated for existing tokens (preserves original first_seen)
            token_data = {
                "address": token.get("address"),
                "symbol": token.get("symbol", "UNKNOWN"),
                "name": token.get("name", ""),
                "final_score": token.get("final_score", 0),
                "safety_score": token.get("safety_score", 0),
                "holder_score": token.get("holder_score", 0),
                "smart_money_score": smart_money_score,
                # Additional scores (default to 0 if not available)
                "liquidity_score": token.get("liquidity_score", 0),
                "volume_score": token.get("volume_score", 0),
                "price_action_score": token.get("price_action_score", 0),
                "grade": token.get("grade", "F"),
                "category": token.get("category", "POOR"),
                "holder_count": token.get("holder_count", 0),
                "smart_money_count": token.get("smart_money_count", 0),
                # Market data
                "liquidity_sol": token.get("liquidity_sol", 0.0),
                "volume_24h": token.get("volume_24h", 0.0),
                "price_usd": token.get("price_usd", 0.0),
                "market_cap": token.get("market_cap", 0.0),
                # Source and status
                "source": token.get("source", "dexscreener"),
                "status": token.get("status", "active"),
                # 🆕 New fields for smart scanning
                "token_created_at": token_created_at.isoformat() if token_created_at else None,
                "token_age_hours": token_age_hours,
                "last_scanned_at": now.isoformat(),
                "next_scan_at": next_scan_at,
                "scan_priority": scan_priority,
            }
            
            # Upsert (insert or update if exists)
            # Supabase REST API: Use POST with Prefer header for upsert
            # The on_conflict parameter tells Supabase which column to check for conflicts
            # Note: The 'address' column must have a UNIQUE constraint in the database
            headers = {
                "Prefer": "resolution=merge-duplicates,return=representation"
            }
            response = await self._client.post(
                "/scanned_tokens_history",  # ✅ שינוי: שמירה ל-scanned_tokens_history במקום tokens
                json=token_data,
                headers=headers,
                params={"on_conflict": "address"}
            )
            
            if response.status_code in (200, 201):
                logger.info(f"✅ Saved token {token.get('symbol', 'UNKNOWN')} to scanned_tokens_history (status: {response.status_code})")
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
        Get tokens from database (scanned_tokens_history table)
        
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
                "order": "first_seen.desc",  # ✅ שינוי: first_seen במקום last_analyzed_at
                "limit": limit
            }
            
            if min_score is not None:
                params["final_score"] = f"gte.{min_score}"
            
            response = await self._client.get("/scanned_tokens_history", params=params)  # ✅ שינוי: קריאה מ-scanned_tokens_history
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"⚠️ Failed to get tokens: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"❌ Error getting tokens from database: {e}")
            return []
    
    async def get_tokens_to_rescan(self, limit: int = 50) -> List[Dict]:
        """
        Get tokens that need to be rescanned based on next_scan_at and scan_priority
        
        This is used for smart rescanning - only tokens that actually need updating
        will be returned, saving resources.
        
        Args:
            limit: Maximum number of tokens to return
            
        Returns:
            List of token dictionaries that need rescanning
        """
        if not self.enabled or not self._client:
            return []
        
        try:
            now = datetime.now(timezone.utc).isoformat()
            
            # Get tokens where next_scan_at <= now, ordered by scan_priority DESC
            # This ensures high-priority tokens are scanned first
            params = {
                "next_scan_at": f"lte.{now}",
                "order": "scan_priority.desc,next_scan_at.asc",
                "limit": limit
            }
            
            response = await self._client.get("/scanned_tokens_history", params=params)
            
            if response.status_code == 200:
                tokens = response.json()
                logger.info(f"📋 Found {len(tokens)} tokens to rescan (priority-based)")
                return tokens
            else:
                logger.warning(f"⚠️ Failed to get tokens to rescan: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"❌ Error getting tokens to rescan: {e}")
            return []
    
    async def get_new_tokens(self, max_age_hours: int = 48, limit: int = 100) -> List[Dict]:
        """
        Get only new tokens (recently created) for initial scanning
        
        Args:
            max_age_hours: Maximum token age in hours (default: 48)
            limit: Maximum number of tokens to return
            
        Returns:
            List of new token dictionaries
        """
        if not self.enabled or not self._client:
            return []
        
        try:
            # Calculate cutoff time
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
            
            params = {
                "token_created_at": f"gte.{cutoff_time.isoformat()}",
                "order": "token_created_at.desc,scan_priority.desc",
                "limit": limit
            }
            
            response = await self._client.get("/scanned_tokens_history", params=params)
            
            if response.status_code == 200:
                tokens = response.json()
                logger.info(f"🆕 Found {len(tokens)} new tokens (age < {max_age_hours}h)")
                return tokens
            else:
                logger.warning(f"⚠️ Failed to get new tokens: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"❌ Error getting new tokens: {e}")
            return []


# Global instance
_supabase_client: Optional[SupabaseClient] = None


def get_supabase_client() -> SupabaseClient:
    """Get or create Supabase client instance"""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = SupabaseClient()
    return _supabase_client
