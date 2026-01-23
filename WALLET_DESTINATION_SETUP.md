# 💰 הגדרת כתובת יעד להעברת רווחים

**איך הבוט יודע לאיפה להעביר כסף אחרי מכירה?**

---

## 🎯 מה זה?

כשהבוט מוכר טוקן (דרך `/sell` או אוטומטית), הוא מקבל SOL בארנק הבוט.

**עכשיו אפשר להגדיר כתובת יעד** - הבוט יעביר את ה-SOL ישירות לכתובת שלך ב-Phantom!

---

## 📝 איך להגדיר?

### 1. פתח את `backend/.env`

### 2. הוסף את השורה הזו:

```env
WALLET_DESTINATION_ADDRESS=YourPhantomAddressHere
```

**דוגמה:**
```env
WALLET_DESTINATION_ADDRESS=7nbarFfd1U3H7fPHmt5AMyi5wHm2L3P4BmdeajwxRxqQ
```

**⚠️ חשוב:**
- זה הכתובת של ה-Phantom האישי שלך (לא ארנק הבוט!)
- זה אופציונלי - אם לא מוגדר, הכסף נשאר בארנק הבוט
- הבוט ישמור 0.01 SOL בארנק הבוט (ל-fees)

---

## 🔍 איך למצוא את הכתובת שלי?

### דרך Phantom:

1. **פתח את Phantom** (טלפון/דסקטופ)
2. **לחץ על הארנק שלך** (בחלק העליון)
3. **העתק את הכתובת** (Base58 string, 44 תווים)

**או:**

1. **לחץ על "Receive"** / "קבל"
2. **העתק את הכתובת** שמופיעה

---

## ✅ איך זה עובד?

### כשהבוט מוכר טוקן:

1. **מבצע swap:** Token → SOL
2. **מקבל SOL** בארנק הבוט
3. **אם `WALLET_DESTINATION_ADDRESS` מוגדר:**
   - **מעביר את כל ה-SOL** לכתובת היעד
   - **שומר 0.01 SOL** בארנק הבוט (ל-fees)
4. **אם לא מוגדר:**
   - **הכסף נשאר** בארנק הבוט

---

## 📋 דוגמה:

### לפני:
```env
WALLET_PRIVATE_KEY=2DBrF8qNdztGBodq9uczox75o87szpRdiSf8nYbsWGshXp27443QiZ3EDFhJoYXwLUvCiH8pQERx5k1xYf1Eqk6e
```

### אחרי:
```env
WALLET_PRIVATE_KEY=2DBrF8qNdztGBodq9uczox75o87szpRdiSf8nYbsWGshXp27443QiZ3EDFhJoYXwLUvCiH8pQERx5k1xYf1Eqk6e
WALLET_DESTINATION_ADDRESS=YourPhantomAddressHere
```

---

## 🎯 מתי זה קורה?

הבוט מעביר כסף לכתובת היעד ב:

1. **מכירה ידנית** (`/sell` בטלגרם)
2. **Stop Loss** (כשהמחיר יורד -15%)
3. **Time Limit** (אחרי 7 ימים)
4. **Take Profit** (כשמגיע ל-x2 או x5)
5. **Trailing Stop** (כשהמחיר יורד)
6. **Emergency Exit** (Rug Pull)

---

## ⚠️ הערות חשובות:

### 1. שמירת Reserve:
- הבוט **תמיד שומר 0.01 SOL** בארנק הבוט
- זה ל-fees של טרנזקציות עתידיות
- אם יש פחות מ-0.01 SOL, לא יעביר כלום

### 2. אם לא מוגדר:
- אם `WALLET_DESTINATION_ADDRESS` לא מוגדר
- הכסף **נשאר בארנק הבוט**
- אתה יכול להעביר ידנית דרך Phantom

### 3. בטיחות:
- ✅ זה רק **כתובת** (public key)
- ✅ **לא צריך** private key
- ✅ **לא מסוכן** לחשוף את זה
- ✅ זה כמו מספר חשבון בנק

---

## 🔄 איך להוציא כסף אם לא מוגדר?

### דרך 1: דרך Phantom (ישירות)

**⚠️ זה לא עובד!** כי הארנק הבוט לא ב-Phantom!

### דרך 2: דרך הבוט

1. **שלח בטלגרם:** `/portfolio`
2. **תראה את כל הפוזיציות**
3. **שלח:** `/sell <token_address>`
4. **הבוט ימכור** ויעביר (אם מוגדר כתובת יעד)

### דרך 3: הגדר כתובת יעד

**פשוט הוסף ל-`.env`:**
```env
WALLET_DESTINATION_ADDRESS=YourPhantomAddressHere
```

**וזה הכל!** הבוט יעביר אוטומטית! 🚀

---

## 📋 סיכום:

### מה לעשות:

1. **פתח את Phantom**
2. **העתק את הכתובת שלך**
3. **פתח את `backend/.env`**
4. **הוסף:**
   ```env
   WALLET_DESTINATION_ADDRESS=YourPhantomAddressHere
   ```
5. **שמור את הקובץ**

**זה הכל!** עכשיו כל פעם שהבוט מוכר טוקן, הוא יעביר את ה-SOL ישירות לכתובת שלך! 🎉

---

**פשוט וקל!** 🚀
