"""
Position Monitor
ניטור פוזיציות ומכירה אוטומטית (Stop Loss)

📋 מה הקובץ הזה עושה:
-------------------
זה הקובץ שמנהל את ניטור הפוזיציות - בדיקת מחיר, stop loss, מכירה אוטומטית.

הקובץ הזה:
1. ניטור מחיר כל 30 שניות
2. בדיקת stop loss (-15%)
3. מכירה אוטומטית אם stop loss הופעל
4. התראות בטלגרם
5. שמירת trade history
6. בדיקת time limit (7 ימים מקסימום)

⚠️ אבטחה:
- Stop Loss: ALWAYS -15% (אין יוצאים מהכלל!)
- Time Limit: 7 ימים מקסימום
- Emergency Exit: אם Rug Pull מזוהה → מכירה מיידית

🔧 שימוש:
```python
from executor.position_monitor import PositionMonitor

monitor = PositionMonitor(jupiter_client, wallet_manager)
await monitor.start_monitoring(position)
```

📝 הערות:
- ניטור רציף כל 30 שניות
- Stop loss: -15% (ברירת מחדל, ניתן לשנות)
- Time limit: 7 ימים (ברירת מחדל)
- התראות בטלגרם כשמוכר
"""

import asyncio
from typing import Optional, Dict, Any, Callable, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from enum import Enum

from executor.jupiter_client import JupiterClient
from executor.wallet_manager import WalletManager
from executor.price_fetcher import PriceFetcher
from utils.logger import get_logger

logger = get_logger(__name__)


class PositionStatus(Enum):
    """סטטוס פוזיציה"""
    ACTIVE = "active"
    STOP_LOSS_HIT = "stop_loss_hit"
    TIME_LIMIT_REACHED = "time_limit_reached"
    MANUALLY_CLOSED = "manually_closed"
    EMERGENCY_EXIT = "emergency_exit"


@dataclass
class Position:
    """פוזיציה פעילה"""
    token_mint: str
    token_symbol: str
    entry_price: float  # מחיר כניסה ממוצע (מ-DCA)
    amount_tokens: int  # כמות טוקנים (ב-minimum units)
    entry_timestamp: datetime
    stop_loss_pct: float = 0.15  # 15% stop loss
    time_limit_days: int = 7  # 7 ימים מקסימום
    status: PositionStatus = PositionStatus.ACTIVE
    transactions: list[str] = field(default_factory=list)  # Transaction signatures
    
    def get_age_days(self) -> float:
        """קבל גיל הפוזיציה בימים"""
        age = datetime.now(timezone.utc) - self.entry_timestamp
        return age.total_seconds() / 86400  # Convert to days


