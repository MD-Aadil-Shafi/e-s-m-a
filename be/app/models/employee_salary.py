from sqlalchemy import (
    Column, Integer, String, ForeignKey,
    Numeric, Date, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.db.base import Base

class EmployeeSalary(Base):
    __tablename__ = "employee_salaries"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(
        Integer,
        ForeignKey("employees.id", ondelete="RESTRICT"),
        nullable=False
    )

    # Payroll period
    payroll_month = Column(Integer, nullable=False)
    payroll_year = Column(Integer, nullable=False)

    # Salary details
    base_salary = Column(Numeric(12, 2), nullable=False)
    allowances = Column(Numeric(12, 2), default=0)
    deductions = Column(Numeric(12, 2), default=0)

    gross_salary = Column(Numeric(12, 2), nullable=False)
    net_salary = Column(Numeric(12, 2), nullable=False)

    # Attendance details
    total_days = Column(Integer, nullable=False)
    working_days = Column(Integer, nullable=False)
    paid_days = Column(Integer, nullable=False)
    unpaid_days = Column(Integer, default=0)

    # Payment information
    payment_date = Column(Date, nullable=True)
    payment_status = Column(
        String(20),
        default="PENDING",
        nullable=False
    )

    employee = relationship(
        "Employee",
        back_populates="salary_records"
    )

    __table_args__ = (
        UniqueConstraint(
            "employee_id",
            "payroll_month",
            "payroll_year",
            name="uq_employee_monthly_salary"
        ),
    )

# Key points:
'''
gross_salary = base_salary + allowances
net_salary = gross_salary - deductions
per_day_salary = base_salary / total_days
unpaid_deduction = per_day_salary * unpaid_days
'''