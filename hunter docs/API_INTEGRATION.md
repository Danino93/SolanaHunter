# 🔌 SolanaHunter - API Integration Guide

**כל ה-APIs שתשתמש בהם + דוגמאות קוד**

---

## 📋 APIs Overview

| API | Purpose | Cost | Rate Limit |
|-----|---------|------|------------|
| Helius | Solana RPC | Free tier | 250k/day |
| Jupiter | Token swaps | Free | Unlimited |
| Birdeye | Price data | Free tier | 100/min |
| DexScreener | Charts | Free | 300/min |
| Solscan | Blockchain explorer | Free | 100/min |
| Telegram | Messaging | Free | Unlimited ✅ |

---

## 1. 🌐 Helius (Solana RPC)

**Purpose:** Interact with Solana blockchain

**Signup:** https://helius.dev/  
**Docs:** https://docs.helius.dev/

### Setup:
```python
import requests

HELIUS_API_KEY = "your_api_key"
RPC_URL = f"https://mainnet.helius-rpc.com/?api-key={HELIUS_API_KEY}"

def rpc_call(method, params=[]):
    response = requests.post(RPC_URL, json={
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    })
    return response.json()
```

### Get Token Accounts:
```python
def get_token_accounts(wallet_address):
    return rpc_call("getTokenAccountsByOwner", [
        wallet_address,
        {"programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},
        {"encoding": "jsonParsed"}
    ])
```

### Get Token Supply:
```python
def get_token_supply(token_mint):
    return rpc_call("getTokenSupply", [token_mint])
```

---

## 2. 🔄 Jupiter (DEX Aggregator)

**Purpose:** Get best swap prices, execute trades

**Docs:** https://station.jup.ag/docs/apis/swap-api

### Get Quote:
```python
def get_jupiter_quote(input_mint, output_mint, amount):
    """
    amount in smallest unit (lamports)
    1 SOL = 1,000,000,000 lamports
    """
    url = "https://quote-api.jup.ag/v6/quote"
    params = {
        "inputMint": input_mint,
        "outputMint": output_mint,
        "amount": amount,
        "slippageBps": 50  # 0.5%
    }
    response = requests.get(url, params=params)
    return response.json()

# Example:
SOL_MINT = "So11111111111111111111111111111111111111112"
USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

quote = get_jupiter_quote(
    input_mint=SOL_MINT,
    output_mint=USDC_MINT,
    amount=1_000_000_000  # 1 SOL
)

print(f"You'll get: {quote['outAmount']} USDC")
```

### Execute Swap:
```python
def execute_swap(quote, wallet_keypair):
    """
    Execute the swap transaction
    """
    url = "https://quote-api.jup.ag/v6/swap"
    
    swap_request = {
        "quoteResponse": quote,
        "userPublicKey": str(wallet_keypair.pubkey()),
        "wrapAndUnwrapSol": True
    }
    
    response = requests.post(url, json=swap_request)
    swap_transaction = response.json()['swapTransaction']
    
    # Sign and send transaction
    # (Full implementation in executor module)
    return swap_transaction
```

---

## 3. 🐦 Birdeye

**Purpose:** Real-time token prices, market data

**Signup:** https://birdeye.so/  
**Docs:** https://docs.birdeye.so/

### Get Token Price:
```python
BIRDEYE_API_KEY = "your_api_key"

def get_token_price(token_address):
    url = f"https://public-api.birdeye.so/defi/price"
    headers = {
        "X-API-KEY": BIRDEYE_API_KEY
    }
    params = {
        "address": token_address
    }
    response = requests.get(url, headers=headers, params=params)
    return response.json()['data']['value']

# Example:
bonk_price = get_token_price("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263")
print(f"BONK price: ${bonk_price}")
```

### Get Token Market Data:
```python
def get_token_overview(token_address):
    url = f"https://public-api.birdeye.so/defi/token_overview"
    headers = {"X-API-KEY": BIRDEYE_API_KEY}
    params = {"address": token_address}
    
    response = requests.get(url, headers=headers, params=params)
    data = response.json()['data']
    
    return {
        'price': data['price'],
        'volume_24h': data['v24hUSD'],
        'price_change_24h': data['v24hChangePercent'],
        'liquidity': data['liquidity'],
        'market_cap': data['mc']
    }
```

---

## 4. 📊 DexScreener

**Purpose:** Token discovery, charts, trending tokens

**Docs:** https://docs.dexscreener.com/

