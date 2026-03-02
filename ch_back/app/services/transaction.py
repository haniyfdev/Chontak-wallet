from fastapi import Header, HTTPException, status, Request, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, Card, StatusCard, UserRole
from .auth import get_current_user
from decimal import Decimal
import uuid
import redis.asyncio as aioredis
from app.redis_client import get_redis
from app.config import settings

redis_client = aioredis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)

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
    result = await db.execute(select(Card)
                     .where(Card.id == from_card_id,
                     Card.user_id == current_user.id).with_for_update(of=Card))
    
    sender_card = result.unique().scalar_one_or_none()
    if not sender_card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Yuboruvchi karta topilmadi yoki sizga tegishli emas")
    
    return sender_card

# ------------------
async def get_receiver_card_with_lock(db, to_card_number) -> Card:
    result = await db.execute(select(Card)
                     .where(Card.card_number == to_card_number).with_for_update(of=Card))
    receiver_card = result.unique().scalar_one_or_none()
    if not receiver_card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Qabul qiluvchi karta mavjud emas")

    return receiver_card

# ------------------
async def rate_limiter(request: Request, 
                       current_user: User = Depends(get_current_user)) -> bool:

    user_id = current_user.id

    key = f"rate_limit:{user_id}"
    limit = 30
    window = 60

    current_requests = await redis_client.incr(key)

    if current_requests == 1:
        await redis_client.expire(key, window)
    
    if current_requests > limit:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, 
                            detail="Juda ko'p request yubordingiz")
    
    return True

# ------------------
async def check_idempotency(idempotency_key: str = Header(None)):

    if not idempotency_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Idempotency-key sarlavhasi yetishmayapti")

    key = f"idempotency:{idempotency_key}"

    is_new = await redis_client.set(key, "locked", nx=True, ex=86400)
    if not is_new:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Bu tranzaksiya allaqachon bajarilgan yoki jarayaonda !")
    return True



