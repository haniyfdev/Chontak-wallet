from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.models import User, StatusCard
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from app.database import *
from app.config import settings
from app.services.auth import get_current_user
from app.services.transaction import *
from app.services.admin import *
from app.schemas.transaction import *
from app.schemas.card import *
from app.schemas.user import *
from app.models import *
from uuid import UUID
from datetime import date, timedelta
from typing import List

router = APIRouter(prefix="/admin")

# ------------------------------ 1.endpoint
@router.post("/deposit", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def deposit(tc: TransactionCreate,
                  current_user: User = Depends(get_current_user),
                  db: AsyncSession = Depends(get_db)):
    
    check_admin(current_user)
    
    depositer = await get_sender_card_with_lock(db, tc.from_card_id, current_user)
    receiver = await get_receiver_card_with_lock(db, tc.to_card_number)

    async with db.begin():
        total_amount, commission = validator_transaction(
            from_card=depositer,
            to_card=receiver,
            user_role=UserRole.ADMIN,
            amount=tc.amount
        )

        depositer.balance -= total_amount
        receiver.balance += tc.amount

        new_deposit = Transaction(
            to_card_id = receiver.id,
            amount = total_amount,
            commission = commission,
            type = TypeTransaction.DEPOSIT,
            status = StatusTransaction.SUCCESS,
            description = tc.description,
            completed_at = func.now()
        )

        db.add(new_deposit)

        await db.flush()
        await db.refresh(new_deposit)

    return new_deposit
        

# ------------------------------ 2.endpoint
@router.get("/platform-card", response_model=CardResponse, status_code=status.HTTP_200_OK)
async def get_platform_card(current_user: User = Depends(get_current_user), 
                            db: AsyncSession = Depends(get_db)):
    
    check_admin(current_user)
    
    result = await db.execute(select(Card).where(Card.card_number == settings.PLATFORM_CARD))
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Platform card mavjud emas")
    
    return card


# ------------------------------ 3.endpoint
@router.get("/all-users", response_model=UserListResponse, status_code=status.HTTP_200_OK)
async def get_all_users(current_user: User = Depends(get_current_user),
                        db: AsyncSession = Depends(get_db),
                        search_name: str = Query(None, min_length=3, max_length=60),
                        search_number: str = Query(None, min_length=3, max_length=16),
                        page: int = Query(1, ge=1),
                        limit: int = Query(10, le=30)
                        ):
    
    # Basic validation
    check_admin(current_user)
    
    query = select(User).where(User.role == UserRole.USER)

    # Searching
    if search_name:
        query = query.where(User.full_name.ilike(f"%{search_name}%"))
    
    if search_number: 
        query = query.where(User.phone_number.ilike(f"%{search_number}%"))

    # .count(users)
    count_users = await db.execute(select(func.count()).select_from(query.subquery()))
    total_users = count_users.scalar() or 0

    # pagination
    offset = (page - 1) * limit
    query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)

    # result
    result = await db.execute(query)
    users = result.scalars().all()

    return UserListResponse(
        total_users = total_users,
        page = page,
        limit = limit,
        total_pages = (total_users + limit - 1) // limit,
        data = users
    )


