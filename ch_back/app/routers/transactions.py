from fastapi import APIRouter, HTTPException, Request, status, Depends, Query
from app.models import User, StatusCard
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.database import *
from app.config import settings
from app.services.auth import get_current_user
from app.services.transaction import *
from app.schemas.transaction import *
from app.models import *
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta
from typing import List
from app.config import settings
import redis.asyncio as aioredis
from app.config import get_redis




router = APIRouter()


# ------------------------------ 1.endpoint
@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def send_money(tc: TransactionCreate, 
                     current_user: User = Depends(get_current_user),
                     db: AsyncSession = Depends(get_db),
                     _limit = Depends(rate_limiter),
                     _idem = Depends(check_idempotency)):
    
    async with db.begin():
        from_card = await get_sender_card_with_lock(db, tc.from_card_id, current_user)
        to_card = await get_receiver_card_with_lock(db, tc.to_card_number)
        
        total_to_pay, commission = validator_transaction(
            from_card=from_card,
            to_card=to_card,
            user_role=current_user.role,
            amount=tc.amount
        )

        from_card.balance -= total_to_pay
        to_card.balance += tc.amount
        
        # commission to chontak
        if commission > 0: # if not premium and admin
            platform = await db.execute(
                select(Card).where(Card.card_number == settings.PLATFORM_CARD).with_for_update()
            )                                                                  # row closed temporarily
            platform_card = platform.scalar_one()
            platform_card.balance += commission
 
        # new transaction
        new_transaction = Transaction(            
            from_card_id = from_card.id,
            to_card_id = to_card.id,
            amount = tc.amount,
            commission = commission,
            type = TypeTransaction.TRANSFER,
            status = StatusTransaction.SUCCESS,
            description = tc.description,
            completed_at = func.now()
        )

        db.add(new_transaction)
        await db.flush()
        await db.refresh(new_transaction) 
        # autocommit

    return new_transaction


# ------------------------------ 2.endpoint
@router.get("/", response_model=TransactionListResponse, status_code=status.HTTP_200_OK)
async def get_all_transactions(current_user: User = Depends(get_current_user),
                               db: AsyncSession = Depends(get_db),
                               start_date: date = None, 
                               end_date: date = None, 
                               amount: Decimal = None,
                               limit: int = Query(8, ge=1, le=20),
                               page: int = Query(1, ge=1)
                            ):
    # filter
    base_filter = or_(
        Transaction.from_card.has(user_id = current_user.id),
        Transaction.to_card.has(user_id = current_user.id)
    )
    query = select(Transaction).where(base_filter)

    if start_date:
        query = query.where(Transaction.created_at >= start_date)

    if end_date:
        query = query.where(Transaction.created_at <= end_date)
    
    if amount:
        query = query.where(Transaction.amount == amount)

    # async count
    count_query = await db.execute(select(func.count()).select_from(query.subquery()))
    total_checks = count_query.scalar() or 0

    # pagination
    offset = (page - 1) * limit
    query = query.order_by(Transaction.created_at.desc()).offset(offset).limit(limit)

    # result
    result = await db.execute(query)
    checks = result.scalars().all()

    return TransactionListResponse(
        total = total_checks,
        page = page,
        limit = limit,
        total_pages = (total_checks + limit-1) // limit,
        data = checks
    )



# ------------------------------ 3.endpoint
@router.get("/{transaction_id}", response_model=TransactionResponse, status_code=status.HTTP_200_OK)
async def get_transaction(transaction_id: str, 
                          current_user: User = Depends(get_current_user),
                          db: AsyncSession = Depends(get_db)):
    
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id,
                                                  or_(
                                                      Transaction.from_card.has(user_id = current_user.id),
                                                      Transaction.to_card.has(user_id = current_user.id)
                                                    )))                                                

    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tranzaksiya topilmadi yoki ruhsatingiz yo'q")

    return transaction
