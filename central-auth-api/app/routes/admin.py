from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.user import PendingUserResponse, UserResponse
from app.schemas.admin import ApprovalRequest, RejectionRequest, LoginHistoryResponse, AdminLogin
from app.services import registration_service, admin_service, notification_service
from app.models.active_user import ActiveUser
from app.core.security import create_access_token
from app.core.dependencies import get_current_admin
from app.models.admin import Admin

router = APIRouter()

from app.middleware.rate_limiter import login_rate_limiter

@router.post("/login", dependencies=[Depends(login_rate_limiter.check_rate_limit)])
def login(credentials: AdminLogin, db: Session = Depends(get_db)):
    """
    Authenticate admin and return access token
    """
    admin = admin_service.authenticate_admin(
        username=credentials.username,
        password=credentials.password,
        db=db
    )
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": admin.username, "type": "admin", "id": admin.id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": admin.id,
            "username": admin.username,
            "email": admin.email,
            "full_name": admin.full_name,
            "role": "super_admin" if admin.is_super_admin else "admin"
        }
    }

@router.get("/pending", response_model=List[PendingUserResponse])
def get_pending_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Get all users awaiting approval
    Admin control center calls this to display pending registrations
    """
    try:
        pending_users = registration_service.get_pending_users(db, skip, limit)
        return pending_users
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve pending users: {str(e)}"
        )

@router.post("/approve/{user_id}", response_model=UserResponse)
def approve_user(
    user_id: int,
    approval: ApprovalRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Approve a pending user registration
    Moves user from pending_users to active_users
    """
    try:
        # Approve the user
        active_user = registration_service.approve_user(
            user_id=user_id,
            admin_notes=approval.admin_notes,
            db=db
        )
        
        # Send approval notification to user
        notification_service.notify_user_approval(
            email=active_user.email,
            username=active_user.username
        )
        
        return active_user
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve user: {str(e)}"
        )

@router.post("/reject/{user_id}")
def reject_user(
    user_id: int,
    rejection: RejectionRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Reject a pending user registration
    Marks user as reviewed with rejection reason
    """
    try:
        success = registration_service.reject_user(
            user_id=user_id,
            reason=rejection.reason,
            db=db
        )
        
        return {
            "success": success,
            "message": f"User {user_id} has been rejected"
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/login-history")
def get_login_history(
    user_id: Optional[int] = None,
    service_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Get login history for admin dashboard
    Shows who logged into which service and when
    """
    try:
        history = admin_service.get_login_history(
            db=db,
            user_id=user_id,
            service_id=service_id,
            skip=skip,
            limit=limit
        )
        
        return history
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve login history: {str(e)}"
        )

@router.get("/user-stats/{user_id}")
def get_user_statistics(
    user_id: int, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Get statistics for a specific user
    Shows total logins, services used, etc.
    """
    try:
        stats = admin_service.get_user_statistics(user_id, db)
        return stats
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Get all active users
    """
    users = db.query(ActiveUser).offset(skip).limit(limit).all()
    return users