"""
Holder Analysis Module - ULTIMATE HYBRID VERSION 🧠🔥
-------------------------------------------------------
Best of Both Worlds: Claude's Detailed Logic + Gemini's Batch Optimization

Features:
1. ✅ Batch RPC Calls (getMultipleAccounts) - יעיל מאוד
2. ✅ Smart LP Detection (Raydium/PumpFun/Orca)
3. ✅ Whale vs Liquidity vs Burn distinction
4. ✅ Advanced Scoring with multiple factors
5. ✅ Detailed logging for debugging

Created by: Claude + Gemini collaboration
Date: January 2026
"""

import asyncio
import os
from typing import List, Dict, Optional
from dataclasses import dataclass, field
import httpx

from utils.logger import get_logger

logger = get_logger("holder_analyzer")

# ============================================================================
# תוכניות נזילות מוכרות (LP Programs)
# אם ה-Owner של Account הוא אחד מאלה → זה LP Pool ולא Whale
# ============================================================================
KNOWN_LIQUIDITY_PROGRAMS = {
    "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium AMM V4",
    "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX": "OpenBook DEX",
    "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin": "Serum V3",
    "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc": "Orca Whirlpool",
    "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP": "Orca Token Swap",
    "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P": "Pump.fun Program",
    "EewxydAPCCVuNEyrVN68PuSYdQ7wKn27V9Gjeoi8dy3S": "Lifinity",
}

# ============================================================================
# כתובות ספציפיות להתעלמות (Burn, System, Bonding)
# ============================================================================
KNOWN_EXEMPT_ADDRESSES = {
    # System Programs
    "11111111111111111111111111111111": "System Program",
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": "Token Program",
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL": "Associated Token Program",
    "SysvarRent111111111111111111111111111111111": "Rent Sysvar",
    "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo": "Memo Program",
    
    # Burn Addresses
    "1nc1nerator11111111111111111111111111111111": "Incinerator",
    "burne1111111111111111111111111111111111111": "Burn Address 1",
    "Dead111111111111111111111111111111111111111": "Burn Address 2",
    "Gu3K1tCF44D8787h6s1v75j41E6h8D37715f3333333": "Burn Address 3",
    
    # PumpFun Specific
    "CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM": "Pump.fun Bonding Curve",
    "39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg": "Pump.fun Authority",
    "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1": "Pump.fun Fee Vault",
    
    # Raydium Specific
    "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1": "Raydium Authority",
}

@dataclass
class HolderAnalysis:
    """Smart holder analysis results with detailed breakdown"""
    # Percentages
    top_10_percentage: float = 0.0          # Top 10 Real Whales (excluding LP/Burn)
    largest_holder_pct: float = 0.0         # Largest Real Whale
    total_lp_percentage: float = 0.0        # Total Liquidity Pool %
    total_burn_percentage: float = 0.0      # Total Burned %
    
    # Flags
    is_concentrated: bool = False           # Dangerous concentration?
    
    # Counts
    holder_count: int = 0                   # Estimated total holders
    
    # Detailed Lists
    top_holders: List[Dict] = field(default_factory=list)      # All holders
    lp_holders: List[Dict] = field(default_factory=list)       # LP Pools only
    burn_holders: List[Dict] = field(default_factory=list)     # Burned tokens
    whale_holders: List[Dict] = field(default_factory=list)    # Real whales
    
    # Score
    holder_score: int = 0                   # 0-20 points


