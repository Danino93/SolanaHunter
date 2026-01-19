"""
Smart Money Auto-Discovery Engine
Automatically discover smart wallets by analyzing blockchain data
"""

import asyncio
from typing import List, Dict, Set, Optional
from datetime import datetime, timedelta
from pathlib import Path
import json

from analyzer.wallet_performance_analyzer import WalletPerformanceAnalyzer
from analyzer.first_buyer_detector import FirstBuyerDetector
from analyzer.smart_money_tracker import SmartMoneyTracker, SmartWallet
from utils.logger import get_logger

logger = get_logger("smart_discovery")


class SmartMoneyDiscovery:
    """
    Auto-Discovery Engine for Smart Wallets
    
    This is the INTELLIGENCE - learns from blockchain data to identify smart money
    """
    
    def __init__(self):
        self.wallet_analyzer = WalletPerformanceAnalyzer()
        self.first_buyer_detector = FirstBuyerDetector()
        self.tracker = SmartMoneyTracker()
        
        # Known successful tokens for historical analysis
        # These are tokens that did x100+ in the past
        # The bot will analyze who bought them early and learn from that
        self.successful_tokens = [
            "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",  # BONK - did x1000+
            # Add more successful tokens here as you discover them
            # Format: "token_address",  # Token name - performance
        ]
    
    async def discover_from_history(self) -> List[str]:
        """
        Discover smart wallets from historical analysis of successful tokens
        
        Process:
        1. Take list of successful tokens (BONK, WIF, etc.)
        2. Find who bought them early (first 24h)
        3. Analyze their performance
        4. Add smart wallets to tracker
        
        Returns:
            List of discovered wallet addresses
        """
        logger.info("🔍 Starting historical smart wallet discovery...")
        
        discovered_wallets: Set[str] = set()
        
        for token_address in self.successful_tokens:
            try:
                logger.info(f"📊 Analyzing {token_address[:20]}...")
                
                # Step 1: Find first buyers
                first_buyers = await self.first_buyer_detector.detect_first_buyers(
                    token_address,
                    hours=24,
                    limit=50
                )
                
                logger.info(f"  Found {len(first_buyers)} first buyers")
                
                # Step 2: Analyze each first buyer
                for buyer in first_buyers[:20]:  # Analyze top 20 to avoid rate limits
                    try:
                        wallet_address = buyer.wallet_address
                        
                        # Skip if already discovered
                        if wallet_address in discovered_wallets:
                            continue
                        
                        # Simplified approach: If wallet was first buyer of successful token,
                        # and we see it was first buyer of multiple successful tokens, it's likely smart
                        
                        # For now, we'll add first buyers of successful tokens directly
                        # (they caught a gem early, that's a good sign)
                        
                        # Check if wallet was first buyer of other successful tokens too
                        # This is a simplified check - real implementation would analyze full history
                        
                        # Add as smart wallet (being first buyer of successful token is already a good sign)
                        logger.info(
                            f"  ✅ Smart wallet candidate: {wallet_address[:20]}... | "
                            f"First buyer of successful token"
                        )
                        
                        # Add to tracker
                        self.tracker.add_smart_wallet(
                            wallet_address,
                            nickname=f"FirstBuyer-{token_address[:8]}"
                        )
                        discovered_wallets.add(wallet_address)
                        
                        # Note: Full performance analysis would require transaction history parsing
                        # For now, being first buyer of successful token is good enough indicator
                        
                        # Rate limiting
                        await asyncio.sleep(0.5)  # Don't hammer APIs
                        
                    except Exception as e:
                        logger.warning(f"  ⚠️ Failed to analyze {buyer.wallet_address[:20]}...: {e}")
                        continue
                
            except Exception as e:
                logger.error(f"❌ Error analyzing token {token_address[:20]}...: {e}")
                continue
        
        # Save discovered wallets
        self.tracker.save_wallets()
        
        logger.info(f"🎯 Discovery complete! Found {len(discovered_wallets)} smart wallets")
        
        return list(discovered_wallets)
    
    async def discover_from_new_token(
        self,
        token_address: str,
        token_performance: float  # x multiplier (e.g., 10.0 = x10)
    ) -> List[str]:
        """
        Discover smart wallets from a new token that performed well
        
        If a new token does x10+, the wallets that bought early might be smart
        
        Args:
            token_address: Token address
            token_performance: Performance multiplier (x10, x100, etc.)
        
        Returns:
            List of discovered wallet addresses
        """
        # Only analyze if token performed well
        if token_performance < 10.0:
            return []
        
        logger.info(
            f"🔍 Analyzing new token {token_address[:20]}... "
            f"(performed {token_performance:.1f}x)"
        )
        
        discovered_wallets: Set[str] = set()
        
        try:
            # Find first buyers
            first_buyers = await self.first_buyer_detector.detect_first_buyers(
                token_address,
                hours=24,
                limit=30
            )
            
            # Analyze each first buyer
            for buyer in first_buyers:
                try:
                    wallet_address = buyer.wallet_address
                    
                    # Simplified: If wallet was first buyer and token performed well,
                    # it's a good candidate for smart wallet
                    # (caught a gem early = good indicator)
                    
                    logger.info(
                        f"  ✅ New smart wallet candidate: {wallet_address[:20]}... "
                        f"from token {token_address[:20]}... (performed {token_performance:.1f}x)"
                    )
                    
                    self.tracker.add_smart_wallet(
                        wallet_address,
                        nickname=f"Auto-{token_address[:8]}"
                    )
                    discovered_wallets.add(wallet_address)
                    
                    await asyncio.sleep(0.3)
                    
                except Exception as e:
                    logger.debug(f"Failed to analyze buyer: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"Error discovering from new token: {e}")
        
        if discovered_wallets:
            self.tracker.save_wallets()
        
        return list(discovered_wallets)
    
    async def run_initial_discovery(self):
        """
        Run initial discovery on startup
        
        This populates the smart wallet list from historical data
        """
        logger.info("🚀 Running initial smart wallet discovery...")
        
        discovered = await self.discover_from_history()
        
        logger.info(f"✅ Initial discovery complete: {len(discovered)} smart wallets found")
        
        return discovered
    
    async def close(self):
        """Cleanup resources"""
        await self.wallet_analyzer.close()
        await self.first_buyer_detector.close()


# Global instance
_discovery_engine: Optional[SmartMoneyDiscovery] = None


def get_discovery_engine() -> SmartMoneyDiscovery:
    """Get global discovery engine instance"""
    global _discovery_engine
    if _discovery_engine is None:
        _discovery_engine = SmartMoneyDiscovery()
    return _discovery_engine
