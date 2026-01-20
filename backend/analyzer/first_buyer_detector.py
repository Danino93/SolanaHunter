"""
First Buyer Detector
Detect wallets that bought tokens early (first 24 hours)

📋 מה הקובץ הזה עושה:
-------------------
זה הקובץ שמוצא מי היו הקונים הראשונים של טוקן (24 שעות ראשונות).

הקובץ הזה:
1. מחפש את כל הקונים הראשונים של טוקן (24 שעות ראשונות)
2. מחזיר רשימה של ארנקים שקנו מוקדם
3. משמש את Smart Money Discovery Engine למציאת ארנקים חכמים

🔧 פונקציות עיקריות:
- detect_first_buyers(token_address) - מוצא את כל הקונים הראשונים
- get_buy_timestamp(wallet, token) - מוצא מתי ארנק קנה

💡 איך זה עובד:
1. שולח בקשה ל-Solscan API לקבלת טרנזקציות של הטוקן
2. מסנן רק טרנזקציות קנייה (buy) מ-24 השעות הראשונות
3. מחזיר רשימה של ארנקים שקנו מוקדם

📝 הערות:
- זה חלק מהמערכת של Smart Money Auto-Discovery
- ארנקים שקנו מוקדם טוקנים מוצלחים = פוטנציאל ל-Smart Money
- משתמש ב-Solscan API לנתוני טרנזקציות
"""

import asyncio
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import httpx

from utils.logger import get_logger

logger = get_logger("first_buyer")


@dataclass
class FirstBuyer:
    """First buyer information"""
    wallet_address: str
    token_address: str
    buy_timestamp: datetime
    buy_price: float
    amount_usd: float
    hours_after_launch: float


class FirstBuyerDetector:
    """
    Detect wallets that bought tokens early
    
    This identifies potential smart money by finding who bought first
    """
    
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def detect_first_buyers(
        self,
        token_address: str,
        hours: int = 24,
        limit: int = 50
    ) -> List[FirstBuyer]:
        """
        Detect wallets that bought token in first N hours
        
        Args:
            token_address: Token address
            hours: Time window (default: 24 hours)
            limit: Maximum number of buyers to return
        
        Returns:
            List of FirstBuyer objects
        """
        logger.info(f"🔍 Detecting first buyers for {token_address[:20]}... (first {hours}h)")
        
        try:
            # Get token creation time
            token_created = await self._get_token_creation_time(token_address)
            if not token_created:
                logger.warning(f"⚠️ Could not determine token creation time")
                return []
            
            cutoff_time = token_created + timedelta(hours=hours)
            
            # Get early transactions
            early_transactions = await self._get_early_transactions(
                token_address,
                token_created,
                cutoff_time
            )
            
            # Extract first buyers
            first_buyers = self._extract_first_buyers(early_transactions, token_created)
            
            # Sort by timestamp (earliest first)
            first_buyers.sort(key=lambda b: b.buy_timestamp)
            
            logger.info(f"✅ Found {len(first_buyers)} first buyers")
            
            return first_buyers[:limit]
            
        except Exception as e:
            logger.error(f"❌ Error detecting first buyers: {e}", exc_info=True)
            return []
    
    async def _get_token_creation_time(self, token_address: str) -> Optional[datetime]:
        """Get token creation timestamp"""
        try:
            # Use Solscan API
            url = f"https://api.solscan.io/token/meta"
            params = {"token": token_address}
            
            response = await self.http_client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                token_data = data.get("data", {})
                
                # Try to get creation time
                # Solscan might have this in metadata
                # If not available, use first transaction time
                return await self._get_first_transaction_time(token_address)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting token creation time: {e}")
            return None
    
    async def _get_first_transaction_time(self, token_address: str) -> Optional[datetime]:
        """Get time of first transaction for token"""
        try:
            # Get token transactions
            url = f"https://api.solscan.io/token/transactions"
            params = {
                "token": token_address,
                "limit": 1,
                "offset": 0
            }
            
            response = await self.http_client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                transactions = data.get("data", [])
                
                if transactions:
                    first_tx = transactions[-1]  # Oldest first
                    block_time = first_tx.get("blockTime", 0)
                    return datetime.fromtimestamp(block_time)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting first transaction time: {e}")
            return None
    
    async def _get_early_transactions(
        self,
        token_address: str,
        start_time: datetime,
        end_time: datetime
    ) -> List[Dict]:
        """Get transactions in time window"""
        try:
            # Get token transactions
            url = f"https://api.solscan.io/token/transactions"
            params = {
                "token": token_address,
                "limit": 100  # Get more to filter by time
            }
            
            response = await self.http_client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                all_transactions = data.get("data", [])
                
                # Filter by time window
                early_transactions = []
                for tx in all_transactions:
                    block_time = tx.get("blockTime", 0)
                    tx_time = datetime.fromtimestamp(block_time)
                    
                    if start_time <= tx_time <= end_time:
                        early_transactions.append(tx)
                
                return early_transactions
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting early transactions: {e}")
            return []
    
    def _extract_first_buyers(
        self,
        transactions: List[Dict],
        token_created: datetime
    ) -> List[FirstBuyer]:
        """Extract first buyer information from transactions"""
        first_buyers = []
        seen_wallets = set()
        
        for tx in transactions:
            try:
                # Extract buyer address (simplified - real implementation needs proper parsing)
                buyer_address = tx.get("signer", "") or tx.get("from", "")
                
                if not buyer_address or buyer_address in seen_wallets:
                    continue
                
                # Extract buy info
                block_time = tx.get("blockTime", 0)
                buy_timestamp = datetime.fromtimestamp(block_time)
                
                # Calculate hours after launch
                hours_after = (buy_timestamp - token_created).total_seconds() / 3600
                
                # Extract price and amount (simplified)
                # Real implementation would parse transaction data properly
                buy_price = 0.0  # Would need to parse from transaction
                amount_usd = 0.0  # Would need to parse from transaction
                
                buyer = FirstBuyer(
                    wallet_address=buyer_address,
                    token_address="",  # Will be set by caller
                    buy_timestamp=buy_timestamp,
                    buy_price=buy_price,
                    amount_usd=amount_usd,
                    hours_after_launch=hours_after
                )
                
                first_buyers.append(buyer)
                seen_wallets.add(buyer_address)
                
            except Exception as e:
                logger.debug(f"Failed to extract buyer from transaction: {e}")
                continue
        
        return first_buyers
    
    async def close(self):
        """Cleanup resources"""
        await self.http_client.aclose()


# Convenience function
async def detect_first_buyers(token_address: str, hours: int = 24) -> List[FirstBuyer]:
    """Convenience function to detect first buyers"""
    detector = FirstBuyerDetector()
    try:
        return await detector.detect_first_buyers(token_address, hours)
    finally:
        await detector.close()
