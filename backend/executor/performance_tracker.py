"""
Performance Tracker - Learning System 🧠
Tracks token performance and updates Smart Wallet trust scores

Features:
1. Tracks every token the bot recommends
2. Monitors price changes (ROI)
3. Updates Smart Wallet success rates
4. Learns from mistakes
5. Stores everything in Supabase

How it works:
1. When bot alerts on a token → track_token()
2. Every 5 minutes → update_all_tracked_tokens()
3. If ROI > 50% → mark as SUCCESS, update smart wallets
4. If ROI < -20% → mark as FAILURE, penalize smart wallets
"""

import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass
import json

from database.supabase_client import get_supabase_client
from analyzer.smart_money_tracker import get_smart_money_tracker
from executor.price_fetcher import PriceFetcher
from utils.logger import get_logger

logger = get_logger("performance_tracker")


@dataclass
class TrackedToken:
    """Token being tracked for performance"""
    address: str
    symbol: str
    entry_price: float
    entry_time: datetime
    entry_score: int
    smart_wallets: List[str]  # List of smart wallet addresses holding this token
    
    # Current state
    current_price: float = 0.0
    roi: float = 0.0
    status: str = "ACTIVE"  # ACTIVE, SUCCESS, FAILURE
    
    # Exit info
    exit_price: Optional[float] = None
    exit_time: Optional[datetime] = None


