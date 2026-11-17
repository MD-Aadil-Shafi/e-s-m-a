from sqlalchemy import (
    Column, Integer,  ForeignKey,
    Numeric
)
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid

from app.db.base import Base

class EmployeeBasePay(Base):
    __tablename__ = "employee_base_pay"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(
        Integer,
        ForeignKey("employees.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,
        index=True
    )

    base_salary = Column(Numeric(12, 2), nullable=False)
    allowances = Column(Numeric(12, 2), default=0)

    added_by = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    employee = relationship(
        "Employee",
        back_populates="base_pay"
    )
