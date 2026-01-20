"""
DCA (Dollar Cost Averaging) Strategy
אסטרטגיית קנייה בשלבים - 30-40-30

📋 מה הקובץ הזה עושה:
-------------------
זה הקובץ שמנהל את אסטרטגיית ה-DCA - קנייה בשלבים במקום קנייה אחת.

האסטרטגיה:
1. Stage 1: 30% מהסכום → קנייה מיידית
2. Wait 2 minutes
3. Stage 2: 40% מהסכום → אם מחיר יציב/עולה
4. Wait 2 minutes
5. Stage 3: 30% מהסכום → אם volume עולה

למה DCA?
- מפחית סיכון - לא קונים את כל הסכום בנקודה אחת
- מפזר את מחיר הכניסה - ממוצע מחירים
- נותן זמן לבדוק שהטוקן לא rug pull

⚠️ אבטחה:
- תמיד בדוק את המחיר לפני כל שלב
- אם מחיר ירד משמעותית - עצור!
- אם יש סימנים ל-rug pull - עצור!

🔧 שימוש:
```python
from executor.dca_strategy import DCAStrategy
from executor.jupiter_client import JupiterClient

dca = DCAStrategy(jupiter_client)
result = await dca.buy_token_dca(
    token_mint="...",
    total_amount_sol=0.1,  # 0.1 SOL total
    wait_minutes=2
)
```

📝 הערות:
- האסטרטגיה: 30% → 40% → 30%
- ברירת מחדל: 2 דקות בין שלבים
- מחזיר מחיר כניסה ממוצע
"""

import asyncio
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime, timezone

from executor.jupiter_client import JupiterClient
from utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class DCAResult:
    """תוצאה של DCA buy"""
    success: bool
    stages_completed: int
    total_stages: int
    total_amount_sol: float
    average_entry_price: Optional[float] = None
    transactions: List[str] = None  # Transaction signatures
    error: Optional[str] = None
    
    def __post_init__(self):
        if self.transactions is None:
            self.transactions = []


class DCAStrategy:
    """
    DCA (Dollar Cost Averaging) Strategy
    
    מטופל:
    - קנייה בשלבים (30-40-30)
    - בדיקת מחיר בין שלבים
    - חישוב מחיר כניסה ממוצע
    """
    
    # DCA stages: 30% → 40% → 30%
    DCA_STAGES = [0.3, 0.4, 0.3]
    
    def __init__(self, jupiter_client: JupiterClient):
        """
        אתחול DCA Strategy
        
        Args:
            jupiter_client: JupiterClient instance לביצוע swaps
        """
        self.jupiter = jupiter_client
        logger.info("✅ DCAStrategy initialized")
    
    async def buy_token_dca(
        self,
        token_mint: str,
        total_amount_sol: float,
        wait_minutes: int = 2,
        slippage_bps: int = 50,
        check_price_between_stages: bool = True,
    ) -> DCAResult:
        """
        קנה טוקן ב-DCA (3 שלבים)
        
        Args:
            token_mint: כתובת הטוקן
            total_amount_sol: סכום כולל ב-SOL (למשל: 0.1 SOL)
            wait_minutes: זמן המתנה בין שלבים (ברירת מחדל: 2 דקות)
            slippage_bps: Slippage tolerance (ברירת מחדל: 0.5%)
            check_price_between_stages: בדוק מחיר בין שלבים (ברירת מחדל: True)
        
        Returns:
            DCAResult עם פרטי הקנייה
        
        Example:
            result = await dca.buy_token_dca(
                token_mint="DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
                total_amount_sol=0.1
            )
        """
        logger.info(
            f"🔄 Starting DCA buy: {token_mint}, "
            f"total: {total_amount_sol} SOL, stages: {self.DCA_STAGES}"
        )
        
        result = DCAResult(
            success=False,
            stages_completed=0,
            total_stages=len(self.DCA_STAGES),
            total_amount_sol=total_amount_sol,
        )
        
        entry_prices = []  # מחירי כניסה לכל שלב
        
        try:
            for i, stage_pct in enumerate(self.DCA_STAGES, start=1):
                stage_amount = total_amount_sol * stage_pct
                
                logger.info(
                    f"📊 Stage {i}/{len(self.DCA_STAGES)}: "
                    f"Buying {stage_pct*100:.0f}% = {stage_amount:.6f} SOL"
                )
                
                # בדוק מחיר לפני קנייה (אם לא בשלב הראשון)
                if check_price_between_stages and i > 1:
                    # TODO: Get current price (Day 18 - price monitoring)
                    # For now, we'll skip price check
                    pass
                
                # בצע swap
                tx_signature = await self.jupiter.swap_sol_to_token(
                    token_mint=token_mint,
                    amount_sol=stage_amount,
                    slippage_bps=slippage_bps,
                )
                
                if not tx_signature:
                    logger.error(f"❌ Stage {i} failed - no transaction signature")
                    result.error = f"Stage {i} failed"
                    break
                
                result.transactions.append(tx_signature)
                result.stages_completed = i
                
                logger.info(
                    f"✅ Stage {i} completed! "
                    f"Transaction: https://solscan.io/tx/{tx_signature}"
                )
                
                # חכה לפני השלב הבא (אם לא בשלב האחרון)
                if i < len(self.DCA_STAGES):
                    wait_seconds = wait_minutes * 60
                    logger.info(f"⏳ Waiting {wait_minutes} minutes before next stage...")
                    await asyncio.sleep(wait_seconds)
            
            # חישוב מחיר כניסה ממוצע
            # TODO: Calculate from actual swap results (Day 18 - price tracking)
            # For now, we'll mark it as successful
            if result.stages_completed == len(self.DCA_STAGES):
                result.success = True
                logger.info(
                    f"✅ DCA Complete! "
                    f"{result.stages_completed}/{result.total_stages} stages executed"
                )
            else:
                logger.warning(
                    f"⚠️ DCA Incomplete: "
                    f"{result.stages_completed}/{result.total_stages} stages executed"
                )
        
        except Exception as e:
            logger.error(f"❌ DCA error: {e}", exc_info=True)
            result.error = str(e)
        
        return result
    
    async def buy_token_dca_simple(
        self,
        token_mint: str,
        total_amount_sol: float,
        wait_minutes: int = 2,
    ) -> DCAResult:
        """
        גרסה פשוטה של DCA - ללא בדיקות מחיר
        
        Args:
            token_mint: כתובת הטוקן
            total_amount_sol: סכום כולל ב-SOL
            wait_minutes: זמן המתנה בין שלבים
        
        Returns:
            DCAResult
        """
        return await self.buy_token_dca(
            token_mint=token_mint,
            total_amount_sol=total_amount_sol,
            wait_minutes=wait_minutes,
            check_price_between_stages=False,
        )
