from fastapi import APIRouter, HTTPException, status, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import *
from app.config import settings
from app.services.auth import get_current_user
from app.schemas.saved_card import *
from app.models import User, Card, SavedCard
from uuid import UUID
from typing import List


router = APIRouter()

# ------------------------------ 1.endpoint
@router.post("/", response_model=SavedCardsResponse, status_code=status.HTTP_201_CREATED)
async def saved_card(scc: SavedCardCreate, 
                     get_current: User = Depends(get_current_user), 
                     db: AsyncSession = Depends(get_db)):
    

    # SavedCard object
    result = await db.execute(select(SavedCard).where(SavedCard.owner_user_id == get_current.id,
                                                        SavedCard.card_number == scc.card_number))
    card = result.unique().scalar_one_or_none()
    if card:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Bu karta save qilingan")

    # Card object
    resultt = await db.execute(select(Card).where(Card.card_number == scc.card_number))
    cardd = resultt.unique().scalar_one_or_none()
    if cardd:
        holder_name = cardd.owner_name
    else:
        holder_name = scc.card_holder_name

    new_save_card = SavedCard(
        owner_user_id = get_current.id,
        card_number = scc.card_number,
        card_holder_name = holder_name,
        alias = scc.alias
    )

    db.add(new_save_card)
    await db.commit()
    await db.flush()
    await db.refresh(new_save_card)

    return new_save_card


# ------------------------------ 2.endpoint
@router.get("/", response_model=SavedCardListResponse, status_code=status.HTTP_200_OK)
async def get_saved_cards(current_user: User = Depends(get_current_user), 
                        db: AsyncSession = Depends(get_db),
                        search_number: str = Query(None, min_length=4),
                        search_alias: str = Query(None, min_length=2),
                        search_owner: str = Query(None, min_length=2),
                        limit: int = Query(8, ge=1, le=20),
                        page: int = Query(1, ge=1)
                        ):
    
    # current_user filter
    query = select(SavedCard).where(SavedCard.owner_user_id == current_user.id)
    

    # searching
    if search_alias:
        query = query.where(SavedCard.alias.ilike(f"%{search_alias}%"))
    if search_number:
        query = query.where(SavedCard.card_number.ilike(f"%{search_number}%"))
    if search_owner:
        query = query.where(SavedCard.card_holder_name.ilike(f"%{search_owner}%"))

    # count saved cards
    count_query = await db.execute(select(func.count()).select_from(query.subquery()))
    total_saved_cards = count_query.scalar() or 0

    # pagination
    offset = (page - 1) * limit
    query = query.order_by(SavedCard.alias.desc()).offset(offset).limit(limit)

    # result
    result = await db.execute(query)
    saved_cards = result.scalars().all()

    return SavedCardListResponse(
        total_saved_cards = total_saved_cards,
        page = page,
        limit = limit,
        total_pages = (total_saved_cards + limit - 1) // limit,
        data = saved_cards
    )


# ------------------------------ 3.endpoint
@router.get("/{saved_card_id}", response_model=SavedCardsResponse, status_code=status.HTTP_200_OK)
async def get_save_card(saved_card_id: UUID, 
                        current_user: User = Depends(get_current_user), 
                        db: AsyncSession = Depends(get_db)):
    
    result = await db.execute(select(SavedCard)
                              .where(SavedCard.owner_user_id == current_user.id,
                                     SavedCard.id == saved_card_id))
    saved_card = result.scalar_one_or_none()
    if not saved_card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bu karta topilmadi")

    return saved_card

# ------------------------------ 4.endpoint
@router.patch("/{saved_card_id}", response_model=SavedCardsResponse, status_code=status.HTTP_200_OK)
async def get_edit_alias(saved_card_id: UUID,
                         scu: SavedCardUpdate, 
                         current_user: User = Depends(get_current_user),
                         db: AsyncSession = Depends(get_db)):
    
    result = await db.execute(select(SavedCard).where
                   (SavedCard.owner_user_id == current_user.id, SavedCard.id == saved_card_id))
    saved_card = result.scalar_one_or_none()
    if not saved_card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bu karta topilmadi")
    
    update_data = scu.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(saved_card, key, value)

    await db.commit()
    await db.refresh(saved_card)

    return saved_card


# ------------------------------ 5.endpoint
@router.delete("/{saved_card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_card(saved_card_id: UUID, 
                      current_user: User = Depends(get_current_user),
                      db: AsyncSession = Depends(get_db)):
    
    result = await db.execute(select(SavedCard).where
                   (SavedCard.owner_user_id == current_user.id, SavedCard.id == saved_card_id))
    saved_card = result.scalar_one_or_none()
    if not saved_card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bu karta topilmadi")
    
    await db.delete(saved_card)
    await db.commit()

    return None 

