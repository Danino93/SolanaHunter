"""
Trading Endpoints - API routes for trading operations

📋 מה הקובץ הזה עושה:
-------------------
מספק endpoints למסחר:
- POST /api/trading/buy - קנייה
- POST /api/trading/sell - מכירה
- GET /api/trading/history - היסטוריית trades
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class BuyRequest(BaseModel):
    token_address: str
    amount_usd: float
    use_dca: bool = True


class SellRequest(BaseModel):
    token_address: str
    amount_percent: Optional[float] = None  # None = sell all


@router.post("/buy")
async def buy_token(request: BuyRequest):
    """
    Buy a token
    
    TODO: Implement actual trading logic (Day 16-17)
    For now, returns mock response
    """
    try:
        # TODO: Implement actual buy logic
        return {
            "success": False,
            "message": "Trading not implemented yet. Will be available in Day 16-17.",
            "tx_signature": None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error buying token: {str(e)}")


@router.post("/sell")
async def sell_token(request: SellRequest):
    """
    Sell a token
    
    TODO: Implement actual trading logic (Day 16-17)
    For now, returns mock response
    """
    try:
        # TODO: Implement actual sell logic
        return {
            "success": False,
            "message": "Trading not implemented yet. Will be available in Day 16-17.",
            "tx_signature": None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error selling token: {str(e)}")


@router.get("/history")
async def get_trade_history(limit: int = 50):
    """
    Get trade history
    
    TODO: Load from database
    For now, returns empty list
    """
    try:
        return {
            "trades": [],
            "total": 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trade history: {str(e)}")
