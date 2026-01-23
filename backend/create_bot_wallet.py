"""
יצירת ארנק בוט חדש בקוד
זה יוצר Keypair חדש ומדפיס את ה-Private Key ל-.env

מה הקובץ הזה עושה:
-------------------
יוצר ארנק חדש בקוד (לא מ-Phantom) ומדפיס את ה-Private Key.

שימוש:
python create_bot_wallet.py

חשוב:
- זה יוצר ארנק חדש לחלוטין
- שמור את ה-Private Key במקום בטוח!
- שלח כסף לכתובת החדשה מ-Phantom שלך
"""

import sys
from solders.keypair import Keypair
from solders.pubkey import Pubkey

# Fix Windows encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def create_bot_wallet():
    """יצירת ארנק בוט חדש"""
    
    print("=" * 60)
    print("יצירת ארנק בוט חדש")
    print("=" * 60)
    print()
    
    # יצירת Keypair חדש
    keypair = Keypair()
    pubkey = keypair.pubkey()
    
    # המרה ל-Base58 (הפורמט ש-Phantom משתמש בו)
    private_key_base58 = str(keypair)
    
    # כתובת הארנק (Public Key)
    wallet_address = str(pubkey)
    
    print("[OK] ארנק חדש נוצר בהצלחה!")
    print()
    print("=" * 60)
    print("פרטי הארנק:")
    print("=" * 60)
    print(f"כתובת (Address): {wallet_address}")
    print(f"Private Key (Base58): {private_key_base58}")
    print()
    print("=" * 60)
    print("מה לעשות עכשיו:")
    print("=" * 60)
    print()
    print("1. העתק את ה-Private Key למעלה")
    print("2. פתח את backend/.env")
    print("3. מצא את השורה: WALLET_PRIVATE_KEY=your_private_key_base58_here")
    print("4. החלף ב-Private Key שהעתקת:")
    print(f"   WALLET_PRIVATE_KEY={private_key_base58}")
    print()
    print("5. שמור את הקובץ (Ctrl+S)")
    print()
    print("6. שלח כסף לכתובת הזו מ-Phantom שלך:")
    print(f"   {wallet_address}")
    print("   (0.5-1 SOL לבדיקות)")
    print()
    print("7. בדוק עם: python verify_setup.py")
    print()
    print("=" * 60)
    print("אבטחה:")
    print("=" * 60)
    print("[!] שמור את ה-Private Key במקום בטוח!")
    print("[!] שלח רק סכומים קטנים ($10-20) לבדיקות")
    print("[!] זה ארנק ייעודי לבוט בלבד!")
    print()
    
    return {
        "address": wallet_address,
        "private_key": private_key_base58
    }

if __name__ == "__main__":
    try:
        create_bot_wallet()
    except Exception as e:
        print(f"[ERROR] שגיאה: {e}")
        print()
        print("ודא שיש לך את כל ה-dependencies:")
        print("pip install solana solders")
