from decimal import Decimal
from pydantic import BaseModel, Field 
from datetime import date, datetime
from typing import Optional
from uuid import UUID
from app.schemas.employee import EmployeeResponse

class EmployeeSalaryCreate(BaseModel):
    employee_id: int
    payroll_month: int = Field(ge=1, le=12)
    payroll_year: int = Field(ge=2000)
    # base_salary: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    # allowances: Decimal = Field(default=Decimal("0.00"), ge=0)
    # deductions: Decimal = Field(default=Decimal("0.00"), ge=0)
    total_days: int = Field(gt=0)
    working_days: int = Field(ge=0)
    paid_days: int = Field(ge=0)
    unpaid_days: int = Field(default=0, ge=0)
# gross, net, payment handled inward

class EmployeePromote(BaseModel):
    base_salary: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    allowances: Decimal | None = Field(default=None, ge=0)
    remark: str

class EmployeeBasePayCreate(BaseModel):
    employee_id: int
    base_salary: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    allowances: Decimal = Field(default=Decimal("0.00"), ge=0)

class EmployeeBasePayResponse(BaseModel):
    employee_id: int
    base_salary: Decimal
    allowances: Decimal
    added_by: UUID
    created_at: datetime
    employee: EmployeeResponse
    version: int
    
class EmployeeBasePayUpdateResponse(BaseModel):
    employee_id: int
    base_salary: Decimal
    allowances: Decimal
    added_by: UUID
    created_at: datetime
    version: int


class EmployeeSalaryUpdate(BaseModel):
    # base_salary: Decimal | None = Field(
    #     default=None, gt=0, max_digits=12, decimal_places=2
    # )
    # allowances: Decimal | None = Field(default=None, ge=0)
    deductions: Decimal | None = Field(default=None, ge=0)

    total_days: int | None = Field(default=None, gt=0)
    working_days: int | None = Field(default=None, ge=0)
    paid_days: int | None = Field(default=None, ge=0)
    unpaid_days: int | None = Field(default=None, ge=0)

    payment_date: date | None = None
    payment_status: str | None = None


class EmployeeSalaryResponse(BaseModel):
    id: int
    employee_id: int

    payroll_month: int
    payroll_year: int

    base_salary: Decimal
    allowances: Decimal
    deductions: Decimal

    gross_salary: Decimal
    net_salary: Decimal

    total_days: int
    working_days: int
    paid_days: int
    unpaid_days: int

    payment_date: date | None
    payment_status: str
    added_by: UUID

    class Config: 
            from_attributes = True 
    
