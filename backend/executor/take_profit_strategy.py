"""
Take Profit Strategy
אסטרטגיית מכירה מדורגת - 30-30-40

📋 מה הקובץ הזה עושה:
-------------------
זה הקובץ שמנהל את אסטרטגיית ה-Take Profit - מכירה בשלבים במקום מכירה אחת.

האסטרטגיה:
1. ב-x2 → מכור 30% (החזרת השקעה)
2. ב-x5 → מכור עוד 30% (רווח מובטח)
3. השאר 40% עם trailing stop (תפיסת ירח)

למה Take Profit מדורג?
- מבטיח רווח - לא מחכה ל-moon
- נשאר חשוף לעליות - 40% עדיין פעיל
- מפחית FOMO - לא מוכר הכל מוקדם מדי

⚠️ אבטחה:
- תמיד בדוק את המחיר לפני מכירה
- Trailing stop עולה עם המחיר
- אם מחיר יורד - trailing stop נשאר במקום

🔧 שימוש:
```python
from executor.take_profit_strategy import TakeProfitStrategy

strategy = TakeProfitStrategy(jupiter_client, price_fetcher)
await strategy.monitor_and_sell(position)
```

📝 הערות:
- האסטרטגיה: 30% @ x2, 30% @ x5, 40% trailing stop
- Trailing stop: עולה עם המחיר, לא יורד
- ניטור רציף עד שכל ה-60% נמכר
"""

import asyncio
from typing import Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime, timezone

from executor.jupiter_client import JupiterClient
from executor.price_fetcher import PriceFetcher
from executor.position_monitor import Position, PositionStatus
from utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class TakeProfitTarget:
    """יעד Take Profit"""
    multiple: float  # x2, x5, וכו'
    sell_percentage: float  # 30%, 30%, וכו'
    sold: bool = False  # האם כבר נמכר


@dataclass
class TrailingStop:
    """Trailing Stop ל-40% האחרונים"""
    highest_price: float  # המחיר הגבוה ביותר שראינו
    trailing_pct: float = 0.10  # 10% trailing stop (ברירת מחדל)
    stop_price: Optional[float] = None  # מחיר stop הנוכחי
    
    def update(self, current_price: float):
        """עדכן trailing stop"""
        if current_price > self.highest_price:
            self.highest_price = current_price
            self.stop_price = current_price * (1 - self.trailing_pct)
            logger.debug(
                f"📈 Trailing stop updated: "
                f"Highest: ${self.highest_price:.6f}, "
                f"Stop: ${self.stop_price:.6f}"
            )
    
    def is_triggered(self, current_price: float) -> bool:
        """בדוק אם trailing stop הופעל"""
        if self.stop_price is None:
            return False
        return current_price <= self.stop_price