### Search Tokens:
```python
def search_tokens(query):
    url = f"https://api.dexscreener.com/latest/dex/search"
    params = {"q": query}
    response = requests.get(url, params=params)
    return response.json()['pairs']

# Example:
results = search_tokens("BONK")
for pair in results[:5]:
    print(f"{pair['baseToken']['symbol']}: ${pair['priceUsd']}")
```

### Get Token Pairs:
```python
def get_token_pairs(token_address):
    url = f"https://api.dexscreener.com/latest/dex/tokens/{token_address}"
    response = requests.get(url)
    return response.json()['pairs']

# Example:
pairs = get_token_pairs("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263")
for pair in pairs:
    print(f"DEX: {pair['dexId']}, Liquidity: ${pair['liquidity']['usd']}")
```

### Get New Pairs (Last 24h):
```python
def get_new_pairs():
    url = "https://api.dexscreener.com/latest/dex/pairs/solana"
    response = requests.get(url)
    pairs = response.json()['pairs']
    
    # Filter for new tokens (created < 24h ago)
    from datetime import datetime, timedelta
    now = datetime.now()
    day_ago = now - timedelta(days=1)
    
    new_pairs = [
        p for p in pairs
        if datetime.fromisoformat(p['pairCreatedAt'].replace('Z', '+00:00')) > day_ago
    ]
    
    return new_pairs
```

---

## 5. 🔍 Solscan

**Purpose:** Blockchain explorer, transaction history

**Docs:** https://docs.solscan.io/

### Get Token Holders:
```python
def get_token_holders(token_address, limit=20):
    url = f"https://api.solscan.io/token/holders"
    params = {
        "token": token_address,
        "offset": 0,
        "limit": limit
    }
    response = requests.get(url, params=params)
    return response.json()['data']

# Example:
holders = get_token_holders("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263")
for holder in holders[:10]:
    print(f"Holder: {holder['address']}, Amount: {holder['amount']}")
```

### Get Token Metadata:
```python
def get_token_meta(token_address):
    url = f"https://api.solscan.io/token/meta"
    params = {"token": token_address}
    response = requests.get(url, params=params)
    return response.json()['data']
```

---

## 6. 💬 Telegram Bot API

**Purpose:** Send messages, receive commands

**Docs:** https://core.telegram.org/bots/api  
**Library:** python-telegram-bot

**Cost:** Free! ✅

### Setup:
1. Open Telegram
2. Search @BotFather
3. Send `/newbot`
4. Get Bot Token

### Send Message:
```python
from telegram import Bot
import asyncio

async def send_telegram(chat_id, message):
    bot = Bot(token="YOUR_BOT_TOKEN")
    await bot.send_message(chat_id=chat_id, text=message)

# Example:
asyncio.run(send_telegram("YOUR_CHAT_ID", "🚀 Test message!"))
```

### Send Message with Buttons:
```python
from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ParseMode

async def send_alert_with_buttons(chat_id, token_symbol, score, token_address):
    bot = Bot(token="YOUR_BOT_TOKEN")
    
    keyboard = [
        [
            InlineKeyboardButton("📊 More Info", callback_data=f"info_{token_address}"),
            InlineKeyboardButton("💰 Buy", callback_data=f"buy_{token_address}")
        ],
        [InlineKeyboardButton("❌ Ignore", callback_data="ignore")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    message = f"🔥 *{token_symbol}* - Score: {score}/100"
    
    await bot.send_message(
        chat_id=chat_id,
        text=message,
        reply_markup=reply_markup,
        parse_mode=ParseMode.MARKDOWN
    )
```

### Receive Messages (Polling):
```python
from telegram.ext import Application, CommandHandler, MessageHandler, filters

async def handle_message(update, context):
    text = update.message.text
    chat_id = update.message.chat_id
    
    if text == "/status":
        await update.message.reply_text("🤖 Bot is running!")
    elif text.startswith("/check "):
        token_address = text.split()[1]
        # Check token...
        await update.message.reply_text(f"📊 Checking {token_address}...")

# Setup
app = Application.builder().token("YOUR_BOT_TOKEN").build()
app.add_handler(MessageHandler(filters.TEXT, handle_message))
app.run_polling()
```

---

## 📚 Complete Integration Example

