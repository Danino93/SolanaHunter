"""
Token Endpoints - API routes for tokens

📋 מה הקובץ הזה עושה:
-------------------
מספק endpoints לטוקנים:
- GET /api/tokens - רשימת טוקנים
- GET /api/tokens/{address} - פרטי טוקן
- GET /api/tokens/search?q={query} - חיפוש
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from database.supabase_client import get_supabase_client

router = APIRouter()


@router.get("")
async def get_tokens(
    limit: int = Query(100, ge=1, le=1000),
    min_score: Optional[int] = Query(None, ge=0, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Get list of tokens
    
    Args:
        limit: Maximum number of tokens to return (1-1000)
        min_score: Minimum score filter (0-100)
        offset: Offset for pagination
    """
    try:
        supabase = get_supabase_client()
        if not supabase.enabled:
            return {"tokens": [], "total": 0}
        
        async with supabase:
            tokens = await supabase.get_tokens(limit=limit, min_score=min_score)
            
            # Apply offset manually (Supabase client doesn't support it yet)
            if offset > 0:
                tokens = tokens[offset:]
            
            return {
                "tokens": tokens,
                "total": len(tokens),
                "limit": limit,
                "offset": offset,
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tokens: {str(e)}")


@router.get("/{address}")
async def get_token(address: str):
    """Get token details by address"""
    try:
        supabase = get_supabase_client()
        if not supabase.enabled:
            raise HTTPException(status_code=404, detail="Token not found")
        
        async with supabase:
            tokens = await supabase.get_tokens(limit=1000)
            token = next((t for t in tokens if t.get("address") == address), None)
            
            if not token:
                raise HTTPException(status_code=404, detail="Token not found")
            
            return token
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching token: {str(e)}")


@router.get("/search")
async def search_tokens(q: str = Query(..., min_length=1)):
    """Search tokens by symbol or name"""
    try:
        supabase = get_supabase_client()
        if not supabase.enabled:
            return {"tokens": []}
        
        async with supabase:
            tokens = await supabase.get_tokens(limit=1000)
            query_lower = q.lower()
            
            # Filter by symbol or name
            results = [
                t for t in tokens
                if query_lower in t.get("symbol", "").lower() or
                   query_lower in t.get("name", "").lower()
            ]
            
            return {"tokens": results, "query": q}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching tokens: {str(e)}")
