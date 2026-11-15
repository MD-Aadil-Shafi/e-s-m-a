import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, Integer, String, Enum, Date, Numeric
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.enums.employment_type import EmploymentType

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True)
    firstname = Column(String(12), nullable=False)
    lastname = Column(String(12), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    country = Column(String(30), nullable=False)
    state = Column(String(30), nullable=False)
    city = Column(String(30), nullable=False)
    zipcode = Column(String(10), nullable=False)
    address = Column(String(255), nullable=False)
    phone_number = Column(String(15), nullable=False)
    department = Column(String(40), nullable=False)
    designation = Column(String(40), nullable=False)
    employment_type = role = Column(
            Enum(EmploymentType, name="employment_type"),
            default=EmploymentType.FULLTIME,
            nullable=False
        )
    joining_date = Column(Date, nullable=False)
    leaving_date = Column(Date, nullable=True)
    
    salary_records = relationship(
        "EmployeeSalary",
        back_populates="employee"
    )
    remark = Column(String(255), nullable=True)

    employee_logs = relationship("Log", back_populates="employee",
                                 uselist=False,
                    cascade="all, delete-orphan")

