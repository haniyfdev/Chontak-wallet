from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, Date
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


router = APIRouter()

# ------------------------------ 1.endpoint
@router.post("/deposit", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def deposit(tc: TransactionCreate,
                  current_user: User = Depends(get_current_user),
                  db: AsyncSession = Depends(get_transaction_db)):
    
    check_admin(current_user)

    depositer = await get_sender_card_with_lock(db, tc.from_card_id, current_user)
    receiver = await get_receiver_card_with_lock(db, tc.to_card_number)

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
    
    result = await db.execute(select(Card)
                     .where(Card.card_number == settings.PLATFORM_CARD).with_for_update(of=Card))
                            
    card = result.unique().scalar_one_or_none()
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
    total_users = count_users.unique().scalar() or 0

    # pagination
    offset = (page - 1) * limit
    query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)

    # result
    result = await db.execute(query)
    users = result.unique().scalars().all()

    return UserListResponse(
        total_users = total_users,
        page = page,
        limit = limit,
        total_pages = (total_users + limit - 1) // limit,
        data = users
    )


# ------------------------------ 4.endpoint
@router.get("/one-users/{user_id}", response_model=UserbyCardResponse, status_code=status.HTTP_200_OK)
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
@router.patch("/status-card/{card_id}", response_model=CardResponse, status_code=status.HTTP_200_OK)
async def update_satatus_card(card_id: UUID,
                              status: StatusCard,
                              current_user: User = Depends(get_current_user),
                              db: AsyncSession = Depends(get_db)):
    
    check_admin(current_user)
    
    result = await db.execute(select(Card).where(Card.id == card_id))
    card = result.unique().scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bunday card mavjud emas")

    if status == StatusCard.CLOSED:
        to_closed(card)
    
    elif status == StatusCard.FROZEN:
        to_frozen(card)

    elif status == StatusCard.ACTIVE:
        to_active(card)

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
    user = result.unique().scalar_one_or_none()
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
@router.get("/verify-all-balance", status_code=status.HTTP_200_OK)
async def get_verify_balances(current_user: User = Depends(get_current_user),
                              db: AsyncSession = Depends(get_db),
                              search_number: str = Query(None, min_length=4, max_length=16),
                              page: int = 1,
                              limit: int = 16 ):
    
    # Filter
    check_admin(current_user)

    query = select(
        Card.id, Card.card_number, Card.balance.label("stored_balance"),

        func.coalesce(select(func.sum(Transaction.amount))
                      .where(Transaction.to_card_id == Card.id,
                      Transaction.status == StatusTransaction.SUCCESS)
                      .scalar_subquery(), 0
        ).label("total_incoming"),
                   
        func.coalesce(select(func.sum(Transaction.amount + Transaction.commission))
                      .where(Transaction.from_card_id == Card.id,
                      Transaction.status == StatusTransaction.SUCCESS)
                      .scalar_subquery(), 0
        ).label("total_outgoing")
    )

    # Search
    if search_number:
        query = query.where(Card.card_number.ilike(f"%{search_number}%"))

    # Calcualtion in db
    subq = query.subquery()
    total_cards = await db.scalar(select(func.count()).select_from(subq))
   
    total_invalid = select(func.count()).select_from(subq).where(
        func.abs(subq.c.stored_balance - (subq.c.total_incoming - subq.c.total_outgoing)) > 0.01
    )
    
    total_invalid_cards = await db.scalar(total_invalid)
   
    total_valid_cards = total_cards - total_invalid_cards
   
    # Pagination
    offset = (page - 1) * limit
    query = query.order_by(Card.created_at.desc()).offset(offset).limit(limit)

    # result
    result = await db.execute(query)
    rows = result.unique().all()

    invalid_cards = []
    valid_card_count = 0

    for row in rows:
        calculated_balance = row.total_incoming - row.total_outgoing 
        difference = row.stored_balance - calculated_balance

        if abs(difference) > 0.01:
            invalid_cards.append({
                "card_number": row.card_number,
                "stored_balance": row.stored_balance,
                "calculated_balance": calculated_balance,
                "difference": difference
            })
        else:
            valid_card_count += 1

    return {
        "total_page": (total_cards + limit -1) // limit,
        "total_cards": total_cards,
        "total_valid_cards": total_valid_cards,
        "total_invalid_cards": total_invalid_cards,
        "page": page,
        "limit": limit,
        "bug_details": invalid_cards
    }


