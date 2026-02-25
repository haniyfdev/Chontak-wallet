from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Card, StatusCard, UserRole
from decimal import Decimal
import uuid

# ------------------
def id_for_transaction():
    return f"PBC-{uuid.uuid4().hex[:22].upper()}"

# ------------------
def validator_transaction(from_card: Card, to_card: Card, user_role: UserRole, amount: Decimal):
    if from_card.id == to_card.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O'z kartangizdan ayni shu kartaga mumkin emas")
   
    if from_card.status != StatusCard.ACTIVE or to_card.status != StatusCard.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ikki kartadan biri aktiv emas")

    if amount < 2000:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O'tkazma juda kam yoki ko'p")

    # for freemium user;
    if user_role == UserRole.USER: 
        commission = amount * Decimal("0.01")
        total_to_pay = amount + commission
        max_limit = 2000000

    # for premium users;
    elif user_role == UserRole.PREMIUM:
        commission = Decimal("0")
        total_to_pay = amount
        max_limit = 4000000 

    # for admin;
    else:
        commission = Decimal("0")
        total_to_pay = amount
        max_limit = 100000000

    if amount > max_limit:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Maksimal limitdan oshdi {max_limit}")
    
    if total_to_pay > from_card.balance:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Hisobingizda mablag' mavjud emas")
    
    return total_to_pay, commission

# ------------------
async def get_sender_card_with_lock(db, from_card_id, current_user) -> Card:
    result = await db.execute(select(Card).where(Card.id == from_card_id,
                                                 Card.user_id == current_user.id).with_for_update())
    sender_card = result.scalar_one_or_none()
    if not sender_card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Yuboruvchi karta topilmadi yoki sizga tegishli emas")
    
    return sender_card

# ------------------
async def get_receiver_card_with_lock(db, to_card_number) -> Card:
    result = await db.execute(select(Card).where(Card.card_number == to_card_number).with_for_update())
    receiver_card = result.scalar_one_or_none()
    if not receiver_card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Qabul qiluvchi karta mavjud emas")

    return receiver_card

# ------------------




