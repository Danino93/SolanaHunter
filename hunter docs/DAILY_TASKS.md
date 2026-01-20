# 📅 SolanaHunter - Daily Development Tasks (21 Days)

**תוכנית עבודה יומית לפיתוח הבוט - כל יום = פיצ'ר חדש**

עם Cursor + Claude, כל משימה תהיה מהירה ופרקטית.

---

## 🎯 העיקרון המנחה

**כל יום = 1 פיצ'ר עובד שאפשר לבדוק**

- לא תיאוריה
- לא תכנון ארוך
- רק קוד שעובד + בדיקה שעובד

---

## 📅 WEEK 1: THE BRAIN (ימים 1-7)
**מטרה: בוט שמזהה טוקנים חדשים ונותן להם ציון**

---

### 🔥 Day 1: Setup + First Scan
**⏰ 2-3 שעות | Output: בוט שסורק טוקנים חדשים**
**סטטוס:** ✅ הושלם (קוד) | ⏳ ממתין ל-API keys

**מה אתה עושה:**
- [x] צור פרויקט ב-Cursor (✅ נעשה - מבנה מודרני!)
- [ ] התקן dependencies: `pip install -r requirements.txt`
- [ ] הירשם ל-Helius.dev (API key חינם) - **אלירן עושה**
- [x] כתוב סקריפט שסורק טוקנים חדשים (✅ נעשה - TokenScanner חכם!)

**קוד לכתיבה ב-Cursor:**
```python
# scanner.py
import requests
import time

HELIUS_API = "your_key_here"

def get_new_tokens():
    """מצא טוקנים שנוצרו ב-24 שעות האחרונות"""
    # API call לHelius
    # החזר רשימה של טוקנים
    pass

while True:
    tokens = get_new_tokens()
    print(f"Found {len(tokens)} new tokens")
    for t in tokens:
        print(f"  - {t['symbol']}: {t['address']}")
    time.sleep(300)  # כל 5 דקות
```

**✅ בדיקה:** הרץ את הסקריפט, ראה שמודפסים טוקנים חדשים

---

### 🔥 Day 2: Contract Safety Checker
**⏰ 3-4 שעות | Output: בדיקות אבטחה בסיסיות**
**סטטוס:** ✅ הושלם

**מה אתה עושה:**
- [x] כתוב פונקציה שבודקת אם ownership renounced ✅
- [x] כתוב פונקציה שבודקת liquidity lock ✅
- [x] כתוב פונקציה שבודקת mint authority ✅
- [x] אינטגרציה עם main.py ✅

**קוד לכתיבה:**
```python
# safety_checker.py
def check_safety(token_address):
    score = 0
    
    # בדיקה 1: ownership
    if is_ownership_renounced(token_address):
        score += 33
    
    # בדיקה 2: liquidity
    if is_liquidity_locked(token_address):
        score += 33
    
    # בדיקה 3: mint
    if not can_mint_more(token_address):
        score += 34
    
    return score
```

**✅ בדיקה:** הרץ על 5 טוקנים ידועים, ראה ציונים הגיוניים

---

### 🔥 Day 3: Holder Analysis
**⏰ 3-4 שעות | Output: ניתוח מחזיקי טוקן**
**סטטוס:** ✅ הושלם

**מה אתה עושה:**
- [x] שלוף את רשימת ה-TOP 20 holders ✅
- [x] חשב אחוזים ✅
- [x] זהה אם concentrated מדי (אדום) ✅
- [x] אינטגרציה עם main.py ✅

**קוד:**
```python
def analyze_holders(token_address):
    holders = get_top_holders(token_address, limit=20)
    
    # חשב top 10
    top_10_pct = sum([h['pct'] for h in holders[:10]])
    
    is_risky = top_10_pct > 60  # אם top 10 מחזיקים 60%+
    
    return {
        'top_10_percentage': top_10_pct,
        'is_concentrated': is_risky,
        'holder_count': len(holders)
    }
```

**✅ בדיקה:** בדוק על טוקן ידוע (כמו BONK), ראה שהנתונים נכונים

