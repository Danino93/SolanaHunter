# 📝 מה להכניס ל-`.env` - ניהול כסף

**הסבר מפורט מה כן ומה לא להכניס**

---

## ✅ מה כן להכניס:

### 1. כתובת יעד (אופציונלי - רק אם אתה רוצה העברות אוטומטיות)
```env
WALLET_DESTINATION_ADDRESS=7nbarFfd1U3H7fPHmt5AMyi5wHm2L3P4BmdeajwxRxqQ
```
**⚠️ החלף ב-כתובת ה-Phantom האישי שלך!**

### 2. Reserve קבוע (מומלץ להשאיר ברירת מחדל)
```env
WALLET_RESERVE_SOL=0.1
```
**זה כבר ברירת מחדל, אבל אתה יכול לשנות אם תרצה**

### 3. Auto-transfer threshold (מומלץ להשאיר 0.0 לבדיקות)
```env
WALLET_AUTO_TRANSFER_THRESHOLD=0.0
```
**0.0 = לא מעביר אוטומטית (רק ידנית דרך `/withdraw`)**

---

## ❌ מה לא להכניס:

### הערות (שורות שמתחילות ב-`#`)
```env
# כתובת יעד (הארנק האישי שלך)  ← לא להכניס!
# Reserve קבוע (תמיד נשאר)  ← לא להכניס!
# Auto-transfer threshold  ← לא להכניס!
```

**הערות הן רק הסבר - לא צריך להכניס אותן!**

---

## 📋 דוגמה מלאה ל-`.env`:

```env
# ============================================
# Wallet
# ============================================
WALLET_PRIVATE_KEY=2DBrF8qNdztGBodq9uczox75o87szpRdiSf8nYbsWGshXp27443QiZ3EDFhJoYXwLUvCiH8pQERx5k1xYf1Eqk6e

# כתובת יעד (אופציונלי)
WALLET_DESTINATION_ADDRESS=7nbarFfd1U3H7fPHmt5AMyi5wHm2L3P4BmdeajwxRxqQ

# Reserve קבוע
WALLET_RESERVE_SOL=0.1

# Auto-transfer threshold (0.0 = לא אוטומטי)
WALLET_AUTO_TRANSFER_THRESHOLD=0.0
```

---

## 🎯 סיכום - מה להכניס:

### חובה:
```env
WALLET_PRIVATE_KEY=your_private_key_here
```

### אופציונלי (אבל מומלץ):
```env
WALLET_DESTINATION_ADDRESS=your_phantom_address_here
WALLET_RESERVE_SOL=0.1
WALLET_AUTO_TRANSFER_THRESHOLD=0.0
```

---

## 💡 המלצות:

### לבדיקות (מומלץ):
```env
WALLET_DESTINATION_ADDRESS=your_phantom_address_here
WALLET_RESERVE_SOL=0.1
WALLET_AUTO_TRANSFER_THRESHOLD=0.0
```
**לא מעביר אוטומטית - אתה שולט מתי להעביר דרך `/withdraw`**

### לייצור (אחרי בדיקות):
```env
WALLET_DESTINATION_ADDRESS=your_phantom_address_here
WALLET_RESERVE_SOL=0.1
WALLET_AUTO_TRANSFER_THRESHOLD=1.0
```
**מעביר אוטומטית אם יש יותר מ-1 SOL**

---

**פשוט וקל!** 🚀
