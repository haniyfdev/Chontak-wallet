from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import (Column, DECIMAL, Integer, String, DateTime, Date, ForeignKey, TIMESTAMP, Enum, CheckConstraint)
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.database import Base

class StatusCard(str, enum.Enum):
    ACTIVE = "active"
    FROZEN = "frozen"
    EXPIRED = "expired"
    CLOSED = "closed"

# - - - - - Modul Card
class Card(Base):
    __tablename__ = "cards"
    __table_args__ = (CheckConstraint("balance >= 0", name="Check_balance_non_negative"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False) #FK
    balance = Column(DECIMAL(15, 2), nullable=False, default=0.00)
    card_number = Column(String, unique=True, nullable=False, index=True)
    status = Column(Enum(StatusCard), nullable=False, default=StatusCard.FROZEN)
    expiry_date = Column(Date, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    # relationship
    user = relationship("User", back_populates="cards", uselist=False, lazy="joined")
    sent_money = relationship("Transaction", foreign_keys="[Transaction.from_card_id]", back_populates="from_card")
    received_money = relationship("Transaction", foreign_keys="[Transaction.to_card_id]", back_populates="to_card")
    subscriptions = relationship("Subscription", back_populates="card")

    @property
    def owner_name(self) -> str:
        return self.user.full_name if self.user else "Noma'lum"
    
    