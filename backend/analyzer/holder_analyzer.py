"""
Holder Analysis Module - RPC VERSION
Analyze token holder distribution using direct RPC calls
(Bypasses Cloudflare & Solscan blocking completely)
"""

import asyncio
import os
from typing import List, Dict
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
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=10.0)
        # ננסה למשוך את כתובת ה-RPC מהמשתנים, אם אין נשתמש בברירת מחדל ציבורית
        self.rpc_url = os.getenv("RPC_ENDPOINT") or os.getenv("HELIUS_RPC_URL") or "https://api.mainnet-beta.solana.com"
        
    async def analyze(self, token_address: str, limit: int = 20) -> HolderAnalysis:
        logger.info(f"🔍 Analyzing holders via RPC for {token_address[:20]}...")
        analysis = HolderAnalysis()
        
        try:
            # שלב 1: השגת הכמות הכוללת (Supply)
            supply_data = await self._get_token_supply(token_address)
            if not supply_data:
                logger.warning("⚠️ Could not fetch token supply")
                return analysis
            
            total_supply = float(supply_data['amount'])
            decimals = supply_data['decimals']

            # שלב 2: השגת המחזיקים הגדולים ישירות מהבלוקצ'יין
            top_accounts = await self._get_largest_accounts(token_address)
            
            if not top_accounts:
                logger.warning("⚠️ No holders found via RPC")
                return analysis

            # המרה לפורמט שהבוט מכיר
            formatted_holders = []
            for acc in top_accounts:
                amount = float(acc['amount']) / (10 ** decimals)
                formatted_holders.append({
                    "address": acc['address'],
                    "amount": amount,
                    "percentage": (amount / total_supply) * 100 if total_supply > 0 else 0
                })

            analysis.top_holders = formatted_holders
            # ה-RPC מחזיר רק את ה-20 הגדולים, אז נניח שיש יותר אם הרשימה מלאה
            analysis.holder_count = 1000 if len(formatted_holders) >= 20 else len(formatted_holders)
            
            # חישוב אחוזים
            if total_supply > 0:
                top_10_sum = sum(h['amount'] for h in formatted_holders[:10])
                top_20_sum = sum(h['amount'] for h in formatted_holders[:20])
                
                analysis.top_10_percentage = (top_10_sum / total_supply) * 100
                analysis.top_20_percentage = (top_20_sum / total_supply) * 100

            # בדיקת ריכוזיות
            analysis.is_concentrated = analysis.top_10_percentage > 60.0
            
            # חישוב ציון
            analysis.holder_score = self._calculate_holder_score(analysis)
            
            logger.info(
                f"📊 RPC Analysis: Top 10 holds {analysis.top_10_percentage:.1f}% | "
                f"Score: {analysis.holder_score}/20"
            )
            
        except Exception as e:
            logger.error(f"❌ Error analyzing holders: {e}")
        
        return analysis

    async def _get_token_supply(self, token_address: str):
        """פנייה ל-RPC לקבלת ה-Supply"""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTokenSupply",
            "params": [token_address]
        }
        try:
            resp = await self.http_client.post(self.rpc_url, json=payload)
            data = resp.json()
            if "result" in data:
                return data["result"]["value"]
        except Exception:
            return None
        return None

    async def _get_largest_accounts(self, token_address: str):
        """פנייה ל-RPC לקבלת 20 המחזיקים הגדולים"""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTokenLargestAccounts",
            "params": [token_address]
        }
        try:
            resp = await self.http_client.post(self.rpc_url, json=payload)
            data = resp.json()
            if "result" in data:
                return data["result"]["value"]
        except Exception as e:
            logger.error(f"RPC Error: {e}")
        return []

    def _calculate_holder_score(self, analysis: HolderAnalysis) -> int:
        score = 0
        # בונוס על ביזור
        if analysis.top_10_percentage < 30: score += 10
        elif analysis.top_10_percentage < 50: score += 7
        elif analysis.top_10_percentage < 70: score += 4
        
        # מכיוון שאנחנו לא יודעים את סך המחזיקים המדויק דרך RPC רגיל
        # אנחנו ניתן ניקוד בסיס אם יש לפחות 20 מחזיקים פעילים
        if len(analysis.top_holders) >= 20:
            score += 10
            
        return min(score, 20)
    
    async def close(self):
        await self.http_client.aclose()

async def analyze_holders(token_address: str, limit: int = 20) -> HolderAnalysis:
    analyzer = HolderAnalyzer()
    try:
        return await analyzer.analyze(token_address, limit)
    finally:
        await analyzer.close()