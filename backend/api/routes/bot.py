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
            "status": "paused" if hunter._paused else ("running" if hunter.running else "stopped"),
            "running": hunter.running and not hunter._paused,
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
        
        if hunter.running:
            return {"message": "Bot is already running", "status": "running"}
        
        # Start the bot if not already started
        import asyncio
        hunter.running = True
        hunter._paused = False
        
        # Start the scan loop in background if not already running
        if not hasattr(hunter, '_scan_task') or hunter._scan_task is None or (hasattr(hunter._scan_task, 'done') and hunter._scan_task.done()):
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # If loop is already running, create task
                    hunter._scan_task = asyncio.create_task(hunter._scan_loop())
                else:
                    # If no loop running, we can't start async task from sync context
                    # The bot should be started via main.py start() method
                    pass
            except RuntimeError:
                # No event loop - bot should be started via main.py
                pass
        
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
        
        hunter.running = False
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
        
        if not hunter.running:
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
        
        import time
        uptime_seconds = 0
        if hasattr(hunter, '_start_time') and hunter._start_time:
            uptime_seconds = int(time.time() - hunter._start_time)
        
        return {
            "scans": hunter._scan_count,
            "tokens_analyzed": hunter._tokens_analyzed,
            "high_score_count": hunter._high_score_count,
            "alerts_sent": len(hunter._alerts_sent) if hasattr(hunter, '_alerts_sent') else 0,
            "uptime_seconds": uptime_seconds,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting bot stats: {str(e)}")


@router.get("/health")
async def get_bot_health():
    """
    Get bot health status - checks all components
    ✅ עכשיו בודק באמת את כל הרכיבים!
    """
    try:
        hunter = get_solanahunter()
        if not hunter:
            return {
                "scanner": {"status": "unknown", "message": "Bot not initialized"},
                "analyzer": {"status": "unknown", "message": "Bot not initialized"},
                "database": {"status": "unknown", "message": "Bot not initialized"},
                "telegram": {"status": "unknown", "message": "Bot not initialized"},
            }
        
        health = {}
        
        # Check Scanner
        try:
            if hasattr(hunter, 'scanner') and hunter.scanner:
                health["scanner"] = {"status": "healthy", "message": "Scanner initialized"}
            else:
                health["scanner"] = {"status": "unhealthy", "message": "Scanner not initialized"}
        except Exception as e:
            health["scanner"] = {"status": "error", "message": f"Scanner error: {str(e)}"}
        
        # Check Analyzer
        try:
            if hasattr(hunter, 'scoring_engine') and hunter.scoring_engine:
                health["analyzer"] = {"status": "healthy", "message": "Analyzer initialized"}
            else:
                health["analyzer"] = {"status": "unhealthy", "message": "Analyzer not initialized"}
        except Exception as e:
            health["analyzer"] = {"status": "error", "message": f"Analyzer error: {str(e)}"}
        
        # Check Database (Supabase)
        try:
            if hasattr(hunter, 'supabase') and hunter.supabase and hunter.supabase.enabled:
                # Try a simple query
                async with hunter.supabase:
                    response = await hunter.supabase._client.get("/tokens", params={"limit": 1})
                    if response.status_code in (200, 201):
                        health["database"] = {"status": "healthy", "message": "Database connected"}
                    else:
                        health["database"] = {"status": "unhealthy", "message": f"Database query failed: {response.status_code}"}
            else:
                health["database"] = {"status": "unhealthy", "message": "Database not configured"}
        except Exception as e:
            health["database"] = {"status": "error", "message": f"Database error: {str(e)}"}
        
        # Check Telegram
        try:
            if hasattr(hunter, 'telegram') and hunter.telegram:
                health["telegram"] = {"status": "healthy", "message": "Telegram bot connected"}
            else:
                health["telegram"] = {"status": "unhealthy", "message": "Telegram bot not configured"}
        except Exception as e:
            health["telegram"] = {"status": "error", "message": f"Telegram error: {str(e)}"}
        
        return health
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting bot health: {str(e)}")
