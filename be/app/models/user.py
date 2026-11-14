import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.enums.user_role import UserRole

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firstname = Column(String(12), nullable=False)
    lastname = Column(String(12), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar = Column(String, nullable=True)
    country_code = Column(String(6), nullable=True)
    phone_number = Column(String(10), nullable=True)
    role = Column(
        Enum(UserRole, name="role"),
        default=UserRole.HR,
        nullable=False
    )
    # relationship
    refresh_tokens = relationship("RefreshToken", back_populates="user")