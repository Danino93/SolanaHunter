"""
Bot Control Endpoints - API routes for bot management

📋 מה הקובץ הזה עושה:
-------------------
מספק endpoints לניהול הבוט:
- GET /api/bot/status - מצב הבוט
- POST /api/bot/start - הפעלה
- POST /api/bot/stop - עצירה
- POST /api/bot/pause - השהייה
- GET /api/bot/stats - סטטיסטיקות
"""

from fastapi import APIRouter, HTTPException
from api.dependencies import get_solanahunter

router = APIRouter()


@router.get("/status")
async def get_bot_status():
    """Get bot status"""
    try:
        hunter = get_solanahunter()
        if not hunter:
            return {
                "status": "not_initialized",
                "running": False,
                "paused": False,
            }
        
        return {
            "status": "paused" if hunter._paused else ("running" if hunter._running else "stopped"),
            "running": hunter._running and not hunter._paused,
            "paused": hunter._paused,
            "scan_count": hunter._scan_count,
            "tokens_analyzed": hunter._tokens_analyzed,
            "high_score_count": hunter._high_score_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting bot status: {str(e)}")


@router.post("/start")
async def start_bot():
    """Start the bot"""
    try:
        hunter = get_solanahunter()
        if not hunter:
            raise HTTPException(status_code=503, detail="Bot not initialized")
        
        if hunter._running:
            return {"message": "Bot is already running", "status": "running"}
        
        hunter._running = True
        hunter._paused = False
        
        return {"message": "Bot started", "status": "running"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting bot: {str(e)}")


@router.post("/stop")
async def stop_bot():
    """Stop the bot"""
    try:
        hunter = get_solanahunter()
        if not hunter:
            raise HTTPException(status_code=503, detail="Bot not initialized")
        
        hunter._running = False
        hunter._paused = False
        
        return {"message": "Bot stopped", "status": "stopped"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error stopping bot: {str(e)}")


@router.post("/pause")
async def pause_bot():
    """Pause the bot"""
    try:
        hunter = get_solanahunter()
        if not hunter:
            raise HTTPException(status_code=503, detail="Bot not initialized")
        
        if not hunter._running:
            raise HTTPException(status_code=400, detail="Bot is not running")
        
        hunter._paused = True
        
        return {"message": "Bot paused", "status": "paused"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error pausing bot: {str(e)}")


@router.post("/resume")
async def resume_bot():
    """Resume the bot"""
    try:
        hunter = get_solanahunter()
        if not hunter:
            raise HTTPException(status_code=503, detail="Bot not initialized")
        
        if not hunter._paused:
            return {"message": "Bot is not paused", "status": "running"}
        
        hunter._paused = False
        
        return {"message": "Bot resumed", "status": "running"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resuming bot: {str(e)}")


@router.get("/stats")
async def get_bot_stats():
    """Get bot statistics"""
    try:
        hunter = get_solanahunter()
        if not hunter:
            return {
                "scans": 0,
                "tokens_analyzed": 0,
                "high_score_count": 0,
                "alerts_sent": 0,
            }
        
        return {
            "scans": hunter._scan_count,
            "tokens_analyzed": hunter._tokens_analyzed,
            "high_score_count": hunter._high_score_count,
            "alerts_sent": len(hunter._alerts_sent) if hasattr(hunter, '_alerts_sent') else 0,
            "uptime_seconds": 0,  # TODO: Calculate from start time
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting bot stats: {str(e)}")
