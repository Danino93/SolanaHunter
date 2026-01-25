"""
Analytics Endpoints - API routes for analytics

📋 מה הקובץ הזה עושה:
-------------------
מספק endpoints ל-analytics:
- GET /api/analytics/performance - ביצועים
- GET /api/analytics/trades - ניתוח trades
- GET /api/analytics/roi - ROI
"""

from fastapi import APIRouter, HTTPException
from database.supabase_client import get_supabase_client
from api.dependencies import get_solanahunter

router = APIRouter()


@router.get("/performance")
async def get_performance(time_range: str = "all"):
    """
    Get performance analytics from trade_history
    ✅ עכשיו מחשב מנתונים אמיתיים מ-Supabase!
    ✅ תומך ב-time_range filtering!
    """
    try:
        from datetime import datetime, timedelta, timezone
        
        # Calculate date filter based on time_range
        date_filter = None
        if time_range == "7d":
            date_filter = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        elif time_range == "30d":
            date_filter = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        elif time_range == "90d":
            date_filter = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
        # "all" = no filter
        
        supabase = get_supabase_client()
        if not supabase or not supabase.enabled:
            return {
                "win_rate": 0.0,
                "total_pnl": 0.0,
                "total_trades": 0,
                "avg_profit": 0.0,
                "best_trade": None,
                "worst_trade": None,
            }
        
        async with supabase:
            # Build params
            params = {
                "order": "created_at.desc",
                "limit": 1000,
            }
            if date_filter:
                params["created_at"] = f"gte.{date_filter}"
            
            # Get trades from trade_history
            response = await supabase._client.get(
                "/trade_history",
                params=params
            )
            
            if response.status_code != 200:
                return {
                    "win_rate": 0.0,
                    "total_pnl": 0.0,
                    "total_trades": 0,
                    "avg_profit": 0.0,
                    "best_trade": None,
                    "worst_trade": None,
                }
            
            trades = response.json()
            
            if not trades:
                return {
                    "win_rate": 0.0,
                    "total_pnl": 0.0,
                    "total_trades": 0,
                    "avg_profit": 0.0,
                    "best_trade": None,
                    "worst_trade": None,
                }
            
            # Calculate metrics
            total_trades = len(trades)
            profitable_trades = [t for t in trades if t.get("realized_pnl_usd", 0) and t.get("realized_pnl_usd", 0) > 0]
            losing_trades = [t for t in trades if t.get("realized_pnl_usd", 0) and t.get("realized_pnl_usd", 0) < 0]
            
            win_rate = (len(profitable_trades) / total_trades * 100) if total_trades > 0 else 0.0
            
            total_pnl = sum(t.get("realized_pnl_usd", 0) or 0 for t in trades)
            avg_profit = total_pnl / total_trades if total_trades > 0 else 0.0
            
            # Find best and worst trades
            best_trade = None
            worst_trade = None
            if trades:
                best_trade = max(trades, key=lambda t: t.get("realized_pnl_usd", 0) or 0)
                worst_trade = min(trades, key=lambda t: t.get("realized_pnl_usd", 0) or 0)
            
            return {
                "win_rate": round(win_rate, 2),
                "total_pnl": round(total_pnl, 2),
                "total_trades": total_trades,
                "avg_profit": round(avg_profit, 2),
                "best_trade": {
                    "token_symbol": best_trade.get("token_symbol", "N/A") if best_trade else None,
                    "pnl_usd": round(best_trade.get("realized_pnl_usd", 0) or 0, 2) if best_trade else None,
                    "date": best_trade.get("created_at") if best_trade else None,
                } if best_trade else None,
                "worst_trade": {
                    "token_symbol": worst_trade.get("token_symbol", "N/A") if worst_trade else None,
                    "pnl_usd": round(worst_trade.get("realized_pnl_usd", 0) or 0, 2) if worst_trade else None,
                    "date": worst_trade.get("created_at") if worst_trade else None,
                } if worst_trade else None,
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching performance: {str(e)}")


@router.get("/trades")
async def get_trades_analysis(time_range: str = "all"):
    """
    Get trades analysis from trade_history
    ✅ עכשיו מחשב מנתונים אמיתיים מ-Supabase!
    ✅ תומך ב-time_range filtering!
    """
    try:
        from datetime import datetime, timedelta, timezone
        
        # Calculate date filter based on time_range
        date_filter = None
        if time_range == "7d":
            date_filter = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        elif time_range == "30d":
            date_filter = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        elif time_range == "90d":
            date_filter = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
        # "all" = no filter
        
        supabase = get_supabase_client()
        if not supabase or not supabase.enabled:
            return {
                "total_trades": 0,
                "winning_trades": 0,
                "losing_trades": 0,
                "avg_win": 0.0,
                "avg_loss": 0.0,
            }
        
        async with supabase:
            # Build params
            params = {
                "order": "created_at.desc",
                "limit": 1000,
            }
            if date_filter:
                params["created_at"] = f"gte.{date_filter}"
            
            # Get trades
            response = await supabase._client.get(
                "/trade_history",
                params=params
            )
            
            if response.status_code != 200:
                return {
                    "total_trades": 0,
                    "winning_trades": 0,
                    "losing_trades": 0,
                    "avg_win": 0.0,
                    "avg_loss": 0.0,
                }
            
            trades = response.json()
            
            if not trades:
                return {
                    "total_trades": 0,
                    "winning_trades": 0,
                    "losing_trades": 0,
                    "avg_win": 0.0,
                    "avg_loss": 0.0,
                }
            
            # Analyze trades
            winning_trades = [t for t in trades if t.get("realized_pnl_usd", 0) and t.get("realized_pnl_usd", 0) > 0]
            losing_trades = [t for t in trades if t.get("realized_pnl_usd", 0) and t.get("realized_pnl_usd", 0) < 0]
            
            avg_win = sum(t.get("realized_pnl_usd", 0) or 0 for t in winning_trades) / len(winning_trades) if winning_trades else 0.0
            avg_loss = sum(t.get("realized_pnl_usd", 0) or 0 for t in losing_trades) / len(losing_trades) if losing_trades else 0.0
            
            return {
                "total_trades": len(trades),
                "winning_trades": len(winning_trades),
                "losing_trades": len(losing_trades),
                "avg_win": round(avg_win, 2),
                "avg_loss": round(avg_loss, 2),
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trades analysis: {str(e)}")


@router.get("/roi")
async def get_roi(time_range: str = "all"):
    """
    Get ROI calculation from positions and trades
    ✅ עכשיו מחשב מנתונים אמיתיים מ-Supabase!
    ✅ תומך ב-time_range filtering!
    """
    try:
        from datetime import datetime, timedelta, timezone
        
        # Calculate date filter based on time_range
        date_filter = None
        if time_range == "7d":
            date_filter = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        elif time_range == "30d":
            date_filter = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        elif time_range == "90d":
            date_filter = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
        # "all" = no filter
        
        solanahunter = get_solanahunter()
        if not solanahunter or not solanahunter.supabase or not solanahunter.supabase.enabled:
            return {
                "roi": 0.0,
                "total_invested": 0.0,
                "total_value": 0.0,
                "profit": 0.0,
            }
        
        from executor.price_fetcher import PriceFetcher
        
        async with solanahunter.supabase:
            # Get active positions
            positions = await solanahunter.supabase.get_positions(status="ACTIVE")
            
            # Build params for closed trades
            params = {
                "trade_type": "eq.SELL",
                "limit": 1000,
            }
            if date_filter:
                params["created_at"] = f"gte.{date_filter}"
            
            # Get closed positions (from trade_history where type=SELL)
            trades_response = await solanahunter.supabase._client.get(
                "/trade_history",
                params=params
            )
            
            closed_trades = trades_response.json() if trades_response.status_code == 200 else []
        
        # Calculate total invested (from entry values)
        total_invested = sum(float(p.get("entry_value_usd", 0) or 0) for p in positions)
        
        # Calculate current value
        price_fetcher = PriceFetcher()
        total_value = 0.0
        for pos in positions:
            current_price = await price_fetcher.get_token_price(pos.get("token_address", ""))
            if current_price is None:
                current_price = float(pos.get("entry_price", 0) or 0)
            amount = float(pos.get("amount_tokens", 0) or 0)
            total_value += current_price * amount
        
        # Add realized profits from closed trades
        realized_profit = sum(t.get("realized_pnl_usd", 0) or 0 for t in closed_trades)
        
        # Total value = current positions + realized profits
        total_value_with_profit = total_value + realized_profit
        
        # Calculate ROI
        profit = total_value_with_profit - total_invested
        roi = (profit / total_invested * 100) if total_invested > 0 else 0.0
        
        return {
            "roi": round(roi, 2),
            "total_invested": round(total_invested, 2),
            "total_value": round(total_value_with_profit, 2),
            "profit": round(profit, 2),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating ROI: {str(e)}")
