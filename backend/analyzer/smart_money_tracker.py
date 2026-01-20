"""
Smart Money Tracker
Track successful wallets and detect their positions

📋 מה הקובץ הזה עושה:
-------------------
זה הקובץ שמנהל את רשימת ה-Smart Money Wallets (ארנקים חכמים).

הקובץ הזה:
1. שומר רשימה של Smart Money Wallets (ארנקים שהצליחו בעבר)
2. בודק אם ארנקים חכמים מחזיקים טוקן מסוים
3. טוען ושומר את הרשימה מקובץ JSON
4. מספק גישה נוחה לרשימת הארנקים החכמים

🔧 פונקציות עיקריות:
- check_if_holds(token_address, holder_addresses) - בודק אם Smart Money מחזיק טוקן
- add_wallet(address, nickname) - מוסיף ארנק חדש לרשימה
- get_smart_wallet_count() - מחזיר כמה ארנקים חכמים יש
- load_from_file() - טוען רשימה מקובץ JSON
- save_to_file() - שומר רשימה לקובץ JSON

💡 איך זה עובד:
1. טוען רשימה של Smart Money Wallets מקובץ data/smart_wallets.json
2. כשמנתחים טוקן, בודק אם אחד מהמחזיקים הוא Smart Money
3. כל Smart Money wallet שמוצא = 5 נקודות (מקסימום 15 נקודות)
4. הרשימה מתעדכנת אוטומטית על ידי Smart Money Discovery Engine

📝 הערות:
- הרשימה נשמרת ב-data/smart_wallets.json
- Smart Money Discovery Engine מוסיף ארנקים חדשים אוטומטית
- כל ארנק חכם = 5 נקודות לציון הסופי (מקסימום 15)
- זה חלק חשוב מהציון הסופי של כל טוקן!
"""

from typing import List, Dict, Set, Optional
from dataclasses import dataclass
import json
from pathlib import Path

from utils.logger import get_logger

logger = get_logger("smart_money")


@dataclass
class SmartWallet:
    """Smart wallet information"""
    address: str
    nickname: Optional[str] = None
    total_trades: int = 0
    profitable_trades: int = 0
    success_rate: float = 0.0
    tracked_since: Optional[str] = None


class SmartMoneyTracker:
    """
    Track smart money wallets and detect their positions
    
    Smart wallets are wallets that have a history of successful trades
    (catching gems early, profitable exits, etc.)
    """
    
    def __init__(self, wallets_file: Optional[str] = None):
        """
        Initialize smart money tracker
        
        Args:
            wallets_file: Path to JSON file with smart wallet addresses
        """
        self.wallets_file = wallets_file or "data/smart_wallets.json"
        self.smart_wallets: Dict[str, SmartWallet] = {}
        self._load_wallets()
    
    def _load_wallets(self):
        """Load smart wallets from file or use defaults"""
        wallets_path = Path(self.wallets_file)
        
        if wallets_path.exists():
            try:
                with open(wallets_path, 'r') as f:
                    data = json.load(f)
                    for wallet_data in data:
                        wallet = SmartWallet(**wallet_data)
                        self.smart_wallets[wallet.address] = wallet
                logger.info(f"✅ Loaded {len(self.smart_wallets)} smart wallets from file")
            except Exception as e:
                logger.warning(f"⚠️ Failed to load wallets file: {e}, using defaults")
                self._load_default_wallets()
        else:
            logger.info("📝 No wallets file found, using defaults")
            self._load_default_wallets()
    
    def _load_default_wallets(self):
        """Load default smart wallet addresses"""
        # Auto-discovery will populate this, but we can have some defaults
        default_wallets = [
            # Can add known smart wallets here if needed
            # Auto-discovery will find more!
        ]
        
        for wallet_data in default_wallets:
            wallet = SmartWallet(**wallet_data)
            self.smart_wallets[wallet.address] = wallet
        
        logger.info(f"📝 Loaded {len(self.smart_wallets)} default smart wallets")
    
    def add_smart_wallet(self, address: str, nickname: Optional[str] = None):
        """
        Add a smart wallet to track
        
        Args:
            address: Wallet address
            nickname: Optional nickname
        """
        if address not in self.smart_wallets:
            wallet = SmartWallet(address=address, nickname=nickname)
            self.smart_wallets[address] = wallet
            logger.info(f"✅ Added smart wallet: {address} ({nickname or 'No name'})")
        else:
            logger.debug(f"Wallet {address} already tracked")
    
    def check_if_holds(self, token_address: str, holder_addresses: List[str]) -> int:
        """
        Check if any smart wallets hold this token
        
        Args:
            token_address: Token address
            holder_addresses: List of holder addresses to check
        
        Returns:
            Number of smart wallets holding this token
        """
        smart_holders = set(holder_addresses) & set(self.smart_wallets.keys())
        count = len(smart_holders)
        
        if count > 0:
            wallet_names = [
                self.smart_wallets[addr].nickname or addr[:8]
                for addr in smart_holders
            ]
            logger.info(
                f"🎯 Smart money detected! {count} wallet(s) holding {token_address[:20]}...: "
                f"{', '.join(wallet_names)}"
            )
        
        return count
    
    def get_smart_wallet_count(self) -> int:
        """Get total number of tracked smart wallets"""
        return len(self.smart_wallets)
    
    def get_wallet_info(self, address: str) -> Optional[SmartWallet]:
        """Get information about a specific smart wallet"""
        return self.smart_wallets.get(address)
    
    def save_wallets(self):
        """Save smart wallets to file"""
        wallets_path = Path(self.wallets_file)
        wallets_path.parent.mkdir(parents=True, exist_ok=True)
        
        wallets_data = [
            {
                "address": wallet.address,
                "nickname": wallet.nickname,
                "total_trades": wallet.total_trades,
                "profitable_trades": wallet.profitable_trades,
                "success_rate": wallet.success_rate,
                "tracked_since": wallet.tracked_since,
            }
            for wallet in self.smart_wallets.values()
        ]
        
        try:
            with open(wallets_path, 'w') as f:
                json.dump(wallets_data, f, indent=2)
            logger.info(f"✅ Saved {len(wallets_data)} smart wallets to {wallets_path}")
        except Exception as e:
            logger.error(f"❌ Failed to save wallets: {e}")


# Global instance
_smart_money_tracker: Optional[SmartMoneyTracker] = None


def get_smart_money_tracker() -> SmartMoneyTracker:
    """Get global smart money tracker instance"""
    global _smart_money_tracker
    if _smart_money_tracker is None:
        _smart_money_tracker = SmartMoneyTracker()
    return _smart_money_tracker
