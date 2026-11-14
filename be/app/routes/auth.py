from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from datetime import timedelta
from jose import jwt, JWTError
from app.schemas.user import UserCreate,UserLogin, UserUpdate, UserResponse
from app.schemas.token import Token
from app.models.user import User
from app.core.security import (
    hash_password, verify_password, create_token, get_current_user, revoke_refresh_token, get_db, create_refresh_token
)
from app.core.config import settings


router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

@router.post("/register", response_model=dict)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(User).where(User.email == user.email).limit(1)
        )
        if result.scalar_one_or_none():
            raise HTTPException(400, "Email already exists")
        
        db_user = User(
            # **user.dict(),
            **user.dict(exclude={"password"}),
            hashed_password = hash_password(user.password)
        )
        db.add(db_user)
        await db.commit()
        return {"message": "user created", "success": True}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/login", response_model=Token)
async def login(
    user: UserLogin, db: AsyncSession = Depends(get_db)
):
    try:
        if not user.email or not user.password: 
            raise HTTPException(400, "Please put email along with password")
        
        stmt = select(User).where(User.email == user.email).limit(1)
        result = await db.execute(stmt)
        db_user = result.scalar_one_or_none()
        
        if not db_user:
            raise HTTPException(401, "Invalid credentials")
        
        if not verify_password(user.password, db_user.hashed_password):
            raise HTTPException(401, "Invalid Credentials")
        
        access = create_token(
            {"sub": str(db_user.id)},
            timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        refresh = await create_refresh_token(db_user.id, db)
        
        return {
            "access_token": access,
            "refresh_token": refresh
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
  

@router.get("/get-me", response_model=UserResponse)
async def getMe(current_user: User = Depends(get_current_user)):
    try:
        return current_user
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
    

@router.get("/refresh", response_model=Token)
async def refresh(refreshToken: str = Header(...), db: AsyncSession = Depends(get_db)):
    
    token = refreshToken
    try:
        # print('ref token....', token, type(settings.SECRET_KEY), type(settings.ALGORITHM))
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub")
        token_id = payload.get("jti")
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    await revoke_refresh_token(token_id, user_id, db)
    access = create_token(
        {"sub": str(user_id)},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh = await create_refresh_token(user_id, db)
    
    return {
        "access_token": access,
        "refresh_token": refresh
    }
    

@router.post("/logout", response_model=dict)
async def refresh(payload: dict, db: AsyncSession = Depends(get_db)):
    token = payload.get("refresh_token")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_id = payload.get("jti")
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    await revoke_refresh_token(token_id, user_id, db)
    return {
        "message": "Logged out successfully",
        "status": True
    }
    
    
@router.put("/update-profile", response_model=UserResponse)
async def update_user(user:UserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    result = await db.execute(
        select(User).where(User.id == current_user.id).limit(1)
    )
    db_user = result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(404, "user not found")
    
    update_data = user.model_dump(exclude_unset=True, exclude={"id"})
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    await db.commit()
    await db.refresh(db_user)
    return db_user