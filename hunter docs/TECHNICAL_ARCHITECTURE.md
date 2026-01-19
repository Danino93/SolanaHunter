# 🏗️ SolanaHunter - Technical Architecture

**ארכיטקטורה טכנית מלאה של המערכת**

---

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      SOLANAHUNTER                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   SCANNER    │  │  ANALYZER    │  │  EXECUTOR    │     │
│  │   (Brain)    │→│  (Decision)  │→│   (Action)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │            │
│         ▼                  ▼                  ▼            │
│  ┌───────────────────────────────────────────────────┐    │
│  │            COMMUNICATION LAYER                    │    │
│  │  (WhatsApp + Dashboard + Notifications)           │    │
│  └───────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Component Breakdown

### 1. SCANNER MODULE
**תפקיד:** זיהוי טוקנים חדשים ברשת Solana

**Components:**
```
scanner/
├── blockchain_listener.py    # מאזין ל-new tokens
├── token_fetcher.py          # שולף מידע על טוקנים
└── metadata_parser.py        # מפענח metadata
```

**Data Flow:**
```
Solana Blockchain
    ↓ (Helius RPC)
Blockchain Listener
    ↓ (filters: created < 24h)
Token Fetcher
    ↓ (metadata enrichment)
Database (tokens table)
```

**APIs Used:**
- Helius RPC: real-time blockchain data
- Solscan API: token metadata
- DexScreener API: market data

---

### 2. ANALYZER MODULE
**תפקיד:** ניתוח עומק של כל טוקן

**Components:**
```
analyzer/
├── contract_checker.py       # בדיקות smart contract
├── holder_analyzer.py        # ניתוח מחזיקים
├── smart_money_tracker.py    # מעקב ארנקים חכמים
├── social_sentiment.py       # ניתוח רשתות חברתיות
└── scoring_engine.py         # מנוע הציון
```

**Analysis Pipeline:**
```
New Token Detected
    ↓
┌─────────────────────────────┐
│ Contract Analysis           │
│ - Ownership renounced?      │
│ - Mint authority disabled?  │
│ - Liquidity locked?         │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ Holder Analysis             │
│ - Top 10 holders %          │
│ - Distribution pattern      │
│ - Smart money presence      │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ Social Sentiment            │
│ - Twitter mentions          │
│ - Telegram activity         │
│ - Influencer buzz           │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ Scoring Engine              │
│ → Final Score (0-100)       │
└─────────────────────────────┘
```

**Scoring Algorithm:**
```python
def calculate_final_score(token):
    # Base safety score (0-60 points)
    safety_score = 0
    if contract.ownership_renounced:
        safety_score += 20
    if contract.liquidity_locked:
        safety_score += 20
    if not contract.can_mint:
        safety_score += 20
    
    # Holder distribution (0-20 points)
    holder_score = 0
    if holders.top_10_pct < 50:
        holder_score += 10
    if holders.count > 1000:
        holder_score += 10
    
    # Smart money bonus (0-15 points)
    smart_money_score = min(smart_money.count * 5, 15)
    
    # Social sentiment (0-15 points)
    social_score = 0
    if social.is_trending:
        social_score += 10
    if social.mentions > 100:
        social_score += 5
    
    return min(
        safety_score + holder_score + smart_money_score + social_score,
        100
    )
```

---

### 3. EXECUTOR MODULE
**תפקיד:** ביצוע trades (buy/sell)

**Components:**
```
executor/
├── wallet_manager.py         # ניהול ארנק
├── jupiter_client.py         # אינטגרציה עם Jupiter
├── trade_executor.py         # ביצוע trades
├── position_monitor.py       # מעקב פוזיציות
└── risk_manager.py           # ניהול סיכונים
```

