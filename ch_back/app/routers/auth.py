from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import redis.asyncio as aioredis
from app.redis_client import get_redis
from app.database import *
from app.config import settings
from app.schemas.user import *
from app.services.auth import *
from app.models import User


router = APIRouter()

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
@router.post("/refresh", response_model=TokenRefreshResponse, status_code=status.HTTP_201_CREATED)
async def refresh_access_token(
    rt: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis)):
    
    
    try:
        payload = jwt.decode(rt.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token muddati o'tgan yoki xato")
    
    redis_key = f"refresh_token:{user_id}"
    stored_token = await redis.get(redis_key)

    if not stored_token or stored_token != rt.refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token haqiqiy emas yoki bekor qilingan")
    
    new_access_token = create_access_token(data={"sub": user_id})
    new_refresh_token = create_refresh_token(data={"sub": user_id})

    await redis.set(redis_key, new_refresh_token, ex=7 * 24 * 60 * 60)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


# ------------------------------ 3.endpoint
@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(data: OAuth2PasswordRequestForm = Depends(),
                db: AsyncSession = Depends(get_db),
                redis: aioredis.Redis = Depends(get_redis)):
    result = await db.execute(select(User).where(User.phone_number == data.username)) #phone_number
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bunday User mavjud emas")
    
    is_verifed = verify_password(data.password, user.hashed_password)
    if not is_verifed: # False
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Parol notog'ri")
    
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    redis_key = f"refresh_token:{user.id}"

    expire_seconds = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

    await redis.set(redis_key, refresh_token, ex=expire_seconds)


    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

# ------------------------------ 4.endpoint
@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

# ------------------------------ 5.endpoint
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

# ------------------------------ 6.endpoint
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

# ------------------------------ 7.endpoint
@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(current_user: User = Depends(get_current_user),
                 redis: aioredis.Redis = Depends(get_redis)):
    
    redis_key = f"refresh_token:{current_user.id}"
    await redis.delete(redis_key)
    return {"detail": "Tizimdan chiqdingiz"}


