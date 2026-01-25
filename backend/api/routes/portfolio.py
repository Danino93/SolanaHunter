"""
Portfolio Endpoints - API routes for portfolio management

📋 מה הקובץ הזה עושה:
-------------------
מספק endpoints לניהול תיק:
- GET /api/portfolio - פוזיציות פעילות
- GET /api/portfolio/stats - סטטיסטיקות תיק
"""

from fastapi import APIRouter, HTTPException, Body
from typing import List, Optional, Dict
from pydantic import BaseModel
from executor.price_fetcher import PriceFetcher
from executor.position_monitor import PositionStatus
from api.dependencies import get_solanahunter
import httpx

router = APIRouter()


class SellPositionRequest(BaseModel):
    amount_percent: float = 100.0  # Percentage of position to sell (default: 100%)


class UpdatePositionRequest(BaseModel):
    stop_loss_pct: Optional[float] = None
    take_profit_1_price: Optional[float] = None
    take_profit_2_price: Optional[float] = None


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
        # Try DexScreener first for more accurate prices
        price_fetcher = PriceFetcher()
        enriched_positions = []
        
        # Try to get prices from DexScreener for better accuracy
        async with httpx.AsyncClient(timeout=10.0) as client:
            for pos in positions:
                current_price = None
                
                # Try DexScreener first
                try:
                    dex_url = f"https://api.dexscreener.com/latest/dex/tokens/{pos.token_mint}"
                    dex_response = await client.get(dex_url)
                    if dex_response.status_code == 200:
                        dex_data = dex_response.json()
                        pairs = dex_data.get("pairs", [])
                        if pairs:
                            # Get the pair with highest liquidity
                            main_pair = max(
                                pairs,
                                key=lambda p: float(p.get("liquidity", {}).get("usd", 0) or 0)
                            )
                            current_price = float(main_pair.get("priceUsd", 0) or 0)
                except Exception:
                    pass  # Fallback to PriceFetcher
                
                # Fallback to PriceFetcher if DexScreener failed
                if current_price is None or current_price == 0:
                    current_price = await price_fetcher.get_token_price(pos.token_mint)
                
                if current_price is None or current_price == 0:
                    current_price = pos.entry_price  # Final fallback to entry price
            
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
                "stop_loss_pct": pos.stop_loss_pct * 100,  # Convert to percentage
                "take_profit_1_price": None,  # TODO: Add to Position dataclass
                "take_profit_2_price": None,  # TODO: Add to Position dataclass
                "opened_at": pos.opened_at.isoformat(),  # For frontend compatibility
                "entry_timestamp": pos.opened_at.isoformat(),  # For database compatibility
            })
        
        return {
            "positions": enriched_positions,
            "total": len(enriched_positions),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"אופס, שגיאה בטעינת פוזיציות: {str(e)}")


@router.get("/wallet")
async def get_wallet_info():
    """
    Get wallet information (address, balance, token balances)
    
    Returns:
        Wallet information including address, SOL balance, and token holdings
    """
    solanahunter = get_solanahunter()
    if not solanahunter:
        raise HTTPException(status_code=503, detail="Bot not initialized")
    
    if not solanahunter.wallet_manager:
        return {
            "address": None,
            "balance_sol": 0.0,
            "balance_usd": 0.0,
            "token_holdings": [],
            "available": False,
        }
    
    try:
        wallet = solanahunter.wallet_manager
        address = wallet.get_address()
        balance_sol = await wallet.get_balance()
        
        # Get SOL price in USD
        price_fetcher = PriceFetcher()
        sol_price = await price_fetcher.get_sol_price() or 0.0
        balance_usd = balance_sol * sol_price
        
        # Get token accounts (holdings)
        token_accounts = await wallet.get_token_accounts()
        token_holdings = []
        
        # Parse token accounts to get balances
        # This is simplified - full implementation would parse account data
        for account in token_accounts[:20]:  # Limit to 20 tokens
            try:
                # TODO: Parse account data properly to get mint and balance
                # For now, we'll return basic info
                token_holdings.append({
                    "mint": "unknown",  # TODO: Parse from account data
                    "balance": 0.0,  # TODO: Parse from account data
                })
            except Exception:
                continue
        
        return {
            "address": address,
            "balance_sol": balance_sol,
            "balance_usd": balance_usd,
            "token_holdings": token_holdings,
            "available": True,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"אופס, שגיאה בקבלת מידע ארנק: {str(e)}")


