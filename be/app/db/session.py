from collections.abc import Generator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from sqlalchemy import create_engine, text
from app.db.base import Base

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Sync engine for Alembic / create_all
sync_engine = create_engine(settings.DATABASE_URL_SYNC)

# def init_db() -> None:
    # Base.metadata.create_all(bind=sync_engine)
