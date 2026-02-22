from fastapi import HTTPException, status
from app.models import Card, User, StatusCard, UserRole
from uuid import UUID
from datetime import datetime, date, timedelta
from enum import Enum
import enum

# ------------------
class ActionCard(str, enum.Enum):
    ACTIVE_FROM_FROZEN = "active_from_frozen"
    ACTIVE_FROM_EXPIRED = "active_from_expired"
    EXPIRED = "expired"
    CLOSED = "closed"
    FROZEN = "frozen"

# ------------------
class ActionUser(str, enum.Enum):
    PREMIUM = "premium"
    USER = "user"

# ------------------
def check_admin(current_user: User):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Siz admin emassiz !")

    return current_user

# ------------------
def to_expired(card: Card):
    today = datetime.now()
    if card.expiry_date <= today:
        card.status = StatusCard.EXPIRED

    return card

# ------------------
def to_closed(card: Card):
    if card.status != StatusCard.CLOSED:
        card.status = StatusCard.CLOSED

    return card

# ------------------
def to_active_from_frozen(card: Card):
    if card.status == StatusCard.FROZEN:
        card.status = StatusCard.ACTIVE

    return card

# ------------------
def to_active_from_expired(card: Card):
    if card.status == StatusCard.EXPIRED:
        exp = date.today() + timedelta(days=1286)
        card.expiry_date = exp
        card.status = StatusCard.ACTIVE
    
    return card

# ------------------
def to_frozen(card: Card):
    if card.status == StatusCard.ACTIVE or card.status == StatusCard.EXPIRED:
        card.status = StatusCard.FROZEN

    return card

# ------------------
def to_premium(user: User):
    if user.role == ActionUser.USER:
        user.role = ActionUser.PREMIUM
    
# ------------------
def to_user(user: User):
    if user.role == ActionUser.PREMIUM:
        user.role = ActionUser.USER
        

