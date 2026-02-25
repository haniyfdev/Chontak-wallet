from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import *
from app.config import settings
from app.schemas.user import *
from app.services.auth import *
from app.models import User


router = APIRouter(prefix="/auth")

# ------------------------------ 1.endpoint
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def registration(uc: UserCreate, 
                       db: AsyncSession = Depends(get_db)):
    num = await db.execute(select(User).where(User.phone_number == uc.phone_number))
    number = num.scalar_one_or_none()
    if number:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Boshqa raqam kiriting")
    
    hashed = hash_password(uc.password)

    new_user = User(
        full_name = uc.full_name,
        phone_number = uc.phone_number,
        hashed_password = hashed
    )    

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user

# ------------------------------ 2.endpoint
@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(ul: UserLogin, 
                db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone_number == ul.phone_number))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bunday User mavjud emas")
    
    is_verifed = verify_password(ul.password, user.hashed_password)
    if not is_verifed: # False
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Parol notog'ri")
    
    access_token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

# ------------------------------ 3.endpoint
@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

# ------------------------------ 4.endpoint
@router.patch("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_profile_info(uu: UserUpdate, 
                           current_user: User = Depends(get_current_user), 
                           db: AsyncSession = Depends(get_db)):

    update_data = uu.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)

    await db.commit()
    await db.refresh(current_user)

    return current_user

# ------------------------------ 5.endpoint
@router.patch("/change-password", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def change_password(ucp: UserChangePassword,
                          current_user: User = Depends(get_current_user),
                          db: AsyncSession = Depends(get_db)):
    if not verify_password(ucp.old_password, current_user.hashed_password): # -> False
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Parol noto'g'ri")
    
    if ucp.new_password != ucp.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tasdiqlovchi parol noto'g'ri")
    
    current_user.hashed_password = hash_password(ucp.new_password)

    await db.commit()
    await db.refresh(current_user)
    return current_user