---

### 🔥 Day 4: Scoring Algorithm
**⏰ 2-3 שעות | Output: מערכת ציון 0-100**
**סטטוס:** ✅ הושלם

**מה אתה עושה:**
- [x] שלב את כל הבדיקות ✅
- [x] צור ציון משוקלל ✅
- [x] הוסף logic לסיווג (A+, A, B+, B, C+, C, F) ✅
- [x] מערכת התראות (85+ = HIGH SCORE) ✅

**קוד:**
```python
def calculate_score(token_address):
    safety = check_safety(token_address)  # 0-100
    holders = analyze_holders(token_address)
    
    final_score = safety
    
    # בונוסים
    if not holders['is_concentrated']:
        final_score += 10
    
    if holders['holder_count'] > 1000:
        final_score += 5
    
    return min(final_score, 100)
```

**✅ בדיקה:** הרץ על 10 טוקנים, ראה שהציונים הגיוניים

---

### 🔥 Day 5: Database Setup (Supabase)
**⏰ 2-3 שעות | Output: שמירת כל הטוקנים ב-DB**
**סטטוס:** ⏳ לא התחיל

**מה אתה עושה:**
- [ ] הירשם ל-Supabase (free tier)
- [ ] צור טבלה `tokens`
- [ ] שמור כל סריקה ב-DB

**SQL:**
```sql
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT UNIQUE,
  symbol TEXT,
  name TEXT,
  score INTEGER,
  analyzed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```

**Python:**
```python
from supabase import create_client

db = create_client(url, key)

def save_token(token_data):
    db.table('tokens').insert(token_data).execute()
```

**✅ בדיקה:** הרץ scanner, בדוק שטוקנים נשמרים ב-Supabase dashboard

---

### 🔥 Day 6: Smart Money Tracking
**⏰ 3-4 שעות | Output: מעקב אחרי ארנקים חכמים**
**סטטוס:** ✅ הושלם (קוד) | ⏳ ממתין לרשימת smart wallets

**מה אתה עושה:**
- [ ] מצא 10 ארנקים שתפסו gems בעבר (ידני - חפש ב-Solscan) - **אלירן עושה**
- [x] צור DB של "smart wallets" ✅ (JSON file)
- [x] בדוק אם אחד מהם החזיק טוקן חדש ✅

**קוד:**
```python
SMART_WALLETS = [
    "wallet1_address",
    "wallet2_address",
    # ... עוד 8
]

def check_smart_money(token_address):
    holders = get_top_holders(token_address)
    smart_count = 0
    
    for holder in holders:
        if holder['address'] in SMART_WALLETS:
            smart_count += 1
    
    return smart_count

# בscoring:
if check_smart_money(token) > 2:
    score += 15  # בונוס חזק!
```

**✅ בדיקה:** מצא טוקן שארנק חכם החזיק, ראה שהציון עולה

---

### 🔥 Day 7: Main Loop + Logging
**⏰ 2-3 שעות | Output: בוט שרץ 24/7**
**סטטוס:** ✅ הושלם

**מה אתה עושה:**
- [x] שלב הכל ללולאה אחת ✅
- [x] הוסף logging (מה קורה, מתי) ✅
- [ ] Deploy ל-Railway (נעשה מאוחר יותר)

**קוד:**
```python
# main.py
import logging

logging.basicConfig(level=logging.INFO)

def main():
    logging.info("🚀 SolanaHunter Started")
    
    while True:
        try:
            tokens = get_new_tokens()
            logging.info(f"Scanning {len(tokens)} tokens...")
            
            for token in tokens:
                score = calculate_score(token['address'])
                
                if score >= 80:
                    logging.warning(f"🔥 HIGH SCORE: {token['symbol']} = {score}")
                    save_token({**token, 'score': score})
                
            time.sleep(300)
        except Exception as e:
            logging.error(f"Error: {e}")
            time.sleep(60)

if __name__ == "__main__":
    main()
```

