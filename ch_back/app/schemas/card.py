from pydantic import BaseModel, Field
from datetime import date
from decimal import Decimal
from uuid import UUID
from enum import Enum
import enum
from typing import Optional

# ------- Enum
class StatusCard(str, enum.Enum):
    ACTIVE = "active"
    FROZEN = "frozen"
    EXPIRED = "expired"
    CLOSED = "closed"

# -------- Response 
class CardResponse(BaseModel):
    id: UUID
    user_id: UUID
    balance: Decimal
    card_number: str
    status: StatusCard
    expiry_date: date

    class Config:
        from_attributes = True

# -------- Response 
class CardListResponse(BaseModel):
    total_cards: int
    page: int
    limit: int
    total_pages: int
    data: list[CardResponse]
    