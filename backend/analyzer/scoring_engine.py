"""
Advanced Scoring Engine - Version 2.0 🚀
Comprehensive token scoring with Liquidity, Volume, and Price Action

📊 New Formula:
- Safety: 0-25 points (Contract safety)
- Holders: 0-20 points (Distribution)
- Liquidity: 0-25 points (Pool depth in SOL) ⭐ NEW
- Volume: 0-15 points (24h trading volume) ⭐ NEW
- Smart Money: 0-10 points (Trust-weighted)
- Price Action: 0-5 points (Price momentum) ⭐ NEW

Total: 0-100 points
"""

from typing import Dict, Optional
from dataclasses import dataclass
from enum import Enum

from analyzer.contract_checker import ContractSafety
from analyzer.holder_analyzer import HolderAnalysis
from analyzer.smart_money_tracker import get_smart_money_tracker
from utils.logger import get_logger

logger = get_logger("scoring_engine_v2")


class TokenGrade(Enum):
    """Token quality grades"""
    S_PLUS = "S+"  # New top tier (98-100)
    S = "S"        # New tier (95-97)
    A_PLUS = "A+"  # 90-94
    A = "A"        # 85-89
    B_PLUS = "B+"  # 80-84
    B = "B"        # 75-79
    C_PLUS = "C+"  # 70-74
    C = "C"        # 60-69
    F = "F"        # <60


class TokenCategory(Enum):
    """Token risk categories"""
    LEGENDARY = "LEGENDARY"    # 95+ (new)
    EXCELLENT = "EXCELLENT"    # 85-94
    GOOD = "GOOD"              # 75-84
    FAIR = "FAIR"              # 60-74
    POOR = "POOR"              # <60


@dataclass
class TokenScore:
    """Complete token score breakdown"""
    # Component scores
    safety_score: int = 0          # 0-25 (reduced from 60)
    holder_score: int = 0          # 0-20
    liquidity_score: int = 0       # 0-25 ⭐ NEW
    volume_score: int = 0          # 0-15 ⭐ NEW
    smart_money_score: int = 0     # 0-10 (reduced from 15)
    price_action_score: int = 0    # 0-5 ⭐ NEW
    
    # Final score
    final_score: int = 0           # 0-100
    
    # Grade and category
    grade: TokenGrade = TokenGrade.F
    category: TokenCategory = TokenCategory.POOR
    
    # Breakdown
    breakdown: Dict = None
    
    def __post_init__(self):
        if self.breakdown is None:
            self.breakdown = {}