class PerformanceTracker:
    """
    Tracks token performance and learns from results
    
    This is the "brain" that makes the bot smarter over time!
    """
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self.smart_money_tracker = get_smart_money_tracker()
        self.price_fetcher = PriceFetcher()
        
        self.tracked_tokens: Dict[str, TrackedToken] = {}
        
        # Thresholds
        self.success_threshold = 50.0  # 50% ROI = success
        self.failure_threshold = -20.0  # -20% ROI = failure
        self.max_tracking_days = 7  # Stop tracking after 7 days
        
        logger.info("✅ Performance Tracker initialized")
    
    async def track_token(
        self,
        token_address: str,
        symbol: str,
        entry_price: float,
        entry_score: int,
        smart_wallets: List[str]
    ):
        """
        Start tracking a new token
        
        Called when the bot sends an alert
        
        Args:
            token_address: Token mint address
            symbol: Token symbol
            entry_price: Price when bot alerted (USD)
            entry_score: Bot's score (0-100)
            smart_wallets: List of smart wallet addresses holding this token
        """
        logger.info(
            f"📌 Starting to track {symbol} at ${entry_price:.8f} "
            f"(Score: {entry_score}/100)"
        )
        
        tracked = TrackedToken(
            address=token_address,
            symbol=symbol,
            entry_price=entry_price,
            entry_time=datetime.now(timezone.utc),
            entry_score=entry_score,
            smart_wallets=smart_wallets,
            current_price=entry_price,
            roi=0.0,
            status="ACTIVE"
        )
        
        self.tracked_tokens[token_address] = tracked
        
        # Save to database
        await self._save_to_db(tracked)
    
    async def update_all_tracked_tokens(self):
        """
        Update prices for all actively tracked tokens
        
        Should be called every 5 minutes
        """
        if not self.tracked_tokens:
            return
        
        logger.info(f"🔄 Updating {len(self.tracked_tokens)} tracked tokens...")
        
        for token_address, tracked in list(self.tracked_tokens.items()):
            # Skip if already finished
            if tracked.status != "ACTIVE":
                continue
            
            # Check if too old (stop tracking after 7 days)
            age = datetime.now(timezone.utc) - tracked.entry_time
            if age > timedelta(days=self.max_tracking_days):
                logger.info(f"⏰ {tracked.symbol} is too old, stopping tracking")
                tracked.status = "EXPIRED"
                await self._save_to_db(tracked)
                continue
            
            # Fetch current price
            try:
                current_price = await self.price_fetcher.get_price(token_address)
                
                if current_price and current_price > 0:
                    # Update price and ROI
                    tracked.current_price = current_price
                    tracked.roi = ((current_price - tracked.entry_price) / tracked.entry_price) * 100
                    
                    # Check if should mark as success/failure
                    if tracked.roi >= self.success_threshold:
                        await self._mark_success(tracked)
                    elif tracked.roi <= self.failure_threshold:
                        await self._mark_failure(tracked)
                    else:
                        # Just update in DB
                        await self._save_to_db(tracked)
                    
                    logger.info(
                        f"📊 {tracked.symbol}: "
                        f"${tracked.current_price:.8f} ({tracked.roi:+.1f}%) "
                        f"[{tracked.status}]"
                    )
            
            except Exception as e:
                logger.error(f"Error updating {tracked.symbol}: {e}")
    
    async def _mark_success(self, tracked: TrackedToken):
        """
        Mark token as successful and update smart wallets
        
        Called when ROI >= 50%
        """
        if tracked.status != "ACTIVE":
            return  # Already processed
        
        logger.warning(
            f"🎉 SUCCESS: {tracked.symbol} reached {tracked.roi:+.1f}% ROI!"
        )
        
        tracked.status = "SUCCESS"
        tracked.exit_price = tracked.current_price
        tracked.exit_time = datetime.now(timezone.utc)
        
        # Update smart wallets - they were RIGHT!
        for wallet_address in tracked.smart_wallets:
            await self._update_wallet_success(wallet_address, True)
        
        # Save to DB
        await self._save_to_db(tracked)
    
    async def _mark_failure(self, tracked: TrackedToken):
        """
        Mark token as failed and penalize smart wallets
        
        Called when ROI <= -20%
        """
        if tracked.status != "ACTIVE":
            return  # Already processed
        
        logger.warning(
            f"❌ FAILURE: {tracked.symbol} dropped to {tracked.roi:+.1f}% ROI"
        )
        
        tracked.status = "FAILURE"
        tracked.exit_price = tracked.current_price
        tracked.exit_time = datetime.now(timezone.utc)
        
        # Update smart wallets - they were WRONG!
        for wallet_address in tracked.smart_wallets:
            await self._update_wallet_success(wallet_address, False)
        
        # Save to DB
        await self._save_to_db(tracked)
    
    async def _update_wallet_success(self, wallet_address: str, was_successful: bool):
        """
        Update smart wallet's success rate
        
        This is how the bot learns!
        
        Args:
            wallet_address: Smart wallet address
            was_successful: True if token was successful, False if failed
        """
        wallet_info = self.smart_money_tracker.get_wallet_info(wallet_address)
        
        if not wallet_info:
            logger.warning(f"⚠️ Wallet {wallet_address[:8]} not found in tracker")
            return
        
        # Update stats
        wallet_info.total_trades += 1
        
        if was_successful:
            wallet_info.profitable_trades += 1
        
        # Recalculate success rate
        wallet_info.success_rate = (
            wallet_info.profitable_trades / wallet_info.total_trades * 100
        )
        
        logger.info(
            f"🎯 Updated {wallet_info.nickname or wallet_address[:8]}: "
            f"{wallet_info.profitable_trades}/{wallet_info.total_trades} "
            f"({wallet_info.success_rate:.1f}% success rate)"
        )
        
        # Save updated wallets
        self.smart_money_tracker.save_wallets()
    
    async def _save_to_db(self, tracked: TrackedToken):
        """
        Save tracked token to Supabase
        
        Table: performance_tracking
        Columns:
        - address (text, primary key)
        - symbol (text)
        - entry_price (float)
        - entry_time (timestamp)
        - entry_score (int)
        - smart_wallets (json)
        - current_price (float)
        - roi (float)
        - status (text)
        - exit_price (float, nullable)
        - exit_time (timestamp, nullable)
        """
        if not self.supabase:
            return
        
        try:
            data = {
                "address": tracked.address,
                "symbol": tracked.symbol,
                "entry_price": tracked.entry_price,
                "entry_time": tracked.entry_time.isoformat(),
                "entry_score": tracked.entry_score,
                "smart_wallets": json.dumps(tracked.smart_wallets),
                "current_price": tracked.current_price,
                "roi": tracked.roi,
                "status": tracked.status,
                "exit_price": tracked.exit_price,
                "exit_time": tracked.exit_time.isoformat() if tracked.exit_time else None,
            }
            
            # Upsert (insert or update)
            self.supabase.client.table("performance_tracking").upsert(data).execute()
        
        except Exception as e:
            logger.error(f"Error saving to DB: {e}")
    
    async def get_statistics(self) -> Dict:
        """
        Get overall performance statistics
        
        Returns:
            Dict with stats
        """
        if not self.supabase:
            return {}
        
        try:
            # Get all tracked tokens
            response = self.supabase.client.table("performance_tracking").select("*").execute()
            
            all_tokens = response.data
            
            total = len(all_tokens)
            successes = len([t for t in all_tokens if t["status"] == "SUCCESS"])
            failures = len([t for t in all_tokens if t["status"] == "FAILURE"])
            active = len([t for t in all_tokens if t["status"] == "ACTIVE"])
            
            success_rate = (successes / total * 100) if total > 0 else 0
            
            # Average ROI for completed tokens
            completed = [t for t in all_tokens if t["status"] in ["SUCCESS", "FAILURE"]]
            avg_roi = sum(t["roi"] for t in completed) / len(completed) if completed else 0
            
            return {
                "total_tracked": total,
                "successes": successes,
                "failures": failures,
                "active": active,
                "success_rate": success_rate,
                "average_roi": avg_roi,
            }
        
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {}
    
    async def start_monitoring(self):
        """
        Start the background monitoring loop
        
        Updates all tracked tokens every 5 minutes
        """
        logger.info("🚀 Starting performance monitoring loop...")
        
        while True:
            try:
                await self.update_all_tracked_tokens()
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
            
            # Wait 5 minutes
            await asyncio.sleep(300)
    
    async def close(self):
        """Cleanup resources"""
        await self.price_fetcher.close()


# ============================================================================
# Global Instance
# ============================================================================
_performance_tracker: Optional[PerformanceTracker] = None


def get_performance_tracker() -> PerformanceTracker:
    """Get global performance tracker instance"""
    global _performance_tracker
    if _performance_tracker is None:
        _performance_tracker = PerformanceTracker()
    return _performance_tracker