from fastapi import APIRouter
from app.core.system_status import get_system_status, is_system_open
from app.schemas.system import SystemStatusResponse
from datetime import datetime, time
from app.config import settings

router = APIRouter()

@router.get("/status", response_model=SystemStatusResponse)
def get_status():
    """
    Get current system status
    
    Shows if system is open, closed, or closing soon
    All apps should call this periodically to show warnings
    """
    status = get_system_status()
    return SystemStatusResponse(**status)

@router.get("/operating-hours")
def get_operating_hours():
    """
    Get configured operating hours
    """
    return {
        "opening_time": f"{settings.OPENING_HOUR:02d}:{settings.OPENING_MINUTE:02d}",
        "closing_time": f"{settings.CLOSING_HOUR:02d}:{settings.CLOSING_MINUTE:02d}",
        "warning_minutes_before_close": settings.WARNING_MINUTES,
        "timezone": "UTC",
        "currently_open": is_system_open()
    }

@router.get("/health")
def health_check():
    """
    Simple health check endpoint
    Returns 200 if API is running
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "system_open": is_system_open()
    }