**Deploy:**
- צור account ב-Railway
- העלה את הקוד
- הרץ 24/7

**✅ בדיקה:** בוט רץ שעה בלי crash, רואה logs ב-Railway

---

## ✅ WEEK 1 MILESTONE:
**בוט שסורק טוקנים, מנתח אותם, ונותן ציון - רץ 24/7**

---

## 📅 WEEK 2: THE MOUTH (ימים 8-14)
**מטרה: בוט שמדבר איתך בטלגרם**

---

### 🔥 Day 8: Telegram Bot Setup
**⏰ 1-2 שעות | Output: שליחת הודעה ראשונה**  
**סטטוס:** ⏳ לא התחיל

**מה אתה עושה:**
- [ ] פתח Telegram
- [ ] חפש @BotFather
- [ ] שלח /newbot
- [ ] תן שם לבוט (למשל: "SolanaHunter Bot")
- [ ] תן username (למשל: "solanahunter_bot")
- [ ] קבל את ה-Bot Token
- [ ] שלח הודעת טסט לעצמך

**קוד:**
```python
# telegram_bot.py
from telegram import Bot
import asyncio

class TelegramBot:
    def __init__(self, token):
        self.bot = Bot(token=token)
        self.token = token
    
    async def send_message(self, chat_id, text):
        """Send message to Telegram"""
        await self.bot.send_message(chat_id=chat_id, text=text)

# בדיקה:
bot = TelegramBot("YOUR_BOT_TOKEN")
asyncio.run(bot.send_message(YOUR_CHAT_ID, "🚀 Test from SolanaHunter!"))

# או עם python-telegram-bot:
from telegram.ext import Application

app = Application.builder().token("YOUR_BOT_TOKEN").build()
await app.bot.send_message(chat_id=YOUR_CHAT_ID, text="🚀 Test!")
```

**✅ בדיקה:** קיבלת הודעה בטלגרם!

---

### 🔥 Day 9: Alert System
**⏰ 2-3 שעות | Output: התראות אוטומטיות על טוקנים טובים**
**סטטוס:** ⏳ לא התחיל

**מה אתה עושה:**
- [ ] כשבוט מוצא טוקן עם score > 85 → שלח טלגרם
- [ ] עצב את ההודעה יפה עם Markdown

**קוד:**
```python
from telegram import ParseMode

async def send_alert(token, score, chat_id):
    message = f"""
🚨 *HIGH SCORE TOKEN DETECTED!*

*Token:* ${token['symbol']}
*Score:* {score}/100

✅ Safety: {token['safety_score']}
✅ Holders: {token['holder_count']}
✅ Smart Money: {token['smart_money_count']}

*Address:* `{token['address']}`
[DexScreener](https://dexscreener.com/solana/{token['address']})

⚡ *Act fast!*
    """
    
    await bot.send_message(
        chat_id=chat_id,
        text=message.strip(),
        parse_mode=ParseMode.MARKDOWN
    )

# בmain loop:
if score >= 85:
    await send_alert(token, score, YOUR_CHAT_ID)
```

**✅ בדיקה:** הרץ, חכה שיזהה טוקן טוב, קבל התראה בטלגרם

---

### 🔥 Day 10: Two-Way Chat (Receive Messages)
**⏰ 2-3 שעות | Output: אתה שולח "status" → בוט עונה**  
**סטטוס:** ⏳ לא התחיל

**מה אתה עושה:**
- [ ] הגדר message handler
- [ ] תפוס הודעות נכנסות
- [ ] ענה על פקודות בסיסיות

