from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
import os
import shutil
import uuid
from sqlalchemy import select
from redis import asyncio as aioredis
from app.config import settings
from app.schemas.avatar import *
from app.services.auth import get_current_user, get_db
from app.models import User, Avatar
from app.redis_client import get_redis


router = APIRouter()

# ------------------------------ 1.endpoint
@router.post("/{user_id}", status_code=status.HTTP_200_OK)
async def avatar_create(user_id: UUID, 
                        image: UploadFile = File(...),
                        current_user: User = Depends(get_current_user),
                        db: AsyncSession = Depends(get_db),
                        redis: aioredis.Redis = Depends(get_redis)
                        ):
    
    if image.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rasm formati png/jpeg bo'lsin")
    
    MAX_SIXE = 5 * 1024 * 1024
    if image.size > MAX_SIXE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rasm 5mb'dan katta bo'lmasligi kerek")


    try:
        # Rate limiting
        limit_key = f"rate:avatar:{current_user.id}"

        request_count = await redis.incr(limit_key)

        if request_count == 1:
            await redis.expire(limit_key, 60)

    except Exception as e:
        print(f"Redis error: {str(e)}")
        request_count = 0 

        if request_count > 5:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, 
                                detail="Ko'p so'ro'v yubordingiz biroz kuting")


    upload_dir = "static/avatars"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, 
                            detail="Bunday user mavjud emas")
    
    if user.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
                            detail="Bu profile sizniki emas")
    
    result_avatar = await db.execute(select(Avatar).where(Avatar.user_id == current_user.id))
    avatar = result_avatar.scalar_one_or_none()
    if avatar:
        old_file = avatar.photo_url.lstrip('/')
        if os.path.exists(old_file):
            try:
                os.remove(old_file)
                print(f"Old file deleted - {old_file}")
            except Exception as e:
                print(f"Not deleted old file {str(e)}")
        
        await db.delete(avatar)
        await db.commit()
    
    filename = f"{uuid.uuid4()}_{image.filename}"
    file_location = os.path.join(upload_dir, filename)
    # file_location = (f"static/avatars/{filename}") --> eski usul

    try:
        with open(file_location, "wb+") as buffer:
            shutil.copyfileobj(image.file, buffer)
    finally:
        image.file.close()

    new_file = Avatar(photo_url = f"/{file_location.replace(os.sep, '/')}", user_id = current_user.id)
    

    db.add(new_file)
    await db.commit()
    await db.refresh(new_file)

    return new_file


# ------------------------------ 2.endpoint
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def del_avatar(user_id: UUID,
                     current_user: User = Depends(get_current_user),
                     db: AsyncSession = Depends(get_db)):
    
    result = await db.execute(select(Avatar).where(Avatar.user_id == user_id))
    avatar = result.scalar_one_or_none()
    if not avatar:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Zotan avataringiz yo'q")
    
    if avatar.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
                            detail="Bu profile sizniki emas")
    
    file_path = avatar.photo_url.lstrip('/')
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            print(f"File deleted {file_path}")
        except Exception as e:
            print(f"file not deleted {str(e)}")
    
    else:
        print("file not found")

    await db.delete(avatar)
    await db.commit()

    return None


