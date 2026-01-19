# 🚀 Quick Start Guide

## התקנה מהירה (5 דקות)

### 1. התקן Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. הגדר Environment Variables
```bash
# העתק את הקובץ
copy env.example .env  # Windows
# או
cp env.example .env   # Mac/Linux

# ערוך את .env והוסף את ה-API keys שלך
```

### 3. בדוק שהכל עובד
```bash
python verify_setup.py
```

### 4. הרץ את הבוט!
```bash
python main.py
```

---

## מה צריך להגדיר ב-.env?

### חובה (להתחלה):
- `HELIUS_API_KEY` - הירשם ב-https://helius.dev (חינם)

### אופציונלי (לימים הבאים):
- `SUPABASE_URL` + `SUPABASE_KEY` - Day 5
- `WHATSAPP_PHONE_ID` + `WHATSAPP_TOKEN` - Day 8
- `WALLET_PRIVATE_KEY` - Day 15

---

## מה הבוט עושה עכשיו?

✅ **Day 1 - Scanner:**
- סורק טוקנים חדשים מ-DexScreener
- מציג טבלה יפה עם כל הטוקנים
- רץ בלולאה אינסופית (כל 5 דקות)

⏳ **ימים הבאים:**
- Day 2: בדיקות אבטחה
- Day 3: ניתוח מחזיקים
- Day 4: מערכת ציון
- Day 5: Database
- Day 6: Smart Money
- Day 7: Main Loop מלא

---

## בעיות?

1. **"Module not found"** → הרץ `pip install -r requirements.txt`
2. **"Config error"** → בדוק ש-.env קיים ומוגדר נכון
3. **"API error"** → בדוק שה-API key נכון

---

**מוכן? בואו נתחיל! 🚀**
