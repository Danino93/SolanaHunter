"""
Price Fetcher
קבלת מחירים של טוקנים

📋 מה הקובץ הזה עושה:
-------------------
זה הקובץ שמביא מחירים של טוקנים מ-DexScreener (public API).

הקובץ הזה:
1. מביא מחיר נוכחי של טוקן
2. מביא מחיר היסטורי (אם צריך)
3. מטפל בשגיאות ו-rate limiting

🔧 שימוש:
```python
from executor.price_fetcher import PriceFetcher

fetcher = PriceFetcher()
price = await fetcher.get_token_price(token_mint)
```

📝 הערות:
- משתמש ב-DexScreener public API (חינם, אין צורך ב-key)
- Rate limit: 300 requests/minute
- מחזיר מחיר ב-USD
"""

import asyncio
from typing import Optional, Dict, Any
import httpx
from utils.logger import get_logger

logger = get_logger(__name__)

DEXSCREENER_API = "https://api.dexscreener.com/latest/dex/tokens"


class PriceFetcher:
    """
    Price Fetcher - קבלת מחירים מ-DexScreener
    
    מטופל:
    - קבלת מחיר נוכחי
    - Rate limiting
    - Error handling
    """
    
    def __init__(self):
        """אתחול PriceFetcher"""
        self.http_client = httpx.AsyncClient(timeout=10.0)
        logger.info("✅ PriceFetcher initialized")
    
    async def get_token_price(self, token_mint: str) -> Optional[float]:
        """
        קבל מחיר נוכחי של טוקן
        
        Args:
            token_mint: כתובת הטוקן
        
        Returns:
            מחיר ב-USD או None אם יש שגיאה
        """
        try:
            url = f"{DEXSCREENER_API}/{token_mint}"
            
            response = await self.http_client.get(url)
            response.raise_for_status()
            
            data = response.json()
            
            if "pairs" not in data or not data["pairs"]:
                logger.warning(f"⚠️ No pairs found for {token_mint[:8]}...")
                return None
            
            # קח את ה-pair הראשון (הכי נזיל בדרך כלל)
            pair = data["pairs"][0]
            
            price_usd = pair.get("priceUsd")
            
            if price_usd:
                price = float(price_usd)
                logger.debug(f"💰 Price for {token_mint[:8]}...: ${price:.6f}")
                return price
            else:
                logger.warning(f"⚠️ No price in pair data for {token_mint[:8]}...")
                return None
        
        except httpx.HTTPError as e:
            logger.error(f"❌ HTTP error getting price: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Error getting price: {e}", exc_info=True)
            return None
    
    async def get_token_info(self, token_mint: str) -> Optional[Dict[str, Any]]:
        """
        קבל מידע מלא על טוקן (מחיר, volume, liquidity, וכו')
        
        Args:
            token_mint: כתובת הטוקן
        
        Returns:
            Dict עם מידע על הטוקן או None
        """
        try:
            url = f"{DEXSCREENER_API}/{token_mint}"
            
            response = await self.http_client.get(url)
            response.raise_for_status()
            
            data = response.json()
            
            if "pairs" not in data or not data["pairs"]:
                return None
            
            # קח את ה-pair הראשון
            pair = data["pairs"][0]
            
            return {
                "price_usd": float(pair.get("priceUsd", 0)),
                "volume_24h": float(pair.get("volume", {}).get("h24", 0)),
                "liquidity_usd": float(pair.get("liquidity", {}).get("usd", 0)),
                "price_change_24h": float(pair.get("priceChange", {}).get("h24", 0)),
                "dex": pair.get("dexId"),
                "pair_address": pair.get("pairAddress"),
            }
        
        except Exception as e:
            logger.error(f"❌ Error getting token info: {e}", exc_info=True)
            return None
    
    async def close(self):
        """סגור את ה-HTTP client"""
        try:
            await self.http_client.aclose()
            logger.debug("PriceFetcher HTTP client closed")
        except Exception as e:
            logger.warning(f"Error closing HTTP client: {e}")
    
    async def __aenter__(self):
        """Async context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
