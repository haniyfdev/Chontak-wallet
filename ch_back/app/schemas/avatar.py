from pydantic import BaseModel
from uuid import UUID

# -------- Request
class AvatarCreate(BaseModel):
    photo_url: str
    user_id: UUID

# -------- Response 
class AvatarResponse(BaseModel):
    id: UUID
    photo_url: str

    class Config:
        from_attributes = True



