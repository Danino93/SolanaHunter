"""
DexScreener API Routes - אינטגרציה עם DexScreener לדשבורד

📋 מה הקובץ הזה עושה:
-------------------
מספק endpoints להצגת נתונים מ-DexScreener בדשבורד:
- GET /api/dexscreener/trending - טוקנים טרנדיים
- GET /api/dexscreener/search?q={query} - חיפוש טוקנים
- GET /api/dexscreener/token/{address} - פרטי טוקן
- GET /api/dexscreener/new - טוקנים חדשים (24h)
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
import httpx
from utils.logger import get_logger

logger = get_logger("dexscreener")

router = APIRouter()

DEXSCREENER_BASE = "https://api.dexscreener.com/latest/dex"
DEXSCREENER_API_BASE = "https://api.dexscreener.com"


@router.get("/trending")
async def get_trending_tokens(
    chain: str = Query("solana", description="Blockchain (solana, ethereum, etc.)"),
    limit: int = Query(20, ge=1, le=100, description="Number of tokens to return")
):
    """
    קבל טוקנים טרנדיים מ-DexScreener
    
    Uses search endpoint with popular token symbols to get diverse pairs,
    then filters by chain and sorts by volume (trending = high volume).
    
    Note: DexScreener doesn't have a direct trending endpoint, so we use
    search with popular symbols and sort by volume.
    
    Returns:
        List of trending tokens with price, volume, and change data
    """
    try:
        all_pairs = []
        url = f"{DEXSCREENER_BASE}/search"
        
        # Use multiple search strategies to get diverse trending tokens
        # Strategy 1: Search popular Solana tokens to get many pairs
        # Strategy 2: Search with common pair patterns
        if chain == "solana":
            # Popular Solana tokens that will return many diverse pairs
            search_queries = [
                "SOL/USDC",  # Most popular pair - will return many results
                "SOL/USDT",  # Second most popular
                "BONK",      # Popular meme coin
                "WIF",       # Popular meme coin
                "POPCAT",    # Popular meme coin
            ]
        else:
            search_queries = [
                "ETH/USDC",
                "ETH/USDT",
            ]
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            for query in search_queries:
                try:
                    response = await client.get(url, params={"q": query})
                    response.raise_for_status()
                    data = response.json()
                    pairs = data.get("pairs", [])
                    
                    # Filter by chain - ONLY Solana (or specified chain)
                    chain_pairs = [p for p in pairs if p.get("chainId") == chain]
                    all_pairs.extend(chain_pairs)
                    
                    # If we have enough pairs, break early
                    if len(all_pairs) >= limit * 5:  # Get more to filter better
                        break
                except Exception as e:
                    logger.warning(f"⚠️ Search query '{query}' failed: {e}")
                    continue
        
        # Remove duplicates by pair address
        seen_addresses = set()
        unique_pairs = []
        for pair in all_pairs:
            pair_addr = pair.get("pairAddress")
            if pair_addr and pair_addr not in seen_addresses:
                seen_addresses.add(pair_addr)
                unique_pairs.append(pair)
        
        # Sort by volume 24h (trending = high volume)
        sorted_pairs = sorted(
            unique_pairs,
            key=lambda p: float(p.get("volume", {}).get("h24", 0) or 0),
            reverse=True
        )
        
        # Take top N
        trending = sorted_pairs[:limit]
        
        # Format the data
        formatted = []
        for pair in trending:
            base_token = pair.get("baseToken", {})
            
            price_usd = float(pair.get("priceUsd", 0) or 0)
            volume_24h = float(pair.get("volume", {}).get("h24", 0) or 0)
            price_change_24h = float(pair.get("priceChange", {}).get("h24", 0) or 0)
            liquidity = float(pair.get("liquidity", {}).get("usd", 0) or 0)
            
            formatted.append({
                "pair_address": pair.get("pairAddress"),
                "token_address": base_token.get("address"),
                "symbol": base_token.get("symbol"),
                "name": base_token.get("name"),
                "price_usd": price_usd,
                "volume_24h": volume_24h,
                "price_change_24h": price_change_24h,
                "price_change_24h_pct": price_change_24h,
                "liquidity_usd": liquidity,
                "dex": pair.get("dexId"),
                "created_at": pair.get("pairCreatedAt"),
                "url": f"https://dexscreener.com/{chain}/{pair.get('pairAddress')}",
            })
        
        return {
            "tokens": formatted,
            "total": len(formatted),
            "chain": chain,
        }
    
    except httpx.HTTPError as e:
        logger.error(f"❌ HTTP error fetching trending tokens: {e}")
        raise HTTPException(status_code=500, detail=f"אופס, שגיאה בקבלת טוקנים טרנדיים: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Error fetching trending tokens: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"אופס, שגיאה: {str(e)}")


@router.get("/search")
async def search_tokens(
    q: str = Query(..., description="Search query (symbol or name)"),
    chain: str = Query("solana", description="Blockchain")
):
    """
    חיפוש טוקנים ב-DexScreener
    
    Args:
        q: שאילתת חיפוש (סימבול או שם)
        chain: blockchain (solana, ethereum, וכו')
    
    Returns:
        List of matching tokens
    """
    try:
        url = f"{DEXSCREENER_BASE}/search"
        params = {"q": q}
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
        
        pairs = data.get("pairs", [])
        
        # סינון לפי chain (אם צוין)
        if chain:
            pairs = [p for p in pairs if p.get("chainId") == chain]
        
        # עיצוב הנתונים
        formatted = []
        for pair in pairs[:50]:  # מקסימום 50 תוצאות
            base_token = pair.get("baseToken", {})
            
            formatted.append({
                "pair_address": pair.get("pairAddress"),
                "token_address": base_token.get("address"),
                "symbol": base_token.get("symbol"),
                "name": base_token.get("name"),
                "price_usd": float(pair.get("priceUsd", 0) or 0),
                "volume_24h": float(pair.get("volume", {}).get("h24", 0) or 0),
                "price_change_24h": float(pair.get("priceChange", {}).get("h24", 0) or 0),
                "liquidity_usd": float(pair.get("liquidity", {}).get("usd", 0) or 0),
                "dex": pair.get("dexId"),
                "chain": pair.get("chainId"),
                "url": f"https://dexscreener.com/{pair.get('chainId')}/{pair.get('pairAddress')}",
            })
        
        return {
            "tokens": formatted,
            "query": q,
            "total": len(formatted),
        }
    
    except httpx.HTTPError as e:
        logger.error(f"❌ HTTP error searching tokens: {e}")
        raise HTTPException(status_code=500, detail=f"אופס, שגיאה בחיפוש: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Error searching tokens: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"אופס, שגיאה: {str(e)}")


@router.get("/token/{token_address}")
async def get_token_details(token_address: str):
    """
    קבל פרטים מלאים על טוקן מ-DexScreener
    
    Args:
        token_address: כתובת הטוקן
    
    Returns:
        Detailed token information with all pairs
    """
    try:
        url = f"{DEXSCREENER_BASE}/tokens/{token_address}"
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
        
        pairs = data.get("pairs", [])
        
        if not pairs:
            raise HTTPException(status_code=404, detail="אופס, לא נמצאו pairs עבור הטוקן הזה 😅")
        
        # קח את ה-pair הכי נזיל (הכי הרבה liquidity)
        main_pair = max(
            pairs,
            key=lambda p: float(p.get("liquidity", {}).get("usd", 0) or 0)
        )
        
        base_token = main_pair.get("baseToken", {})
        quote_token = main_pair.get("quoteToken", {})
        
        # חשב סטטיסטיקות מכל ה-pairs
        total_volume_24h = sum(
            float(p.get("volume", {}).get("h24", 0) or 0) for p in pairs
        )
        total_liquidity = sum(
            float(p.get("liquidity", {}).get("usd", 0) or 0) for p in pairs
        )
        
        return {
            "token": {
                "address": base_token.get("address"),
                "symbol": base_token.get("symbol"),
                "name": base_token.get("name"),
            },
            "price_usd": float(main_pair.get("priceUsd", 0) or 0),
            "volume_24h": total_volume_24h,
            "liquidity_usd": total_liquidity,
            "price_change_24h": float(main_pair.get("priceChange", {}).get("h24", 0) or 0),
            "price_change_24h_pct": float(main_pair.get("priceChange", {}).get("h24", 0) or 0),
            "pairs_count": len(pairs),
            "pairs": [
                {
                    "pair_address": p.get("pairAddress"),
                    "dex": p.get("dexId"),
                    "price_usd": float(p.get("priceUsd", 0) or 0),
                    "liquidity_usd": float(p.get("liquidity", {}).get("usd", 0) or 0),
                    "volume_24h": float(p.get("volume", {}).get("h24", 0) or 0),
                    "url": f"https://dexscreener.com/{p.get('chainId')}/{p.get('pairAddress')}",
                }
                for p in pairs[:10]  # מקסימום 10 pairs
            ],
            "url": f"https://dexscreener.com/solana/{token_address}",
        }
    
    except httpx.HTTPError as e:
        logger.error(f"❌ HTTP error fetching token details: {e}")
        raise HTTPException(status_code=500, detail=f"אופס, שגיאה בקבלת פרטי טוקן: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Error fetching token details: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"אופס, שגיאה: {str(e)}")


@router.get("/new")
async def get_new_tokens(
    chain: str = Query("solana", description="Blockchain"),
    limit: int = Query(20, ge=1, le=100, description="Number of tokens to return")
):
    """
    קבל טוקנים חדשים (נוצרו ב-24 שעות האחרונות)
    
    Uses search endpoint to find new tokens, then filters by creation date.
    
    Returns:
        List of newly created tokens
    """
    try:
        # Use search with common terms to get pairs, then filter by creation date
        # DexScreener doesn't have a direct "new tokens" endpoint
        search_queries = ["SOL", "USDC"] if chain == "solana" else ["ETH", "USDC"]
        
        all_pairs = []
        url = f"{DEXSCREENER_BASE}/search"
        
        from datetime import datetime, timedelta, timezone
        now = datetime.now(timezone.utc)
        day_ago = now - timedelta(hours=24)
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Search with multiple queries
            for query in search_queries:
                try:
                    response = await client.get(url, params={"q": query})
                    response.raise_for_status()
                    data = response.json()
                    pairs = data.get("pairs", [])
                    
                    # Filter by chain and creation date
                    for pair in pairs:
                        if pair.get("chainId") != chain:
                            continue
                        
                        created_at_str = pair.get("pairCreatedAt")
                        if not created_at_str:
                            continue
                        
                        try:
                            created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                            if created_at > day_ago:
                                all_pairs.append(pair)
                        except Exception:
                            continue
                except Exception as e:
                    logger.warning(f"⚠️ Search query '{query}' failed: {e}")
                    continue
        
        # Remove duplicates
        seen_addresses = set()
        unique_pairs = []
        for pair in all_pairs:
            pair_addr = pair.get("pairAddress")
            if pair_addr and pair_addr not in seen_addresses:
                seen_addresses.add(pair_addr)
                unique_pairs.append(pair)
        
        # Sort by creation date (newest first)
        unique_pairs.sort(
            key=lambda p: p.get("pairCreatedAt", ""),
            reverse=True
        )
        
        # Take top N
        new_pairs = unique_pairs[:limit]
        
        # Format the data
        formatted = []
        for pair in new_pairs:
            base_token = pair.get("baseToken", {})
            
            formatted.append({
                "pair_address": pair.get("pairAddress"),
                "token_address": base_token.get("address"),
                "symbol": base_token.get("symbol"),
                "name": base_token.get("name"),
                "price_usd": float(pair.get("priceUsd", 0) or 0),
                "volume_24h": float(pair.get("volume", {}).get("h24", 0) or 0),
                "price_change_24h": float(pair.get("priceChange", {}).get("h24", 0) or 0),
                "liquidity_usd": float(pair.get("liquidity", {}).get("usd", 0) or 0),
                "dex": pair.get("dexId"),
                "created_at": pair.get("pairCreatedAt"),
                "url": f"https://dexscreener.com/{chain}/{pair.get('pairAddress')}",
            })
        
        return {
            "tokens": formatted,
            "total": len(formatted),
            "chain": chain,
        }
    
    except httpx.HTTPError as e:
        logger.error(f"❌ HTTP error fetching new tokens: {e}")
        raise HTTPException(status_code=500, detail=f"אופס, שגיאה בקבלת טוקנים חדשים: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Error fetching new tokens: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"אופס, שגיאה: {str(e)}")
