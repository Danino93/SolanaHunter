"""
Portfolio Endpoints - API routes for portfolio management

📋 מה הקובץ הזה עושה:
-------------------
מספק endpoints לניהול תיק:
- GET /api/portfolio - פוזיציות פעילות
- GET /api/portfolio/stats - סטטיסטיקות תיק
"""

from fastapi import APIRouter, HTTPException
from typing import List

router = APIRouter()


@router.get("")
async def get_positions():
    """
    Get active positions
    
    TODO: Connect to real database/backend
    For now, returns empty list
    """
    try:
        # TODO: Load from database
        return {
            "positions": [],
            "total": 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching positions: {str(e)}")


@router.get("/stats")
async def get_portfolio_stats():
    """
    Get portfolio statistics
    
    TODO: Calculate from real positions
    For now, returns mock data
    """
    try:
        return {
            "total_value": 0.0,
            "total_cost": 0.0,
            "total_pnl": 0.0,
            "total_pnl_pct": 0.0,
            "active_positions": 0,
            "win_rate": 0.0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching portfolio stats: {str(e)}")
