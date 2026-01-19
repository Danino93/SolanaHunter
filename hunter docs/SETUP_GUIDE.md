# 🛠️ SolanaHunter - Setup Guide

**הוראות התקנה מלאות - מאפס ועד בוט רץ**

---

## 📋 Prerequisites

לפני שמתחילים, תוודא שיש לך:
- [x] מחשב (Windows/Mac/Linux)
- [x] חיבור אינטרנט יציב
- [x] כרטיס אשראי (לשירותים בתשלום, אם יהיו)
- [x] ארנק Phantom עם קצת SOL ($50-100 לבוט)

---

## 🎯 Phase 1: Development Environment

### Step 1: Install Python 3.11+

**Mac:**
```bash
# התקן Homebrew אם אין לך
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# התקן Python
brew install python@3.11
python3 --version  # verify: should show 3.11+
```

**Windows:**
1. לך ל-https://www.python.org/downloads/
2. הורד Python 3.11+ installer
3. **חשוב:** סמן "Add Python to PATH"
4. התקן
5. פתח CMD ובדוק: `python --version`

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3.11 python3-pip
python3 --version
```

---

### Step 2: Install Cursor IDE

1. לך ל-https://cursor.sh/
2. הורד ל-OS שלך
3. התקן
4. פתח Cursor
5. התחבר עם GitHub account שלך

**Setup Cursor:**
- Settings → Extensions → Install "Python" extension
- Settings → AI → Enable Claude integration
- Settings → Formatting → Enable "Format on Save"

---

### Step 3: Install Git

**Mac:**
```bash
brew install git
```

**Windows:**
1. הורד מ-https://git-scm.com/download/win
2. התקן עם ברירות מחדל

**Linux:**
```bash
sudo apt install git
```

**Configure Git:**
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 🔧 Phase 2: Create Project

### Step 1: Create GitHub Repository

1. לך ל-https://github.com/new
2. Repository name: `solanahunter`
3. Private: ✅ (חשוב!)
4. Create repository

**Clone to your machine:**
```bash
git clone https://github.com/YOUR_USERNAME/solanahunter.git
cd solanahunter
```

---

### Step 2: Create Virtual Environment

```bash
# צור virtual environment
python3 -m venv venv

# הפעל אותו
# Mac/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate

# אמור לראות (venv) בתחילת השורה
```

---

### Step 3: Create Project Structure

```bash
# צור תיקיות
mkdir -p services utils config

# צור קבצים
touch main.py
touch requirements.txt
touch .env
touch .gitignore
touch README.md

# Structure אמור להיראות ככה:
# solanahunter/
# ├── .env
# ├── .gitignore
# ├── main.py
# ├── requirements.txt
# ├── README.md
# ├── config/
# ├── services/
# └── utils/
```

**Create .gitignore:**
```bash
cat > .gitignore << EOF
venv/
__pycache__/
*.pyc
.env
*.log
.DS_Store
EOF
```

---

## 🌐 Phase 3: Setup External Services

### Step 1: Helius (Solana RPC)

1. **Sign up:**
   - לך ל-https://www.helius.dev/
   - לחץ "Get Started"
   - הירשם (GitHub או Google)

2. **Create API Key:**
   - Dashboard → Create New API Key
   - Name: "SolanaHunter"
   - Network: **Mainnet** (לא Devnet!)
   - Copy API Key

3. **Add to .env:**
   ```bash
   echo "HELIUS_API_KEY=your_api_key_here" >> .env
   ```

4. **Test:**
   ```python
   # test_helius.py
   import os
   import requests
   from dotenv import load_dotenv
   
   load_dotenv()
   api_key = os.getenv('HELIUS_API_KEY')
   
   url = f"https://mainnet.helius-rpc.com/?api-key={api_key}"
   response = requests.post(url, json={
       "jsonrpc": "2.0",
       "id": 1,
       "method": "getHealth"
   })
   
   print(response.json())  # should print: {'result': 'ok'}
   ```

**Free Tier Limits:**
- 250,000 requests/day
- עבורנו: מספיק בהתחלה!

---

### Step 2: Supabase (Database)

1. **Sign up:**
   - לך ל-https://supabase.com/
   - "Start your project"
   - הירשם (GitHub)

2. **Create Project:**
   - New Project
   - Name: `solanahunter`
   - Database Password: **שמור סיסמה חזקה!**
   - Region: בחר קרוב אליך (Europe West)
   - Create Project (לוקח ~2 דקות)

3. **Get Connection Details:**
   - Settings → API
   - Copy:
     - Project URL
     - Project API Key (anon, public)

4. **Add to .env:**
   ```bash
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

5. **Create Tables:**
   - SQL Editor → New Query
   - Copy-paste from TECHNICAL_ARCHITECTURE.md
   - Run Query