class HolderAnalyzer:
    """
    Advanced Holder Distribution Analyzer
    
    Analyzes token holder distribution with smart detection of:
    - Liquidity Pools (LP) - Good concentration
    - Burned tokens - Reduces circulating supply
    - Real Whales - Bad concentration
    
    Uses batch RPC calls for optimal performance.
    """
    
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=20.0)
        self.rpc_url = os.getenv("HELIUS_RPC_URL") or os.getenv("RPC_ENDPOINT")
        
        if not self.rpc_url:
            logger.warning("⚠️ No Helius RPC set. Using public node (expect rate limits).")
            self.rpc_url = "https://api.mainnet-beta.solana.com"
        else:
            logger.info("✅ Using Helius RPC for smart holder analysis")

    async def analyze(self, token_address: str, limit: int = 20) -> HolderAnalysis:
        """
        Perform comprehensive holder analysis
        
        Args:
            token_address: Token mint address
            limit: Number of top holders to analyze (max 20)
        
        Returns:
            HolderAnalysis object with complete breakdown
        """
        logger.info(f"🧠 ULTIMATE Analyzing holders for {token_address[:20]}...")
        analysis = HolderAnalysis()
        
        try:
            # Step 1: Get total supply
            supply_data = await self._get_token_supply(token_address)
            if not supply_data:
                logger.warning("❌ Could not fetch token supply")
                return analysis
            
            total_supply_raw = float(supply_data['amount'])
            if total_supply_raw == 0:
                logger.warning("❌ Token has zero supply")
                return analysis

            # Step 2: Get top holders (addresses + amounts)
            top_accounts = await self._get_largest_accounts(token_address, limit)
            if not top_accounts:
                logger.warning("❌ Could not fetch largest accounts")
                return analysis

            # Step 3: BATCH CHECK - Identify LP Pools via Account Owners
            # This is Gemini's optimization - very efficient!
            account_addresses = [acc['address'] for acc in top_accounts]
            accounts_owners = await self._fetch_accounts_owners_batch(account_addresses)

            # Step 4: Categorize each holder
            lp_holders = []
            burn_holders = []
            whale_holders = []
            
            for acc in top_accounts:
                address = acc['address']
                amount_raw = float(acc['amount'])
                percentage = (amount_raw / total_supply_raw) * 100
                
                # Default values
                holder_type = "WHALE"
                is_lp = False
                is_exempt = address in KNOWN_EXEMPT_ADDRESSES
                label = KNOWN_EXEMPT_ADDRESSES.get(address, f"Whale {address[:8]}...")
                
                # Check if it's a known exempt address (Burn/System)
                if is_exempt:
                    if "Burn" in label or "Incinerator" in label:
                        holder_type = "BURN"
                    else:
                        holder_type = "EXEMPT"
                
                # Check if it's an LP Pool (by owner)
                elif address in accounts_owners:
                    owner = accounts_owners[address]
                    if owner in KNOWN_LIQUIDITY_PROGRAMS:
                        holder_type = "LP"
                        is_lp = True
                        label = f"LP: {KNOWN_LIQUIDITY_PROGRAMS[owner]}"
                
                # Build holder info
                holder_info = {
                    "address": address,
                    "amount": amount_raw,
                    "percentage": percentage,
                    "type": holder_type,
                    "is_lp": is_lp,
                    "is_exempt": is_exempt,
                    "label": label
                }
                
                # Categorize
                if holder_type == "LP":
                    lp_holders.append(holder_info)
                    analysis.total_lp_percentage += percentage
                elif holder_type == "BURN":
                    burn_holders.append(holder_info)
                    analysis.total_burn_percentage += percentage
                else:  # WHALE or EXEMPT (non-burn)
                    if holder_type == "WHALE":
                        whale_holders.append(holder_info)
            
            # Step 5: Save categorized data
            analysis.lp_holders = lp_holders
            analysis.burn_holders = burn_holders
            analysis.whale_holders = whale_holders
            analysis.top_holders = lp_holders + burn_holders + whale_holders
            
            # Step 6: Estimate total holder count
            analysis.holder_count = self._estimate_holder_count(len(top_accounts))
            
            # Step 7: Calculate whale metrics (only real whales)
            if whale_holders:
                analysis.largest_holder_pct = whale_holders[0]['percentage']
                analysis.top_10_percentage = sum(h['percentage'] for h in whale_holders[:10])
            
            # Step 8: Calculate final score
            analysis.holder_score = self._calculate_smart_score(analysis)
            
            # Step 9: Determine if concentrated (dangerous)
            analysis.is_concentrated = analysis.holder_score < 10
            
            # Step 10: Detailed logging
            logger.info(
                f"📊 Analysis Complete:\n"
                f"   💧 LP Pools: {len(lp_holders)} holders = {analysis.total_lp_percentage:.1f}%\n"
                f"   🔥 Burned: {len(burn_holders)} addresses = {analysis.total_burn_percentage:.1f}%\n"
                f"   🐋 Real Whales: {len(whale_holders)} holders\n"
                f"   📈 Top 10 Whales: {analysis.top_10_percentage:.1f}%\n"
                f"   ⚠️  Largest Whale: {analysis.largest_holder_pct:.1f}%\n"
                f"   🎯 Score: {analysis.holder_score}/20"
            )
            
            # Warning if dangerous
            if analysis.largest_holder_pct > 30:
                logger.warning(
                    f"🚨 DANGER: Single whale holds {analysis.largest_holder_pct:.1f}%!"
                )
            
        except Exception as e:
            logger.error(f"❌ Error in holder analysis: {e}", exc_info=True)
        
        return analysis

    async def _get_token_supply(self, token_address: str) -> Optional[Dict]:
        """Get total token supply"""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTokenSupply",
            "params": [token_address]
        }
        
        try:
            resp = await self.http_client.post(self.rpc_url, json=payload)
            if resp.status_code == 200:
                return resp.json().get("result", {}).get("value")
        except Exception as e:
            logger.error(f"Error fetching token supply: {e}")
        
        return None

    async def _get_largest_accounts(self, token_address: str, limit: int = 20) -> List[Dict]:
        """Get largest token accounts"""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTokenLargestAccounts",
            "params": [token_address]
        }
        
        try:
            resp = await self.http_client.post(self.rpc_url, json=payload)
            if resp.status_code == 200:
                accounts = resp.json().get("result", {}).get("value", [])
                return accounts[:limit]
        except Exception as e:
            logger.error(f"Error fetching largest accounts: {e}")
        
        return []

    async def _fetch_accounts_owners_batch(self, addresses: List[str]) -> Dict[str, str]:
        """
        Batch fetch account owners to identify LP pools
        
        This is Gemini's optimization - uses getMultipleAccounts
        to check all addresses in ONE RPC call instead of N calls.
        
        Args:
            addresses: List of account addresses
        
        Returns:
            Dict mapping address -> owner program ID
        """
        if not addresses:
            return {}
        
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getMultipleAccounts",
            "params": [addresses, {"encoding": "jsonParsed"}]
        }
        
        owners = {}
        
        try:
            resp = await self.http_client.post(self.rpc_url, json=payload)
            data = resp.json()
            
            if "result" in data and "value" in data["result"]:
                for i, account_info in enumerate(data["result"]["value"]):
                    if account_info:
                        # Extract owner (the program that owns this account)
                        owner = account_info.get("owner")
                        if owner:
                            owners[addresses[i]] = owner
        
        except Exception as e:
            logger.error(f"Error in batch account fetch: {e}")
        
        return owners

    def _estimate_holder_count(self, top_count: int) -> int:
        """
        Estimate total number of holders
        
        This is a rough estimate since we only see top 20
        """
        if top_count >= 20:
            return 1000  # Conservative estimate
        else:
            return top_count

    def _calculate_smart_score(self, analysis: HolderAnalysis) -> int:
        """
        Calculate smart holder distribution score (0-20)
        
        Scoring Logic:
        1. LP Percentage (0-8 points) - More is better
        2. Whale Distribution (0-10 points) - More distributed is better
        3. Burn Bonus (0-2 points) - Burned supply is good
        4. Kill Switch: Single whale >30% = instant 0
        
        Args:
            analysis: HolderAnalysis object
        
        Returns:
            Score 0-20
        """
        
        # ❌ KILL SWITCH: Single whale over 30% = instant fail
        if analysis.largest_holder_pct > 30.0:
            logger.warning(
                f"🚨 KILL SWITCH ACTIVATED: "
                f"Single whale holds {analysis.largest_holder_pct:.1f}%"
            )
            return 0
        
        score = 0
        
        # ============================================================================
        # Part 1: LP Percentage Score (0-8 points)
        # More liquidity locked = safer token
        # ============================================================================
        if analysis.total_lp_percentage > 80:
            score += 8      # Excellent - highly liquid
        elif analysis.total_lp_percentage > 50:
            score += 6      # Good
        elif analysis.total_lp_percentage > 20:
            score += 4      # Fair
        elif analysis.total_lp_percentage > 10:
            score += 2      # Weak
        # else: 0 points
        
        # ============================================================================
        # Part 2: Whale Distribution Score (0-10 points)
        # Less concentration = better distribution
        # ============================================================================
        if analysis.top_10_percentage < 15:
            score += 10     # Perfect distribution
        elif analysis.top_10_percentage < 30:
            score += 7      # Good distribution
        elif analysis.top_10_percentage < 50:
            score += 4      # Fair distribution
        elif analysis.top_10_percentage < 70:
            score += 2      # Risky
        # else: 0 points - Very concentrated
        
        # ============================================================================
        # Part 3: Burn Bonus (0-2 points)
        # Burned tokens reduce circulating supply
        # ============================================================================
        if analysis.total_burn_percentage > 20:
            score += 2      # Significant burn
        elif analysis.total_burn_percentage > 10:
            score += 1      # Some burn
        
        return min(score, 20)
    
    async def close(self):
        """Cleanup resources"""
        await self.http_client.aclose()


