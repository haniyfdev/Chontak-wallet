from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from app.database import get_db
from app.config import settings
from app.models import User, UserRole


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ------------------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# ------------------
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# ------------------
def create_access_token(data: dict, expires_delta: Optional[int] = None):
    copydata = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + timedelta(minutes=expires_delta)
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_MINUTES)

    copydata.update({"exp": expire})
    encoded_jwt = jwt.encode(copydata, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return encoded_jwt

# ------------------
async def get_current_user(token:str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    cred_error = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token'ni tasdiqlab bo'lmadi !", 
                               headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        user_id: str = payload.get("sub")
        if user_id is None:
            raise cred_error  # if sub is None
        
    except JWTError: 
        raise cred_error  # if token invalid
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise cred_error  # if user is None in db
    
    return user

# ------------------
async def check_role(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Siz admin emassiz")
    
    return current_user 

    
         