class TakeProfitStrategy:
    """
    Take Profit Strategy - מכירה מדורגת
    
    מטופל:
    - מכירה ב-x2 (30%)
    - מכירה ב-x5 (30%)
    - Trailing stop על 40%
    """
    
    # Take Profit targets: (multiple, sell_percentage)
    TARGETS = [
        TakeProfitTarget(multiple=2.0, sell_percentage=0.30),  # x2 → 30%
        TakeProfitTarget(multiple=5.0, sell_percentage=0.30),  # x5 → 30%
    ]
    
    # Remaining 40% with trailing stop
    REMAINING_PCT = 0.40
    
    def __init__(
        self,
        jupiter_client: JupiterClient,
        price_fetcher: PriceFetcher,
        check_interval_seconds: int = 60,  # בדיקה כל דקה
    ):
        """
        אתחול TakeProfitStrategy
        
        Args:
            jupiter_client: JupiterClient לביצוע swaps
            price_fetcher: PriceFetcher לקבלת מחירים
            check_interval_seconds: תדירות בדיקה (ברירת מחדל: 60 שניות)
        """
        self.jupiter = jupiter_client
        self.price_fetcher = price_fetcher
        self.check_interval = check_interval_seconds
        
        logger.info("✅ TakeProfitStrategy initialized")
    
    async def monitor_and_sell(
        self,
        position: Position,
        alert_callback: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """
        ניטור ומכירה מדורגת
        
        Args:
            position: Position לניטור
            alert_callback: פונקציה להתראות (אופציונלי)
        
        Returns:
            Dict עם תוצאות המכירה
        """
        logger.info(
            f"🎯 Starting Take Profit monitoring: {position.token_symbol} "
            f"(Entry: ${position.entry_price:.6f})"
        )
        
        result = {
            "targets_hit": [],
            "total_sold_pct": 0.0,
            "transactions": [],
            "final_status": "active",
        }
        
        # Initialize targets
        targets = [
            TakeProfitTarget(
                multiple=t.multiple,
                sell_percentage=t.sell_percentage
            )
            for t in self.TARGETS
        ]
        
        # Initialize trailing stop (רק אחרי ש-60% נמכר)
        trailing_stop: Optional[TrailingStop] = None
        
        original_amount = position.amount_tokens
        remaining_amount = original_amount
        
        try:
            while remaining_amount > 0:
                # קבל מחיר נוכחי
                current_price = await self.price_fetcher.get_token_price(
                    position.token_mint
                )
                
                if current_price is None:
                    logger.warning(f"⚠️ Could not get price for {position.token_symbol}")
                    await asyncio.sleep(self.check_interval)
                    continue
                
                # חשב multiple (כמה פעמים המחיר)
                multiple = current_price / position.entry_price
                
                logger.debug(
                    f"📊 {position.token_symbol}: "
                    f"${current_price:.6f} ({multiple:.2f}x entry), "
                    f"Sold: {result['total_sold_pct']*100:.1f}%"
                )
                
                # בדוק targets (x2, x5)
                for target in targets:
                    if not target.sold and multiple >= target.multiple:
                        # מכור את ה-percentage
                        amount_to_sell = int(original_amount * target.sell_percentage)
                        
                        if amount_to_sell > remaining_amount:
                            amount_to_sell = remaining_amount
                        
                        logger.info(
                            f"🎯 Target hit! {target.multiple}x → "
                            f"Selling {target.sell_percentage*100:.0f}% "
                            f"({amount_to_sell} tokens)"
                        )
                        
                        # בצע מכירה
                        tx_signature = await self.jupiter.swap_token_to_sol(
                            token_mint=position.token_mint,
                            amount_tokens=amount_to_sell,
                            slippage_bps=100,  # 1% slippage
                        )
                        
                        if tx_signature:
                            target.sold = True
                            result["targets_hit"].append({
                                "multiple": target.multiple,
                                "percentage": target.sell_percentage,
                                "transaction": tx_signature,
                            })
                            result["transactions"].append(tx_signature)
                            result["total_sold_pct"] += target.sell_percentage
                            remaining_amount -= amount_to_sell
                            
                            logger.info(
                                f"✅ Sold {target.sell_percentage*100:.0f}% at {target.multiple}x! "
                                f"Transaction: https://solscan.io/tx/{tx_signature}"
                            )
                            
                            # התראה
                            if alert_callback:
                                await alert_callback(
                                    position,
                                    f"Sold {target.sell_percentage*100:.0f}% at {target.multiple}x",
                                    tx_signature
                                )
                        else:
                            logger.error(f"❌ Failed to sell at {target.multiple}x")
                
                # אם 60% נמכר, התחל trailing stop
                if result["total_sold_pct"] >= 0.60 and trailing_stop is None:
                    logger.info(
                        f"🎯 60% sold! Starting trailing stop on remaining 40%"
                    )
                    trailing_stop = TrailingStop(
                        highest_price=current_price,
                        trailing_pct=0.10,  # 10% trailing stop
                    )
                
                # בדוק trailing stop (אם פעיל)
                if trailing_stop:
                    trailing_stop.update(current_price)
                    
                    if trailing_stop.is_triggered(current_price):
                        logger.info(
                            f"🛑 Trailing stop triggered! "
                            f"Selling remaining {remaining_amount} tokens"
                        )
                        
                        # מכור את כל השאר
                        tx_signature = await self.jupiter.swap_token_to_sol(
                            token_mint=position.token_mint,
                            amount_tokens=remaining_amount,
                            slippage_bps=100,
                        )
                        
                        if tx_signature:
                            result["transactions"].append(tx_signature)
                            result["total_sold_pct"] = 1.0
                            remaining_amount = 0
                            result["final_status"] = "trailing_stop_triggered"
                            
                            logger.info(
                                f"✅ All sold via trailing stop! "
                                f"Transaction: https://solscan.io/tx/{tx_signature}"
                            )
                            
                            # התראה
                            if alert_callback:
                                await alert_callback(
                                    position,
                                    "Trailing stop triggered - all sold",
                                    tx_signature
                                )
                        else:
                            logger.error("❌ Failed to sell via trailing stop")
                
                # אם הכל נמכר - סיים
                if remaining_amount == 0:
                    logger.info(f"✅ Take Profit complete! All sold.")
                    break
                
                # חכה לפני הבדיקה הבאה
                await asyncio.sleep(self.check_interval)
        
        except asyncio.CancelledError:
            logger.info(f"⏹️ Take Profit monitoring cancelled for {position.token_symbol}")
            result["final_status"] = "cancelled"
        except Exception as e:
            logger.error(
                f"❌ Error in Take Profit monitoring: {e}",
                exc_info=True
            )
            result["final_status"] = "error"
            result["error"] = str(e)
        
        return result
    
    async def check_targets(
        self,
        position: Position,
    ) -> Dict[str, Any]:
        """
        בדוק את ה-targets (ללא מכירה) - רק בדיקה
        
        Args:
            position: Position לבדיקה
        
        Returns:
            Dict עם סטטוס ה-targets
        """
        current_price = await self.price_fetcher.get_token_price(position.token_mint)
        
        if current_price is None:
            return {"error": "Could not get price"}
        
        multiple = current_price / position.entry_price
        
        status = {
            "current_price": current_price,
            "entry_price": position.entry_price,
            "multiple": multiple,
            "targets": [],
        }
        
        for target in self.TARGETS:
            status["targets"].append({
                "multiple": target.multiple,
                "sell_percentage": target.sell_percentage,
                "hit": multiple >= target.multiple,
                "remaining": target.multiple - multiple if multiple < target.multiple else 0,
            })
        
        return status
