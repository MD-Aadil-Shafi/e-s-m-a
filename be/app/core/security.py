import bcrypt
import uuid

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import AsyncSessionLocal

from app.core.config import settings
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.enums.user_role import UserRole

from datetime import datetime, timedelta

def hash_password(plain:str)->str:
    pass_bytes = plain.encode("utf-8")
    hashed = bcrypt.hashpw(pass_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")

def verify_password(plain:str, hashed:str):
    hashed_bytes = hashed.encode("utf-8")
    return bcrypt.checkpw(plain.encode("utf-8"), hashed_bytes)

def create_token(data:dict, expires_delta:timedelta):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + expires_delta
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
   

oauth2_schema = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def create_refresh_token(user_id: str, db: AsyncSession):
    token = uuid.uuid4().hex
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    rt = RefreshToken(
        token=token,
        expires_at=expires_at, 
        # user_id=int(user_id)
        user_id=uuid.UUID(str(user_id))
        )
    db.add(rt)
    await db.commit()
    await db.refresh(rt)
    
    payload = {"sub": str(user_id), "jti": token, "exp": int(expires_at.timestamp()), "type": "refresh"}
    print('token check::', settings.SECRET_KEY, settings.ALGORITHM)
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token

        
async def get_current_user(token: str = Depends(oauth2_schema), db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    result = await db.execute(
        # select(User).where(User.id == int(user_id)).limit(1)
        select(User).where(User.id == uuid.UUID(str(user_id))).limit(1)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    # Currently for HR only
    if user.role != UserRole.HR:
        raise HTTPException(status_code=409, detail="Not authorized to perform this action.")

    return user

async def revoke_refresh_token(token: str, user_id: str, db: AsyncSession):
    # print('token id , user id',token, user_id)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token == token, RefreshToken.user_id == uuid.UUID(str(user_id)))
    )

    refresh_token = result.scalar_one_or_none()
    
    if not refresh_token:
        raise HTTPException(404, "Invalid R Token ID")
    
    await db.delete(refresh_token)
    await db.commit()