**Trade Execution Flow:**
```
User Command: "BUY 50"
    ↓
Risk Manager
│ - Check available balance
│ - Validate trade size
│ - Check daily limits
    ↓
Jupiter Quote
│ - Get best swap route
│ - Calculate slippage
│ - Estimate output
    ↓
DCA Strategy
│ - Stage 1: 30% ($15)
│ - Wait 2 minutes
│ - Stage 2: 40% ($20)
│ - Wait 2 minutes
│ - Stage 3: 30% ($15)
    ↓
Position Monitor
│ - Track entry price
│ - Set stop-loss (-15%)
│ - Set take-profits (x2, x5)
│ - Monitor 24/7
```

**Risk Management Rules:**
```python
class RiskManager:
    MAX_POSITION_SIZE = 0.05  # 5% of portfolio
    MAX_DAILY_TRADES = 10
    MAX_OPEN_POSITIONS = 5
    STOP_LOSS_PCT = 0.15  # 15%
    
    def validate_trade(self, amount_usd):
        # Check balance
        if amount_usd > self.get_available_balance():
            raise InsufficientFunds()
        
        # Check position size
        portfolio_value = self.get_portfolio_value()
        if amount_usd > portfolio_value * self.MAX_POSITION_SIZE:
            raise PositionTooLarge()
        
        # Check daily limit
        if self.get_trades_today() >= self.MAX_DAILY_TRADES:
            raise DailyLimitReached()
        
        # Check open positions
        if len(self.get_open_positions()) >= self.MAX_OPEN_POSITIONS:
            raise TooManyPositions()
```

---

### 4. COMMUNICATION LAYER
**תפקיד:** תקשורת עם המשתמש

**Components:**
```
communication/
├── whatsapp_bot.py           # WhatsApp Business API
├── dashboard_api.py          # REST API for dashboard
├── notification_manager.py   # ניהול התראות
└── command_parser.py         # פענוח פקודות
```

**WhatsApp Commands:**
```
User → Bot:
┌──────────────────────────────────────┐
│ "status"                             │
│ → Current scan status, stats         │
├──────────────────────────────────────┤
│ "check <address>"                    │
│ → Analyze specific token             │
├──────────────────────────────────────┤
│ "BUY <amount> [address]"             │
│ → Execute buy order                  │
├──────────────────────────────────────┤
│ "SELL [address]"                     │
│ → Sell position                      │
├──────────────────────────────────────┤
│ "portfolio"                          │
│ → Show all positions + P&L           │
├──────────────────────────────────────┤
│ "stop"                               │
│ → Pause bot scanning                 │
└──────────────────────────────────────┘

Bot → User:
┌──────────────────────────────────────┐
│ 🚨 Alert: High score token found     │
│ 📊 Update: Position hit target       │
│ ⚠️ Warning: Stop loss triggered      │
│ ✅ Confirmation: Trade executed      │
└──────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Tables:

#### 1. **tokens**
```sql
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT UNIQUE NOT NULL,
  symbol TEXT,
  name TEXT,
  decimals INTEGER,
  supply BIGINT,
  
  -- Scores
  safety_score INTEGER,
  holder_score INTEGER,
  social_score INTEGER,
  final_score INTEGER,
  
  -- Metadata
  created_at TIMESTAMP,
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_analyzed_at TIMESTAMP,
  
  -- Analysis results
  is_renounced BOOLEAN,
  is_liquidity_locked BOOLEAN,
  liquidity_lock_until TIMESTAMP,
  top_10_holders_pct FLOAT,
  holder_count INTEGER,
  smart_money_count INTEGER,
  
  -- Status
  status TEXT DEFAULT 'active',  -- active, dead, rug_pull
  
  -- Extra data
  metadata JSONB
);

