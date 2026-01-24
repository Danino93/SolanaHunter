"""
Holder Analysis Module
Analyze token holder distribution and concentration

📋 מה הקובץ הזה עושה:
-------------------
זה הקובץ שמנתח את פיזור המחזיקים של כל טוקן.
הקובץ תוקן כדי לשלוח API KEY ל-Solscan ולמנוע שגיאות 403.
"""

import asyncio
import os
from typing import List, Dict, Optional
from dataclasses import dataclass
import httpx

from utils.logger import get_logger

logger = get_logger("holder_analyzer")


@dataclass
class HolderAnalysis:
    """Holder analysis results"""
    top_10_percentage: float = 0.0
    top_20_percentage: float = 0.0
    is_concentrated: bool = False
    holder_count: int = 0
    top_holders: List[Dict] = None
    holder_score: int = 0  # 0-20 points
    
    def __post_init__(self):
        if self.top_holders is None:
            self.top_holders = []


class HolderAnalyzer:
    """
    Advanced holder distribution analyzer
    """
    
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=30.0)
        # טעינת המפתח מהסביבה
        self.api_key = os.getenv("SOLSCAN_API_KEY")
        if not self.api_key:
            logger.warning("⚠️ SOLSCAN_API_KEY not found in environment variables!")
    
    async def analyze(self, token_address: str, limit: int = 20) -> HolderAnalysis:
        """
        Analyze token holder distribution
        """
        logger.info(f"🔍 Analyzing holders for {token_address[:20]}...")
        
        analysis = HolderAnalysis()
        
        try:
            # Fetch holders from Solscan
            holders = await self._fetch_holders(token_address, limit)
            
            if not holders:
                logger.warning(f"⚠️ No holders found for {token_address}")
                return analysis
            
            analysis.top_holders = holders
            analysis.holder_count = len(holders)
            
            # Calculate percentages
            total_supply = sum(float(h.get("amount", 0)) for h in holders)
            
            if total_supply > 0:
                # Top 10 percentage
                top_10_amount = sum(float(h.get("amount", 0)) for h in holders[:10])
                analysis.top_10_percentage = (top_10_amount / total_supply) * 100
                
                # Top 20 percentage
                top_20_amount = sum(float(h.get("amount", 0)) for h in holders[:20])
                analysis.top_20_percentage = (top_20_amount / total_supply) * 100
            
            # Check if concentrated (risky)
            analysis.is_concentrated = analysis.top_10_percentage > 60.0
            
            # Calculate holder score (0-20 points)
            analysis.holder_score = self._calculate_holder_score(analysis)
            
            logger.info(
                f"📊 Holders: {analysis.holder_count} | "
                f"Top 10: {analysis.top_10_percentage:.1f}% | "
                f"Concentrated: {analysis.is_concentrated} | "
                f"Score: {analysis.holder_score}/20"
            )
            
        except Exception as e:
            logger.error(f"❌ Error analyzing holders: {e}", exc_info=True)
        
        return analysis
    
    async def _fetch_holders(self, token_address: str, limit: int = 20) -> List[Dict]:
        """
        Fetch top holders from Solscan API (Fixed with API Key)
        """
        try:
            # שימוש ב-API הציבורי של סולסקאן (דורש מפתח ב-Header)
            url = "https://public-api.solscan.io/token/holders"
            
            params = {
                "tokenAddress": token_address, # שים לב: הפרמטר שונה ל-tokenAddress בגרסאות מסוימות, אבל ננסה לשמור על תאימות
                "limit": limit,
                "offset": 0
            }
            
            # התיקון החשוב: הוספת הכותרת עם המפתח
            headers = {}
            if self.api_key:
                headers = {"token": self.api_key}
            
            # ניסיון ראשון עם public-api
            response = await self.http_client.get(url, params=params, headers=headers)
            
            # אם נכשל, ננסה את ה-API הישן יותר כגיבוי
            if response.status_code != 200:
                 url_backup = "https://api.solscan.io/token/holders"
                 params_backup = {
                    "token": token_address,
                    "offset": 0,
                    "limit": limit
                 }
                 response = await self.http_client.get(url_backup, params=params_backup, headers=headers)

            if response.status_code == 200:
                data = response.json()
                # Solscan לפעמים מחזיר את המידע בתוך data ולפעמים ישירות
                holders = data.get("data", []) if isinstance(data, dict) else data
                
                # Sort by amount (descending)
                if holders:
                    holders.sort(key=lambda x: float(x.get("amount", 0)), reverse=True)
                
                return holders
            else:
                logger.warning(f"⚠️ Solscan API returned {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            logger.error(f"Error fetching holders: {e}")
            return []
    
    def _calculate_holder_score(self, analysis: HolderAnalysis) -> int:
        """
        Calculate holder distribution score (0-20 points)
        """
        score = 0
        
        # Distribution bonus (10 points)
        if not analysis.is_concentrated:
            score += 10
            logger.debug("✅ Not concentrated: +10 points")
        
        # Holder count bonus (10 points max)
        if analysis.holder_count > 1000:
            score += 10
            logger.debug("✅ >1000 holders: +10 points")
        elif analysis.holder_count > 500:
            score += 7
            logger.debug("✅ >500 holders: +7 points")
        elif analysis.holder_count > 100:
            score += 5
            logger.debug("✅ >100 holders: +5 points")
        elif analysis.holder_count > 50:
            score += 3
            logger.debug("✅ >50 holders: +3 points")
        
        return min(score, 20)
    
    async def close(self):
        """Cleanup resources"""
        await self.http_client.aclose()


# Convenience function
async def analyze_holders(token_address: str, limit: int = 20) -> HolderAnalysis:
    """
    Convenience function to analyze holders
    """
    analyzer = HolderAnalyzer()
    try:
        return await analyzer.analyze(token_address, limit)
    finally:
        await analyzer.close()


if __name__ == "__main__":
    # Test with BONK
    async def test():
        analyzer = HolderAnalyzer()
        try:
            # BONK address for testing
            bonk_address = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
            result = await analyzer.analyze(bonk_address)
            
            print(f"\nHolder Analysis:")
            print(f"Holder Count: {result.holder_count}")
            print(f"Top 10%: {result.top_10_percentage:.2f}%")
            print(f"Top 20%: {result.top_20_percentage:.2f}%")
            print(f"Is Concentrated: {result.is_concentrated}")
            print(f"Holder Score: {result.holder_score}/20")
        finally:
            await analyzer.close()
    
    asyncio.run(test())