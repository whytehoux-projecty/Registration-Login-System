from sqlalchemy import Column, String, Boolean
from app.models.base import BaseModel

class PendingUser(BaseModel):
    __tablename__ = "pending_users"
    
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    
    # Admin will review these
    is_reviewed = Column(Boolean, default=False)
    admin_notes = Column(String, nullable=True)