CREATE INDEX idx_tokens_score ON tokens(final_score DESC);
CREATE INDEX idx_tokens_created ON tokens(created_at DESC);
CREATE INDEX idx_tokens_status ON tokens(status);
```

#### 2. **smart_wallets**
```sql
CREATE TABLE smart_wallets (
  wallet_address TEXT PRIMARY KEY,
  nickname TEXT,
  
  -- Performance
  total_trades INTEGER DEFAULT 0,
  profitable_trades INTEGER DEFAULT 0,
  success_rate FLOAT,
  
  -- Stats
  avg_profit_pct FLOAT,
  biggest_win_pct FLOAT,
  
  -- Tracking
  tracked_since TIMESTAMP DEFAULT NOW(),
  last_trade_at TIMESTAMP,
  
  metadata JSONB
);
```

#### 3. **trades**
```sql
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Token info
  token_address TEXT REFERENCES tokens(address),
  token_symbol TEXT,
  
  -- Trade details
  type TEXT NOT NULL,  -- 'buy' or 'sell'
  amount_usd FLOAT NOT NULL,
  amount_tokens FLOAT NOT NULL,
  price FLOAT NOT NULL,
  
  -- Execution
  executed_at TIMESTAMP DEFAULT NOW(),
  tx_signature TEXT,
  
  -- Performance (for sells)
  entry_price FLOAT,
  profit_usd FLOAT,
  profit_pct FLOAT,
  
  metadata JSONB
);

CREATE INDEX idx_trades_token ON trades(token_address);
CREATE INDEX idx_trades_executed ON trades(executed_at DESC);
```

#### 4. **positions**
```sql
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Token
  token_address TEXT REFERENCES tokens(address),
  token_symbol TEXT,
  
  -- Position details
  amount_tokens FLOAT NOT NULL,
  entry_price FLOAT NOT NULL,
  entry_value_usd FLOAT NOT NULL,
  
  -- Risk management
  stop_loss_price FLOAT,
  take_profit_1_price FLOAT,
  take_profit_2_price FLOAT,
  
  -- Status
  status TEXT DEFAULT 'open',  -- open, partial, closed
  opened_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  
  -- Performance
  current_value_usd FLOAT,
  unrealized_pnl_usd FLOAT,
  unrealized_pnl_pct FLOAT,
  realized_pnl_usd FLOAT,
  
  metadata JSONB
);

CREATE INDEX idx_positions_status ON positions(status);
```

#### 5. **alerts**
```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Alert details
  type TEXT NOT NULL,  -- 'high_score', 'stop_loss', 'take_profit', etc.
  token_address TEXT,
  message TEXT NOT NULL,
  
  -- Delivery
  sent_at TIMESTAMP DEFAULT NOW(),
  sent_via TEXT,  -- 'whatsapp', 'email', etc.
  
  -- User interaction
  user_action TEXT,  -- 'buy', 'ignore', 'no_action'
  action_at TIMESTAMP,
  
  metadata JSONB
);
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL DATA SOURCES                      │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Solana    │  │   Twitter   │  │  DexScreener│           │
│  │  Blockchain │  │     API     │  │     API     │           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
└─────────┼─────────────────┼─────────────────┼──────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA COLLECTION                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Scanner (Every 5 min)                                    │  │
│  │  → New tokens → Metadata → Initial filter                │  │
│  └─────────────────────────┬────────────────────────────────┘  │
└────────────────────────────┼───────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          ANALYSIS                               │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Contract   │  │   Holders    │  │    Social    │        │
│  │   Analysis   │  │   Analysis   │  │  Sentiment   │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         └──────────────────┼──────────────────┘                │
│                            ▼                                    │
│                  ┌──────────────────┐                          │
│                  │  Scoring Engine  │                          │
│                  │   (0-100 score)  │                          │
│                  └────────┬─────────┘                          │
└───────────────────────────┼────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DECISION LAYER                            │
│                                                                 │
│  Score >= 85? ───YES──→ Send Alert to User                     │
│      │                       │                                  │
│      NO                      ▼                                  │
│      │                User Response?                            │
│      │                   │        │                             │
│      │              "BUY 50"   "IGNORE"                         │
│      │                   │        │                             │
│      │                   ▼        ▼                             │
│      │              Execute   Log & Skip                        │
│      │                Trade                                     │
│      │                   │                                      │
│      │                   ▼                                      │
│      │           ┌─────────────────┐                           │
│      │           │ Position Monitor│                           │
│      │           │  (Stop/Target)  │                           │
│      │           └─────────────────┘                           │
│      │                                                          │
│      └──→ Log to Database                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          RAILWAY                                │
│                     (24/7 Server)                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Main Bot Process (Python)                               │  │
│  │  ├── Scanner Thread (continuous)                         │  │
│  │  ├── Analyzer Thread Pool (parallel)                     │  │
│  │  ├── Position Monitor Thread (continuous)                │  │
│  │  └── FastAPI Server (webhooks)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Redis (Cache & Queue)                                    │  │
│  │  ├── Token cache (1 hour TTL)                            │  │
│  │  ├── Analysis queue (async jobs)                         │  │
│  │  └── Rate limiting                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ (API Calls)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                 │
│                    (Database + Realtime)                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                      │  │
│  │  (All tables: tokens, trades, positions, etc.)           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Realtime Subscriptions                                   │  │
│  │  (Push updates to dashboard)                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ (Queries)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          VERCEL                                 │
│                    (Dashboard Frontend)                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js App                                              │  │
│  │  ├── Token Scanner View                                  │  │
│  │  ├── Portfolio Tracker                                   │  │
│  │  ├── Performance Analytics                               │  │
│  │  └── Manual Controls                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security & Best Practices

