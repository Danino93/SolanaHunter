"""
Test Jupiter Integration
סקריפט בדיקה ל-Jupiter Client

⚠️ זה מבצע swap אמיתי! ודא שיש לך מספיק SOL בארנק!
"""

import asyncio
from executor.wallet_manager import WalletManager
from executor.jupiter_client import JupiterClient, SOL_MINT, USDC_MINT

async def test_jupiter():
    """בדיקת Jupiter Client"""
    
    print("🚀 Testing Jupiter Integration...\n")
    
    # טען wallet
    try:
        wallet = WalletManager()
        print(f"✅ Wallet loaded: {wallet.get_address()}")
        
        balance = await wallet.get_balance()
        print(f"💰 Balance: {balance:.4f} SOL\n")
        
        if balance < 0.01:
            print("⚠️ Warning: Low balance! Need at least 0.01 SOL for testing")
            return
        
    except Exception as e:
        print(f"❌ Failed to load wallet: {e}")
        print("⚠️ Make sure WALLET_PRIVATE_KEY is set in .env")
        return
    
    # צור Jupiter client
    async with JupiterClient(wallet) as jupiter:
        print("✅ Jupiter Client created\n")
        
        # בדיקה 1: Get Quote (SOL → USDC)
        print("📊 Test 1: Getting quote (SOL → USDC)...")
        quote = await jupiter.get_quote(
            input_mint=SOL_MINT,
            output_mint=USDC_MINT,
            amount=0.01,  # 0.01 SOL
            is_sol=True,
            slippage_bps=50,  # 0.5%
        )
        
        if quote:
            out_amount = int(quote.get("outAmount", 0))
            print(f"✅ Quote received: 0.01 SOL → {out_amount} USDC")
            print(f"   Price impact: {quote.get('priceImpactPct', 0)}%")
            print(f"   Route: {len(quote.get('routePlan', []))} hops\n")
        else:
            print("❌ Failed to get quote\n")
            return
        
        # בדיקה 2: Execute Swap (רק אם יש מספיק SOL)
        print("🔄 Test 2: Execute swap?")
        print("⚠️ This will execute a REAL swap!")
        print("   Press Ctrl+C to cancel, or wait 5 seconds to continue...")
        
        try:
            await asyncio.sleep(5)
        except KeyboardInterrupt:
            print("\n❌ Cancelled by user")
            return
        
        print("\n🔄 Executing swap (0.01 SOL → USDC)...")
        tx_signature = await jupiter.execute_swap(quote)
        
        if tx_signature:
            print(f"✅ Swap executed successfully!")
            print(f"   Transaction: https://solscan.io/tx/{tx_signature}")
        else:
            print("❌ Swap failed")
    
    print("\n✅ Test complete!")

if __name__ == "__main__":
    asyncio.run(test_jupiter())
