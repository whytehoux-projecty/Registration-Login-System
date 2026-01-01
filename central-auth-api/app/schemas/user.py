from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    auth_key: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class PendingUserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    phone: Optional[str]
    is_reviewed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True