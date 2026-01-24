"""
Token Metrics Fetcher
Fetches real-time market metrics: Liquidity, Volume, Price Changes

APIs Used:
- DexScreener (primary)
- Birdeye (backup)
- Jupiter (price quotes)
"""

import asyncio
from typing import Dict, Optional
from dataclasses import dataclass
import httpx

from utils.logger import get_logger

logger = get_logger("token_metrics")


@dataclass
class TokenMetrics:
    """Token market metrics"""
    # Liquidity
    liquidity_usd: float = 0.0
    liquidity_sol: float = 0.0
    
    # Volume
    volume_24h: float = 0.0
    volume_6h: float = 0.0
    volume_1h: float = 0.0
    
    # Price
    price_usd: float = 0.0
    price_change_5m: float = 0.0
    price_change_1h: float = 0.0
    price_change_6h: float = 0.0
    price_change_24h: float = 0.0
    
    # Market Cap
    fdv: float = 0.0  # Fully Diluted Valuation
    market_cap: float = 0.0
    
    # Metadata
    source: str = "unknown"  # Which API provided the data


class TokenMetricsFetcher:
    """
    Fetches token metrics from multiple sources
    
    Priority:
    1. DexScreener (fast, reliable, free)
    2. Birdeye (detailed, requires API key)
    3. Jupiter (price only)
    """
    
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=15.0)
        self.sol_price_usd = 0.0  # Will be fetched on first call
    
    async def get_metrics(self, token_address: str) -> TokenMetrics:
        """
        Get comprehensive token metrics
        
        Args:
            token_address: Token mint address
        
        Returns:
            TokenMetrics object
        """
        logger.info(f"📊 Fetching metrics for {token_address[:20]}...")
        
        # Update SOL price if needed
        if self.sol_price_usd == 0:
            await self._update_sol_price()
        
        # Try DexScreener first (best for Solana)
        metrics = await self._fetch_from_dexscreener(token_address)
        
        if metrics and metrics.liquidity_sol > 0:
            logger.info(
                f"✅ Metrics from DexScreener: "
                f"Liq={metrics.liquidity_sol:.1f} SOL, "
                f"Vol={metrics.volume_24h:.0f} USD"
            )
            return metrics
        
        # Fallback: Try Birdeye
        logger.warning("⚠️ DexScreener failed, trying Birdeye...")
        metrics = await self._fetch_from_birdeye(token_address)
        
        if metrics and metrics.liquidity_sol > 0:
            logger.info(
                f"✅ Metrics from Birdeye: "
                f"Liq={metrics.liquidity_sol:.1f} SOL"
            )
            return metrics
        
        # No data found
        logger.warning(f"❌ Could not fetch metrics for {token_address}")
        return TokenMetrics()
    
    async def _fetch_from_dexscreener(self, token_address: str) -> Optional[TokenMetrics]:
        """
        Fetch metrics from DexScreener API
        
        Free API, no key required, very reliable for Solana
        """
        try:
            url = f"https://api.dexscreener.com/latest/dex/tokens/{token_address}"
            
            response = await self.http_client.get(url)
            
            if response.status_code != 200:
                return None
            
            data = response.json()
            pairs = data.get("pairs", [])
            
            if not pairs:
                return None
            
            # Get the main pair (usually the one with highest liquidity)
            # Filter for Solana pairs only
            solana_pairs = [p for p in pairs if p.get("chainId") == "solana"]
            
            if not solana_pairs:
                return None
            
            # Sort by liquidity (highest first)
            solana_pairs.sort(
                key=lambda x: float(x.get("liquidity", {}).get("usd", 0)),
                reverse=True
            )
            
            pair = solana_pairs[0]
            
            # Extract metrics
            metrics = TokenMetrics()
            
            # Liquidity
            liquidity = pair.get("liquidity", {})
            metrics.liquidity_usd = float(liquidity.get("usd", 0))
            metrics.liquidity_sol = metrics.liquidity_usd / self.sol_price_usd if self.sol_price_usd > 0 else 0
            
            # Volume
            volume = pair.get("volume", {})
            metrics.volume_24h = float(volume.get("h24", 0))
            metrics.volume_6h = float(volume.get("h6", 0))
            metrics.volume_1h = float(volume.get("h1", 0))
            
            # Price
            metrics.price_usd = float(pair.get("priceUsd", 0))
            
            # Price changes
            price_change = pair.get("priceChange", {})
            metrics.price_change_5m = float(price_change.get("m5", 0))
            metrics.price_change_1h = float(price_change.get("h1", 0))
            metrics.price_change_6h = float(price_change.get("h6", 0))
            metrics.price_change_24h = float(price_change.get("h24", 0))
            
            # Market Cap
            metrics.fdv = float(pair.get("fdv", 0))
            metrics.market_cap = float(pair.get("marketCap", 0))
            
            metrics.source = "dexscreener"
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error fetching from DexScreener: {e}")
            return None
    
    async def _fetch_from_birdeye(self, token_address: str) -> Optional[TokenMetrics]:
        """
        Fetch metrics from Birdeye API
        
        Requires API key, but has detailed data
        """
        # TODO: Implement Birdeye if you have API key
        # For now, return None
        return None
    
    async def _update_sol_price(self):
        """
        Update SOL price in USD
        
        Uses DexScreener to get current SOL price
        """
        try:
            # SOL token address (wrapped SOL)
            sol_address = "So11111111111111111111111111111111111111112"
            
            url = f"https://api.dexscreener.com/latest/dex/tokens/{sol_address}"
            response = await self.http_client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                pairs = data.get("pairs", [])
                
                if pairs:
                    # Get SOL/USDC pair
                    usdc_pairs = [
                        p for p in pairs 
                        if p.get("quoteToken", {}).get("symbol") == "USDC"
                    ]
                    
                    if usdc_pairs:
                        self.sol_price_usd = float(usdc_pairs[0].get("priceUsd", 0))
                        logger.info(f"💰 SOL Price: ${self.sol_price_usd:.2f}")
        
        except Exception as e:
            logger.error(f"Error fetching SOL price: {e}")
            self.sol_price_usd = 100.0  # Fallback estimate
    
    async def close(self):
        """Cleanup resources"""
        await self.http_client.aclose()


# ============================================================================
# Convenience Function
# ============================================================================
async def get_token_metrics(token_address: str) -> TokenMetrics:
    """
    Convenience function to get token metrics
    
    Args:
        token_address: Token mint address
    
    Returns:
        TokenMetrics object
    """
    fetcher = TokenMetricsFetcher()
    try:
        return await fetcher.get_metrics(token_address)
    finally:
        await fetcher.close()


# ============================================================================
# Test Function
# ============================================================================
if __name__ == "__main__":
    async def test():
        # Test with BONK
        bonk_address = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
        
        print("\n" + "="*60)
        print("Testing Token Metrics Fetcher")
        print("="*60 + "\n")
        
        metrics = await get_token_metrics(bonk_address)
        
        print(f"Results:")
        print(f"  Liquidity: ${metrics.liquidity_usd:,.2f} ({metrics.liquidity_sol:.1f} SOL)")
        print(f"  Volume 24h: ${metrics.volume_24h:,.2f}")
        print(f"  Price: ${metrics.price_usd:.8f}")
        print(f"  Price Change 5m: {metrics.price_change_5m:.2f}%")
        print(f"  Price Change 1h: {metrics.price_change_1h:.2f}%")
        print(f"  Price Change 24h: {metrics.price_change_24h:.2f}%")
        print(f"  FDV: ${metrics.fdv:,.2f}")
        print(f"  Source: {metrics.source}")
    
    asyncio.run(test())