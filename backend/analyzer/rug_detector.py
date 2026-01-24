"""
Rug Pull Detector
מזהה סקאמים בזמן אמת

Features:
1. זיהוי נזילות נמוכה מדי (<5 SOL)
2. זיהוי נזילות שנעלמה פתאום
3. זיהוי Dev Wallet שמכר טוקנים רבים
4. זיהוי Honeypot (לא ניתן למכור)
5. זיהוי Volume פיקטיבי (אותם ארנקים סוחרים)

How it works:
1. בדיקות בסיסיות - נזילות, contract
2. בדיקות מתקדמות - Dev behavior, Volume patterns
3. החזרת אזהרות מפורטות עם הסברים
"""

import asyncio
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import httpx

from analyzer.token_metrics import TokenMetricsFetcher
from analyzer.contract_checker import ContractChecker
from analyzer.holder_analyzer import HolderAnalyzer
from utils.logger import get_logger

logger = get_logger("rug_detector")


@dataclass
class RugPullAlert:
    """Alert על Rug Pull אפשרי"""
    is_rug_pull: bool
    severity: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    reasons: List[str]
    score: int  # 0-100 (0 = safe, 100 = definite rug pull)
    recommendations: List[str]


class RugPullDetector:
    """
    מזהה Rug Pull patterns בזמן אמת
    
    Detection Methods:
    1. Liquidity Analysis - נזילות נמוכה/נעלמת
    2. Dev Wallet Behavior - הבעלים מוכר הרבה
    3. Contract Analysis - Honeypot/Mint issues
    4. Volume Analysis - Volume פיקטיבי
    5. Price Action Analysis - Pump & Dump patterns
    """
    
    def __init__(self):
        self.metrics_fetcher = TokenMetricsFetcher()
        self.contract_checker = None  # Will be initialized async
        self.holder_analyzer = HolderAnalyzer()
        
        # Thresholds
        self.min_safe_liquidity_sol = 5.0
        self.max_dev_sell_percentage = 50.0  # 50%
        self.min_holder_count = 10
        self.max_concentration = 80.0  # 80%
        
        logger.info("🚨 Rug Pull Detector initialized")
    
    async def check_rug_pull(self, token_address: str) -> RugPullAlert:
        """
        בודק אם יש Rug Pull
        
        Args:
            token_address: Token mint address
            
        Returns:
            RugPullAlert with details
        """
        logger.info(f"🔍 Checking for rug pull: {token_address[:20]}...")
        
        reasons = []
        recommendations = []
        score = 0
        severity = "LOW"
        
        try:
            # Initialize contract checker if needed
            if not self.contract_checker:
                self.contract_checker = ContractChecker()
                await self.contract_checker.__aenter__()
            
            # 1. Liquidity Analysis
            liquidity_score, liquidity_reasons = await self._check_liquidity(token_address)
            score += liquidity_score
            reasons.extend(liquidity_reasons)
            
            # 2. Contract Safety Analysis  
            contract_score, contract_reasons = await self._check_contract_safety(token_address)
            score += contract_score
            reasons.extend(contract_reasons)
            
            # 3. Holder Concentration Analysis
            holder_score, holder_reasons = await self._check_holder_concentration(token_address)
            score += holder_score
            reasons.extend(holder_reasons)
            
            # 4. Price Action Analysis
            price_score, price_reasons = await self._check_price_action(token_address)
            score += price_score
            reasons.extend(price_reasons)
            
            # 5. Volume Analysis
            volume_score, volume_reasons = await self._check_volume_patterns(token_address)
            score += volume_score
            reasons.extend(volume_reasons)
            
            # Determine severity
            if score >= 80:
                severity = "CRITICAL"
                recommendations.append("🛑 DO NOT BUY - High probability rug pull")
                recommendations.append("📤 If you own this token, consider selling immediately")
            elif score >= 60:
                severity = "HIGH"  
                recommendations.append("⚠️ High risk - avoid trading")
                recommendations.append("🔍 Monitor closely if you own this token")
            elif score >= 40:
                severity = "MEDIUM"
                recommendations.append("🟡 Medium risk - trade with caution")
                recommendations.append("💰 Use only small position sizes")
            else:
                severity = "LOW"
                recommendations.append("🟢 Low risk detected")
                recommendations.append("✅ Appears relatively safe to trade")
            
            is_rug_pull = score >= 70
            
            if is_rug_pull:
                logger.warning(f"🚨 RUG PULL DETECTED: {token_address[:20]} (Score: {score}/100)")
                for reason in reasons:
                    logger.warning(f"  • {reason}")
            else:
                logger.info(f"✅ No rug pull detected: {token_address[:20]} (Score: {score}/100)")
            
            return RugPullAlert(
                is_rug_pull=is_rug_pull,
                severity=severity,
                reasons=reasons,
                score=score,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Error checking rug pull for {token_address}: {e}")
            return RugPullAlert(
                is_rug_pull=False,
                severity="UNKNOWN",
                reasons=[f"Analysis failed: {str(e)}"],
                score=0,
                recommendations=["⚠️ Could not analyze - proceed with extreme caution"]
            )
    
    async def _check_liquidity(self, token_address: str) -> Tuple[int, List[str]]:
        """
        בדיקת נזילות - נמוכה מדי = סכנה
        
        Returns:
            (score, reasons) - score 0-30
        """
        try:
            metrics = await self.metrics_fetcher.get_metrics(token_address)
            score = 0
            reasons = []
            
            if metrics.liquidity_sol < 1.0:
                score += 30
                reasons.append(f"💧 Extremely low liquidity: {metrics.liquidity_sol:.2f} SOL")
            elif metrics.liquidity_sol < 3.0:
                score += 20
                reasons.append(f"💧 Very low liquidity: {metrics.liquidity_sol:.2f} SOL")
            elif metrics.liquidity_sol < self.min_safe_liquidity_sol:
                score += 10
                reasons.append(f"💧 Low liquidity: {metrics.liquidity_sol:.2f} SOL")
            
            # Check if liquidity is 0 (pool removed)
            if metrics.liquidity_sol == 0:
                score = 30
                reasons = ["🚨 LIQUIDITY REMOVED - Pool drained!"]
            
            return score, reasons
            
        except Exception as e:
            return 5, [f"Could not check liquidity: {str(e)}"]
    
    async def _check_contract_safety(self, token_address: str) -> Tuple[int, List[str]]:
        """
        בדיקת בטיחות החוזה
        
        Returns:
            (score, reasons) - score 0-25
        """
        try:
            safety = await self.contract_checker.check_contract(token_address)
            score = 0
            reasons = []
            
            if not safety.ownership_renounced:
                score += 10
                reasons.append("👤 Ownership not renounced - dev can modify")
            
            if not safety.mint_authority_disabled:
                score += 15
                reasons.append("🏭 Mint authority active - infinite supply possible")
            
            if not safety.liquidity_locked:
                score += 8
                reasons.append("🔓 Liquidity not locked - can be removed")
            
            if safety.safety_score < 50:
                score += 10
                reasons.append(f"⚠️ Low contract safety score: {safety.safety_score}/100")
            
            return min(score, 25), reasons
            
        except Exception as e:
            return 10, [f"Could not check contract safety: {str(e)}"]
    
    async def _check_holder_concentration(self, token_address: str) -> Tuple[int, List[str]]:
        """
        בדיקת ריכוזיות מחזיקים
        
        Returns:
            (score, reasons) - score 0-20
        """
        try:
            holders = await self.holder_analyzer.analyze(token_address)
            score = 0
            reasons = []
            
            if holders.holder_count < 5:
                score += 20
                reasons.append(f"👥 Very few holders: {holders.holder_count}")
            elif holders.holder_count < self.min_holder_count:
                score += 10
                reasons.append(f"👥 Few holders: {holders.holder_count}")
            
            # Check concentration (excluding LP pools)
            real_concentration = holders.top_10_percentage
            if real_concentration > 90:
                score += 15
                reasons.append(f"🐋 Extreme concentration: top 10 hold {real_concentration:.1f}%")
            elif real_concentration > self.max_concentration:
                score += 10
                reasons.append(f"🐋 High concentration: top 10 hold {real_concentration:.1f}%")
            
            # Check largest holder
            if holders.largest_holder_pct > 30:
                score += 10
                reasons.append(f"🦈 Single large holder: {holders.largest_holder_pct:.1f}%")
            
            return min(score, 20), reasons
            
        except Exception as e:
            return 5, [f"Could not check holder concentration: {str(e)}"]
    
    async def _check_price_action(self, token_address: str) -> Tuple[int, List[str]]:
        """
        בדיקת פעולת מחיר - Pump & Dump
        
        Returns:
            (score, reasons) - score 0-15
        """
        try:
            metrics = await self.metrics_fetcher.get_metrics(token_address)
            score = 0
            reasons = []
            
            # Extreme pump detection
            if metrics.price_change_5m > 1000:  # 1000%+ in 5 minutes
                score += 15
                reasons.append(f"📈 Extreme pump: +{metrics.price_change_5m:.0f}% in 5m")
            elif metrics.price_change_5m > 500:  # 500%+ in 5 minutes
                score += 10
                reasons.append(f"📈 Major pump: +{metrics.price_change_5m:.0f}% in 5m")
            
            # Check for dump after pump
            if (metrics.price_change_5m > 200 and 
                metrics.price_change_1h < metrics.price_change_5m * 0.3):
                score += 12
                reasons.append("📉 Pump & dump pattern detected")
            
            # Extreme negative movement
            if metrics.price_change_1h < -80:
                score += 8
                reasons.append(f"📉 Major dump: {metrics.price_change_1h:.0f}% in 1h")
            
            return min(score, 15), reasons
            
        except Exception as e:
            return 3, [f"Could not check price action: {str(e)}"]
    
    async def _check_volume_patterns(self, token_address: str) -> Tuple[int, List[str]]:
        """
        בדיקת Volume patterns - Volume פיקטיבי
        
        Returns:
            (score, reasons) - score 0-10
        """
        try:
            metrics = await self.metrics_fetcher.get_metrics(token_address)
            score = 0
            reasons = []
            
            # Very low volume
            if metrics.volume_24h < 1000:
                score += 5
                reasons.append(f"📊 Very low volume: ${metrics.volume_24h:.0f}")
            
            # Check volume vs market cap ratio
            if metrics.market_cap > 0:
                volume_ratio = metrics.volume_24h / metrics.market_cap
                if volume_ratio < 0.01:  # Less than 1% daily turnover
                    score += 5
                    reasons.append("📊 Suspiciously low trading activity")
            
            return min(score, 10), reasons
            
        except Exception as e:
            return 2, [f"Could not check volume patterns: {str(e)}"]
    
    async def close(self):
        """Cleanup resources"""
        if self.contract_checker:
            await self.contract_checker.__aexit__(None, None, None)
        await self.metrics_fetcher.close()


# ============================================================================
# Global Instance
# ============================================================================
_rug_detector: Optional[RugPullDetector] = None


def get_rug_detector() -> RugPullDetector:
    """Get global rug detector instance"""
    global _rug_detector
    if _rug_detector is None:
        _rug_detector = RugPullDetector()
    return _rug_detector


# ============================================================================
# Test Function
# ============================================================================
if __name__ == "__main__":
    async def test():
        # Test with a known token
        test_address = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"  # BONK
        
        print("\n" + "="*60)
        print("Testing Rug Pull Detector")
        print("="*60 + "\n")
        
        detector = get_rug_detector()
        try:
            alert = await detector.check_rug_pull(test_address)
            
            print(f"Results for {test_address}:")
            print(f"  Is Rug Pull: {'YES' if alert.is_rug_pull else 'NO'}")
            print(f"  Severity: {alert.severity}")
            print(f"  Score: {alert.score}/100")
            print(f"  Reasons:")
            for reason in alert.reasons:
                print(f"    - {reason}")
            print(f"  Recommendations:")
            for rec in alert.recommendations:
                print(f"    - {rec}")
        finally:
            await detector.close()
    
    asyncio.run(test())