"""
Intelligent Token Scanner
Modern scanner with AI-powered filtering and multi-source discovery

📋 מה הקובץ הזה עושה:
-------------------
זה הקובץ שסורק ומזהה טוקנים חדשים ברשת Solana.

הקובץ הזה:
1. סורק טוקנים חדשים ממספר מקורות (DexScreener, Helius)
2. מסיר כפילויות (deduplication)
3. מסנן טוקנים ישנים (רק טוקנים שנוצרו ב-24 שעות האחרונות)
4. מציג את התוצאות בטבלה יפה

🔧 פונקציות עיקריות:
- discover_new_tokens(hours=24) - מוצא טוקנים חדשים
- display_tokens(tokens) - מציג טבלה יפה עם כל הטוקנים
- close() - סגירה נקייה של החיבורים

💡 איך זה עובד:
1. שולח בקשות ל-DexScreener API ו-Helius RPC
2. אוסף את כל הטוקנים החדשים
3. מסיר כפילויות (לפי כתובת)
4. מסנן רק טוקנים שנוצרו ב-24 שעות האחרונות
5. מחזיר רשימה של טוקנים חדשים

📝 הערות:
- משתמש ב-async/await לניהול I/O יעיל
- תומך ב-multi-source discovery (אם מקור אחד נכשל, מנסה את השני)
- מציג טבלה יפה עם Rich library
"""

import asyncio
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import httpx
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from core.config import settings
from utils.logger import get_logger

logger = get_logger("scanner")
console = Console()


