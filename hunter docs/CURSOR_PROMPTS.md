# 🤖 SolanaHunter - Cursor AI Prompts

**פרומפטים מוכנים לשימוש ב-Cursor בכל שלב**

---

## 🎯 How to Use This Guide

1. פתח את Cursor
2. לחץ Cmd+K (Mac) או Ctrl+K (Windows)
3. העתק את הפרומפט הרלוונטי
4. הדבק ולחץ Enter
5. Cursor יכתוב את הקוד בשבילך!

---

## 📅 Week 1: The Brain

### Day 1: Scanner Setup

**Prompt:**
```
Create a Python script that scans for new Solana tokens using Helius API.

Requirements:
- Use requests library
- RPC endpoint: https://mainnet.helius-rpc.com/?api-key={API_KEY}
- Find tokens created in last 24 hours
- Extract: address, symbol, name, supply
- Print results to console
- Use environment variables for API key
- Add error handling

File: scanner.py
```

---

### Day 2: Contract Safety Checker

**Prompt:**
```
Create a Solana smart contract safety checker.

Create a class ContractChecker with methods:
1. check_ownership_renounced(token_address) - returns bool
2. check_liquidity_locked(token_address) - returns bool  
3. check_mint_authority(token_address) - returns bool
4. calculate_safety_score() - returns 0-100

Each check worth 33 points.
Use Helius RPC for blockchain data.
Add detailed docstrings.

File: services/contract_checker.py
```

---

### Day 3: Holder Analysis

**Prompt:**
```
Create a holder analysis module for Solana tokens.

Requirements:
- Get top 20 token holders using Solscan API
- Calculate percentage held by top 10
- Detect if concentrated (>60% = risky)
- Count total holders
- Return analysis dict with:
  {
    'top_10_pct': float,
    'is_concentrated': bool,
    'holder_count': int,
    'top_holders': list
  }

File: services/holder_analyzer.py
```

---

### Day 4: Scoring Algorithm

**Prompt:**
```
Create a comprehensive token scoring algorithm.

Combine:
1. Safety score (0-60 points)
   - Ownership renounced: 20pts
   - Liquidity locked: 20pts  
   - No mint authority: 20pts

2. Holder score (0-20 points)
   - Not concentrated: 10pts
   - >1000 holders: 10pts

3. Smart money bonus (0-15 points)
   - Each smart wallet: 5pts (max 15)

4. Social score (0-15 points)
   - Trending: 10pts
   - >100 mentions: 5pts

Return final score 0-100.

File: services/scoring.py
```

---

### Day 5: Database Setup

**Prompt:**
```
Create Supabase database integration for SolanaHunter.

Requirements:
- Create Database class with methods:
  - save_token(token_data)
  - get_token(address)
  - update_score(address, score)
  - get_top_tokens(limit)
  - get_tokens_today()

- Use @supabase/supabase-py
- Handle connection errors
- Add logging
- Use environment variables

File: services/database.py
```

---

### Day 6: Smart Money Tracking

**Prompt:**
```
Create a smart money wallet tracker.

Requirements:
- List of 10 known successful wallets (hardcoded)
- Check if any smart wallet holds token
- Count smart money holders
- Track wallet performance:
  - Total trades
  - Win rate
  - Best trade

Return smart_money_count for scoring.

File: services/smart_money.py
```

---

### Day 7: Main Loop

**Prompt:**
```
Create main bot loop that ties everything together.

Flow:
1. Scan for new tokens (every 5 min)
2. For each token:
   - Analyze contract
   - Analyze holders
   - Check smart money
   - Calculate score
   - Save to database
3. If score >= 85: log as high-score token
4. Handle errors gracefully
5. Add comprehensive logging

Use:
- logging module
- infinite while loop
- try/except blocks
- time.sleep(300)

File: main.py
```

---

## 📅 Week 2: The Mouth

### Day 8: WhatsApp Setup

**Prompt:**
```
Create WhatsApp messaging service using Meta Business API.

Class WhatsAppBot with methods:
- send_message(to, text)
- send_template(to, template_name, params)
- mark_as_read(message_id)

Use:
- requests library
- Graph API v18.0
- Environment variables for token and phone_id
- Error handling with retries

File: services/whatsapp.py
```

---

### Day 9: Alert System

**Prompt:**
```
Create alert system that sends WhatsApp notifications.

Function: send_token_alert(token, score)

Alert format:
🚨 HIGH SCORE TOKEN!

Token: $SYMBOL
Score: X/100

✅ Safety: X/100
✅ Holders: X
✅ Smart Money: X

Address: ...
DexScreener: ...

⚡ Act fast!

Send only if score >= 85.

File: services/alerts.py
```

---

### Day 10: Webhook Handler

**Prompt:**
```
Create FastAPI webhook handler for WhatsApp messages.

Endpoint: POST /webhook

Handle incoming messages:
- Parse message content
- Extract sender number and text
- Route commands:
  - "status" → bot stats
  - "check <address>" → analyze token
  - "portfolio" → show positions
  - "help" → command list

Return {"status": "ok"} for webhooks.

File: api/webhook.py
```

---

### Day 11: Rich Messages

**Prompt:**
```
Enhance WhatsApp messages with interactive buttons.

Create function: send_interactive_alert(token, score)

Add buttons:
- "More Info" → detailed analysis
- "Buy" → prepare trade
- "Ignore" → dismiss alert

Use WhatsApp Interactive Messages API.
Handle button clicks in webhook.

File: services/whatsapp.py (update)
```

---

### Day 12: Dashboard Setup

