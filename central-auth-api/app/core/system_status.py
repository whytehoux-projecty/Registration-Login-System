from datetime import datetime, time, timedelta
from app.config import settings

def is_system_open() -> bool:
    """Check if current time is within operating hours"""
    now = datetime.now().time()
    opening = time(settings.OPENING_HOUR, settings.OPENING_MINUTE)
    closing = time(settings.CLOSING_HOUR, settings.CLOSING_MINUTE)
    
    return opening <= now < closing

def should_send_warning() -> bool:
    """Check if we're in warning period before closing"""
    now = datetime.now()
    closing = datetime.combine(now.date(), time(settings.CLOSING_HOUR, settings.CLOSING_MINUTE))
    warning_time = closing - timedelta(minutes=settings.WARNING_MINUTES)
    
    return warning_time <= now < closing

def get_system_status() -> dict:
    """Get detailed system status"""
    now = datetime.now()
    
    if is_system_open():
        if should_send_warning():
            closing = datetime.combine(now.date(), time(settings.CLOSING_HOUR, settings.CLOSING_MINUTE))
            minutes_left = int((closing - now).total_seconds() / 60)
            
            return {
                "status": "open",
                "warning": True,
                "message": f"System closing in {minutes_left} minutes. Please save your work.",
                "minutes_until_close": minutes_left
            }
        return {
            "status": "open",
            "warning": False,
            "message": "System is operating normally"
        }
    
    return {
        "status": "closed",
        "warning": False,
        "message": f"System is closed. Hours: {settings.OPENING_HOUR}:00 - {settings.CLOSING_HOUR}:00"
    }