class AdvancedScoringEngine:
    """
    Advanced token scoring engine with market metrics
    
    New Features:
    - Liquidity depth analysis
    - Trading volume analysis
    - Price momentum analysis
    - Trust-weighted smart money
    """
    
    def __init__(self, alert_threshold: int = 85):
        """
        Initialize advanced scoring engine
        
        Args:
            alert_threshold: Minimum score to trigger alert (default: 85)
        """
        self.alert_threshold = alert_threshold
    
    def calculate_score(
        self,
        safety: ContractSafety,
        holders: HolderAnalysis,
        liquidity_sol: float = 0.0,      # ⭐ NEW
        volume_24h: float = 0.0,         # ⭐ NEW
        price_change_5m: float = 0.0,    # ⭐ NEW
        price_change_1h: float = 0.0,    # ⭐ NEW
        smart_money_count: int = 0,
        smart_money_avg_trust: float = 50.0  # ⭐ NEW (0-100)
    ) -> TokenScore:
        """
        Calculate comprehensive token score with market metrics
        
        Args:
            safety: ContractSafety object
            holders: HolderAnalysis object
            liquidity_sol: Total liquidity in SOL
            volume_24h: 24h trading volume in USD
            price_change_5m: 5-minute price change %
            price_change_1h: 1-hour price change %
            smart_money_count: Number of smart money wallets
            smart_money_avg_trust: Average trust score of smart wallets (0-100)
        
        Returns:
            TokenScore object with complete breakdown
        """
        score = TokenScore()
        
        # ========================================================================
        # 1. Safety Score (0-25) - Reduced weight
        # ========================================================================
        # Normalize from 0-100 to 0-25
        score.safety_score = int(safety.safety_score * 0.25)
        score.breakdown["safety"] = {
            "raw": safety.safety_score,
            "normalized": score.safety_score,
            "ownership_renounced": safety.ownership_renounced,
            "liquidity_locked": safety.liquidity_locked,
            "mint_authority_disabled": safety.mint_authority_disabled,
        }
        
        # ========================================================================
        # 2. Holder Score (0-20) - Same as before
        # ========================================================================
        score.holder_score = holders.holder_score
        score.breakdown["holders"] = {
            "score": holders.holder_score,
            "count": holders.holder_count,
            "top_10_percentage": holders.top_10_percentage,
            "lp_percentage": holders.total_lp_percentage,
            "burn_percentage": holders.total_burn_percentage,
            "is_concentrated": holders.is_concentrated,
        }
        
        # ========================================================================
        # 3. Liquidity Score (0-25) ⭐ NEW - CRITICAL!
        # ========================================================================
        score.liquidity_score = self._calculate_liquidity_score(liquidity_sol)
        score.breakdown["liquidity"] = {
            "liquidity_sol": liquidity_sol,
            "score": score.liquidity_score,
        }
        
        # ========================================================================
        # 4. Volume Score (0-15) ⭐ NEW
        # ========================================================================
        score.volume_score = self._calculate_volume_score(volume_24h)
        score.breakdown["volume"] = {
            "volume_24h": volume_24h,
            "score": score.volume_score,
        }
        
        # ========================================================================
        # 5. Smart Money Score (0-10) - Trust-weighted
        # ========================================================================
        score.smart_money_score = self._calculate_smart_money_score(
            smart_money_count, 
            smart_money_avg_trust
        )
        score.breakdown["smart_money"] = {
            "count": smart_money_count,
            "avg_trust": smart_money_avg_trust,
            "score": score.smart_money_score,
        }
        
        # ========================================================================
        # 6. Price Action Score (0-5) ⭐ NEW
        # ========================================================================
        score.price_action_score = self._calculate_price_action_score(
            price_change_5m,
            price_change_1h
        )
        score.breakdown["price_action"] = {
            "price_change_5m": price_change_5m,
            "price_change_1h": price_change_1h,
            "score": score.price_action_score,
        }
        
        # ========================================================================
        # Calculate final score
        # ========================================================================
        score.final_score = min(
            score.safety_score +
            score.holder_score +
            score.liquidity_score +
            score.volume_score +
            score.smart_money_score +
            score.price_action_score,
            100
        )
        
        # Determine grade
        score.grade = self._calculate_grade(score.final_score)
        
        # Determine category
        score.category = self._calculate_category(score.final_score)
        
        logger.info(
            f"📊 Advanced Score: {score.final_score}/100 | "
            f"Grade: {score.grade.value} | "
            f"Safety={score.safety_score}/25 | "
            f"Holders={score.holder_score}/20 | "
            f"Liquidity={score.liquidity_score}/25 | "
            f"Volume={score.volume_score}/15 | "
            f"SmartMoney={score.smart_money_score}/10 | "
            f"PriceAction={score.price_action_score}/5"
        )
        
        return score
    
    def _calculate_liquidity_score(self, liquidity_sol: float) -> int:
        """
        Calculate liquidity score (0-25)
        
        Liquidity is CRITICAL - without it, you can't trade!
        
        Args:
            liquidity_sol: Total liquidity in SOL
        
        Returns:
            Score 0-25
        """
        if liquidity_sol >= 100:
            return 25      # Excellent - very safe to trade
        elif liquidity_sol >= 50:
            return 20      # Good
        elif liquidity_sol >= 20:
            return 15      # Fair
        elif liquidity_sol >= 10:
            return 10      # Risky
        elif liquidity_sol >= 5:
            return 5       # Very risky
        else:
            return 0       # Extremely risky - don't trade!
    
    def _calculate_volume_score(self, volume_24h: float) -> int:
        """
        Calculate volume score (0-15)
        
        High volume = active trading = better
        
        Args:
            volume_24h: 24h trading volume in USD
        
        Returns:
            Score 0-15
        """
        if volume_24h >= 500000:
            return 15      # Very high volume
        elif volume_24h >= 100000:
            return 12      # High volume
        elif volume_24h >= 50000:
            return 9       # Good volume
        elif volume_24h >= 10000:
            return 6       # Fair volume
        elif volume_24h >= 5000:
            return 3       # Low volume
        else:
            return 0       # Very low volume
    
    def _calculate_smart_money_score(
        self, 
        count: int, 
        avg_trust: float
    ) -> int:
        """
        Calculate smart money score (0-10) with trust weighting
        
        Args:
            count: Number of smart money wallets
            avg_trust: Average trust score (0-100)
        
        Returns:
            Score 0-10
        """
        if count == 0:
            return 0
        
        # Base score from count (max 10)
        base_score = min(count * 3, 10)
        
        # Adjust by trust level (0-100 → 0-1 multiplier)
        trust_multiplier = avg_trust / 100.0
        
        final_score = int(base_score * trust_multiplier)
        
        return min(final_score, 10)
    
    def _calculate_price_action_score(
        self,
        price_change_5m: float,
        price_change_1h: float
    ) -> int:
        """
        Calculate price momentum score (0-5)
        
        Positive momentum = good
        Extreme pump (>500% in 5m) = Pump & Dump warning
        
        Args:
            price_change_5m: 5-minute price change %
            price_change_1h: 1-hour price change %
        
        Returns:
            Score 0-5
        """
        # 🚨 Pump & Dump Detection
        if price_change_5m > 500:
            logger.warning(
                f"🚨 PUMP DETECTED: +{price_change_5m:.1f}% in 5m - "
                f"Possible dump incoming!"
            )
            return 0  # Extreme pump = danger
        
        # Healthy growth
        if 10 <= price_change_1h <= 100:
            return 5  # Strong upward momentum
        elif 5 <= price_change_1h < 10:
            return 4  # Good momentum
        elif 0 <= price_change_1h < 5:
            return 3  # Positive
        elif -5 <= price_change_1h < 0:
            return 2  # Slightly negative
        else:
            return 0  # Falling
    
    def _calculate_grade(self, score: int) -> TokenGrade:
        """Calculate token grade based on score"""
        if score >= 98:
            return TokenGrade.S_PLUS
        elif score >= 95:
            return TokenGrade.S
        elif score >= 90:
            return TokenGrade.A_PLUS
        elif score >= 85:
            return TokenGrade.A
        elif score >= 80:
            return TokenGrade.B_PLUS
        elif score >= 75:
            return TokenGrade.B
        elif score >= 70:
            return TokenGrade.C_PLUS
        elif score >= 60:
            return TokenGrade.C
        else:
            return TokenGrade.F
    
    def _calculate_category(self, score: int) -> TokenCategory:
        """Calculate token category based on score"""
        if score >= 95:
            return TokenCategory.LEGENDARY
        elif score >= 85:
            return TokenCategory.EXCELLENT
        elif score >= 75:
            return TokenCategory.GOOD
        elif score >= 60:
            return TokenCategory.FAIR
        else:
            return TokenCategory.POOR
    
    def should_alert(self, score: TokenScore) -> bool:
        """
        Determine if token should trigger alert
        
        Args:
            score: TokenScore object
        
        Returns:
            True if score >= alert_threshold
        """
        return score.final_score >= self.alert_threshold
    
    def get_score_summary(self, score: TokenScore) -> str:
        """
        Get human-readable score summary
        
        Args:
            score: TokenScore object
        
        Returns:
            Formatted summary string
        """
        return (
            f"Score: {score.final_score}/100 ({score.grade.value}) | "
            f"Safety: {score.safety_score}/25 | "
            f"Holders: {score.holder_score}/20 | "
            f"Liquidity: {score.liquidity_score}/25 | "
            f"Volume: {score.volume_score}/15 | "
            f"SmartMoney: {score.smart_money_score}/10 | "
            f"Price: {score.price_action_score}/5"
        )


# Backward compatibility - use AdvancedScoringEngine as ScoringEngine
ScoringEngine = AdvancedScoringEngine