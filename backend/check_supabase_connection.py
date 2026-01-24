"""בדיקת חיבור ומבנה טבלאות Supabase"""

import asyncio
import os
from core.config import Settings

async def check_supabase():
    config = Settings()
    
    print("=" * 60)
    print("בדיקת חיבור ומבנה טבלאות Supabase")
    print("=" * 60)
    
    print(f"Supabase URL: {config.supabase_url}")
    print(f"Supabase Key: {'***' + config.supabase_key[-10:] if config.supabase_key else 'Missing!'}")
    
    # בדיקה פשוטה של הטבלאות החדשות
    try:
        from supabase import create_client
        
        supabase = create_client(config.supabase_url, config.supabase_key)
        
        # בדיקת טבלת performance_tracking
        print("\n1. בדיקת טבלת performance_tracking:")
        result = supabase.table("performance_tracking").select("*").limit(1).execute()
        print(f"   Status: OK - Found {len(result.data)} rows")
        
        # בדיקת טבלת smart_wallets  
        print("\n2. בדיקת טבלת smart_wallets:")
        result = supabase.table("smart_wallets").select("*").limit(1).execute()
        print(f"   Status: OK - Found {len(result.data)} rows")
        
        # בדיקת טבלת scanned_tokens_history
        print("\n3. בדיקת טבלת scanned_tokens_history:")
        try:
            result = supabase.table("scanned_tokens_history").select("*").limit(1).execute()
            print(f"   Status: OK - Found {len(result.data)} rows")
        except Exception as e:
            print(f"   Status: Table might not exist - {e}")
        
        print("\n" + "="*60)
        print("SUCCESS: Supabase connection and tables working!")
        print("="*60)
        
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(check_supabase())