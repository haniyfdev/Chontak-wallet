from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from decimal import Decimal
from app.database import *
from app.config import settings
from app.services.auth import get_current_user
from app.services.subscription import *
from app.schemas.subscription import *
from app.models import User, Card, UserRole, TypeTransaction, StatusTransaction, Subscription, Transaction
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, date, timedelta



router = APIRouter()

# ------------------------------ 1.endpoint 
@router.post("/{card_id}", response_model=SubResponse, status_code=status.HTTP_201_CREATED)
async def subscription(card_id: UUID, 
                       current_user: User = Depends(get_current_user),
                       db: AsyncSession = Depends(get_transaction_db)):
    
    user_card = await get_sender_card_with_lock(db, card_id, current_user)
    head_card = await get_receiver_card_with_lock(db, settings.PLATFORM_CARD)
    price = await for_subscription(user_card, db)

    if user_card.balance < price:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Hisobingizda yetarli mablag' yo'q")

    user_card.balance -= price
    head_card.balance += price
    current_user.role = UserRole.PREMIUM
    await db.execute(update(User).where(User.id == current_user.id).values(role=UserRole.PREMIUM))

    # transaction
    new_transaction = Transaction(
        from_card_id = user_card.id,
        to_card_id = head_card.id,
        amount = price,
        commission = Decimal("0"),
        type = TypeTransaction.TRANSFER,
        status = StatusTransaction.SUCCESS,
        description = f"Premium obuna: {current_user.full_name}",
        completed_at = func.now()
    )

    # subscriber
    new_subscriber = Subscription(
        user_id = current_user.id,
        card_id = user_card.id,
        price = settings.SUBSCRIPTION_PRICE,
        next_payment_at = datetime.now() + timedelta(days=31),
        is_active = True
    )

    db.add(new_transaction)
    db.add(new_subscriber)
    await db.flush()
    await db.refresh(new_subscriber)

    return new_subscriber

# ------------------------------ 2.endpoint 
@router.get("/{card_id}", response_model=SubResponse, status_code=status.HTTP_200_OK)
async def get_sub(card_id: UUID, 
                  current_user: User = Depends(get_current_user),
                  db: AsyncSession = Depends(get_db)):
    
    result = await db.execute(select(Subscription).where(
                      Subscription.card_id == card_id,
                      Subscription.user_id == current_user.id,
                      Subscription.is_active == True
                    ))
    
    account = result.unique().scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bunday account topilmadi")
    
    return account