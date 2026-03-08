from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid

# - - - - - Saved Card
class SavedCard(Base):
    __tablename__ = "savedcards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    card_number = Column(String(16), nullable=False, index=True)
    card_holder_name = Column(String(60), nullable=False)
    alias = Column(String(50), nullable=False)

    owner_user = relationship("User", back_populates="saved_cards")

