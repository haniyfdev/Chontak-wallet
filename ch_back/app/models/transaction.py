from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import (Column, Integer, String, Text, DECIMAL, DateTime, ForeignKey, TIMESTAMP, Enum, CheckConstraint)
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.database import Base
from app.services.transaction import id_for_transaction

class TypeTransaction(enum.Enum):
    TRANSFER = "transfer"
    DEPOSIT = "deposit"

class StatusTransaction(enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"

# - - - - - Modul Transaction
class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="Check_amount_non_negative"),
        CheckConstraint("commission >= 0", name="Check_comission_non_negative"),
    )

    id = Column(String, primary_key=True, default=id_for_transaction, index=True)
    from_card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id"), nullable=True) # null --> admin deposit
    to_card_id = Column(UUID(as_uuid=True), ForeignKey('cards.id'), nullable=False)
    amount = Column(DECIMAL(15, 2), nullable=False)
    commission = Column(DECIMAL(15, 2), nullable=False)
    type = Column(Enum(TypeTransaction), nullable=False, default=TypeTransaction.TRANSFER)
    status = Column(Enum(StatusTransaction), nullable=False, default=StatusTransaction.PENDING)
    description = Column(Text, nullable=True, default=None)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    completed_at = Column(TIMESTAMP, nullable=True)
    # relationship
    from_card = relationship("Card", foreign_keys="[Transaction.from_card_id]", 
                                back_populates="sent_money", uselist=False, lazy="joined")
    to_card = relationship("Card", foreign_keys="[Transaction.to_card_id]", 
                              back_populates="received_money", uselist=False, lazy="joined")



