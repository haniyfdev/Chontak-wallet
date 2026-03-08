from pydantic import BaseModel, Field
from uuid import UUID
from typing import List, Optional

# -------- Request
class SavedCardCreate(BaseModel):
    card_number: str = Field(min_length=16, max_length=16)
    card_holder_name: Optional[str] = None
    alias: str = Field(min_length=1, max_length=50)

# -------- Request
class SavedCardUpdate(BaseModel):
    alias: str

# -------- Response 
class SavedCardsResponse(BaseModel):
    id: UUID
    owner_user_id: UUID
    card_number: str
    card_holder_name: str
    alias: str

    class Config:
        from_attributes = True

# -------- Response 
class SavedCardListResponse(BaseModel):
    total_saved_cards: int
    page: int
    limit: int
    total_pages: int
    data: List[SavedCardsResponse]

    class Config:
        from_attributes = True


