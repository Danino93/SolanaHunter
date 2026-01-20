"""
Jupiter Client
אינטגרציה עם Jupiter DEX Aggregator לביצוע swaps

📋 מה הקובץ הזה עושה:
-------------------
זה הקובץ שמנהל את כל הפעולות עם Jupiter - קבלת quotes וביצוע swaps.

הקובץ הזה:
1. מקבל quotes ל-swaps (כמה תקבל עבור X SOL)
2. מבצע swaps בפועל (SOL → Token, Token → SOL)
3. מטפל ב-slippage ו-fees
4. חותם ושולח טרנזקציות

⚠️ אבטחה:
- תמיד בדוק את ה-quote לפני ביצוע swap
- השתמש ב-slippage protection (0.5-1%)
- התחל עם סכומים קטנים לבדיקות!

🔧 שימוש:
```python
from executor.jupiter_client import JupiterClient

jupiter = JupiterClient(wallet_manager)
quote = await jupiter.get_quote(
    input_mint=SOL_MINT,
    output_mint=TOKEN_MINT,
    amount_sol=0.1  # 0.1 SOL
)
swap_result = await jupiter.execute_swap(quote)
```

📝 הערות:
- Jupiter הוא DEX Aggregator - מוצא את המחיר הטוב ביותר
- אין צורך ב-API key (public API)
- תמיכה ב-slippage protection
- תמיכה ב-multiple DEXs (Raydium, Orca, וכו')
"""

import asyncio
from typing import Optional, Dict, Any
from decimal import Decimal
import httpx
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.transaction import Transaction
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from solana.rpc.types import TxOpts
from solana.transaction import Transaction as SolanaTransaction
import base64

from executor.wallet_manager import WalletManager
from utils.logger import get_logger

logger = get_logger(__name__)

# Jupiter API endpoints
JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6/quote"
JUPITER_SWAP_API = "https://quote-api.jup.ag/v6/swap"

# Common mint addresses
SOL_MINT = "So11111111111111111111111111111111111111112"  # Wrapped SOL
USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"  # USDC