### 1. API Keys Management
```python
# .env file (NEVER commit to git!)
HELIUS_API_KEY=xxx
SUPABASE_URL=xxx
SUPABASE_KEY=xxx
WHATSAPP_TOKEN=xxx
WALLET_PRIVATE_KEY=xxx  # ⚠️ DEDICATED BOT WALLET ONLY

# Load in code
from dotenv import load_dotenv
load_dotenv()
```

### 2. Wallet Security
- **Never use your main wallet**
- Create dedicated wallet for bot
- Start with small amount ($50-100)
- Monitor closely

### 3. Rate Limiting
```python
from ratelimit import limits, sleep_and_retry

@sleep_and_retry
@limits(calls=100, period=60)  # 100 calls per minute
def call_helius_api():
    pass
```

### 4. Error Handling
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bot.log'),
        logging.StreamHandler()
    ]
)

try:
    execute_trade()
except InsufficientFunds:
    logging.error("Trade failed: insufficient funds")
    alert_user("⚠️ Trade failed - not enough SOL")
except Exception as e:
    logging.exception("Unexpected error")
    alert_admin(f"🚨 Critical error: {e}")
```

---

## 📊 Monitoring & Observability

### Health Checks
```python
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "scanner_running": scanner.is_alive(),
        "last_scan": scanner.last_scan_time,
        "tokens_scanned_today": db.count_tokens_today(),
        "active_positions": db.count_open_positions()
    }
```

### Metrics to Track
- Tokens scanned per hour
- Analysis success rate
- Alert delivery rate
- Trade execution time
- API response times
- Database query performance

---

## 🎯 Performance Optimization

### 1. Caching Strategy
```python
import redis

cache = redis.Redis(host='localhost', port=6379)

def get_token_info(address):
    # Check cache first
    cached = cache.get(f"token:{address}")
    if cached:
        return json.loads(cached)
    
    # Fetch from API
    info = fetch_from_api(address)
    
    # Cache for 1 hour
    cache.setex(f"token:{address}", 3600, json.dumps(info))
    
    return info
```

### 2. Parallel Analysis
```python
from concurrent.futures import ThreadPoolExecutor

def analyze_tokens(tokens):
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(analyze_token, t) for t in tokens]
        results = [f.result() for f in futures]
    return results
```

### 3. Database Indexes
```sql
-- Critical indexes for performance
CREATE INDEX idx_tokens_score_status ON tokens(final_score DESC, status);
CREATE INDEX idx_trades_executed ON trades(executed_at DESC);
CREATE INDEX idx_positions_open ON positions(status) WHERE status = 'open';
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-19
