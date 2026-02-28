from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base
from sqlalchemy.dialects.postgresql import UUID
import uuid

# - - - - - Modul User
class Avatar(Base):
    __tablename__ = "avatars"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    photo_url = Column(String, nullable=False)
    # relationship
    user = relationship("User", back_populates="avatar", lazy='joined')