**Prompt:**
```
Create Next.js dashboard for SolanaHunter.

Pages:
1. / - Token list (table)
   - Columns: Symbol, Score, Time, Action
   - Sort by score desc
   - Filter: score > 80

2. /token/[address] - Token details
   - Full analysis
   - Charts
   - Action buttons

Connect to Supabase.
Use TailwindCSS.
Real-time updates.

Files:
- app/page.tsx
- app/token/[address]/page.tsx
```

---

### Day 13: Real-Time Updates

**Prompt:**
```
Add Supabase Realtime to Next.js dashboard.

Requirements:
- Subscribe to 'tokens' table INSERT events
- Update token list without refresh
- Show toast notification for new tokens
- Use React hooks (useState, useEffect)
- Cleanup on unmount

File: app/page.tsx (update)
```

---

### Day 14: Dashboard Polish

**Prompt:**
```
Beautify dashboard with TailwindCSS.

Add:
- Gradient backgrounds
- Hover effects
- Score badges (color-coded)
- Mini price charts (Recharts)
- Filters (score, date, status)
- Dark mode toggle
- Responsive design

Make it look professional and modern.

Files: app/page.tsx, app/components/
```

---

## 📅 Week 3: The Hands

### Day 15: Wallet Integration

**Prompt:**
```
Create Solana wallet manager.

Class WalletManager with methods:
- load_wallet(private_key) - from env
- get_balance() - SOL balance
- get_token_balance(token_mint) - token balance
- get_address() - public key

Use:
- solders.keypair
- solana.rpc.api
- Environment variables
- Error handling

File: services/wallet.py
```

---

### Day 16: Jupiter Integration

**Prompt:**
```
Create Jupiter swap client.

Class JupiterClient with methods:
- get_quote(input_mint, output_mint, amount, slippage)
- execute_swap(quote, wallet_keypair)
- get_token_price(token_mint)

Requirements:
- Use Jupiter API v6
- Handle transaction signing
- Return transaction signature
- Error handling

File: services/jupiter.py
```

---

### Day 17: DCA Buy Strategy

**Prompt:**
```
Create DCA (Dollar Cost Average) buy strategy.

Function: buy_token_dca(token_address, total_usd)

Strategy:
- Split into 3 stages: 30%, 40%, 30%
- Wait 2 minutes between stages
- Use Jupiter for swaps
- Log each stage
- Return average entry price

File: services/executor.py
```

---

### Day 18: Stop Loss Monitor

**Prompt:**
```
Create position monitor with automatic stop-loss.

Class PositionMonitor with:
- monitor_position(token, entry_price, stop_loss_pct)
- Check price every 30 seconds
- If loss >= stop_loss_pct: sell all
- Log to database
- Send WhatsApp alert

Run in background thread.

File: services/monitor.py
```

---

### Day 19: Take Profit Strategy

**Prompt:**
```
Create tiered take-profit system.

Function: take_profit_strategy(token, entry_price)

Targets:
- Sell 30% at x2
- Sell 30% at x5
- Keep 40% with trailing stop

Monitor price continuously.
Execute sells automatically.
Update position in database.

File: services/executor.py (update)
```

---

### Day 20: WhatsApp Trade Controls

**Prompt:**
```
Add trading commands to WhatsApp webhook.

Commands:
- "BUY <amount> [address]" → execute buy
- "SELL [address]" → sell position
- "PORTFOLIO" → show all positions
- "STOP" → pause bot

For each command:
- Validate input
- Execute action
- Confirm via WhatsApp
- Log to database

File: api/webhook.py (update)
```

---

### Day 21: Portfolio Tracker

**Prompt:**
```
Create portfolio tracking page for dashboard.

Show:
- All open positions
- Entry price vs current price
- P&L ($ and %)
- Total portfolio value
- Chart of performance over time

Real-time price updates.
Color-code P&L (green/red).

File: app/portfolio/page.tsx
```

---

## 🔥 Advanced Prompts

### Debugging Help

**Prompt:**
```
I'm getting this error:
[paste error here]

In this code:
[paste code here]

Please:
1. Explain what's wrong
2. Show the fix
3. Explain why it fixes it
```

---

### Code Review

**Prompt:**
```
Review this code and suggest improvements:
[paste code]

Focus on:
- Security issues
- Performance
- Best practices
- Error handling
- Code organization
```

---

### Refactoring

**Prompt:**
```
Refactor this code to be more:
- Modular
- Maintainable
- Efficient
- Pythonic

[paste code]
```

---

### Testing

**Prompt:**
```
Create unit tests for this function:
[paste function]

Use:
- pytest
- Mock external APIs
- Test edge cases
- 90%+ coverage
```

---

## 💡 Pro Tips for Cursor

### 1. Be Specific
❌ "Create a scanner"  
✅ "Create a Python script that scans Solana blockchain for tokens created in the last 24 hours using Helius RPC API"

### 2. Mention Libraries
❌ "Get token price"  
✅ "Get token price using requests library and Birdeye API"

### 3. Specify File Location
❌ "Create the function"  
✅ "Create function in services/analyzer.py"

### 4. Request Error Handling
❌ "Make API call"  
✅ "Make API call with try/except, retry logic, and logging"

### 5. Ask for Comments
Add to any prompt: "Add docstrings and inline comments explaining the logic"

---

## 🎯 Emergency Prompts

### When Stuck:

**Prompt:**
```
I'm trying to [describe goal].
I've tried [what you tried].
I'm getting [the problem].

What should I try next?
```

---

### When Code Doesn't Work:

**Prompt:**
```
This code should [expected behavior]:
[paste code]

But it's [actual behavior]:
[paste error/output]

Debug this step by step.
```

---

### When Need to Learn:

**Prompt:**
```
Explain [concept] like I'm 5.
Then show me a simple example.
Then show me how to use it in my project.
```

---

**Remember:** Cursor is your coding partner. The better your prompts, the better the code! 💪

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-19