```python
# scanner.py - Complete token analysis

import requests
import os
from dotenv import load_dotenv

load_dotenv()

class TokenAnalyzer:
    def __init__(self):
        self.helius_key = os.getenv('HELIUS_API_KEY')
        self.birdeye_key = os.getenv('BIRDEYE_API_KEY')
    
    def analyze_token(self, token_address):
        """Complete token analysis using multiple APIs"""
        
        print(f"Analyzing {token_address}...")
        
        # 1. Get price (Birdeye)
        price_data = self.get_price(token_address)
        
        # 2. Get market data (DexScreener)
        market_data = self.get_market_data(token_address)
        
        # 3. Get holders (Solscan)
        holders = self.get_holders(token_address)
        
        # 4. Calculate score
        score = self.calculate_score(price_data, market_data, holders)
        
        # 5. If good score, send alert
        if score >= 85:
            self.send_alert(token_address, score)
        
        return {
            'address': token_address,
            'price': price_data['price'],
            'volume_24h': market_data['volume24h'],
            'holders': len(holders),
            'score': score
        }
    
    def get_price(self, token_address):
        url = "https://public-api.birdeye.so/defi/price"
        headers = {"X-API-KEY": self.birdeye_key}
        params = {"address": token_address}
        response = requests.get(url, headers=headers, params=params)
        return response.json()['data']
    
    def get_market_data(self, token_address):
        url = f"https://api.dexscreener.com/latest/dex/tokens/{token_address}"
        response = requests.get(url)
        pairs = response.json()['pairs']
        return pairs[0] if pairs else {}
    
    def get_holders(self, token_address):
        url = "https://api.solscan.io/token/holders"
        params = {"token": token_address, "limit": 20}
        response = requests.get(url, params=params)
        return response.json()['data']
    
    def calculate_score(self, price_data, market_data, holders):
        score = 0
        
        # Price stability (30 points)
        if price_data.get('price', 0) > 0:
            score += 30
        
        # Volume (30 points)
        volume_24h = market_data.get('volume', {}).get('h24', 0)
        if volume_24h > 100000:
            score += 30
        elif volume_24h > 50000:
            score += 20
        elif volume_24h > 10000:
            score += 10
        
        # Holders (40 points)
        holder_count = len(holders)
        if holder_count > 1000:
            score += 40
        elif holder_count > 500:
            score += 30
        elif holder_count > 100:
            score += 20
        elif holder_count > 50:
            score += 10
        
        return min(score, 100)
    
    async def send_alert(self, token_address, score):
        # Telegram alert
        from telegram import Bot
        bot = Bot(token=os.getenv('TELEGRAM_BOT_TOKEN'))
        message = f"""
🚨 HIGH SCORE TOKEN!

Address: {token_address}
Score: {score}/100

Check it out: https://dexscreener.com/solana/{token_address}
        """
        await bot.send_message(
            chat_id=os.getenv('TELEGRAM_CHAT_ID'),
            text=message.strip()
        )

# Usage:
analyzer = TokenAnalyzer()
result = analyzer.analyze_token("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263")
print(result)
```

---

## 🔒 API Security Best Practices

### 1. Environment Variables
```python
# .env
HELIUS_API_KEY=xxx
BIRDEYE_API_KEY=xxx
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx

# Load in code
from dotenv import load_dotenv
load_dotenv()
```

### 2. Rate Limiting
```python
import time
from functools import wraps

def rate_limit(max_calls, period):
    calls = []
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            now = time.time()
            calls[:] = [c for c in calls if c > now - period]
            
            if len(calls) >= max_calls:
                sleep_time = period - (now - calls[0])
                time.sleep(sleep_time)
            
            calls.append(time.time())
            return func(*args, **kwargs)
        return wrapper
    return decorator

@rate_limit(max_calls=100, period=60)  # 100 calls per minute
def get_token_price(token):
    # API call here
    pass
```

### 3. Error Handling
```python
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

def requests_retry_session(
    retries=3,
    backoff_factor=0.3,
    status_forcelist=(500, 502, 504),
):
    session = requests.Session()
    retry = Retry(
        total=retries,
        read=retries,
        connect=retries,
        backoff_factor=backoff_factor,
        status_forcelist=status_forcelist,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session

# Usage:
response = requests_retry_session().get(url)
```

---

## 📊 API Response Caching

```python
import redis
import json
from functools import wraps

redis_client = redis.Redis(host='localhost', port=6379)

def cache_response(ttl=300):  # 5 minutes
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Check cache
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Call function
            result = func(*args, **kwargs)
            
            # Cache result
            redis_client.setex(
                cache_key,
                ttl,
                json.dumps(result)
            )
            
            return result
        return wrapper
    return decorator

@cache_response(ttl=60)  # Cache for 1 minute
def get_token_price(token_address):
    # Expensive API call
    pass
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-19
