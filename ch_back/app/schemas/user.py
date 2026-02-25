from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional, List
from schemas.card import CardResponse
from schemas.avatar import AvatarResponse

# -------- Request
class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=50)
    phone_number: str = Field(..., pattern=r"^\+998\d{9}$")
    password: str = Field(..., min_length=8, max_length=16)

# -------- Request
class UserLogin(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+998\d{9}$")
    password: str = Field(..., min_length=8, max_length=16)

# -------- Update password
class UserChangePassword(BaseModel):
    old_password: str = Field(..., min_length=8, max_length=16)
    new_password: str = Field(..., min_length=8, max_length=16)
    confirm_password: str = Field(..., min_length=8, max_length=16)

# -------- Update
class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=3, max_length=50)
    phone_number: Optional[str] = Field(None, pattern=r"^\+998\d{9}$")

# -------- Response
class UserResponse(BaseModel):
    id: UUID
    name: str
    phone_number: str
    role: str
    avatar: Optional[AvatarResponse] = None

    class Config:
        from_attributes = True

# -------- Response 
class UserListResponse(BaseModel):
    total_users: int
    page: int
    limit: int
    total_pages: int
    data: List[UserResponse]
    cards: list[CardResponse] = []

    class Config:
        from_attributes = True

# -------- Request
class TokenData(BaseModel):
    user_id: str = Field(..., pattern=r"^\+998\d{9}$")

# -------- Response
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# -------- Response
class TokenRefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

# -------- Request
class RefreshTokenRequest(BaseModel):
    refresh_token: str
