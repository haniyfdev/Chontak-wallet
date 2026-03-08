from fastapi import HTTPException, status
from app.models import Card, User, StatusCard, UserRole
from uuid import UUID
from datetime import datetime, date, timedelta
from enum import Enum
import enum

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
def to_closed(card: Card):
    if card.status == StatusCard.CLOSED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Card zotan yopiq")
    
    card.status = StatusCard.CLOSED

    return card

# ------------------
def to_frozen(card: Card):
    if card.status == StatusCard.FROZEN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Card zotan muzlatilgan")
    elif card.status == StatusCard.CLOSED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Card faoliyatda emas")
    
    card.status = StatusCard.FROZEN

# ------------------
def to_active(card: Card):
    if card.status == StatusCard.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Card zotan aktiv")
    elif card.status != StatusCard.FROZEN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Faqat muzlatilgan cards'gina aktivlanadi")
    
    card.status = StatusCard.ACTIVE
    return card

# ------------------
def to_premium(user: User):
    if user.role == ActionUser.PREMIUM:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profil zotan premium tarifda")
    else:
        user.role = ActionUser.PREMIUM

    return user
    
# ------------------
def to_user(user: User):
    if user.role == ActionUser.USER:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profil zotan freemium tarifda")
    else:
        user.role = ActionUser.USER
        
    return user

