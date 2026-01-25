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
import asyncio

from executor.jupiter_client import JupiterClient


class PositionStatus(Enum):
    """Position status types"""
    ACTIVE = "ACTIVE"
    STOP_LOSS_HIT = "STOP_LOSS_HIT" 
    TIME_LIMIT_REACHED = "TIME_LIMIT_REACHED"
    EMERGENCY_EXIT = "EMERGENCY_EXIT"  # NEW
    MANUAL_CLOSE = "MANUAL_CLOSE"
    COMPLETED = "COMPLETED"
from executor.wallet_manager import WalletManager
from executor.price_fetcher import PriceFetcher
from analyzer.rug_detector import get_rug_detector
from database.supabase_client import SupabaseClient
from core.config import settings
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
    entry_value_sol: float = 0.0  # ערך כניסה ב-SOL (למעקב רווחים)
    exit_price: Optional[float] = None  # מחיר יציאה (אם נמכר)
    exit_value_sol: Optional[float] = None  # ערך יציאה ב-SOL
    profit_sol: Optional[float] = None  # רווח/הפסד ב-SOL
    profit_pct: Optional[float] = None  # רווח/הפסד באחוזים
    stop_loss_pct: float = 0.15  # 15% stop loss
    time_limit_days: int = 7  # 7 ימים מקסימום
    status: PositionStatus = PositionStatus.ACTIVE
    transactions: list[str] = field(default_factory=list)  # Transaction signatures
    
    def get_age_days(self) -> float:
        """קבל גיל הפוזיציה בימים"""
        age = datetime.now(timezone.utc) - self.entry_timestamp
        return age.total_seconds() / 86400  # Convert to days
    
    def calculate_profit(self, exit_value_sol: float) -> Tuple[float, float]:
        """
        חשב רווח/הפסד
        
        Returns:
            Tuple[profit_sol, profit_pct]
        """
        if self.entry_value_sol == 0:
            return 0.0, 0.0
        
        profit_sol = exit_value_sol - self.entry_value_sol
        profit_pct = (profit_sol / self.entry_value_sol) * 100
        
        self.exit_value_sol = exit_value_sol
        self.profit_sol = profit_sol
        self.profit_pct = profit_pct
        
        return profit_sol, profit_pct


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
        supabase_client: Optional[SupabaseClient] = None,
    ):
        """
        אתחול PositionMonitor
        
        Args:
            jupiter_client: JupiterClient לביצוע swaps
            wallet_manager: WalletManager לבדיקת balances
            price_fetcher: PriceFetcher לקבלת מחירים (אופציונלי - יוצר חדש אם לא מוגדר)
            check_interval_seconds: תדירות בדיקה (ברירת מחדל: 30 שניות)
            alert_callback: פונקציה להתראות (אופציונלי)
            supabase_client: SupabaseClient לשמירת פוזיציות (אופציונלי)
        """
        self.jupiter = jupiter_client
        self.wallet = wallet_manager
        self.price_fetcher = price_fetcher or PriceFetcher()
        self.rug_detector = get_rug_detector()  # NEW
        self.check_interval = check_interval_seconds
        self.alert_callback = alert_callback
        self.supabase = supabase_client
        
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
        
        # שמור ב-Supabase
        if self.supabase and self.supabase.enabled:
            try:
                entry_value_usd = entry_price * amount_tokens
                position_data = {
                    "token_address": token_mint,
                    "token_symbol": token_symbol,
                    "token_name": token_symbol,  # TODO: Get from token info
                    "amount_tokens": amount_tokens,
                    "entry_price": entry_price,
                    "entry_value_usd": entry_value_usd,
                    "stop_loss_pct": stop_loss_pct * 100,  # Convert to percentage
                    "time_limit_days": time_limit_days,
                    "status": "ACTIVE",
                    "entry_timestamp": position.entry_timestamp.isoformat(),
                    "transaction_signatures": transactions or [],
                }
                async with self.supabase:
                    await self.supabase.save_position(position_data)
            except Exception as e:
                logger.error(f"❌ Error saving position to Supabase: {e}")
        
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
                
                # בדוק Rug Pull (NEW)
                try:
                    rug_alert = await self.rug_detector.check_rug_pull(position.token_mint)
                    
                    if rug_alert.is_rug_pull:
                        logger.warning(
                            f"🚨 RUG PULL DETECTED for {position.token_symbol}! "
                            f"Severity: {rug_alert.severity}, Score: {rug_alert.score}/100"
                        )
                        for reason in rug_alert.reasons:
                            logger.warning(f"  • {reason}")
                        
                        # Emergency exit!
                        await self._emergency_exit(position, rug_alert)
                        break
                    
                    elif rug_alert.severity in ["HIGH", "CRITICAL"]:
                        logger.warning(
                            f"⚠️ HIGH RUG RISK for {position.token_symbol} "
                            f"(Score: {rug_alert.score}/100) - Consider manual exit"
                        )
                
                except Exception as e:
                    logger.error(f"Error checking rug pull for {position.token_symbol}: {e}")
                
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
            
            # עדכן מחיר ב-Supabase
            if self.supabase and self.supabase.enabled:
                try:
                    current_value_usd = current_price * position.amount_tokens
                    entry_value_usd = position.entry_price * position.amount_tokens
                    pnl_usd = current_value_usd - entry_value_usd
                    pnl_pct = (pnl_usd / entry_value_usd * 100) if entry_value_usd > 0 else 0
                    
                    async with self.supabase:
                        await self.supabase.update_position_price(
                            position.token_mint,
                            current_price,
                            current_value_usd,
                            pnl_usd,
                            pnl_pct
                        )
                except Exception as e:
                    logger.error(f"❌ Error updating position price in Supabase: {e}")
            
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
            
            # חכה קצת שהטרנזקציה תאושר
            await asyncio.sleep(2)
            
            # קבל balance נוכחי (לחישוב רווח)
            current_balance = await self.wallet_manager.get_balance()
            
            # חשב רווח/הפסד
            # נניח שה-exit_value הוא ה-balance הנוכחי (לאחר המכירה)
            # זה לא מדויק 100%, אבל זה קירוב טוב
            if position.entry_value_sol > 0:
                exit_value_sol = current_balance - (position.entry_value_sol if position.entry_value_sol > 0 else 0)
                profit_sol, profit_pct = position.calculate_profit(exit_value_sol)
                
                logger.info(
                    f"📊 Profit/Loss: {profit_sol:+.4f} SOL ({profit_pct:+.2f}%)"
                )
            
            position.status = reason
            position.transactions.append(tx_signature)
            
            # עדכן ב-Supabase - סמן כסגור
            if self.supabase and self.supabase.enabled:
                try:
                    async with self.supabase:
                        await self.supabase.close_position(position.token_mint, reason.value)
                        
                        # שמור trade history
                        current_price = await self._get_current_price(position.token_mint) or position.entry_price
                        trade_data = {
                            "position_id": None,  # TODO: Get position ID from Supabase
                            "trade_type": "SELL",
                            "token_address": position.token_mint,
                            "token_symbol": position.token_symbol,
                            "token_name": position.token_symbol,
                            "amount_tokens": position.amount_tokens,
                            "price_usd": current_price,
                            "value_usd": current_price * position.amount_tokens,
                            "transaction_signature": tx_signature,
                            "realized_pnl_usd": position.profit_sol if position.profit_sol else None,
                            "realized_pnl_pct": position.profit_pct if position.profit_pct else None,
                        }
                        await self.supabase.save_trade(trade_data)
                except Exception as e:
                    logger.error(f"❌ Error updating position in Supabase: {e}")
            
            logger.info(
                f"✅ Position sold: {position.token_symbol}, "
                f"Transaction: https://solscan.io/tx/{tx_signature}"
            )
            
            # בדוק אם צריך להעביר כסף (רק אם יש threshold)
            await self._check_and_transfer_if_needed()
            
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
    
    async def _check_and_transfer_if_needed(self) -> Optional[str]:
        """
        בדוק אם צריך להעביר כסף לכתובת היעד
        
        העבר רק אם:
        1. יש כתובת יעד מוגדרת
        2. יש threshold מוגדר (> 0)
        3. ה-balance גבוה מה-threshold + reserve
        
        Returns:
            Transaction signature אם העביר, אחרת None
        """
        if not settings.wallet_destination_address:
            return None
        
        if settings.wallet_auto_transfer_threshold <= 0:
            # לא מוגדר threshold - לא מעביר אוטומטית
            return None
        
        try:
            # קבל balance נוכחי
            current_balance = await self.wallet_manager.get_balance()
            
            # חשב את הסכום המינימלי (threshold + reserve)
            min_balance = settings.wallet_auto_transfer_threshold + settings.wallet_reserve_sol
            
            # בדוק אם יש יותר מהמינימום
            if current_balance <= min_balance:
                logger.debug(
                    f"💰 Balance ({current_balance:.4f} SOL) <= "
                    f"threshold ({min_balance:.4f} SOL), not transferring"
                )
                return None
            
            # חשב כמה להעביר (הכל פחות reserve)
            amount_to_transfer = current_balance - settings.wallet_reserve_sol
            
            logger.info(
                f"💰 Auto-transfer: {amount_to_transfer:.4f} SOL "
                f"(balance: {current_balance:.4f}, reserve: {settings.wallet_reserve_sol})"
            )
            
            # העבר את הכסף
            transfer_tx = await self.wallet_manager.transfer_sol(
                destination_address=settings.wallet_destination_address,
                amount_sol=amount_to_transfer,
                keep_reserve=settings.wallet_reserve_sol,
            )
            
            if transfer_tx:
                logger.info(
                    f"✅ Auto-transferred {amount_to_transfer:.4f} SOL to destination. "
                    f"Transaction: https://solscan.io/tx/{transfer_tx}"
                )
                return transfer_tx
            else:
                logger.warning("⚠️ Failed to auto-transfer SOL")
                return None
                
        except Exception as e:
            logger.error(
                f"❌ Error checking/transferring: {e}",
                exc_info=True
            )
            return None
    
    async def transfer_manually(self, amount_sol: Optional[float] = None) -> Optional[str]:
        """
        העבר כסף ידנית לכתובת היעד
        
        Args:
            amount_sol: כמות SOL להעביר (אם None, מעביר הכל פחות reserve)
        
        Returns:
            Transaction signature או None
        """
        if not settings.wallet_destination_address:
            return None
        
        try:
            current_balance = await self.wallet_manager.get_balance()
            
            if amount_sol is None:
                # העבר הכל פחות reserve
                amount_to_transfer = max(0, current_balance - settings.wallet_reserve_sol)
            else:
                # בדוק שיש מספיק כסף
                if current_balance < amount_sol + settings.wallet_reserve_sol:
                    logger.warning(
                        f"⚠️ Not enough balance: {current_balance:.4f} SOL, "
                        f"need: {amount_sol + settings.wallet_reserve_sol:.4f} SOL"
                    )
                    return None
                amount_to_transfer = amount_sol
            
            if amount_to_transfer <= 0:
                logger.warning("⚠️ Nothing to transfer")
                return None
            
            transfer_tx = await self.wallet_manager.transfer_sol(
                destination_address=settings.wallet_destination_address,
                amount_sol=amount_to_transfer,
                keep_reserve=settings.wallet_reserve_sol,
            )
            
            if transfer_tx:
                logger.info(
                    f"✅ Manually transferred {amount_to_transfer:.4f} SOL. "
                    f"Transaction: https://solscan.io/tx/{transfer_tx}"
                )
                return transfer_tx
            else:
                logger.warning("⚠️ Failed to transfer SOL")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error transferring: {e}", exc_info=True)
            return None
    
    async def _emergency_exit(self, position: Position, rug_alert) -> None:
        """
        Emergency exit due to rug pull detection
        
        Args:
            position: Position to exit
            rug_alert: RugPullAlert object with details
        """
        logger.critical(
            f"🚨 EMERGENCY EXIT: {position.token_symbol} "
            f"({position.token_mint[:8]}...) - RUG PULL DETECTED!"
        )
        
        # Log all reasons
        for reason in rug_alert.reasons:
            logger.critical(f"  🚨 {reason}")
        
        try:
            # Attempt immediate sell
            await self._sell_position(
                position, 
                PositionStatus.EMERGENCY_EXIT  # We need to add this status
            )
            
            # Send urgent alert if callback available
            if self.alert_callback:
                alert_msg = (
                    f"🚨 EMERGENCY EXIT EXECUTED!\n"
                    f"Token: {position.token_symbol}\n"
                    f"Reason: Rug Pull Detected\n"
                    f"Severity: {rug_alert.severity}\n"
                    f"Score: {rug_alert.score}/100\n\n"
                    f"Details:\n" + 
                    "\n".join([f"• {r}" for r in rug_alert.reasons])
                )
                
                try:
                    await self.alert_callback(alert_msg)
                except Exception as e:
                    logger.error(f"Error sending emergency alert: {e}")
        
        except Exception as e:
            logger.error(
                f"❌ Emergency exit failed for {position.token_symbol}: {e}",
                exc_info=True
            )
            
            # Still send alert about the failure
            if self.alert_callback:
                try:
                    await self.alert_callback(
                        f"💥 EMERGENCY EXIT FAILED!\n"
                        f"Token: {position.token_symbol}\n"
                        f"Error: {str(e)}\n"
                        f"MANUAL INTERVENTION REQUIRED!"
                    )
                except:
                    pass
    
    def get_profit_stats(self) -> Dict[str, Any]:
        """
        קבל סטטיסטיקות רווחים/הפסדים
        
        Returns:
            Dict עם total_profit, total_trades, win_rate, וכו'
        """
        all_positions = self.get_all_positions()
        
        closed_positions = [p for p in all_positions if p.status != PositionStatus.ACTIVE]
        
        total_profit_sol = sum(p.profit_sol or 0 for p in closed_positions)
        total_trades = len(closed_positions)
        profitable_trades = len([p for p in closed_positions if p.profit_sol and p.profit_sol > 0])
        losing_trades = len([p for p in closed_positions if p.profit_sol and p.profit_sol < 0])
        
        win_rate = (profitable_trades / total_trades * 100) if total_trades > 0 else 0
        
        biggest_win = max([p.profit_sol or 0 for p in closed_positions], default=0)
        biggest_loss = min([p.profit_sol or 0 for p in closed_positions], default=0)
        
        return {
            "total_profit_sol": total_profit_sol,
            "total_trades": total_trades,
            "profitable_trades": profitable_trades,
            "losing_trades": losing_trades,
            "win_rate": win_rate,
            "biggest_win": biggest_win,
            "biggest_loss": biggest_loss,
        }