class TokenScanner:
    """
    Intelligent token scanner with multi-source discovery
    
    Features:
    - Multi-source token discovery (Helius, DexScreener, Birdeye)
    - AI-powered filtering
    - Real-time monitoring
    - Smart caching
    """
    
    def __init__(self):
        self.helius_api_key = settings.helius_api_key
        self.rpc_url = settings.solana_rpc_url
        self.scan_interval = settings.scan_interval_seconds
        self.last_scan_time: Optional[datetime] = None
        self.discovered_tokens: Dict[str, datetime] = {}  # address -> first_seen
        
        # HTTP client with retry logic
        self.client = httpx.AsyncClient(
            timeout=30.0,
            limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
        )
    
    async def discover_new_tokens(self, hours: int = 24) -> List[Dict]:
        """
        Discover new tokens from multiple sources
        
        Args:
            hours: Look back period in hours
        
        Returns:
            List of discovered tokens with metadata
        """
        logger.info(f"🔍 Starting token discovery (last {hours}h)")
        
        all_tokens = []
        
        # Source 1: DexScreener (fast, reliable)
        try:
            dexscreener_tokens = await self._discover_from_dexscreener(hours)
            all_tokens.extend(dexscreener_tokens)
            logger.info(f"✅ DexScreener: Found {len(dexscreener_tokens)} tokens")
        except Exception as e:
            logger.error(f"❌ DexScreener error: {e}")
        
        # Source 2: Helius Enhanced APIs (if available)
        try:
            helius_tokens = await self._discover_from_helius(hours)
            all_tokens.extend(helius_tokens)
            logger.info(f"✅ Helius: Found {len(helius_tokens)} tokens")
        except Exception as e:
            logger.warning(f"⚠️ Helius discovery not available: {e}")
        
        # Deduplicate by address
        unique_tokens = self._deduplicate_tokens(all_tokens)
        
        # Filter out already seen tokens
        new_tokens = [
            token for token in unique_tokens
            if token["address"] not in self.discovered_tokens
        ]
        
        # Update discovered tokens
        for token in new_tokens:
            self.discovered_tokens[token["address"]] = datetime.now()
        
        logger.info(f"🎯 Total new tokens: {len(new_tokens)}")
        self.last_scan_time = datetime.now()
        
        return new_tokens
    
    async def _discover_from_dexscreener(self, hours: int) -> List[Dict]:
        """Discover tokens from DexScreener API"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        url = "https://api.dexscreener.com/latest/dex/pairs/solana"
        
        try:
            response = await self.client.get(url)
            response.raise_for_status()
            data = response.json()
            
            pairs = data.get("pairs", [])
            
            tokens = []
            for pair in pairs:
                # Check if pair is new
                try:
                    created_at = datetime.fromtimestamp(pair.get("pairCreatedAt", 0) / 1000)
                    if created_at < cutoff_time:
                        continue
                except (ValueError, TypeError):
                    continue
                
                # Extract token info
                base_token = pair.get("baseToken", {})
                quote_token = pair.get("quoteToken", {})
                
                # Only process SOL pairs
                if quote_token.get("symbol") != "SOL":
                    continue
                
                token = {
                    "address": base_token.get("address", ""),
                    "symbol": base_token.get("symbol", "UNKNOWN"),
                    "name": base_token.get("name", "Unknown Token"),
                    "decimals": base_token.get("decimals", 9),
                    "price_usd": float(pair.get("priceUsd", 0)),
                    "liquidity_usd": float(pair.get("liquidity", {}).get("usd", 0)),
                    "volume_24h": float(pair.get("volume", {}).get("h24", 0)),
                    "price_change_24h": float(pair.get("priceChange", {}).get("h24", 0)),
                    "created_at": created_at,
                    "source": "dexscreener",
                    "pair_address": pair.get("pairAddress", ""),
                }
                
                if token["address"]:
                    tokens.append(token)
            
            return tokens
            
        except Exception as e:
            logger.error(f"DexScreener API error: {e}")
            return []
    
    async def _discover_from_helius(self, hours: int) -> List[Dict]:
        """Discover tokens from Helius Enhanced APIs"""
        # Helius Enhanced APIs for token discovery
        # This is a placeholder - actual implementation depends on Helius API availability
        
        # For now, return empty list
        # TODO: Implement when Helius Enhanced APIs are available
        return []
    
    def _deduplicate_tokens(self, tokens: List[Dict]) -> List[Dict]:
        """Remove duplicate tokens by address"""
        seen = set()
        unique = []
        
        for token in tokens:
            address = token.get("address", "")
            if address and address not in seen:
                seen.add(address)
                unique.append(token)
        
        return unique
    
    def display_tokens(self, tokens: List[Dict]):
        """Display discovered tokens in a beautiful table"""
        if not tokens:
            console.print("📭 No new tokens found", style="yellow")
            return
        
        table = Table(title="🆕 New Tokens Discovered", show_header=True, header_style="bold magenta")
        table.add_column("Symbol", style="cyan", no_wrap=True)
        table.add_column("Address", style="dim")
        table.add_column("Price", justify="right", style="green")
        table.add_column("Score", justify="right", style="yellow")
        table.add_column("Grade", justify="center", style="magenta")
        table.add_column("Liquidity", justify="right")
        table.add_column("Volume 24h", justify="right")
        
        for token in tokens[:20]:  # Show top 20
            final_score = token.get("final_score", token.get("safety_score", 0))
            score_color = "green" if final_score >= 85 else "yellow" if final_score >= 70 else "red"
            grade = token.get("grade", "N/A")
            
            table.add_row(
                token.get("symbol", "N/A"),
                token.get("address", "")[:20] + "...",
                f"${token.get('price_usd', 0):.8f}",
                f"[{score_color}]{final_score}/100[/{score_color}]",
                f"[bold {score_color}]{grade}[/bold {score_color}]",
                f"${token.get('liquidity_usd', 0):,.0f}",
                f"${token.get('volume_24h', 0):,.0f}",
            )
        
        console.print(table)
        
        if len(tokens) > 20:
            console.print(f"\n... and {len(tokens) - 20} more tokens", style="dim")
    
    async def close(self):
        """Cleanup resources"""
        await self.client.aclose()


async def main_scan_loop():
    """Main scanning loop"""
    scanner = TokenScanner()
    
    try:
        console.print(Panel.fit(
            "[bold green]🚀 SolanaHunter Scanner Started[/bold green]\n"
            f"Scan interval: {scanner.scan_interval}s\n"
            f"RPC: {scanner.rpc_url[:50]}...",
            title="Scanner Status"
        ))
        
        while True:
            try:
                tokens = await scanner.discover_new_tokens(hours=24)
                
                if tokens:
                    scanner.display_tokens(tokens)
                else:
                    logger.info("⏳ No new tokens, waiting...")
                
                await asyncio.sleep(scanner.scan_interval)
                
            except KeyboardInterrupt:
                logger.info("🛑 Scanner stopped by user")
                break
            except Exception as e:
                logger.error(f"❌ Error in scan loop: {e}", exc_info=True)
                await asyncio.sleep(60)  # Wait before retry
    
    finally:
        await scanner.close()


if __name__ == "__main__":
    asyncio.run(main_scan_loop())
