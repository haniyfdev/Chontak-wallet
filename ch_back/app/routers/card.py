from fastapi import APIRouter, HTTPException, status, Depends
from app.models import User, StatusCard
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import *
from app.config import settings
from app.services.auth import get_current_user
from app.services.card import *
from app.schemas.card import *
from app.models import User, Card, StatusCard, UserRole
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta
from typing import List


router = APIRouter()


# ------------------------------ 1.endpoint
@router.post("/", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
async def create_card(current_user: User = Depends(get_current_user), 
                      db: AsyncSession = Depends(get_db)):
    
    result = await db.execute(select(func.count(Card.id)).where(Card.user_id == current_user.id))
    card_count = result.scalar()
    if card_count >= 1 and current_user.role == UserRole.USER:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="1 dona id'ga 1 dona card ! Premium sotib oling")
   
    if card_count >= 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="5tadan ko'p karta ochish mumkin emas")
   
    while True:
        c_number = card_number_generation()
        card_result = await db.execute(select(Card).where(Card.card_number == c_number))
        card_conflict = card_result.scalar_one_or_none()
        if card_conflict:
            continue
        else:
            break
    exp = date.today() + timedelta(days=1826)
    new_card = Card(
        user_id = current_user.id,
        card_number = c_number,
        expiry_date = exp
    )

    db.add(new_card)
    await db.commit()
    await db.refresh(new_card)
    return new_card

# ------------------------------ 2.endpoint
@router.get("/", response_model=List[CardResponse], status_code=status.HTTP_200_OK)
async def get_cards(current_user: User = Depends(get_current_user), 
                    db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Card).where(Card.user_id == current_user.id))
    cards = result.scalars().all()
    return cards # if card return else []

# ------------------------------ 3.endpoint
@router.get("/{card_id}", response_model=CardResponse, status_code=status.HTTP_200_OK)
async def get_card(card_id: UUID, 
                   current_user: User = Depends(get_current_user), 
                   db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Card).where(Card.id == card_id, Card.user_id == current_user.id))
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bu karta topilmadi")
    
    return card

# ------------------------------ 4.endpoint
@router.patch("/{card_id}/freeze", response_model=CardResponse, status_code=status.HTTP_200_OK)
async def frozen_card(card_id: UUID, 
                      current_user: User = Depends(get_current_user), 
                      db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Card).where(Card.id == card_id, Card.user_id == current_user.id))
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sizni Cardingiz yo'q")
   
    if card.status == StatusCard.CLOSED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu karta mavjud emas")
    elif card.status == StatusCard.ACTIVE:
        card.status = StatusCard.FROZEN
    elif card.status == StatusCard.FROZEN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Karta zotan muzlatilgan")

    await db.commit()
    await db.refresh(card)

    return card

# ------------------------------ 5.endpoint
@router.patch("/{card_id}/unfreeze", response_model=CardResponse, status_code=status.HTTP_200_OK)
async def unfrozen_card(card_id: UUID, 
                        current_user: User = Depends(get_current_user), 
                        db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Card).where(Card.id == card_id, Card.user_id == current_user.id))
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sizni bunday kartangiz yo'q")

    if card.status == StatusCard.CLOSED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu karta mavjud emas")
    elif card.status == StatusCard.FROZEN:
        card.status = StatusCard.ACTIVE
    elif card.status == StatusCard.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Karta zotan faol")

    await db.commit()
    await db.refresh(card)

    return card