**קוד:**
```python
from telegram.ext import Application, CommandHandler, MessageHandler, filters

async def status_command(update, context):
    """Handle /status command"""
    count = count_tokens_today()
    await update.message.reply_text(
        f"🤖 *Running!*\n\nScanned {count} tokens today",
        parse_mode=ParseMode.MARKDOWN
    )

async def check_command(update, context):
    """Handle /check <address> command"""
    if not context.args:
        await update.message.reply_text("Usage: /check <token_address>")
        return
    
    token_address = context.args[0]
    score = calculate_score(token_address)
    await update.message.reply_text(f"📊 Score: {score}/100")

async def handle_message(update, context):
    """Handle regular messages"""
    text = update.message.text.lower()
    
    if text == "status":
        await status_command(update, context)
    elif text.startswith("check "):
        context.args = text.split()[1:]
        await check_command(update, context)

# Setup
app = Application.builder().token("YOUR_BOT_TOKEN").build()
app.add_handler(CommandHandler("status", status_command))
app.add_handler(CommandHandler("check", check_command))
app.add_handler(MessageHandler(filters.TEXT, handle_message))
app.run_polling()
```

**✅ בדיקה:** שלח "/status" בטלגרם → קבל תשובה

---

### 🔥 Day 11: Rich Messages (Buttons + Images)
**⏰ 2-3 שעות | Output: הודעות עם כפתורים**
**סטטוס:** ⏳ לא התחיל

**מה אתה עושה:**
- [ ] כשבוט שולח התראה, הוסף כפתורים: "More Info", "Ignore", "Buy"
- [ ] כשלוחצים "More Info" → שלח גרף מחיר

**קוד:**
```python
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

async def send_alert_with_buttons(token, score, chat_id):
    keyboard = [
        [
            InlineKeyboardButton("📊 More Info", callback_data=f"info_{token['address']}"),
            InlineKeyboardButton("💰 Buy", callback_data=f"buy_{token['address']}")
        ],
        [InlineKeyboardButton("❌ Ignore", callback_data="ignore")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    message = f"🔥 *{token['symbol']}* - Score: {score}/100"
    
    await bot.send_message(
        chat_id=chat_id,
        text=message,
        reply_markup=reply_markup,
        parse_mode=ParseMode.MARKDOWN
    )

async def button_callback(update, context):
    """Handle button clicks"""
    query = update.callback_query
    await query.answer()
    
    data = query.data
    if data.startswith("info_"):
        token_address = data.split("_")[1]
        # Send more info
        await query.edit_message_text(f"📊 Info for {token_address}")
    elif data.startswith("buy_"):
        token_address = data.split("_")[1]
        # Handle buy
        await query.edit_message_text(f"💰 Buying {token_address}...")
```

**✅ בדיקה:** קבל התראה עם כפתורים, לחץ עליהם

---

### 🔥 Day 12: Dashboard (Next.js)
**⏰ 4-5 שעות | Output: עמוד אינטרנט עם טבלה של טוקנים**
**סטטוס:** ✅ הושלם במלואו + Authentication + שיפורי עיצוב מרהיבים!

**מה אתה עושה:**
- [x] צור פרויקט Next.js
- [x] חבר ל-Supabase
- [x] הצג טבלה של כל הטוקנים + scores
- [x] הוסף מסך כניסה מאובטח (username + password)
- [x] שיפור עיצוב מרהיב - gradients, animations, hover effects

**קוד (Cursor יעשה את רוב העבודה):**
```bash
npx create-next-app solanahunter-dashboard
cd solanahunter-dashboard
npm install @supabase/supabase-js
```

