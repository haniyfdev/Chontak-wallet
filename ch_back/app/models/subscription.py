from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import (Column, DECIMAL, DateTime, Boolean, ForeignKey, TIMESTAMP, DATE)
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id"), nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False, default=85000.00)
    created_at = Column(TIMESTAMP, server_default=func.now())
    next_payment_at = Column(DATE, nullable=False)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="subscriptions")
    card = relationship("Card", back_populates="subscriptions")