# ------------------------------ 4.endpoint
@router.get("/one-users/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_one_user(user_id: UUID,
                       current_user: User = Depends(get_current_user),
                       db: AsyncSession = Depends(get_db)):
    
    check_admin(current_user)
    
    result = await db.execute(select(User).options(selectinload(User.cards), selectinload(User.avatar)) # relationship 
                                          .where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bunday user topilmadi")
    
    return user


# ------------------------------ 5.endpoint
@router.get("/all-cards", response_model=CardListResponse, status_code=status.HTTP_200_OK)
async def get_all_cards(current_user: User = Depends(get_current_user),
                        db: AsyncSession = Depends(get_db),
                        search_owner: str = Query(None, min_length=3, max_length=50),
                        search_card_number: str = Query(None, min_length=2, max_length=16),
                        page: int = Query(1, ge=1),
                        limit: int = Query(8, le=50)
                        ):
    
    # validation basics
    check_admin(current_user)
    
    query = select(Card)

    # searching
    if search_owner:
        query = query.join(Card.user).where(User.full_name.ilike(f"%{search_owner}%"))
    if search_card_number:
        query = query.where(Card.card_number.ilike(f"%{search_card_number}%"))

    # .count(Cards)
    count_cards = await db.execute(select(func.count()).select_from(query.subquery()))
    total_cards = count_cards.scalar() or 0

    # pagination
    offset = (page - 1) * limit
    query = query.order_by(Card.created_at.desc()).offset(offset).limit(limit)

    # result
    result = await db.execute(query.options(selectinload(Card.user)))
    cards = result.scalars().all()

    return CardListResponse(
        total_cards = total_cards,
        page = page,
        limit = limit,
        total_pages = (total_cards + limit - 1) // limit,
        data = cards
    )


# ------------------------------ 6.endpoint
@router.get("/one-card/{card_id}", response_model=CardResponse, status_code=status.HTTP_200_OK)
async def get_card(card_id: UUID,
                   current_user: User = Depends(get_current_user),
                   db: AsyncSession = Depends(get_db)):
    
    check_admin(current_user)
    
    result = await db.execute(select(Card)
                              .options(selectinload(Card.user))
                              .where(Card.id == card_id))
    
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bunday karta mavjud emas")
    
    return card


# ------------------------------ 7.endpoint
@router.get("/all-transactions", response_model=TransactionListResponse, status_code=status.HTTP_200_OK)
async def get_all_transaction(current_user: User = Depends(get_current_user),
                              db: AsyncSession = Depends(get_db),
                              min_amount: Decimal = Query(None, ge=2000),
                              max_amount: Decimal = Query(None, le=10000000000),
                              start_date: date = Query(None),
                              end_date: date = Query(None),
                              card_number: str = Query(None, min_length=16, max_length=16),
                              page: int = Query(1, ge=1),
                              limit: int = Query(10, le=30)
                             ):
    
    # validation basics
    check_admin(current_user)
    
    query = select(Transaction)

    # searching/filtering
    if min_amount:
        query = query.where(Transaction.amount >= min_amount)
    if max_amount:
        query = query.where(Transaction.amount <= max_amount)
    if start_date:
        query = query.where(Transaction.created_at >= start_date)
    if end_date:
        query = query.where(Transaction.created_at <= end_date)
    if card_number: 
        query = query.where(or_(Transaction.from_card.has((Card.card_number.ilike(f"%{card_number}%"))),
                                 Transaction.to_card.has(Card.card_number.ilike(f"%{card_number}%"))
                              )
                          )
                           
    
    # .count(transaction)
    count = await db.execute(select(func.count()).select_from(query.subquery()))
    total_transaction = count.scalar() or 0

    # pagination
    offset = (page - 1) * limit
    query = query.order_by(Transaction.created_at.desc()).offset(offset).limit(limit)

    # result
    result = await db.execute(query.options(selectinload(Transaction.from_card),
                                            selectinload(Transaction.to_card)))
    transactions = result.scalars().all()

    return TransactionListResponse(
        total = total_transaction,
        page = page,
        limit = limit,
        total_pages = (total_transaction + limit - 1) // limit,
        data = transactions
        )
    


# ------------------------------ 8.endpoint
@router.get("/one-transaction", response_model=TransactionResponse, status_code=status.HTTP_200_OK)
async def get_one_transaction(transaction_id: str,
                              current_user: User = Depends(get_current_user),
                              db: AsyncSession = Depends(get_db)):
    
    check_admin(current_user)

    result = await db.execute(select(Transaction)
                     .options(selectinload(Transaction.from_card).selectinload(Card.user), 
                              selectinload(Transaction.to_card).selectinload(Card.user))
                     .where(Transaction.id == transaction_id))
    
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bu transaction topilmadi !")

    return transaction


# ------------------------------ 9.endpoint 
@router.patch("/status-card/{user_id}", response_model=CardResponse, status_code=status.HTTP_200_OK)
async def update_satatus_card(user_id: UUID,
                              action: ActionCard,
                              current_user: User = Depends(get_current_user),
                              db: AsyncSession = Depends(get_db)):
    
    check_admin(current_user)
    
    result = await db.execute(select(Card).where(Card.user_id == user_id))
    card = result.scalars().first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bu user'da card mavjud emas")

    if action == ActionCard.ACTIVE_FROM_FROZEN:
        to_active_from_frozen(card)
    elif action == ActionCard.ACTIVE_FROM_EXPIRED:
        to_active_from_expired(card)
    elif action == ActionCard.FROZEN:
        to_frozen(card)
    elif action == ActionCard.EXPIRED:
        to_expired(card)
    elif action == ActionCard.CLOSED:
        to_closed(card)

    await db.commit()
    await db.refresh(card)


    return card

# ------------------------------ 10.endpoint 
@router.patch("/user-role/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_user_role(user_id: UUID,
                           action: ActionUser,
                           current_user: User = Depends(get_current_user),
                           db: AsyncSession = Depends(get_db)):
    
    check_admin(current_user)

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bunday user topilmadi")
    
    if action == ActionUser.PREMIUM:
        to_premium(user)
    elif action == ActionUser.USER:
        to_user(user)

    await db.commit()
    await db.refresh(user)

    return user

# ------------------------------ 11.endpoint
#  Advenced
# ...........Statistika Dashboard (Analytics)
# Admin kirishi bilan bitta-bitta qidirib o'tirmay, umumiy manzarani ko'rishi kerak.
# Total Balance: Hamma foydalanuvchilar kartalaridagi jami pul miqdori.
# Today's Volume: Bugun jami necha so'm pul aylandi.
# Success vs Failed: Tranzaksiyalarning necha foizi muvaffaqiyatli va necha foizi xato bilan tugadi.