class JupiterClient:
    """
    Jupiter DEX Aggregator Client
    
    מטופל:
    - קבלת quotes ל-swaps
    - ביצוע swaps בפועל
    - חתימה ושליחת טרנזקציות
    """
    
    def __init__(self, wallet_manager: WalletManager):
        """
        אתחול JupiterClient
        
        Args:
            wallet_manager: WalletManager instance לחתימה על טרנזקציות
        """
        self.wallet_manager = wallet_manager
        self.rpc_client = wallet_manager.rpc_client
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
        logger.info("✅ JupiterClient initialized")
    
    async def get_quote(
        self,
        input_mint: str,
        output_mint: str,
        amount: float,
        is_sol: bool = True,
        slippage_bps: int = 50,  # 0.5% default
    ) -> Optional[Dict[str, Any]]:
        """
        קבל quote ל-swap
        
        Args:
            input_mint: כתובת הטוקן הנכנס (SOL_MINT או כתובת טוקן)
            output_mint: כתובת הטוקן היוצא (כתובת טוקן או SOL_MINT)
            amount: כמות (SOL או tokens - תלוי ב-is_sol)
            is_sol: True אם amount הוא ב-SOL, False אם ב-tokens
            slippage_bps: Slippage tolerance ב-basis points (50 = 0.5%)
        
        Returns:
            Dict עם quote data או None אם יש שגיאה
        
        Example:
            quote = await jupiter.get_quote(
                input_mint=SOL_MINT,
                output_mint="DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",  # BONK
                amount=0.1,
                is_sol=True
            )
        """
        try:
            # המר SOL ל-lamports (1 SOL = 1e9 lamports)
            # או השתמש ב-amount ישירות אם זה tokens
            if is_sol:
                amount_lamports = int(amount * 1e9)
            else:
                # אם זה tokens, צריך לדעת את ה-decimals
                # כרגע נניח שזה כבר ב-minimum units
                amount_lamports = int(amount)
            
            params = {
                "inputMint": input_mint,
                "outputMint": output_mint,
                "amount": str(amount_lamports),
                "slippageBps": slippage_bps,
                "onlyDirectRoutes": "false",  # Allow multi-hop routes
                "asLegacyTransaction": "false",
            }
            
            amount_display = f"{amount} SOL" if is_sol else f"{amount} tokens"
            logger.debug(f"Getting quote: {input_mint} → {output_mint}, {amount_display}")
            
            response = await self.http_client.get(JUPITER_QUOTE_API, params=params)
            response.raise_for_status()
            
            quote = response.json()
            
            if "error" in quote:
                logger.error(f"❌ Jupiter quote error: {quote['error']}")
                return None
            
            # חשב כמה תקבל (ב-tokens)
            out_amount = int(quote.get("outAmount", 0))
            
            amount_display = f"{amount} SOL" if is_sol else f"{amount} tokens"
            logger.info(
                f"✅ Quote received: {amount_display} → {out_amount} tokens "
                f"(slippage: {slippage_bps/100}%)"
            )
            
            return quote
            
        except httpx.HTTPError as e:
            logger.error(f"❌ HTTP error getting quote: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Error getting quote: {e}", exc_info=True)
            return None
    
    async def execute_swap(
        self,
        quote: Dict[str, Any],
        priority_fee_lamports: int = 10000,  # 0.00001 SOL priority fee
    ) -> Optional[str]:
        """
        בצע swap בפועל
        
        Args:
            quote: Quote object מ-get_quote()
            priority_fee_lamports: Priority fee (למהירות גבוהה יותר)
        
        Returns:
            Transaction signature (str) אם הצליח, None אם נכשל
        
        ⚠️ זה מבצע swap אמיתי! ודא שיש לך מספיק SOL!
        """
        try:
            if not quote:
                logger.error("❌ No quote provided")
                return None
            
            # בנה swap request
            swap_request = {
                "quoteResponse": quote,
                "userPublicKey": str(self.wallet_manager.pubkey()),
                "wrapAndUnwrapSol": True,  # Auto wrap/unwrap SOL
                "dynamicComputeUnitLimit": True,  # Auto adjust compute units
                "prioritizationFeeLamports": priority_fee_lamports,
            }
            
            logger.info("🔄 Executing swap...")
            
            # קבל swap transaction מ-Jupiter
            response = await self.http_client.post(
                JUPITER_SWAP_API,
                json=swap_request,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            
            swap_data = response.json()
            
            if "error" in swap_data:
                logger.error(f"❌ Jupiter swap error: {swap_data['error']}")
                return None
            
            # Parse את ה-transaction
            swap_transaction = swap_data.get("swapTransaction")
            if not swap_transaction:
                logger.error("❌ No swap transaction in response")
                return None
            
            # Decode את ה-transaction
            transaction_bytes = base64.b64decode(swap_transaction)
            transaction = Transaction.from_bytes(transaction_bytes)
            
            # חתום על ה-transaction
            transaction.sign([self.wallet_manager.keypair])
            
            # שלח את ה-transaction
            logger.info("📤 Sending transaction...")
            
            opts = TxOpts(
                skip_preflight=False,
                preflight_commitment=Confirmed,
                max_retries=3,
            )
            
            result = await self.rpc_client.send_transaction(
                transaction,
                self.wallet_manager.keypair,
                opts=opts
            )
            
            if result.value:
                tx_signature = str(result.value)
                logger.info(f"✅ Swap executed! Signature: {tx_signature}")
                return tx_signature
            else:
                logger.error("❌ Transaction failed - no signature")
                return None
                
        except httpx.HTTPError as e:
            logger.error(f"❌ HTTP error executing swap: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Error executing swap: {e}", exc_info=True)
            return None
    
    async def swap_sol_to_token(
        self,
        token_mint: str,
        amount_sol: float,
        slippage_bps: int = 50,
    ) -> Optional[str]:
        """
        Helper function: Swap SOL → Token
        
        Args:
            token_mint: כתובת הטוקן
            amount_sol: כמות SOL לקנות
            slippage_bps: Slippage tolerance
        
        Returns:
            Transaction signature או None
        """
        quote = await self.get_quote(
            input_mint=SOL_MINT,
            output_mint=token_mint,
            amount=amount_sol,
            is_sol=True,
            slippage_bps=slippage_bps,
        )
        
        if not quote:
            return None
        
        return await self.execute_swap(quote)
    
    async def swap_token_to_sol(
        self,
        token_mint: str,
        amount_tokens: int,  # במינימום יחידות של הטוקן
        slippage_bps: int = 50,
    ) -> Optional[str]:
        """
        Helper function: Swap Token → SOL
        
        Args:
            token_mint: כתובת הטוקן
            amount_tokens: כמות טוקנים למכור (ב-minimum units)
            slippage_bps: Slippage tolerance
        
        Returns:
            Transaction signature או None
        
        ⚠️ הערה: amount_tokens צריך להיות ב-minimum units (למשל: 1e9 = 1 token אם decimals=9)
        """
        quote = await self.get_quote(
            input_mint=token_mint,
            output_mint=SOL_MINT,
            amount=amount_tokens,
            is_sol=False,  # זה tokens, לא SOL
            slippage_bps=slippage_bps,
        )
        
        if not quote:
            return None
        
        return await self.execute_swap(quote)
    
    async def close(self):
        """סגור את ה-HTTP client"""
        try:
            await self.http_client.aclose()
            logger.debug("Jupiter HTTP client closed")
        except Exception as e:
            logger.warning(f"Error closing HTTP client: {e}")
    
    async def __aenter__(self):
        """Async context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
