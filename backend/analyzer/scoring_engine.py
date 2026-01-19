"""
Scoring Engine
Comprehensive token scoring system (0-100)
"""

from typing import Dict, Optional
from dataclasses import dataclass
from enum import Enum

from analyzer.contract_checker import ContractSafety
from analyzer.holder_analyzer import HolderAnalysis
from analyzer.smart_money_tracker import get_smart_money_tracker
from utils.logger import get_logger

logger = get_logger("scoring_engine")


class TokenGrade(Enum):
    """Token quality grades"""
    A_PLUS = "A+"
    A = "A"
    B_PLUS = "B+"
    B = "B"
    C_PLUS = "C+"
    C = "C"
    F = "F"


class TokenCategory(Enum):
    """Token risk categories"""
    EXCELLENT = "EXCELLENT"
    GOOD = "GOOD"
    FAIR = "FAIR"
    POOR = "POOR"


@dataclass
class TokenScore:
    """Complete token score breakdown"""
    # Component scores
    safety_score: int = 0  # 0-100 (from ContractChecker, normalized to 0-60)
    holder_score: int = 0  # 0-20
    smart_money_score: int = 0  # 0-15 (Day 6)
    social_score: int = 0  # 0-15 (optional, future)
    
    # Final score
    final_score: int = 0  # 0-100
    
    # Grade and category
    grade: TokenGrade = TokenGrade.F
    category: TokenCategory = TokenCategory.POOR
    
    # Breakdown
    breakdown: Dict = None
    
    def __post_init__(self):
        if self.breakdown is None:
            self.breakdown = {}


class ScoringEngine:
    """
    Comprehensive token scoring engine
    
    Scoring Formula:
    - Safety: 0-60 points (from ContractChecker)
    - Holders: 0-20 points (from HolderAnalyzer)
    - Smart Money: 0-15 points (Day 6)
    - Social: 0-15 points (optional, future)
    
    Total: 0-100 points
    """
    
    def __init__(self, alert_threshold: int = 85):
        """
        Initialize scoring engine
        
        Args:
            alert_threshold: Minimum score to trigger alert (default: 85)
        """
        self.alert_threshold = alert_threshold
    
    def calculate_score(
        self,
        safety: ContractSafety,
        holders: HolderAnalysis,
        smart_money_count: int = 0
    ) -> TokenScore:
        """
        Calculate comprehensive token score
        
        Args:
            safety: ContractSafety object
            holders: HolderAnalysis object
            smart_money_count: Number of smart money wallets holding (default: 0)
        
        Returns:
            TokenScore object with complete breakdown
        """
        score = TokenScore()
        
        # 1. Safety Score (0-100 → normalized to 0-60)
        score.safety_score = int(safety.safety_score * 0.6)
        score.breakdown["safety"] = {
            "raw": safety.safety_score,
            "normalized": score.safety_score,
            "ownership_renounced": safety.ownership_renounced,
            "liquidity_locked": safety.liquidity_locked,
            "mint_authority_disabled": safety.mint_authority_disabled,
        }
        
        # 2. Holder Score (0-20)
        score.holder_score = holders.holder_score
        score.breakdown["holders"] = {
            "score": holders.holder_score,
            "count": holders.holder_count,
            "top_10_percentage": holders.top_10_percentage,
            "is_concentrated": holders.is_concentrated,
        }
        
        # 3. Smart Money Score (0-15)
        # 5 points per smart wallet, max 15
        score.smart_money_score = min(smart_money_count * 5, 15)
        score.breakdown["smart_money"] = {
            "count": smart_money_count,
            "score": score.smart_money_score,
        }
        
        # 4. Social Score (0-15) - Future enhancement
        score.social_score = 0
        score.breakdown["social"] = {
            "score": 0,
            "note": "Not implemented yet",
        }
        
        # Calculate final score
        score.final_score = min(
            score.safety_score +
            score.holder_score +
            score.smart_money_score +
            score.social_score,
            100
        )
        
        # Determine grade
        score.grade = self._calculate_grade(score.final_score)
        
        # Determine category
        score.category = self._calculate_category(score.final_score)
        
        logger.info(
            f"📊 Final Score: {score.final_score}/100 | "
            f"Grade: {score.grade.value} | "
            f"Category: {score.category.value}"
        )
        
        return score
    
    def _calculate_grade(self, score: int) -> TokenGrade:
        """Calculate token grade based on score"""
        if score >= 95:
            return TokenGrade.A_PLUS
        elif score >= 90:
            return TokenGrade.A
        elif score >= 85:
            return TokenGrade.B_PLUS
        elif score >= 80:
            return TokenGrade.B
        elif score >= 70:
            return TokenGrade.C_PLUS
        elif score >= 60:
            return TokenGrade.C
        else:
            return TokenGrade.F
    
    def _calculate_category(self, score: int) -> TokenCategory:
        """Calculate token category based on score"""
        if score >= 85:
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
            f"Safety: {score.safety_score}/60 | "
            f"Holders: {score.holder_score}/20 | "
            f"Smart Money: {score.smart_money_score}/15"
        )


# Convenience function
def calculate_token_score(
    safety: ContractSafety,
    holders: HolderAnalysis,
    smart_money_count: int = 0,
    alert_threshold: int = 85
) -> TokenScore:
    """
    Convenience function to calculate token score
    
    Args:
        safety: ContractSafety object
        holders: HolderAnalysis object
        smart_money_count: Number of smart money wallets
        alert_threshold: Alert threshold
    
    Returns:
        TokenScore object
    """
    engine = ScoringEngine(alert_threshold=alert_threshold)
    return engine.calculate_score(safety, holders, smart_money_count)
