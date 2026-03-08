from pydantic import BaseModel, Field
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID
from enum import Enum
import enum
from typing import Optional

# -------- Request
class SubRequest(BaseModel):
    price: Decimal
    to_card: str
    

# -------- Response 
class SubResponse(BaseModel):
    id: UUID
    user_id: UUID
    card_id: UUID
    price: Decimal
    created_at: datetime
    next_payment_at: date
    is_active: bool