class PositionMonitor:
    """
    Position Monitor - ניטור פוזיציות ומכירה אוטומטית
    
    מטופל:
    - ניטור מחיר כל 30 שניות
    - בדיקת stop loss
    - מכירה אוטומטית
    - התראות
    """
    
    def __init__(
        self,
        jupiter_client: JupiterClient,
        wallet_manager: WalletManager,
        price_fetcher: Optional[PriceFetcher] = None,
        check_interval_seconds: int = 30,
        alert_callback: Optional[Callable] = None,
    ):
        """
        אתחול PositionMonitor
        
        Args:
            jupiter_client: JupiterClient לביצוע swaps
            wallet_manager: WalletManager לבדיקת balances
            price_fetcher: PriceFetcher לקבלת מחירים (אופציונלי - יוצר חדש אם לא מוגדר)
            check_interval_seconds: תדירות בדיקה (ברירת מחדל: 30 שניות)
            alert_callback: פונקציה להתראות (אופציונלי)
        """
        self.jupiter = jupiter_client
        self.wallet = wallet_manager
        self.price_fetcher = price_fetcher or PriceFetcher()
        self.check_interval = check_interval_seconds
        self.alert_callback = alert_callback
        
        self.positions: Dict[str, Position] = {}  # token_mint -> Position
        self.monitoring_tasks: Dict[str, asyncio.Task] = {}  # token_mint -> Task
        self._stop_monitoring = False
        
        logger.info("✅ PositionMonitor initialized")
    
    async def add_position(
        self,
        token_mint: str,
        token_symbol: str,
        entry_price: float,
        amount_tokens: int,
        stop_loss_pct: float = 0.15,
        time_limit_days: int = 7,
        transactions: Optional[list[str]] = None,
    ) -> Position:
        """
        הוסף פוזיציה חדשה לניטור
        
        Args:
            token_mint: כתובת הטוקן
            token_symbol: סימבול הטוקן
            entry_price: מחיר כניסה ממוצע
            amount_tokens: כמות טוקנים (ב-minimum units)
            stop_loss_pct: Stop loss percentage (ברירת מחדל: 15%)
            time_limit_days: זמן מקסימום בימים (ברירת מחדל: 7)
            transactions: רשימת transaction signatures
        
        Returns:
            Position object
        """
        position = Position(
            token_mint=token_mint,
            token_symbol=token_symbol,
            entry_price=entry_price,
            amount_tokens=amount_tokens,
            entry_timestamp=datetime.now(timezone.utc),
            stop_loss_pct=stop_loss_pct,
            time_limit_days=time_limit_days,
            transactions=transactions or [],
        )
        
        self.positions[token_mint] = position
        
        # התחל ניטור
        task = asyncio.create_task(self._monitor_position(position))
        self.monitoring_tasks[token_mint] = task
        
        logger.info(
            f"✅ Position added: {token_symbol} ({token_mint[:8]}...), "
            f"entry: ${entry_price:.6f}, stop loss: {stop_loss_pct*100:.1f}%"
        )
        
        return position
    
    async def _monitor_position(self, position: Position):
        """
        ניטור פוזיציה - לולאה רציפה
        
        Args:
            position: Position לניטור
        """
        logger.info(
            f"🔄 Starting monitoring: {position.token_symbol} "
            f"({position.token_mint[:8]}...)"
        )
        
        try:
            while not self._stop_monitoring:
                # בדוק stop loss
                should_sell, reason = await self._check_stop_loss(position)
                
                if should_sell:
                    await self._sell_position(position, reason)
                    break
                
                # בדוק time limit
                if position.get_age_days() >= position.time_limit_days:
                    logger.warning(
                        f"⏰ Time limit reached for {position.token_symbol} "
                        f"({position.time_limit_days} days)"
                    )
                    await self._sell_position(
                        position,
                        PositionStatus.TIME_LIMIT_REACHED
                    )
                    break
                
                # חכה לפני הבדיקה הבאה
                await asyncio.sleep(self.check_interval)
        
        except asyncio.CancelledError:
            logger.info(f"⏹️ Monitoring cancelled for {position.token_symbol}")
        except Exception as e:
            logger.error(
                f"❌ Error monitoring {position.token_symbol}: {e}",
                exc_info=True
            )
        finally:
            # נקה את הפוזיציה
            if position.token_mint in self.positions:
                del self.positions[position.token_mint]
            if position.token_mint in self.monitoring_tasks:
                del self.monitoring_tasks[position.token_mint]
    
    async def _check_stop_loss(self, position: Position) -> Tuple[bool, Optional[PositionStatus]]:
        """
        בדוק אם stop loss הופעל
        
        Returns:
            (should_sell, reason) - האם למכור ולמה
        """
        try:
            # קבל מחיר נוכחי
            current_price = await self._get_current_price(position.token_mint)
            
            if current_price is None:
                logger.warning(f"⚠️ Could not get price for {position.token_symbol}")
                return False, None
            
            # חשב הפסד
            loss_pct = (position.entry_price - current_price) / position.entry_price
            
            # בדוק stop loss
            if loss_pct >= position.stop_loss_pct:
                logger.warning(
                    f"🚨 STOP LOSS HIT! {position.token_symbol}: "
                    f"Entry: ${position.entry_price:.6f}, "
                    f"Current: ${current_price:.6f}, "
                    f"Loss: {loss_pct*100:.1f}%"
                )
                return True, PositionStatus.STOP_LOSS_HIT
            
            # לוג מחיר (כל 5 דקות)
            if int(asyncio.get_event_loop().time()) % 300 == 0:
                logger.debug(
                    f"📊 {position.token_symbol}: "
                    f"${current_price:.6f} (Entry: ${position.entry_price:.6f}, "
                    f"P&L: {((current_price - position.entry_price) / position.entry_price * 100):.1f}%)"
                )
            
            return False, None
        
        except Exception as e:
            logger.error(f"❌ Error checking stop loss: {e}", exc_info=True)
            return False, None
    
    async def _get_current_price(self, token_mint: str) -> Optional[float]:
        """
        קבל מחיר נוכחי של טוקן
        
        Args:
            token_mint: כתובת הטוקן
        
        Returns:
            מחיר ב-USD או None אם יש שגיאה
        """
        try:
            # השתמש ב-PriceFetcher לקבלת מחיר
            price = await self.price_fetcher.get_token_price(token_mint)
            return price
        
        except Exception as e:
            logger.error(f"❌ Error getting price: {e}")
            return None
    
    async def _sell_position(
        self,
        position: Position,
        reason: PositionStatus,
    ) -> Optional[str]:
        """
        מכור פוזיציה
        
        Args:
            position: Position למכירה
            reason: סיבת המכירה
        
        Returns:
            Transaction signature או None
        """
        try:
            logger.info(
                f"💰 Selling position: {position.token_symbol} "
                f"(reason: {reason.value})"
            )
            
            # בדוק balance
            # TODO: צריך לבדוק את ה-balance של הטוקן
            # כרגע נניח שיש לנו את ה-amount_tokens
            
            # בצע swap: Token → SOL
            tx_signature = await self.jupiter.swap_token_to_sol(
                token_mint=position.token_mint,
                amount_tokens=position.amount_tokens,
                slippage_bps=100,  # 1% slippage (גבוה יותר למכירה מהירה)
            )
            
            if not tx_signature:
                logger.error(f"❌ Failed to sell {position.token_symbol}")
                return None
            
            position.status = reason
            position.transactions.append(tx_signature)
            
            logger.info(
                f"✅ Position sold: {position.token_symbol}, "
                f"Transaction: https://solscan.io/tx/{tx_signature}"
            )
            
            # שלח התראה
            if self.alert_callback:
                await self.alert_callback(position, reason, tx_signature)
            
            return tx_signature
        
        except Exception as e:
            logger.error(
                f"❌ Error selling position: {e}",
                exc_info=True
            )
            return None
    
    async def emergency_exit(self, token_mint: str, reason: str = "Rug Pull detected"):
        """
        Emergency Exit - מכירה מיידית (Rug Pull, וכו')
        
        Args:
            token_mint: כתובת הטוקן
            reason: סיבת ה-Emergency Exit
        """
        if token_mint not in self.positions:
            logger.warning(f"⚠️ Position not found: {token_mint}")
            return
        
        position = self.positions[token_mint]
        
        logger.warning(
            f"🚨 EMERGENCY EXIT: {position.token_symbol} - {reason}"
        )
        
        position.status = PositionStatus.EMERGENCY_EXIT
        await self._sell_position(position, PositionStatus.EMERGENCY_EXIT)
    
    def get_position(self, token_mint: str) -> Optional[Position]:
        """קבל פוזיציה לפי token_mint"""
        return self.positions.get(token_mint)
    
    def get_all_positions(self) -> list[Position]:
        """קבל את כל הפוזיציות הפעילות"""
        return list(self.positions.values())
    
    async def stop_monitoring(self, token_mint: str):
        """עצור ניטור פוזיציה"""
        if token_mint in self.monitoring_tasks:
            self.monitoring_tasks[token_mint].cancel()
            logger.info(f"⏹️ Stopped monitoring: {token_mint[:8]}...")
    
    async def stop_all(self):
        """עצור את כל הניטור"""
        self._stop_monitoring = True
        
        for task in self.monitoring_tasks.values():
            task.cancel()
        
        await asyncio.gather(*self.monitoring_tasks.values(), return_exceptions=True)
        
        logger.info("⏹️ All monitoring stopped")
