"""
Holder Analysis Module
Analyze token holder distribution and concentration

📋 תיקון קריטי:
-------------------
1. עקיפת Cloudflare ע"י שימוש ב-User-Agent של דפדפן אמיתי.
2. תמיכה במפתחות API חדשים (Bearer Tokens).
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
        self.http_client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True
        )
        self.api_key = os.getenv("SOLSCAN_API_KEY")
        if not self.api_key:
            logger.warning("⚠️ SOLSCAN_API_KEY not found in environment variables!")
    
    async def analyze(self, token_address: str, limit: int = 20) -> HolderAnalysis:
        logger.info(f"🔍 Analyzing holders for {token_address[:20]}...")
        
        analysis = HolderAnalysis()
        
        try:
            holders = await self._fetch_holders(token_address, limit)
            
            if not holders:
                logger.warning(f"⚠️ No holders found for {token_address}")
                return analysis
            
            analysis.top_holders = holders
            analysis.holder_count = len(holders)
            
            # Calculate percentages
            total_supply = sum(float(h.get("amount", 0)) for h in holders)
            
            if total_supply > 0:
                top_10_amount = sum(float(h.get("amount", 0)) for h in holders[:10])
                analysis.top_10_percentage = (top_10_amount / total_supply) * 100
                
                top_20_amount = sum(float(h.get("amount", 0)) for h in holders[:20])
                analysis.top_20_percentage = (top_20_amount / total_supply) * 100
            
            analysis.is_concentrated = analysis.top_10_percentage > 60.0
            analysis.holder_score = self._calculate_holder_score(analysis)
            
            logger.info(
                f"📊 Holders: {analysis.holder_count} | "
                f"Top 10: {analysis.top_10_percentage:.1f}% | "
                f"Score: {analysis.holder_score}/20"
            )
            
        except Exception as e:
            logger.error(f"❌ Error analyzing holders: {e}", exc_info=True)
        
        return analysis
    
    async def _fetch_holders(self, token_address: str, limit: int = 20) -> List[Dict]:
        """
        Fetch top holders with Cloudflare bypass headers
        """
        try:
            # אנחנו מנסים להתחזות לדפדפן כדי לעבור את Cloudflare
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
                "Origin": "https://solscan.io",
                "Referer": "https://solscan.io/"
            }

            # הוספת המפתח בפורמטים שונים כדי לכסות את כל האפשרויות
            if self.api_key:
                headers["token"] = self.api_key
                headers["Authorization"] = f"Bearer {self.api_key}"

            # כתובת API ראשית
            url = "https://public-api.solscan.io/token/holders"
            params = {
                "tokenAddress": token_address,
                "limit": limit,
                "offset": 0
            }
            
            # שליחת הבקשה
            response = await self.http_client.get(url, params=params, headers=headers)
            
            # אם קיבלנו 403 או שגיאה, ננסה את ה-API הישן
            if response.status_code != 200:
                # logger.warning(f"Primary API failed ({response.status_code}), trying backup...")
                url_backup = "https://api.solscan.io/token/holders"
                params_backup = {
                    "token": token_address,
                    "limit": limit,
                    "offset": 0
                }
                response = await self.http_client.get(url_backup, params=params_backup, headers=headers)

            if response.status_code == 200:
                data = response.json()
                holders = data.get("data", []) if isinstance(data, dict) else data
                
                # סינון תוצאות ריקות
                if holders and isinstance(holders, list):
                    holders.sort(key=lambda x: float(x.get("amount", 0)), reverse=True)
                    return holders
            
            # אם הגענו לפה, נכשלה הבקשה
            if "Cloudflare" in response.text:
                logger.warning("⚠️ Blocked by Cloudflare protections")
            else:
                logger.warning(f"⚠️ Solscan API Error: {response.status_code}")
                
            return []
                
        except Exception as e:
            logger.error(f"Error fetching holders: {e}")
            return []
    
    def _calculate_holder_score(self, analysis: HolderAnalysis) -> int:
        score = 0
        if not analysis.is_concentrated:
            score += 10
        
        if analysis.holder_count > 1000:
            score += 10
        elif analysis.holder_count > 500:
            score += 7
        elif analysis.holder_count > 100:
            score += 5
        elif analysis.holder_count > 50:
            score += 3
        
        return min(score, 20)
    
    async def close(self):
        await self.http_client.aclose()


# Convenience function
async def analyze_holders(token_address: str, limit: int = 20) -> HolderAnalysis:
    analyzer = HolderAnalyzer()
    try:
        return await analyzer.analyze(token_address, limit)
    finally:
        await analyzer.close()