6. **Test:**
   ```python
   # test_supabase.py
   from supabase import create_client
   import os
   from dotenv import load_dotenv
   
   load_dotenv()
   url = os.getenv('SUPABASE_URL')
   key = os.getenv('SUPABASE_KEY')
   
   supabase = create_client(url, key)
   
   # Test insert
   data = supabase.table('tokens').insert({
       'address': 'test123',
       'symbol': 'TEST',
       'name': 'Test Token',
       'final_score': 50
   }).execute()
   
   print(data)  # should work!
   
   # Clean up
   supabase.table('tokens').delete().eq('address', 'test123').execute()
   ```

---

### Step 3: Railway (Hosting)

1. **Sign up:**
   - לך ל-https://railway.app/
   - "Start a New Project"
   - הירשם עם GitHub

2. **Create Project:**
   - New Project
   - Deploy from GitHub repo
   - Select: `solanahunter`
   - Deploy

3. **Add Environment Variables:**
   - Project → Variables
   - Add:
     - `HELIUS_API_KEY`
     - `SUPABASE_URL`
     - `SUPABASE_KEY`
   - (העתק מ-.env שלך)

4. **Configure:**
   - Settings → Deploy
   - Start Command: `python main.py`
   - Python Version: 3.11

**Free Tier:**
- $5 credit (מספיק ל-~10 ימים)
- אחרי זה: $5-10/month

---

### Step 4: WhatsApp Business API

1. **Create Meta Business Account:**
   - לך ל-https://business.facebook.com/
   - Create Account
   - Business Name: "SolanaHunter" (או שם אחר)

2. **Setup WhatsApp:**
   - Business Settings
   - WhatsApp → Add
   - Create WhatsApp Business Account
   - Phone Number: הזן מספר (יכול להיות שלך)
   - Verify Number (SMS)

3. **Get API Access:**
   - WhatsApp → API Setup
   - Create Access Token (temp token, 24h)
   - Copy:
     - Phone Number ID
     - Access Token

4. **Add to .env:**
   ```bash
   WHATSAPP_PHONE_ID=123456789
   WHATSAPP_TOKEN=EAAxxxxxxx
   YOUR_PHONE_NUMBER=972xxxxxxxxx
   ```

5. **Test:**
   ```python
   # test_whatsapp.py
   import requests
   import os
   from dotenv import load_dotenv
   
   load_dotenv()
   
   phone_id = os.getenv('WHATSAPP_PHONE_ID')
   token = os.getenv('WHATSAPP_TOKEN')
   to = os.getenv('YOUR_PHONE_NUMBER')
   
   url = f"https://graph.facebook.com/v18.0/{phone_id}/messages"
   
   headers = {
       "Authorization": f"Bearer {token}",
       "Content-Type": "application/json"
   }
   
   data = {
       "messaging_product": "whatsapp",
       "to": to,
       "type": "text",
       "text": {
           "body": "🚀 Test from SolanaHunter!"
       }
   }
   
   response = requests.post(url, headers=headers, json=data)
   print(response.json())
   
   # check your phone - should receive message!
   ```

**Important Notes:**
- Temp token expires in 24h
- Later, create permanent token (Day 8)
- Free tier: 1000 messages/month

---

### Step 5: Phantom Wallet Setup

**⚠️ CRITICAL: Create DEDICATED Wallet for Bot**

1. **Install Phantom:**
   - Chrome: https://phantom.app/download
   - Install extension

2. **Create NEW Wallet:**
   - Open Phantom
   - "Create New Wallet"
   - **Save secret phrase securely!**
   - Password protect

3. **Fund Wallet:**
   - Send 0.5-1 SOL to new wallet
   - (for gas fees + testing)

4. **Export Private Key:**
   - Settings → Security & Privacy
   - Export Private Key
   - Enter password
   - **Copy private key**

5. **Add to .env:**
   ```bash
   WALLET_PRIVATE_KEY=your_private_key_base58
   ```

6. **Test:**
   ```python
   # test_wallet.py
   from solders.keypair import Keypair
   from solana.rpc.api import Client
   import os
   from dotenv import load_dotenv
   
   load_dotenv()
   
   private_key = os.getenv('WALLET_PRIVATE_KEY')
   keypair = Keypair.from_base58_string(private_key)
   
   client = Client("https://api.mainnet-beta.solana.com")
   
   balance = client.get_balance(keypair.pubkey())
   sol_balance = balance.value / 1e9
   
   print(f"Wallet Address: {keypair.pubkey()}")
   print(f"Balance: {sol_balance} SOL")
   ```

**🔒 Security Checklist:**
- ✅ Never commit .env to git
- ✅ Different wallet from personal
- ✅ Start with small amount
- ✅ Backup private key offline

---

## 📦 Phase 4: Install Dependencies

### Create requirements.txt:

```txt
# Core
python-dotenv==1.0.0
requests==2.31.0

# Solana
solana==0.30.2
solders==0.18.1

# Jupiter
jupiter-python-sdk==1.0.0

# Database
supabase==2.0.0

# Web Framework
fastapi==0.104.1
uvicorn==0.24.0

# Data Processing
pandas==2.1.3

# Utilities
python-dateutil==2.8.2
pytz==2023.3
```

### Install:

```bash
pip install -r requirements.txt
```

---

## ✅ Phase 5: Verify Everything Works

### Create verification script:

```python
# verify_setup.py
import os
from dotenv import load_dotenv

load_dotenv()

print("🔍 Verifying Setup...\n")

# Check environment variables
required_vars = [
    'HELIUS_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'WHATSAPP_PHONE_ID',
    'WHATSAPP_TOKEN',
    'YOUR_PHONE_NUMBER',
    'WALLET_PRIVATE_KEY'
]

missing = []
for var in required_vars:
    if os.getenv(var):
        print(f"✅ {var}")
    else:
        print(f"❌ {var} - MISSING!")
        missing.append(var)

if missing:
    print(f"\n⚠️ Missing variables: {', '.join(missing)}")
    print("Add them to .env file")
else:
    print("\n🎉 All environment variables set!")

# Test Helius
print("\n📡 Testing Helius...")
try:
    import requests
    api_key = os.getenv('HELIUS_API_KEY')
    url = f"https://mainnet.helius-rpc.com/?api-key={api_key}"
    response = requests.post(url, json={
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getHealth"
    })
    if response.json().get('result') == 'ok':
        print("✅ Helius connected")
    else:
        print("❌ Helius connection failed")
except Exception as e:
    print(f"❌ Helius error: {e}")

# Test Supabase
print("\n🗄️ Testing Supabase...")
try:
    from supabase import create_client
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_KEY')
    supabase = create_client(url, key)
    data = supabase.table('tokens').select('*').limit(1).execute()
    print("✅ Supabase connected")
except Exception as e:
    print(f"❌ Supabase error: {e}")

# Test Wallet
print("\n👛 Testing Wallet...")
try:
    from solders.keypair import Keypair
    from solana.rpc.api import Client
    
    private_key = os.getenv('WALLET_PRIVATE_KEY')
    keypair = Keypair.from_base58_string(private_key)
    
    client = Client("https://api.mainnet-beta.solana.com")
    balance = client.get_balance(keypair.pubkey())
    sol_balance = balance.value / 1e9
    
    print(f"✅ Wallet loaded")
    print(f"   Address: {keypair.pubkey()}")
    print(f"   Balance: {sol_balance} SOL")
    
    if sol_balance < 0.1:
        print("⚠️ Low balance! Add more SOL")
except Exception as e:
    print(f"❌ Wallet error: {e}")

print("\n" + "="*50)
print("Setup verification complete!")
print("="*50)
```

### Run verification:

```bash
python verify_setup.py
```

**Expected output:**
```
🔍 Verifying Setup...

✅ HELIUS_API_KEY
✅ SUPABASE_URL
✅ SUPABASE_KEY
✅ WHATSAPP_PHONE_ID
✅ WHATSAPP_TOKEN
✅ YOUR_PHONE_NUMBER
✅ WALLET_PRIVATE_KEY

🎉 All environment variables set!

📡 Testing Helius...
✅ Helius connected

🗄️ Testing Supabase...
✅ Supabase connected

👛 Testing Wallet...
✅ Wallet loaded
   Address: Abc123...
   Balance: 0.5 SOL

==================================================
Setup verification complete!
==================================================
```

---

## 🚀 Phase 6: First Commit

```bash
git add .
git commit -m "Initial setup complete"
git push origin main
```

---

## 🎯 You're Ready!

**Setup Complete! ✅**

Now you can:
- Start Day 1 from DAILY_TASKS.md
- Use Cursor to write code
- Ask Claude for help anytime

---

## 🆘 Troubleshooting

### Problem: Python not found
```bash
# Mac/Linux
which python3

# Windows
where python
```
→ Make sure Python is in PATH

### Problem: pip install fails
```bash
# Upgrade pip
pip install --upgrade pip

# If still fails, try
pip install --no-cache-dir -r requirements.txt
```

### Problem: Helius API not working
- Check API key copied correctly (no spaces)
- Verify using Mainnet, not Devnet
- Check quota: Dashboard → Usage

### Problem: Supabase connection fails
- Check URL format: https://xxxxx.supabase.co
- Use anon/public key, not service_role key
- Verify tables created

### Problem: WhatsApp not sending
- Check phone number format: 972xxxxxxxxx (no +, no -)
- Temp token expires in 24h
- Verify phone number

### Problem: Wallet balance 0
- Send SOL from exchange/other wallet
- Check correct address
- Allow ~30 seconds for confirmation

---

## 📞 Need Help?

1. Check error message carefully
2. Search error in Google
3. Ask in Discord/Telegram communities
4. Ask Claude!

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-19

**Ready to start Day 1? Let's go! 🚀**