# ============================================================================
# Convenience Function
# ============================================================================
async def analyze_holders(token_address: str, limit: int = 20) -> HolderAnalysis:
    """
    Convenience function to analyze holders
    
    Args:
        token_address: Token mint address
        limit: Number of top holders to analyze
    
    Returns:
        HolderAnalysis object
    """
    analyzer = HolderAnalyzer()
    try:
        return await analyzer.analyze(token_address, limit)
    finally:
        await analyzer.close()


# ============================================================================
# Test Function
# ============================================================================
if __name__ == "__main__":
    async def test():
        # Test with a known token (e.g., BONK)
        bonk_address = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
        
        print("\n" + "="*60)
        print("Testing ULTIMATE Holder Analyzer")
        print("="*60 + "\n")
        
        result = await analyze_holders(bonk_address)
        
        print(f"\nResults:")
        print(f"  LP Percentage: {result.total_lp_percentage:.2f}%")
        print(f"  Burn Percentage: {result.total_burn_percentage:.2f}%")
        print(f"  Top 10 Whales: {result.top_10_percentage:.2f}%")
        print(f"  Largest Whale: {result.largest_holder_pct:.2f}%")
        print(f"  Concentrated: {result.is_concentrated}")
        print(f"  Score: {result.holder_score}/20")
        print(f"\nLP Holders: {len(result.lp_holders)}")
        print(f"Burn Holders: {len(result.burn_holders)}")
        print(f"Whale Holders: {len(result.whale_holders)}")
    
    asyncio.run(test())