"""
Test script for Advanced Scoring Engine
"""

import asyncio
from analyzer.scoring_engine import ScoringEngine, TokenScore
from analyzer.contract_checker import ContractSafety
from analyzer.holder_analyzer import HolderAnalysis

def test_scoring_engine():
    """Test the new advanced scoring engine"""
    print("=" * 60)
    print("Testing Advanced Scoring Engine V2")
    print("=" * 60)
    
    # Create scoring engine
    scoring_engine = ScoringEngine(alert_threshold=85)
    
    # Mock data for testing
    mock_safety = ContractSafety(
        safety_score=80,
        ownership_renounced=True,
        liquidity_locked=True,
        mint_authority_disabled=False
    )
    
    mock_holders = HolderAnalysis(
        holder_count=150,
        top_10_percentage=35.0,
        total_lp_percentage=45.0,
        total_burn_percentage=10.0,
        is_concentrated=False,
        holder_score=16,
        top_holders=[],
        lp_holders=[],
        burn_holders=[],
        largest_holder_pct=8.5
    )
    
    # Test with different scenarios
    scenarios = [
        {
            "name": "High Quality Token",
            "liquidity_sol": 150.0,
            "volume_24h": 250000.0,
            "price_change_5m": 15.0,
            "price_change_1h": 25.0,
            "smart_money_count": 3,
            "smart_money_avg_trust": 85.0
        },
        {
            "name": "Medium Quality Token", 
            "liquidity_sol": 25.0,
            "volume_24h": 50000.0,
            "price_change_5m": 5.0,
            "price_change_1h": 10.0,
            "smart_money_count": 1,
            "smart_money_avg_trust": 60.0
        },
        {
            "name": "Low Quality Token",
            "liquidity_sol": 3.0,
            "volume_24h": 2000.0,
            "price_change_5m": -10.0,
            "price_change_1h": -15.0,
            "smart_money_count": 0,
            "smart_money_avg_trust": 50.0
        },
        {
            "name": "Pump & Dump Warning",
            "liquidity_sol": 20.0,
            "volume_24h": 10000.0,
            "price_change_5m": 600.0,  # Extreme pump!
            "price_change_1h": 800.0,
            "smart_money_count": 2,
            "smart_money_avg_trust": 70.0
        }
    ]
    
    for scenario in scenarios:
        print(f"\nTesting: {scenario['name']}")
        print("-" * 40)
        
        score = scoring_engine.calculate_score(
            safety=mock_safety,
            holders=mock_holders,
            liquidity_sol=scenario['liquidity_sol'],
            volume_24h=scenario['volume_24h'],
            price_change_5m=scenario['price_change_5m'],
            price_change_1h=scenario['price_change_1h'],
            smart_money_count=scenario['smart_money_count'],
            smart_money_avg_trust=scenario['smart_money_avg_trust']
        )
        
        print(f"Final Score: {score.final_score}/100 ({score.grade.value})")
        print(f"Category: {score.category.value}")
        print(f"Should Alert: {'YES' if scoring_engine.should_alert(score) else 'NO'}")
        print(f"Breakdown:")
        print(f"  - Safety: {score.safety_score}/25")
        print(f"  - Holders: {score.holder_score}/20") 
        print(f"  - Liquidity: {score.liquidity_score}/25")
        print(f"  - Volume: {score.volume_score}/15")
        print(f"  - Smart Money: {score.smart_money_score}/10")
        print(f"  - Price Action: {score.price_action_score}/5")

if __name__ == "__main__":
    test_scoring_engine()