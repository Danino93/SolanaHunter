# 📋 SolanaHunter - TODO List מעודכן
## כל מה שצריך לעשות (מעודכן אחרי סריקה עמוקה)

---

## ✅ כבר עשית:
- [x] החלפת Holder Analyzer ל-ULTIMATE version

---

## 🔥 קריטי - עשה עכשיו (סדר לפי Cursor):

### 1. ✅ שדרוג Scoring Engine + Token Metrics
**קבצים:** 
- `scoring_engine_ADVANCED.py` → `analyzer/scoring_engine.py`
- `token_metrics.py` → `analyzer/token_metrics.py`

**שינויים ב-main.py:**
```python
# Import
from analyzer.token_metrics import TokenMetricsFetcher

# בתוך __init__
self.metrics_fetcher = TokenMetricsFetcher()

# בתוך _scan_loop (לפני calculate_score)
metrics = await self.metrics_fetcher.get_metrics(token["address"])

# העבר ל-calculate_score
token_score = self.scoring_engine.calculate_score(
    safety=safety,
    holders=holders,
    liquidity_sol=metrics.liquidity_sol,
    volume_24h=metrics.volume_24h,
    price_change_5m=metrics.price_change_5m,
    price_change_1h=metrics.price_change_1h,
    smart_money_count=smart_money_count
)
```

### 2. ✅ Performance Tracker + Supabase
**קובץ:** `performance_tracker.py` → `executor/performance_tracker.py`

**Supabase SQL:**
```sql
CREATE TABLE performance_tracking (
    address TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    entry_price FLOAT NOT NULL,
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    entry_score INTEGER NOT NULL,
    smart_wallets JSONB,
    current_price FLOAT,
    roi FLOAT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    exit_price FLOAT,
    exit_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_status ON performance_tracking(status);
CREATE INDEX idx_entry_time ON performance_tracking(entry_time);
```

**שינויים ב-main.py:**
```python
# Import
from executor.performance_tracker import get_performance_tracker

# בתוך __init__
self.performance_tracker = get_performance_tracker()

# בתוך run (לפני scan_loop)
asyncio.create_task(self.performance_tracker.start_monitoring())

# אחרי שליחת התראה לטלגרם
if token.get("price_usd", 0) > 0:
    await self.performance_tracker.track_token(
        token_address=token["address"],
        symbol=token["symbol"],
        entry_price=token["price_usd"],
        entry_score=token_score.final_score,
        smart_wallets=holder_addresses
    )
```

---

## 🟡 חשוב - השבוע הזה:

### 3. הוסף RPC_ENDPOINT ל-Config
**קובץ:** `core/config.py`

```python
# הוסף בקבוצת Solana RPC
rpc_endpoint: Optional[str] = Field(None, env="RPC_ENDPOINT")

# עדכן את הvalidator
@validator("rpc_endpoint", always=True)
def build_rpc_endpoint(cls, v, values):
    """Build RPC endpoint if not provided"""
    if not v and "helius_api_key" in values:
        return f"https://mainnet.helius-rpc.com/?api-key={values['helius_api_key']}"
    return v
```

**עדכן .env:**
```bash
RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
```

### 4. 🚨 Rug Pull Detection
**קובץ חדש:** `analyzer/rug_detector.py`

```python
"""
Rug Pull Detector
מזהה סקאמים בזמן אמת
"""

class RugPullDetector:
    async def check_rug_pull(self, token_address: str) -> tuple[bool, str]:
        """
        בודק אם יש Rug Pull
        
        Returns:
            (is_rug_pull, reason)
        """
        # 1. בדיקת נזילות
        metrics = await self.metrics_fetcher.get_metrics(token_address)
        
        if metrics.liquidity_sol < 5.0:
            return True, "Liquidity too low (<5 SOL)"
        
        # 2. בדיקת נזילות שנעלמה פתאום
        # (צריך להשוות לנזילות מלפני 5 דקות)
        
        # 3. בדיקת Dev Wallet
        # האם הבעלים מכר >50% מהטוקנים שלו?
        
        return False, ""
```

**שלב ב-Position Monitor:**
```python
# בתוך _monitoring_loop
is_rug, reason = await self.rug_detector.check_rug_pull(position.token_mint)

if is_rug:
    logger.warning(f"🚨 RUG PULL DETECTED: {reason}")
    # Emergency exit
    await self._emergency_exit(position)
```

### 5. 📡 PumpFun Scanner
**עדכן:** `scanner/token_scanner.py`

```python
async def _discover_from_pumpfun(self, hours: int) -> List[Dict]:
    """
    Discover new tokens from PumpFun
    """
    try:
        url = "https://frontend-api.pump.fun/coins/latest"
        
        response = await self.client.get(url)
        data = response.json()
        
        cutoff_time = datetime.now() - timedelta(hours=hours)
        tokens = []
        
        for coin in data[:100]:  # Latest 100
            created_at = datetime.fromtimestamp(coin.get("created_timestamp", 0))
            
            if created_at < cutoff_time:
                continue
            
            token = {
                "address": coin["mint"],
                "symbol": coin["symbol"],
                "name": coin["name"],
                "price_usd": coin.get("usd_market_cap", 0) / coin.get("total_supply", 1),
                "source": "pumpfun",
                "created_at": created_at,
            }
            tokens.append(token)
        
        return tokens
    
    except Exception as e:
        logger.error(f"PumpFun error: {e}")
        return []
```