# ------------------------------ 12.endpoint
@router.get("/verify_balance/{card_id}", status_code=status.HTTP_200_OK)
async def get_verify_balance(card_id: UUID,
                             current_user: User = Depends(get_current_user),
                             db: AsyncSession = Depends(get_db)):
    
    check_admin(current_user)

    result = await db.execute(select(Card).where(Card.id == card_id))
    card = result.unique().scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bunday karta topilmadi !")

    incoming = await db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0))
        .where(Transaction.to_card_id == card_id, Transaction.status == StatusTransaction.SUCCESS))
    
    outgoing = await db.scalar(
        select(func.coalesce(func.sum(Transaction.amount + Transaction.commission), 0))
        .where(Transaction.from_card_id == card_id, Transaction.status == StatusTransaction.SUCCESS))
    
    calculated_balance = incoming - outgoing
    difference = card.balance - calculated_balance

    return {
        "card_info": {
            "id": card.id,
            "number": card.card_number,
            "owner_id": card.user_id
        },
        "audit": {
            "stored_balance": card.balance,
            "calculated_balance": calculated_balance,
            "difference": difference,
            "status": "OK" if abs(difference) < 0.01 else "Error"
        }
    }


# ------------------------------ 13.endpoint
@router.get("/dashboard",response_model=DashboardResponse, status_code=status.HTTP_200_OK)
async def get_dashboard(current_user: User = Depends(get_current_user),
                        calendar: Optional[date] = Query(None),
                        db: AsyncSession = Depends(get_db)):
    
    check_admin(current_user)

    if not calendar:
        calendar = date.today()

    total_balance = await db.scalar(select(func.coalesce(func.sum(Card.balance), 0)))
    
    sender_transaction = await db.scalar(select(func.coalesce(func.sum(Transaction.amount), 0))
                            .where(func.cast(Transaction.completed_at, Date) == calendar,
                                   Transaction.from_card_id.isnot(None)))
    # bu ikkisini haqiqiy ko'rinishi withdraval type' bilan keyinchalik qoshiladi
    receiver_transaction = await db.scalar(select(func.coalesce(func.sum(Transaction.amount), 0))
                            .where(func.cast(Transaction.completed_at, Date) == calendar,
                                   Transaction.to_card_id.isnot(None)))

    total_commission = await db.scalar(select(func.coalesce(func.sum(Transaction.commission), 0))
                               .where(func.cast(Transaction.completed_at, Date) == calendar,
                                      Transaction.status == StatusTransaction.SUCCESS))

    # math
    count_success = await db.scalar(select(func.count(Transaction.id))
                         .where(Transaction.status == StatusTransaction.SUCCESS,
                                func.cast(Transaction.completed_at, Date) == calendar))


    count_failed = await db.scalar(select(func.count(Transaction.id))
                        .where(Transaction.status == StatusTransaction.FAILED,
                               func.cast(Transaction.completed_at, Date) == calendar))
    
    total = count_success + count_failed

    # percent
    if total > 0:
        percent_success = f"{(count_success / total) * 100:.2f}"
        percent_failed = f"{(count_failed / total) * 100:.2f}"
    else:
        percent_success = 0
        percent_failed = 0


    
    return DashboardResponse(
        total_balance = total_balance,
        sender_transactions = sender_transaction,
        receiver_transactions = receiver_transaction,
        total_commission = total_commission,
        total_count = total,
        success_transfers_count = count_success,
        failed_transfers_count = count_failed,
        success_percent = percent_success,
        failed_percent = percent_failed
    )
                            

