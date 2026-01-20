"""
Holder Analysis Module
Analyze token holder distribution and concentration

📋 מה הקובץ הזה עושה:
-------------------
זה הקובץ שמנתח את פיזור המחזיקים של כל טוקן.

הקובץ הזה:
1. מוצא את כל המחזיקים של הטוקן (Top Holders)
2. מחשב כמה אחוזים מהטוקנים בידי Top 10 מחזיקים
3. בודק אם יש ריכוזיות (concentration) - סיכון למניפולציה
4. מחזיר ציון מחזיקים (0-20 נקודות)

🔧 פונקציות עיקריות:
- analyze(address) - מנתח את כל המחזיקים
- calculate_concentration(top_holders) - מחשב ריכוזיות
- assign_holder_score(holders) - נותן ציון (0-20)

💡 איך זה עובד:
1. שולח בקשה ל-Solscan API לקבלת רשימת מחזיקים
2. מחשב כמה אחוזים בידי Top 10 מחזיקים
3. בודק כמה מחזיקים יש בסך הכל
4. נותן ציון לפי:
   - Top 10% < 50% = טוב (10 נקודות)
   - יותר מ-1000 מחזיקים = טוב (10 נקודות)

📝 הערות:
- ריכוזיות גבוהה = סיכון למניפולציה במחיר
- טוקן עם הרבה מחזיקים = יותר מבוזר = טוב יותר
- משתמש ב-Solscan API לנתוני מחזיקים
"""

import asyncio
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
    
    Analyzes:
    - Top 10/20 holder concentration
    - Total holder count
    - Distribution risk
    - Holder score (0-20 points)
    """
    
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def analyze(self, token_address: str, limit: int = 20) -> HolderAnalysis:
        """
        Analyze token holder distribution
        
        Args:
            token_address: Token mint address
            limit: Number of top holders to fetch
        
        Returns:
            HolderAnalysis object with results
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
        Fetch top holders from Solscan API
        
        Args:
            token_address: Token mint address
            limit: Number of holders to fetch
        
        Returns:
            List of holder dictionaries
        """
        try:
            url = "https://api.solscan.io/token/holders"
            params = {
                "token": token_address,
                "offset": 0,
                "limit": limit
            }
            
            response = await self.http_client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                holders = data.get("data", [])
                
                # Sort by amount (descending)
                holders.sort(key=lambda x: float(x.get("amount", 0)), reverse=True)
                
                return holders
            else:
                logger.warning(f"⚠️ Solscan API returned {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error fetching holders: {e}")
            return []
    
    def _calculate_holder_score(self, analysis: HolderAnalysis) -> int:
        """
        Calculate holder distribution score (0-20 points)
        
        Scoring:
        - Not concentrated (top 10 < 60%): 10 points
        - Holder count > 1000: 10 points
        - Holder count > 500: 7 points
        - Holder count > 100: 5 points
        - Holder count > 50: 3 points
        
        Args:
            analysis: HolderAnalysis object
        
        Returns:
            Score 0-20
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
    
    Args:
        token_address: Token mint address
        limit: Number of top holders to fetch
    
    Returns:
        HolderAnalysis object
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