**בתוך discover_new_tokens:**
```python
# Source 3: PumpFun (NEW)
try:
    pumpfun_tokens = await self._discover_from_pumpfun(hours)
    all_tokens.extend(pumpfun_tokens)
    logger.info(f"✅ PumpFun: Found {len(pumpfun_tokens)} tokens")
except Exception as e:
    logger.warning(f"⚠️ PumpFun error: {e}")
```

### 6. 🔄 Telegram Error Recovery
**עדכן:** `communication/telegram_bot.py`

מצא את הלולאה של Long Polling והוסף Try-Catch:

```python
async def run_polling(self):
    while True:
        try:
            updates = await self._get_updates(self.last_update_id + 1)
            # ... קוד קיים ...
        except Exception as e:
            logger.error(f"❌ Telegram polling error: {e}")
            await asyncio.sleep(5)  # חכה 5 שניות
            continue  # המשך בלולאה - אל תצא!
```

### 7. 📊 Smart Wallets Table ב-Supabase
```sql
CREATE TABLE smart_wallets (
    address TEXT PRIMARY KEY,
    nickname TEXT,
    trust_score INTEGER DEFAULT 50,  -- 0-100
    total_trades INTEGER DEFAULT 0,
    successful_trades INTEGER DEFAULT 0,
    failed_trades INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 0.0,
    average_roi FLOAT DEFAULT 0.0,
    discovered_from TEXT,  -- 'manual', 'first_buyer', 'performance'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- טבלת היסטוריית טוקנים
CREATE TABLE scanned_tokens_history (
    address TEXT PRIMARY KEY,
    symbol TEXT,
    name TEXT,
    first_seen TIMESTAMP WITH TIME ZONE,
    final_score INTEGER,
    status TEXT DEFAULT 'active',  -- 'active', 'success', 'failure', 'scam'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔵 Nice to Have - בעתיד:

### 8. First Buyer Detector (למערכת Learning)
**קובץ חדש:** `analyzer/first_buyer_detector.py`

```python
class FirstBuyerDetector:
    """
    מוצא מי היו הקונים הראשונים של טוכן
    """
    async def detect_first_buyers(
        self,
        token_address: str,
        hours: int = 24,
        limit: int = 50
    ) -> List[FirstBuyer]:
        """
        משתמש ב-Helius Enhanced Transactions API
        """
        # TODO: צריך Helius Enhanced API access
        pass
```

### 9. WebSocket Price Monitoring
**קובץ חדש:** `scanner/realtime_monitor.py`

```python
class RealtimePriceMonitor:
    """
    ניטור מחירים בזמן אמת דרך WebSocket
    """
    async def monitor_token(self, token_address: str):
        async with websockets.connect("wss://api.birdeye.so/...") as ws:
            # Subscribe לטוקן
            # עקוב אחרי מחיר
            # זהה Pump & Dump
            pass
```

### 10. ML Model לניבוי
**קובץ חדש:** `analyzer/ml_predictor.py`

```python
class TokenPredictor:
    """
    מודל ML שמנבא סיכוי להצלחה
    """
    def train(self, historical_data):
        # Logistic Regression על נתונים היסטוריים
        pass
    
    def predict(self, token_features) -> float:
        # מחזיר 0.0-1.0 (סיכוי להצלחה)
        pass
```

---

## 📝 .env Variables שחסרים

עדכן את `.env`:
```bash
# RPC
RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# APIs (אופציונלי)
PUMPFUN_API_URL=https://frontend-api.pump.fun
BIRDEYE_API_KEY=your_key_here
BIRDEYE_WS_URL=wss://public-api.birdeye.so/socket

# Trading (אם עוד לא)
WALLET_PRIVATE_KEY=your_bot_wallet_private_key
WALLET_DESTINATION_ADDRESS=your_phantom_wallet_address
WALLET_RESERVE_SOL=0.1
WALLET_AUTO_TRANSFER_THRESHOLD=1.0

# Supabase (אם עוד לא)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
```

---

## 🎯 סדר ביצוע מומלץ (עם Cursor):

1. ✅ **עכשיו:** Scoring Engine + Token Metrics + Performance Tracker
2. 🟡 **היום:** RPC_ENDPOINT + Supabase Tables
3. 🟡 **מחר:** Rug Pull Detector
4. 🟡 **השבוע:** PumpFun Scanner + Telegram Error Recovery
5. 🔵 **בעתיד:** First Buyer + WebSocket + ML

---

**זה הכל! אתה יכול ללכת לפי הרשימה הזו עם Cursor** 💪