```jsx
// app/page.tsx
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

export default async function Home() {
  const { data: tokens } = await supabase
    .from('tokens')
    .select('*')
    .order('score', { ascending: false })
    .limit(50)
  
  return (
    <div>
      <h1>SolanaHunter Dashboard</h1>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Score</th>
            <th>Analyzed</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map(t => (
            <tr key={t.id}>
              <td>{t.symbol}</td>
              <td>{t.score}</td>
              <td>{new Date(t.analyzed_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

**Deploy:** Vercel (free)

**✅ בדיקה:** פתח את הדשבורד, ראה את כל הטוקנים

---

### 🔥 Day 13: Real-Time Updates
**⏰ 2-3 שעות | Output: דשבורד מתעדכן אוטומטית**
**סטטוס:** ✅ הושלם במלואו

**מה אתה עושה:**
- [x] הוסף Supabase Realtime
- [x] כל טוקן חדש → מופיע בדשבורד בלי refresh
- [x] Backend שומר טוקנים ל-Supabase
- [x] Frontend מאזין לעדכונים בזמן אמת
- [x] אינדיקטור "Live" עם אנימציה

**קוד:**
```jsx
'use client'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [tokens, setTokens] = useState([])
  
  useEffect(() => {
    // טען טוקנים
    loadTokens()
    
    // האזן לשינויים
    const channel = supabase
      .channel('tokens')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'tokens' },
        (payload) => {
          setTokens(prev => [payload.new, ...prev])
        }
      )
      .subscribe()
    
    return () => supabase.removeChannel(channel)
  }, [])
  
  return <div>...</div>
}
```

**✅ בדיקה:** בוט מוצא טוקן חדש → מופיע מיד בדשבורד

---

### 🔥 Day 14: Polish UI
**⏰ 2-3 שעות | Output: דשבורד יפה עם charts**
**סטטוס:** ✅ הושלם במלואו

**מה אתה עושה:**
- [x] הוסף TailwindCSS (כבר היה)
- [x] הוסף mini chart לכל טוקן (price action) - עם Recharts
- [x] הוסף פילטרים (score, date filter - today/week/month)
- [x] שיפורי UI נוספים

**Cursor prompt:**
"Make this dashboard beautiful with Tailwind. Add a mini price chart for each token using Recharts. Add filters for score and date."

**✅ בדיקה:** דשבורד נראה מקצועי

---

## ✅ WEEK 2 MILESTONE:
**בוט שמדבר איתך בטלגרם + דשבורד יפה לניטור**

---

## 📅 WEEK 3: THE HANDS (ימים 15-21)
**מטרה: בוט שקונה ומוכר בשבילך**

---

### 🔥 Day 15: Phantom Wallet Integration
**⏰ 3-4 שעות | Output: בוט מחובר לארנק**
**סטטוס:** ✅ הושלם במלואו

**מה אתה עושה:**
- [x] ייצא private key מPhantom (ארנק ייעודי לבוט!) - **אלירן עושה**
- [x] צור wallet client ב-Python ✅
- [x] בדוק balance ✅

**קוד:**
```python
from solders.keypair import Keypair
from solana.rpc.api import Client

# ⚠️ אל תשתמש בארנק הראשי שלך!
private_key = "your_private_key_here"
keypair = Keypair.from_base58_string(private_key)

client = Client("https://api.mainnet-beta.solana.com")

def get_balance():
    balance = client.get_balance(keypair.pubkey())
    return balance.value / 1e9  # Convert to SOL

print(f"Wallet: {keypair.pubkey()}")
print(f"Balance: {get_balance()} SOL")
```

**✅ בדיקה:** ראה את הבאלנס הנכון

---

### 🔥 Day 16: Jupiter Integration (Swaps)
**⏰ 4-5 שעות | Output: ביצוע swap ראשון**
**סטטוס:** ⏳ לא התחיל

**מה אתה עושה:**
- [ ] התחבר ל-Jupiter API
- [ ] קבל quote ל-swap (SOL → Token)
- [ ] בצע swap של $1 (טסט!)

**קוד:**
```python
import requests

def get_quote(input_mint, output_mint, amount):
    """Get swap quote from Jupiter"""
    url = f"https://quote-api.jup.ag/v6/quote"
    params = {
        "inputMint": input_mint,  # SOL address
        "outputMint": output_mint,  # Token address
        "amount": amount,
        "slippageBps": 50  # 0.5%
    }
    response = requests.get(url, params=params)
    return response.json()

def execute_swap(quote):
    """Execute the swap"""
    # Jupiter swap logic
    pass

