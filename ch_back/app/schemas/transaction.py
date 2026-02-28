from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime
import enum


# -------- Enum
class StatusTransaction(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"

# -------- info
class CardShortInfo(BaseModel):
    owner_name: str
    card_number: str

    class Config: from_attributes = True

# -------- Request
class TransactionCreate(BaseModel):
    from_card_id: UUID 
    to_card_number: str = Field(min_length=16, max_length=16)
    amount: Decimal = Field(gt=0)
    description: Optional[str] = None

# -------- Response
class TransactionResponse(BaseModel):
    id: str
    from_card: Optional[CardShortInfo]
    to_card: CardShortInfo
    amount: Decimal
    commission: Decimal
    status: StatusTransaction
    description: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True
        populate_by_name = True # fro alias
        use_enum_values = True

# -------- Response
class TransactionListResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    data: List[TransactionResponse]

    class Config:
        from_attributes = True

# -------- Response
class DashboardResponse(BaseModel):
    total_balance: Decimal
    sender_transactions: Decimal
    receiver_transactions: Decimal
    total_commission: Decimal
    total_count: int
    success_transfers_count: int
    failed_transfers_count: int
    success_percent: str
    failed_percent: str

    class Config:
        from_attributes = True


