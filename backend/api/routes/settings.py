"""
Settings Endpoints - API routes for settings management

📋 מה הקובץ הזה עושה:
-------------------
מספק endpoints להגדרות:
- GET /api/settings - קבלת הגדרות
- POST /api/settings - עדכון הגדרות
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from api.dependencies import get_solanahunter
from core.config import settings

router = APIRouter()


class SettingsUpdate(BaseModel):
    alert_threshold: Optional[int] = None
    scan_interval: Optional[int] = None
    max_position_size: Optional[float] = None
    stop_loss_pct: Optional[float] = None


@router.get("")
async def get_settings():
    """Get current settings"""
    try:
        hunter = get_solanahunter()
        current_threshold = hunter._alert_threshold if hunter else 85
        
        return {
            "alert_threshold": current_threshold,
            "scan_interval": getattr(settings, 'scan_interval_seconds', 300),
            "max_position_size": getattr(settings, 'max_position_size_pct', 5),
            "stop_loss_pct": getattr(settings, 'stop_loss_pct', 15),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching settings: {str(e)}")


@router.post("")
async def update_settings(request: SettingsUpdate):
    """Update settings"""
    try:
        hunter = get_solanahunter()
        if not hunter:
            raise HTTPException(status_code=503, detail="Bot not initialized")
        
        # Update alert threshold
        if request.alert_threshold is not None:
            if 0 <= request.alert_threshold <= 100:
                hunter._alert_threshold = request.alert_threshold
            else:
                raise HTTPException(status_code=400, detail="Alert threshold must be between 0 and 100")
        
        # TODO: Update other settings (scan_interval, etc.)
        # These might require restarting the bot
        
        return {
            "message": "Settings updated",
            "settings": {
                "alert_threshold": hunter._alert_threshold,
                "scan_interval": getattr(settings, 'scan_interval_seconds', 300),
                "max_position_size": getattr(settings, 'max_position_size_pct', 5),
                "stop_loss_pct": getattr(settings, 'stop_loss_pct', 15),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating settings: {str(e)}")
