import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.core.config import settings
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.core.security import hash_password
from app.enums.user_role import UserRole

# Remove tables with PostgreSQL-specific types for SQLite testing
for table_name in ["logs"]:
    if table_name in Base.metadata.tables:
        Base.metadata.remove(Base.metadata.tables[table_name])

# Test database URL (use SQLite for testing)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with database dependency override."""
    from app.core.security import get_db

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user in the database."""
    user = User(
        email="test@example.com",
        firstname="Test",
        lastname="User",
        hashed_password=hash_password("Test123!"),
        role=UserRole.HR
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_user_data() -> dict:
    """Return valid user creation data."""
    return {
        "email": "newuser@example.com",
        "firstname": "John",
        "lastname": "Doe",
        "password": "Password123!",
        "country_code": "+91",
        "phone_number": "1234567890"
    }


@pytest.fixture
async def auth_headers(test_user: User) -> dict:
    """Return authorization headers with a valid access token."""
    from jose import jwt
    from datetime import timedelta
    from app.core.config import settings
    from app.core.security import create_token

    token = create_token(
        {"sub": str(test_user.id)},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"Authorization": f"Bearer {token}"}