# טסט:
quote = get_quote(SOL_MINT, TOKEN_MINT, 1_000_000)  # $1
print(f"You'll get: {quote['outAmount']} tokens")
```

**✅ בדיקה:** swap של $1 עבר בהצלחה

---

### 🔥 Day 17: Buy Strategy (DCA)
**⏰ 2-3 שעות | Output: קנייה חכמה ב-3 שלבים**
**סטטוס:** ⏳ לא התחיל

**מה אתה עושה:**
- [ ] במקום לקנות $100 בבת אחת
- [ ] קנה $30 → חכה 2 דקות → $40 → חכה → $30
- [ ] זה מפחית סיכון

**קוד:**
```python
def buy_token_dca(token_address, total_amount_usd):
    """Buy in 3 stages"""
    stages = [0.3, 0.4, 0.3]  # 30%, 40%, 30%
    
    for i, pct in enumerate(stages):
        amount = total_amount_usd * pct
        
        print(f"Stage {i+1}: Buying ${amount}...")
        execute_swap(SOL, token_address, amount)
        
        if i < len(stages) - 1:  # לא בפעם האחרונה
            print("Waiting 2 minutes...")
            time.sleep(120)
    
    print("✅ DCA Complete!")
```

**✅ בדיקה:** קנה טוקן טסט ב-DCA, ראה 3 טרנזקציות

---

### 🔥 Day 18: Stop Loss (Auto-Sell)
**⏰ 3-4 שעות | Output: מכירה אוטומטית אם ירידה**
**סטטוס:** ⏳ לא התחיל

**מה אתה עושה:**
- [ ] בדוק מחיר כל 30 שניות
- [ ] אם ירד 15% → SELL ALL
- [ ] שמור trade history

**קוד:**
```python
def monitor_position(token_address, entry_price, stop_loss_pct=0.15):
    """Monitor and auto-sell if stop loss hit"""
    
    while True:
        current_price = get_price(token_address)
        
        loss_pct = (entry_price - current_price) / entry_price
        
        if loss_pct >= stop_loss_pct:
            print(f"🚨 STOP LOSS HIT! Loss: {loss_pct*100:.1f}%")
            sell_all(token_address)
            break
        
        time.sleep(30)

# אחרי קנייה:
entry_price = get_price(token_address)
threading.Thread(target=monitor_position, args=(token_address, entry_price)).start()
```

**✅ בדיקה:** קנה טוקן, שנה stop loss ל-5%, ראה שמוכר אוטומטית

---

### 🔥 Day 19: Take Profit (Tiered Selling)
**⏰ 2-3 שעות | Output: מכירה חכמה ב-3 רמות**
**סטטוס:** ⏳ לא התחיל

**מה אתה עושה:**
- [ ] ב-x2 → מכור 30%
- [ ] ב-x5 → מכור עוד 30%
- [ ] השאר 40% עם trailing stop

**קוד:**
```python
def take_profit_strategy(token_address, entry_price):
    """Tiered profit taking"""
    holdings = get_token_balance(token_address)
    
    targets = [
        (2, 0.3),   # x2 → sell 30%
        (5, 0.3),   # x5 → sell 30%
    ]
    
    sold = 0
    
    while sold < 0.6:  # עד ש-60% נמכר
        current_price = get_price(token_address)
        multiple = current_price / entry_price
        
        for target_x, sell_pct in targets:
            if multiple >= target_x and sold < (sell_pct * holdings):
                amount_to_sell = holdings * sell_pct
                sell(token_address, amount_to_sell)
                sold += sell_pct
                print(f"✅ Sold {sell_pct*100}% at {target_x}x")
        
        time.sleep(60)
```

**✅ בדיקה:** סימולציה - אם מחיר x2, ראה שמוכר 30%

---

### 🔥 Day 20: Telegram Trade Controls
**⏰ 3-4 שעות | Output: קנייה/מכירה מטלגרם**  
**סטטוס:** ⏳ לא התחיל

**מה אתה עושה:**
- [ ] בוט שולח: "🔥 BONK2.0 - Score 95/100" עם כפתור "Buy"
- [ ] אתה לוחץ "Buy" → בוט שואל כמה
- [ ] אתה עונה: "50" (= קנה $50)
- [ ] בוט מבצע ומדווח

**קוד:**
```python
from telegram.ext import ConversationHandler

BUY_AMOUNT = range(1)

