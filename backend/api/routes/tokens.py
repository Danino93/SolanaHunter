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
from datetime import datetime, timezone
from database.supabase_client import get_supabase_client
from api.dependencies import get_solanahunter

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


@router.post("/{address}/analyze")
async def analyze_token(address: str):
    """
    Trigger manual analysis for a specific token
    
    Args:
        address: Token address to analyze
        
    Returns:
        Analysis result with updated token data
    """
    try:
        solanahunter = get_solanahunter()
        if not solanahunter:
            raise HTTPException(status_code=503, detail="Bot not initialized")
        
        # Get token basic info first
        supabase = get_supabase_client()
        token_data = None
        if supabase.enabled:
            async with supabase:
                tokens = await supabase.get_tokens(limit=1000)
                token_data = next((t for t in tokens if t.get("address") == address), None)
        
        if not token_data:
            # Try to get from DexScreener
            from api.routes.dexscreener import get_token_details
            try:
                dex_data = await get_token_details(address)
                token_data = {
                    "address": address,
                    "symbol": dex_data.get("token", {}).get("symbol", "UNKNOWN"),
                    "name": dex_data.get("token", {}).get("name", ""),
                }
            except:
                raise HTTPException(status_code=404, detail="טוקן לא נמצא")
        
        # Run full analysis (same as in _scan_loop)
        try:
            # Contract safety check
            safety = await solanahunter.contract_checker.check_contract(address)
            
            # Holder analysis
            holders = await solanahunter.holder_analyzer.analyze(address)
            
            # Token Metrics
            metrics = await solanahunter.metrics_fetcher.get_metrics(address)
            
            # Smart money check
            from analyzer.smart_money_tracker import get_smart_money_tracker
            holder_addresses = [h.get("address", "") for h in holders.top_holders]
            smart_money_count = get_smart_money_tracker().check_if_holds(address, holder_addresses)
            
            # Calculate final score
            token_score = solanahunter.scoring_engine.calculate_score(
                safety=safety,
                holders=holders,
                liquidity_sol=metrics.liquidity_sol,
                volume_24h=metrics.volume_24h,
                price_change_5m=metrics.price_change_5m,
                price_change_1h=metrics.price_change_1h,
                smart_money_count=smart_money_count,
            )
            
            # Prepare updated token data
            updated_token = {
                **token_data,
                "safety_score": safety.safety_score,
                "ownership_renounced": safety.ownership_renounced,
                "liquidity_locked": safety.liquidity_locked,
                "mint_authority_disabled": safety.mint_authority_disabled,
                "holder_count": holders.holder_count,
                "top_10_percentage": holders.top_10_percentage,
                "total_lp_percentage": holders.total_lp_percentage,
                "total_burn_percentage": holders.total_burn_percentage,
                "is_concentrated": holders.is_concentrated,
                "holder_score": holders.holder_score,
                "liquidity_sol": metrics.liquidity_sol,
                "liquidity_usd": metrics.liquidity_usd,
                "volume_24h": metrics.volume_24h,
                "price_usd": metrics.price_usd,
                "price_change_5m": metrics.price_change_5m,
                "price_change_1h": metrics.price_change_1h,
                "price_change_24h": metrics.price_change_24h,
                "smart_money_count": smart_money_count,
                "final_score": token_score.final_score,
                "grade": token_score.grade.value,
                "category": token_score.category.value,
                "safety_score": token_score.safety_score,
                "liquidity_score": token_score.liquidity_score,
                "volume_score": token_score.volume_score,
                "smart_money_score": token_score.smart_money_score,
                "price_action_score": token_score.price_action_score,
                "last_analyzed_at": datetime.now(timezone.utc).isoformat(),
            }
            
            # Save to database
            if supabase.enabled:
                async with supabase:
                    await supabase.save_token(updated_token)
            
            return {
                "success": True,
                "token_address": address,
                "token": updated_token,
                "message": "ניתוח הושלם בהצלחה"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"אופס, שגיאה בניתוח: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"אופס, שגיאה: {str(e)}")


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
