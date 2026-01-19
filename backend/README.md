# 🚀 SolanaHunter Backend

**AI-Powered Solana Token Hunter & Trading Bot**

Modern, intelligent bot for discovering and trading Solana tokens with AI assistance.

## 🏗️ Architecture

```
backend/
├── core/           # Core business logic
├── scanner/        # Token discovery & scanning
├── analyzer/       # Token analysis & scoring
├── executor/       # Trade execution
├── communication/  # WhatsApp & notifications
├── services/       # External services (DB, APIs)
├── utils/          # Utilities & helpers
└── api/            # FastAPI endpoints
```

## 🚀 Quick Start

1. **Setup Environment:**
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Run:**
```bash
python main.py
```

## 📚 Documentation

See `hunter docs/` for full documentation.

## 🔒 Security

- ⚠️ Never commit `.env` file
- ⚠️ Use dedicated wallet for bot (not your main wallet)
- ⚠️ Start with small amounts

## 🛠️ Development

```bash
# Format code
black .

# Type check
mypy .

# Run tests
pytest
```
