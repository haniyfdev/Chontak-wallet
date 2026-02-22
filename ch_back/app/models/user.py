from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.database import Base

class UserRole(enum.Enum):
    USER = "user"
    PREMIUM = "premium"
    ADMIN = "admin"

# - - - - - Modul User
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    full_name = Column(String, nullable=False)
    phone_number = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    created_at = Column(DateTime(timezone=True), server_default=func.now()) # utc mitaqa vaqti bilan, psql vaqtni oladi
    # relationship
    cards = relationship("Card", back_populates="user")
    avatar = relationship("Avatar", back_populates="user", uselist=False, cascade="all, delete-orphan")
    saved_cards = relationship("SavedCard", back_populates="owner_user")
    