async def buy_button(update, context):
    """Handle buy button click"""
    query = update.callback_query
    await query.answer()
    
    token_address = query.data.split("_")[1]
    context.user_data['buy_token'] = token_address
    
    await query.edit_message_text(
        "💰 *How much to buy?*\n\nSend amount in USD (e.g., 50)",
        parse_mode=ParseMode.MARKDOWN
    )
    
    return BUY_AMOUNT

async def buy_amount(update, context):
    """Handle buy amount input"""
    try:
        amount = float(update.message.text)
        token_address = context.user_data.get('buy_token')
        
        await update.message.reply_text(f"🤖 Buying ${amount} of {token_address}...")
        
        # בצע קנייה
        buy_token_dca(token_address, amount)
        
        await update.message.reply_text("✅ Buy complete! Monitoring position...")
    
        return ConversationHandler.END
    except ValueError:
        await update.message.reply_text("❌ Invalid amount. Please send a number.")

# Setup conversation handler
buy_handler = ConversationHandler(
    entry_points=[CallbackQueryHandler(buy_button, pattern="^buy_")],
    states={BUY_AMOUNT: [MessageHandler(filters.TEXT, buy_amount)]},
    fallbacks=[CommandHandler("cancel", cancel)]
)
app.add_handler(buy_handler)
```

**✅ בדיקה:** קבל alert, לחץ "Buy", שלח "50", ראה שקונה

---

### 🔥 Day 21: Portfolio Tracker
**⏰ 2-3 שעות | Output: דף Portfolio בדשבורד**
**סטטוס:** ⏳ לא התחיל

**מה אתה עושה:**
- [ ] טבלה עם כל ההחזקות שלך
- [ ] רווח/הפסד בזמן אמת
- [ ] סה"כ P&L

**קוד:**
```sql
CREATE TABLE trades (
  id UUID PRIMARY KEY,
  token_address TEXT,
  type TEXT, -- 'buy' or 'sell'
  amount_usd FLOAT,
  amount_tokens FLOAT,
  price FLOAT,
  executed_at TIMESTAMP DEFAULT NOW()
);
```

```jsx
// Dashboard
function Portfolio() {
  const positions = calculatePositions()  // מכל ה-trades
  
  return (
    <table>
      <thead>
        <tr>
          <th>Token</th>
          <th>Entry</th>
          <th>Current</th>
          <th>P&L</th>
        </tr>
      </thead>
      <tbody>
        {positions.map(p => (
          <tr>
            <td>{p.symbol}</td>
            <td>${p.entry_price}</td>
            <td>${p.current_price}</td>
            <td className={p.pnl > 0 ? 'text-green' : 'text-red'}>
              {p.pnl > 0 ? '+' : ''}{p.pnl}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

**✅ בדיקה:** קנה 2-3 טוקנים, ראה אותם בportfolio

---

## 🎉 WEEK 3 MILESTONE:
**בוט שקונה ומוכר אוטומטית עם stop-loss ו-take-profit!**

---

## 🏆 DAY 21 FINAL CHECK:

**האם יש לך:**
- ✅ Bot שסורק טוקנים חדשים 24/7
- ✅ מערכת ציון (safety + holders + smart money)
- ✅ התראות לווטסאפ על הזדמנויות
- ✅ Dashboard עם real-time data
- ✅ יכולת לקנות/למכור מווטסאפ
- ✅ Stop-loss אוטומטי
- ✅ Take-profit tiered
- ✅ Portfolio tracking

**אם כן → LAUNCH! 🚀**

---

## 💡 Pro Tips:

1. **Cursor יעשה 80% מהעבודה** - תן לו פרומפטים טובים
2. **Claude יעזור עם הלוגיקה** - שאל אותו על אסטרטגיות
3. **התחל עם $10-$20 per trade** - לא $100!
4. **Log הכל** - תצטרך את זה לדיבאג
5. **Backup הכל** - push ל-GitHub כל יום

---

**אלירן, בעוד 21 יום יש לך בוט AI מטורף! 💪**

**Let's go! 🚀**