@router.get("/performance/history")
async def get_portfolio_performance_history(days: int = 30):
    """
    Get portfolio performance history for charts
    
    Args:
        days: Number of days to fetch (default: 30)
        
    Returns:
        List of daily portfolio values and P&L
    """
    solanahunter = get_solanahunter()
    if not solanahunter:
        raise HTTPException(status_code=503, detail="Bot not initialized")
    
    if not solanahunter.supabase or not solanahunter.supabase.enabled:
        # Return empty data if Supabase not available
        return {
            "data": [],
            "total_days": days,
        }
    
    try:
        from datetime import datetime, timedelta, timezone
        
        # Get positions from Supabase
        async with solanahunter.supabase:
            positions = await solanahunter.supabase.get_positions(status="ACTIVE")
        
        # For now, return current snapshot
        # TODO: In future, store daily snapshots for historical data
        price_fetcher = PriceFetcher()
        total_value = 0.0
        total_cost = 0.0
        
        for pos_data in positions:
            current_price = await price_fetcher.get_token_price(pos_data["token_address"])
            if current_price is None:
                current_price = float(pos_data.get("entry_price", 0))
            
            entry_value = float(pos_data.get("entry_value_usd", 0))
            current_value = current_price * float(pos_data.get("amount_tokens", 0))
            
            total_cost += entry_value
            total_value += current_value
        
        # Generate mock historical data (will be replaced with real data later)
        # For now, create a simple trend
        data = []
        now = datetime.now(timezone.utc)
        for i in range(days, -1, -1):
            date = now - timedelta(days=i)
            # Simple mock: current value with small random variation
            value = total_value * (1 + (i * 0.01 / days))
            cost = total_cost
            pnl = value - cost
            pnl_pct = (pnl / cost * 100) if cost > 0 else 0
            
            data.append({
                "date": date.strftime("%Y-%m-%d"),
                "value": value,
                "cost": cost,
                "pnl": pnl,
                "pnl_pct": pnl_pct,
            })
        
        return {
            "data": data,
            "total_days": days,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"אופס, שגיאה בקבלת היסטוריית ביצועים: {str(e)}")


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


@router.post("/positions/{token_address}/sell")
async def sell_position(token_address: str, request: SellPositionRequest = Body(...)):
    """
    Sell a position (partially or fully)
    
    Args:
        token_address: Token address (position identifier)
        request: Sell request with amount_percent
        
    Returns:
        Transaction signature and details
    """
    solanahunter = get_solanahunter()
    if not solanahunter:
        raise HTTPException(status_code=503, detail="Bot not initialized")
    
    if not solanahunter.position_monitor:
        raise HTTPException(status_code=503, detail="Position monitor not available")
    
    try:
        position = solanahunter.position_monitor.get_position(token_address)
        if not position:
            raise HTTPException(status_code=404, detail="Position not found")
        
        # Sell position
        tx_signature = await solanahunter.position_monitor._sell_position(
            position,
            PositionStatus.MANUAL_CLOSE
        )
        
        if not tx_signature:
            raise HTTPException(status_code=500, detail="Failed to sell position")
        
        return {
            "success": True,
            "transaction_signature": tx_signature,
            "message": f"Position sold successfully",
            "solscan_url": f"https://solscan.io/tx/{tx_signature}",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"אופס, שגיאה במכירת פוזיציה: {str(e)}")


@router.put("/positions/{token_address}")
async def update_position(token_address: str, request: UpdatePositionRequest = Body(...)):
    """
    Update position settings (stop loss, take profit)
    
    Args:
        token_address: Token address (position identifier)
        request: Update request with new settings
        
    Returns:
        Updated position details
    """
    solanahunter = get_solanahunter()
    if not solanahunter:
        raise HTTPException(status_code=503, detail="Bot not initialized")
    
    if not solanahunter.position_monitor:
        raise HTTPException(status_code=503, detail="Position monitor not available")
    
    try:
        position = solanahunter.position_monitor.get_position(token_address)
        if not position:
            raise HTTPException(status_code=404, detail="Position not found")
        
        # Update position settings
        if request.stop_loss_pct is not None:
            position.stop_loss_pct = request.stop_loss_pct / 100.0  # Convert from percentage
        
        # TODO: Add take profit support to Position dataclass
        
        # Update in Supabase
        if solanahunter.supabase and solanahunter.supabase.enabled:
            try:
                async with solanahunter.supabase:
                    position_data = {
                        "token_address": token_address,
                        "stop_loss_pct": position.stop_loss_pct * 100,  # Convert to percentage
                    }
                    await solanahunter.supabase.save_position(position_data)
            except Exception as e:
                # Log but don't fail
                pass
        
        return {
            "success": True,
            "message": "Position updated successfully",
            "position": {
                "token_address": position.token_mint,
                "token_symbol": position.token_symbol,
                "stop_loss_pct": position.stop_loss_pct * 100,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"אופס, שגיאה בעדכון פוזיציה: {str(e)}")
