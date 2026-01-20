"""
Wallet Manager
ניהול ארנק Phantom לבוט

📋 מה הקובץ הזה עושה:
-------------------
זה הקובץ שמנהל את הארנק של הבוט - חיבור, בדיקת balance, וכו'.

הקובץ הזה:
1. טוען את ה-private key מ-.env
2. יוצר keypair מ-Solana
3. מתחבר ל-RPC (Helius)
4. מספק פונקציות לבדיקת balance, address, וכו'
5. מוכן לביצוע טרנזקציות (Day 16+)

⚠️ אבטחה:
- לעולם אל תשתמש בארנק הראשי שלך!
- צור ארנק ייעודי לבוט בלבד!
- התחל עם סכומים קטנים ($10-20) לבדיקות!

🔧 שימוש:
```python
from executor.wallet_manager import WalletManager

wallet = WalletManager()
balance = await wallet.get_balance()
print(f"Balance: {balance} SOL")
```

📝 הערות:
- Private key חייב להיות ב-.env כ-WALLET_PRIVATE_KEY
- הפורמט: Base58 string (כמו ש-Phantom מייצא)
- הארנק משתמש ב-Helius RPC (מה-config)
"""

import asyncio
from typing import Optional
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from solana.rpc.types import TokenAccountOpts

from core.config import settings
from utils.logger import get_logger

logger = get_logger(__name__)


class WalletManager:
    """
    מנהל ארנק Solana לבוט
    
    מטופל:
    - טעינת private key מ-.env
    - יצירת keypair
    - חיבור ל-RPC
    - בדיקת balance
    - מוכן לביצוע טרנזקציות
    """
    
    def __init__(self):
        """
        אתחול WalletManager
        
        Raises:
            ValueError: אם private key חסר או לא תקין
        """
        # בדוק שיש private key
        if not settings.wallet_private_key:
            raise ValueError(
                "❌ WALLET_PRIVATE_KEY לא מוגדר ב-.env!\n"
                "⚠️ צור ארנק ייעודי לבוט ב-Phantom והוסף את ה-private key ל-.env"
            )
        
        try:
            # טען את ה-private key ויצור keypair
            self.keypair = Keypair.from_base58_string(settings.wallet_private_key)
            self.pubkey = self.keypair.pubkey()
            
            # צור RPC client
            self.rpc_client = AsyncClient(
                settings.solana_rpc_url,
                commitment=Confirmed
            )
            
            logger.info(f"✅ WalletManager initialized - Address: {self.pubkey}")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize wallet: {e}")
            raise ValueError(f"Failed to load wallet: {e}")
    
    async def get_balance(self) -> float:
        """
        קבל את ה-balance של הארנק ב-SOL
        
        Returns:
            float: Balance ב-SOL (למשל: 1.5 = 1.5 SOL)
        
        Raises:
            Exception: אם יש שגיאה בבדיקת balance
        """
        try:
            response = await self.rpc_client.get_balance(self.pubkey)
            
            if response.value is None:
                logger.warning("⚠️ Balance response is None")
                return 0.0
            
            # המר מ-lamports ל-SOL (1 SOL = 1e9 lamports)
            balance_sol = response.value / 1e9
            logger.debug(f"Balance: {balance_sol} SOL")
            return balance_sol
            
        except Exception as e:
            logger.error(f"❌ Failed to get balance: {e}")
            raise
    
    async def get_balance_lamports(self) -> int:
        """
        קבל את ה-balance ב-lamports (יחידות קטנות של SOL)
        
        Returns:
            int: Balance ב-lamports
        """
        try:
            response = await self.rpc_client.get_balance(self.pubkey)
            return response.value if response.value is not None else 0
            
        except Exception as e:
            logger.error(f"❌ Failed to get balance (lamports): {e}")
            raise
    
    def get_address(self) -> str:
        """
        קבל את כתובת הארנק (public key)
        
        Returns:
            str: כתובת הארנק ב-Base58
        """
        return str(self.pubkey)
    
    def get_keypair(self) -> Keypair:
        """
        קבל את ה-keypair (לשימוש בטרנזקציות)
        
        Returns:
            Keypair: ה-keypair של הארנק
        """
        return self.keypair
    
    async def get_token_accounts(self, mint: Optional[str] = None) -> list:
        """
        קבל את כל ה-token accounts של הארנק
        
        Args:
            mint: Optional - אם מוגדר, מחזיר רק accounts של טוקן זה
        
        Returns:
            list: רשימת token accounts
        """
        try:
            opts = TokenAccountOpts(mint=Pubkey.from_string(mint) if mint else None)
            response = await self.rpc_client.get_token_accounts_by_owner(
                self.pubkey,
                opts
            )
            
            return response.value if response.value else []
            
        except Exception as e:
            logger.error(f"❌ Failed to get token accounts: {e}")
            return []
    
    async def get_token_balance(self, mint: str) -> float:
        """
        קבל את ה-balance של טוקן ספציפי
        
        Args:
            mint: כתובת הטוקן (mint address)
        
        Returns:
            float: Balance של הטוקן (0 אם אין)
        """
        try:
            accounts = await self.get_token_accounts(mint)
            
            if not accounts:
                return 0.0
            
            # סכום את כל ה-balances
            total_balance = 0
            for account in accounts:
                # Parse את ה-account data
                # זה דורש parsing של ה-account data structure
                # כרגע נחזיר 0 אם אין accounts
                pass
            
            # TODO: Parse account data properly
            # זה יושלם ב-Day 16 כשיהיה לנו צורך אמיתי
            return 0.0
            
        except Exception as e:
            logger.error(f"❌ Failed to get token balance for {mint}: {e}")
            return 0.0
    
    async def close(self):
        """
        סגור את ה-RPC connection
        """
        try:
            await self.rpc_client.close()
            logger.debug("RPC connection closed")
        except Exception as e:
            logger.warning(f"Error closing RPC connection: {e}")
    
    async def __aenter__(self):
        """Async context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()


# Helper function ליצירת wallet manager
def get_wallet_manager() -> Optional[WalletManager]:
    """
    צור WalletManager instance (אם private key קיים)
    
    Returns:
        Optional[WalletManager]: WalletManager אם private key קיים, אחרת None
    """
    try:
        return WalletManager()
    except ValueError:
        return None
