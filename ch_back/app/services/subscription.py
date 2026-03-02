from fastapi import HTTPException, status
from app.models import Card, User, Subscription
from .transaction import *
from uuid import UUID
from datetime import date, timedelta
from enum import Enum
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession


# ------------------
async def for_subscription(card: Card, db: AsyncSession):
    if card.status != StatusCard.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Card'ingiz active emas")

    sub_check = await db.execute(select(Subscription).where(Subscription.card_id == card.id,
                                                          Subscription.is_active == True))
    if sub_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Siz zotan premium ta'rifdasiz")

    return settings.SUBSCRIPTION_PRICE
    

    

