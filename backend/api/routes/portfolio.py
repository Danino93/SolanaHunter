"""
Portfolio Endpoints - API routes for portfolio management

📋 מה הקובץ הזה עושה:
-------------------
מספק endpoints לניהול תיק:
- GET /api/portfolio - פוזיציות פעילות
- GET /api/portfolio/stats - סטטיסטיקות תיק
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from executor.price_fetcher import PriceFetcher
from api.dependencies import get_solanahunter

router = APIRouter()


@router.get("")
async def get_positions():
    """
    Get active positions from PositionMonitor
    
    Returns:
        List of active positions with current prices and P&L
    """
    solanahunter = get_solanahunter()
    if not solanahunter:
        raise HTTPException(status_code=503, detail="Bot not initialized")
    
    try:
        position_monitor = solanahunter.position_monitor
        
        if not position_monitor:
            return {
                "positions": [],
                "total": 0,
            }
        
        positions = position_monitor.get_all_positions()
        
        # Enrich with current prices and P&L
        price_fetcher = PriceFetcher()
        enriched_positions = []
        for pos in positions:
            current_price = await price_fetcher.get_token_price(pos.token_mint)
            
            if current_price is None:
                current_price = pos.entry_price  # Fallback to entry price
            
            entry_value = pos.entry_price * pos.amount_tokens
            current_value = current_price * pos.amount_tokens
            pnl_usd = current_value - entry_value
            pnl_pct = (pnl_usd / entry_value * 100) if entry_value > 0 else 0
            
            enriched_positions.append({
                "id": pos.token_mint,
                "token_address": pos.token_mint,
                "token_symbol": pos.token_symbol,
                "token_name": pos.token_symbol,  # TODO: Get from token info
                "amount_tokens": pos.amount_tokens,
                "entry_price": pos.entry_price,
                "current_price": current_price,
                "entry_value_usd": entry_value,
                "current_value_usd": current_value,
                "unrealized_pnl_usd": pnl_usd,
                "unrealized_pnl_pct": pnl_pct,
                "stop_loss_price": pos.entry_price * (1 - pos.stop_loss_pct),
                "opened_at": pos.opened_at.isoformat(),
            })
        
        return {
            "positions": enriched_positions,
            "total": len(enriched_positions),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"אופס, שגיאה בטעינת פוזיציות: {str(e)}")


@router.get("/stats")
async def get_portfolio_stats():
    """
    Get portfolio statistics
    
    Calculates from real positions
    """
    solanahunter = get_solanahunter()
    if not solanahunter:
        raise HTTPException(status_code=503, detail="Bot not initialized")
    
    try:
        position_monitor = solanahunter.position_monitor
        
        if not position_monitor:
            return {
                "total_value": 0.0,
                "total_cost": 0.0,
                "total_pnl": 0.0,
                "total_pnl_pct": 0.0,
                "active_positions": 0,
                "win_rate": 0.0,
            }
        
        positions = position_monitor.get_all_positions()
        
        price_fetcher = PriceFetcher()
        total_cost = 0.0
        total_value = 0.0
        winning_positions = 0
        
        for pos in positions:
            current_price = await price_fetcher.get_token_price(pos.token_mint)
            if current_price is None:
                current_price = pos.entry_price  # Fallback
            
            entry_value = pos.entry_price * pos.amount_tokens
            current_value = current_price * pos.amount_tokens
            
            total_cost += entry_value
            total_value += current_value
            
            if current_value > entry_value:
                winning_positions += 1
        
        total_pnl = total_value - total_cost
        total_pnl_pct = (total_pnl / total_cost * 100) if total_cost > 0 else 0.0
        win_rate = (winning_positions / len(positions) * 100) if positions else 0.0
        
        return {
            "total_value": total_value,
            "total_cost": total_cost,
            "total_pnl": total_pnl,
            "total_pnl_pct": total_pnl_pct,
            "active_positions": len(positions),
            "win_rate": win_rate,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"אופס, שגיאה בחישוב סטטיסטיקות: {str(e)}")
