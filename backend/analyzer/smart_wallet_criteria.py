"""
Smart Wallet Criteria
Intelligent criteria for identifying smart money wallets

📋 מה הקובץ הזה עושה:
-------------------
זה הקובץ שקובע את הקריטריונים לזיהוי Smart Money Wallets.

הקובץ הזה:
1. מגדיר את הקריטריונים המינימליים ל-Smart Money
2. בודק אם ארנק עומד בקריטריונים
3. מחשב "smart score" (0-100) לכל ארנק

🔧 קריטריונים מינימליים:
- min_win_rate: 50% (חצי מהטrades רווחיים)
- min_avg_profit: 2.5x (רווח ממוצע של x2.5)
- min_trades: 5 (מינימום 5 טrades)
- min_consistency: 0.3 (עקביות מינימלית)

🔧 פונקציות עיקריות:
- evaluate(stats) - בודק אם ארנק עומד בקריטריונים
- get_smart_score(stats) - מחשב ציון חכמה (0-100)

💡 איך זה עובד:
1. מקבל WalletStats object עם כל הנתונים
2. בודק כל קריטריון בנפרד
3. אם עומד בכל הקריטריונים → True (Smart Money)
4. מחשב ציון חכמה לפי הביצועים

📝 הערות:
- זה ה-"מוח" שקובע מי חכם ומי לא
- הקריטריונים ניתנים להתאמה (ניתן לשנות ב-SmartWalletCriteria)
- ציון גבוה יותר = ארנק יותר חכם
"""

from dataclasses import dataclass
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from analyzer.wallet_performance_analyzer import WalletStats


@dataclass
class SmartWalletCriteria:
    """Configurable criteria for smart wallets"""
    min_win_rate: float = 0.5  # 50% minimum
    min_avg_profit: float = 2.5  # x2.5 minimum average (lowered for estimated values)
    min_trades: int = 5  # Minimum 5 trades (lowered for practical use)
    min_consistency: float = 0.3  # Consistency score (lowered)
    min_first_buy_success: float = 0.3  # 30% of first buys were profitable
    
    # Advanced criteria
    require_consistency: bool = False  # Not required for now (estimated values)
    allow_single_big_win: bool = True  # Allow wallets with good track record


class SmartWalletEvaluator:
    """
    Evaluate if a wallet meets smart money criteria
    
    This is the BRAIN - decides who is smart and who is lucky
    """
    
    def __init__(self, criteria: Optional[SmartWalletCriteria] = None):
        self.criteria = criteria or SmartWalletCriteria()
    
    def evaluate(self, stats: "WalletStats") -> tuple[bool, str]:
        """
        Evaluate if wallet meets smart money criteria
        
        Args:
            stats: WalletStats object
        
        Returns:
            Tuple of (is_smart, reason)
        """
        reasons = []
        
        # Check minimum trades
        if stats.total_trades < self.criteria.min_trades:
            return False, f"Insufficient trades: {stats.total_trades} < {self.criteria.min_trades}"
        
        # Check win rate
        if stats.win_rate < self.criteria.min_win_rate:
            reasons.append(f"Low win rate: {stats.win_rate:.1%} < {self.criteria.min_win_rate:.1%}")
        
        # Check average profit
        if stats.avg_profit_multiplier < self.criteria.min_avg_profit:
            reasons.append(f"Low avg profit: {stats.avg_profit_multiplier:.2f}x < {self.criteria.min_avg_profit:.2f}x")
        
        # Check consistency
        if self.criteria.require_consistency:
            if stats.consistency_score < self.criteria.min_consistency:
                reasons.append(f"Low consistency: {stats.consistency_score:.2f} < {self.criteria.min_consistency:.2f}")
        
        # If all checks pass
        if not reasons:
            return True, "Meets all criteria"
        
        return False, " | ".join(reasons)
    
    def get_smart_score(self, stats: "WalletStats") -> float:
        """
        Calculate smart score (0-100)
        
        Higher score = smarter wallet
        """
        if stats.total_trades < self.criteria.min_trades:
            return 0.0
        
        score = 0.0
        
        # Win rate component (40 points)
        win_rate_score = min(stats.win_rate / self.criteria.min_win_rate, 1.0) * 40
        score += win_rate_score
        
        # Average profit component (30 points)
        profit_score = min(stats.avg_profit_multiplier / self.criteria.min_avg_profit, 1.0) * 30
        score += profit_score
        
        # Consistency component (20 points)
        if self.criteria.require_consistency:
            consistency_score = min(stats.consistency_score / self.criteria.min_consistency, 1.0) * 20
            score += consistency_score
        
        # Trade volume component (10 points)
        volume_score = min(stats.total_trades / 50, 1.0) * 10  # More trades = better
        score += volume_score
        
        return min(score, 100.0)


# Global evaluator
_evaluator: Optional[SmartWalletEvaluator] = None


def get_evaluator() -> SmartWalletEvaluator:
    """Get global evaluator instance"""
    global _evaluator
    if _evaluator is None:
        _evaluator = SmartWalletEvaluator()
    return _evaluator
