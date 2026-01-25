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
from database.supabase_client import get_supabase_client

router = APIRouter()


class SettingsUpdate(BaseModel):
    alert_threshold: Optional[int] = None
    scan_interval: Optional[int] = None
    max_position_size: Optional[float] = None
    stop_loss_pct: Optional[float] = None


@router.get("")
async def get_settings():
    """
    Get current settings
    ✅ עכשיו קורא מ-Supabase אם יש, אחרת מ-config
    """
    try:
        # Try to get from Supabase first
        supabase = get_supabase_client()
        if supabase and supabase.enabled:
            try:
                async with supabase:
                    # Check if settings table exists and has data
                    response = await supabase._client.get("/settings", params={"limit": 1})
                    if response.status_code == 200:
                        settings_data = response.json()
                        if settings_data and len(settings_data) > 0:
                            # Return from database
                            db_settings = settings_data[0]
                            return {
                                "alert_threshold": db_settings.get("alert_threshold", 85),
                                "scan_interval": db_settings.get("scan_interval", 300),
                                "max_position_size": db_settings.get("max_position_size", 5),
                                "stop_loss_pct": db_settings.get("stop_loss_pct", 15),
                            }
            except Exception as e:
                # If table doesn't exist or error, fallback to config
                pass
        
        # Fallback to config/hunter
        hunter = get_solanahunter()
        current_threshold = hunter.scoring_engine.alert_threshold if hunter and hasattr(hunter, 'scoring_engine') else 85
        
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
    """
    Update settings
    ✅ עכשיו שומר ב-Supabase וגם מעדכן את הבוט
    """
    try:
        hunter = get_solanahunter()
        
        # Validation
        if request.alert_threshold is not None:
            if not (0 <= request.alert_threshold <= 100):
                raise HTTPException(status_code=400, detail="Alert threshold must be between 0 and 100")
        
        if request.scan_interval is not None:
            if not (60 <= request.scan_interval <= 3600):
                raise HTTPException(status_code=400, detail="Scan interval must be between 60 and 3600 seconds")
        
        if request.max_position_size is not None:
            if not (1 <= request.max_position_size <= 50):
                raise HTTPException(status_code=400, detail="Max position size must be between 1 and 50%")
        
        if request.stop_loss_pct is not None:
            if not (1 <= request.stop_loss_pct <= 50):
                raise HTTPException(status_code=400, detail="Stop loss must be between 1 and 50%")
        
        # Update in memory (hunter)
        if hunter:
            if request.alert_threshold is not None and hasattr(hunter, 'scoring_engine'):
                hunter.scoring_engine.alert_threshold = request.alert_threshold
        
        # Save to Supabase
        supabase = get_supabase_client()
        if supabase and supabase.enabled:
            try:
                async with supabase:
                    # Get current settings to merge
                    current_settings = {}
                    try:
                        response = await supabase._client.get("/settings", params={"limit": 1})
                        if response.status_code == 200:
                            existing = response.json()
                            if existing and len(existing) > 0:
                                current_settings = existing[0]
                    except:
                        pass
                    
                    # Prepare settings to save
                    settings_to_save = {
                        "user_id": "default",  # Single user for now
                        "alert_threshold": request.alert_threshold if request.alert_threshold is not None else current_settings.get("alert_threshold", 85),
                        "scan_interval": request.scan_interval if request.scan_interval is not None else current_settings.get("scan_interval", 300),
                        "max_position_size": request.max_position_size if request.max_position_size is not None else current_settings.get("max_position_size", 5),
                        "stop_loss_pct": request.stop_loss_pct if request.stop_loss_pct is not None else current_settings.get("stop_loss_pct", 15),
                    }
                    
                    # Upsert (insert or update)
                    if current_settings and "id" in current_settings:
                        # Update existing
                        await supabase._client.patch(f"/settings?id=eq.{current_settings['id']}", json=settings_to_save)
                    else:
                        # Insert new
                        await supabase._client.post("/settings", json=settings_to_save)
            except Exception as db_error:
                # Log but don't fail - settings still updated in memory
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Failed to save settings to Supabase: {db_error}")
        
        # Get final settings
        final_threshold = request.alert_threshold if request.alert_threshold is not None else (hunter.scoring_engine.alert_threshold if hunter and hasattr(hunter, 'scoring_engine') else 85)
        
        return {
            "message": "Settings updated successfully",
            "settings": {
                "alert_threshold": final_threshold,
                "scan_interval": request.scan_interval if request.scan_interval is not None else getattr(settings, 'scan_interval_seconds', 300),
                "max_position_size": request.max_position_size if request.max_position_size is not None else getattr(settings, 'max_position_size_pct', 5),
                "stop_loss_pct": request.stop_loss_pct if request.stop_loss_pct is not None else getattr(settings, 'stop_loss_pct', 15),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating settings: {str(e)}")
