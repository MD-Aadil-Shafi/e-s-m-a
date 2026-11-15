import uuid
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Log(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, unique=True, index=True)
    logs = Column(ARRAY(String), nullable=True)
    employee = relationship("Employee", back_populates="employee_logs")
    

