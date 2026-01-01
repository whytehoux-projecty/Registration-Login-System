from sqlalchemy.orm import Session
from datetime import datetime
from app.models.pending_user import PendingUser
from app.models.active_user import ActiveUser
from app.core.security import hash_password
from app.utils.token_generator import generate_auth_key
from typing import Optional

def create_pending_user(
    email: str,
    username: str,
    password: str,
    full_name: str,
    phone: Optional[str],
    db: Session
) -> PendingUser:
    """
    Create a new user registration request
    User goes into pending_users table awaiting admin approval
    """
    # Check if email already exists in pending users
    existing_pending = db.query(PendingUser).filter(
        PendingUser.email == email
    ).first()
    
    if existing_pending:
        raise ValueError("Email already registered and pending approval")
    
    # Check if email already exists in active users
    existing_active = db.query(ActiveUser).filter(
        ActiveUser.email == email
    ).first()
    
    if existing_active:
        raise ValueError("Email already registered and approved")
    
    # Check if username already taken
    existing_username = db.query(PendingUser).filter(
        PendingUser.username == username
    ).first()
    
    if existing_username:
        raise ValueError("Username already taken")
    
    # Create new pending user
    hashed_pwd = hash_password(password)
    
    pending_user = PendingUser(
        email=email,
        username=username,
        hashed_password=hashed_pwd,
        full_name=full_name,
        phone=phone,
        is_reviewed=False
    )
    
    db.add(pending_user)
    db.commit()
    db.refresh(pending_user)
    
    return pending_user

def get_pending_users(db: Session, skip: int = 0, limit: int = 100):
    """
    Get all users awaiting approval
    Admin uses this to see who needs review
    """
    return db.query(PendingUser).filter(
        PendingUser.is_reviewed == False
    ).offset(skip).limit(limit).all()

def approve_user(user_id: int, admin_notes: Optional[str], db: Session) -> ActiveUser:
    """
    Approve a pending user and move them to active_users
    This is called when admin clicks 'Approve' button
    """
    # Find the pending user
    pending_user = db.query(PendingUser).filter(
        PendingUser.id == user_id
    ).first()
    
    if not pending_user:
        raise ValueError("Pending user not found")
    
    if pending_user.is_reviewed:
        raise ValueError("User already reviewed")
    
    # Create active user with same details
    active_user = ActiveUser(
        email=pending_user.email,
        username=pending_user.username,
        hashed_password=pending_user.hashed_password,
        full_name=pending_user.full_name,
        phone=pending_user.phone,
        auth_key=generate_auth_key(),  # Generate unique UUID for authentication
        is_active=True,
        approved_at=datetime.utcnow()
    )
    
    db.add(active_user)
    
    # Mark pending user as reviewed
    pending_user.is_reviewed = True
    pending_user.admin_notes = admin_notes or "Approved"
    
    db.commit()
    db.refresh(active_user)
    
    return active_user

def reject_user(user_id: int, reason: str, db: Session) -> bool:
    """
    Reject a pending user registration
    User stays in pending_users but marked as reviewed
    """
    pending_user = db.query(PendingUser).filter(
        PendingUser.id == user_id
    ).first()
    
    if not pending_user:
        raise ValueError("Pending user not found")
    
    if pending_user.is_reviewed:
        raise ValueError("User already reviewed")
    
    # Mark as reviewed with rejection reason
    pending_user.is_reviewed = True
    pending_user.admin_notes = f"Rejected: {reason}"
    
    db.commit()
    
    return True