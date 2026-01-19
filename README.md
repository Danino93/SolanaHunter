# 🚀 SolanaHunter

**AI-Powered Solana Token Hunter & Trading Bot**

An intelligent, autonomous bot that scans, analyzes, and trades Solana tokens using advanced AI algorithms and smart money tracking.

---

## ✨ Features

### 🧠 The Brain (Week 1)
- ✅ **Token Scanner** - Discovers new tokens from multiple sources
- ✅ **Contract Safety Checker** - Analyzes smart contract security
- ✅ **Holder Analysis** - Detects concentration risks
- ✅ **Smart Money Auto-Discovery** - Automatically identifies successful wallets
- ✅ **Scoring Engine** - Comprehensive 0-100 scoring system

### 💬 The Mouth (Week 2)
- 🔄 **Telegram Bot** - Real-time alerts and two-way communication
- 🔄 **Rich Messages** - Interactive buttons and formatted alerts
- 🔄 **Dashboard** - Beautiful web interface for monitoring

### 🤖 The Hands (Week 3)
- 🔄 **Automated Trading** - DCA entry, tiered profit taking
- 🔄 **Risk Management** - Dynamic stop-loss, emergency exits
- 🔄 **Portfolio Tracking** - Real-time position monitoring

---

## 🛠️ Tech Stack

- **Backend:** Python 3.11+, FastAPI, AsyncIO
- **Blockchain:** Solana Web3.py, Solders, Helius RPC
- **DEX:** Jupiter API
- **Communication:** Telegram Bot API
- **Database:** Supabase (PostgreSQL)
- **Frontend:** Next.js 14, React, TailwindCSS
- **Deployment:** Railway (backend), Vercel (frontend)

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Helius API Key
- Telegram Bot Token (optional, for Week 2)

### Installation

```bash
# Clone repository
git clone https://github.com/Danino93/SolanaHunter.git
cd SolanaHunter

# Setup backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure
cp env.example .env
# Edit .env with your API keys

# Verify setup
python verify_setup.py

# Run bot
python main.py
```

See [QUICKSTART.md](backend/QUICKSTART.md) for detailed instructions.

---

## 📊 How It Works

### 1. Token Discovery
The bot continuously scans for new Solana tokens from:
- DexScreener API
- Helius RPC
- Real-time blockchain monitoring

### 2. Analysis Pipeline
Each token goes through comprehensive analysis:
- **Contract Safety** (0-60 points)
  - Ownership renounced?
  - Liquidity locked?
  - Mint authority disabled?

- **Holder Distribution** (0-20 points)
  - Top 10% concentration
  - Total holder count
  - Distribution risk

- **Smart Money** (0-15 points)
  - Auto-discovered successful wallets
  - Early buyer detection
  - Track record analysis

### 3. Scoring & Alerts
- Final score: 0-100
- Grade system: A+, A, B+, B, C+, C, F
- Automatic alerts for 85+ scores

### 4. Smart Money Auto-Discovery
The bot automatically learns from successful tokens:
- Analyzes historical winners (BONK, WIF, etc.)
- Identifies first buyers
- Tracks performance
- Builds smart wallet database

---

## 📁 Project Structure

```
SolanaHunter/
├── backend/
│   ├── analyzer/          # Token analysis modules
│   ├── scanner/           # Token discovery
│   ├── core/              # Configuration
│   ├── utils/             # Utilities
│   └── main.py            # Entry point
├── hunter docs/           # Documentation
├── PROGRESS_LOG.md        # Daily progress
└── YOUR_TODO.md           # Personal tasks
```

---

## 📚 Documentation

- [Master Plan](hunter%20docs/MASTER_PLAN.md) - Overall vision
- [Technical Architecture](hunter%20docs/TECHNICAL_ARCHITECTURE.md) - System design
- [Trading Strategy](hunter%20docs/TRADING_STRATEGY.md) - Trading logic
- [Daily Tasks](hunter%20docs/DAILY_TASKS.md) - 21-day roadmap
- [API Integration](hunter%20docs/API_INTEGRATION.md) - API guides
- [Setup Guide](hunter%20docs/SETUP_GUIDE.md) - Installation

---

## 🔒 Security

⚠️ **Important:**
- Use a **dedicated bot wallet** (not your main wallet!)
- Never commit `.env` file
- Keep private keys secure
- Start with small amounts for testing

---

## 📈 Roadmap

### ✅ Week 1: The Brain (Days 1-7)
- [x] Token Scanner
- [x] Contract Safety Checker
- [x] Holder Analysis
- [x] Smart Money Auto-Discovery
- [x] Scoring Engine

### 🔄 Week 2: The Mouth (Days 8-14)
- [ ] Telegram Bot Setup
- [ ] Alert System
- [ ] Two-Way Chat
- [ ] Rich Messages
- [ ] Dashboard

### 🔄 Week 3: The Hands (Days 15-21)
- [ ] Wallet Integration
- [ ] Jupiter Swaps
- [ ] Trading Strategies
- [ ] Portfolio Tracker

---

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

---

## 📝 License

Private project - All rights reserved

---

## 🙏 Acknowledgments

- Solana ecosystem
- Jupiter DEX
- Helius RPC
- All the smart money wallets we learn from

---

**Built with ❤️ for the Solana ecosystem**

**Status:** 🟢 Week 1 Complete | 🔄 Week 2 In Progress
