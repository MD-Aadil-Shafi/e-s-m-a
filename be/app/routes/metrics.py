from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, asc, desc
from sqlalchemy.orm import joinedload
from app.core.security import get_current_user, get_db
from app.models.employee import Employee
from app.models.logs import Log
from app.models.employee_salary import EmployeeSalary
from app.models.user import User
from app.models.employee_base_pay import EmployeeBasePay

router = APIRouter(
    prefix="/api/v1/metrics",
    tags=["Metrics"],
    dependencies=[Depends(get_current_user)]
    )

@router.get("/", response_model=PaginatedResponse[EmployeeResponse])
async def list_employees(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = None,
    country: str | None = None,
    employment_type: str | None = None,
    sort_by: str = "created_at",
    order: str = "desc"
):
    base_query = select(Employee)
    if search:
        base_query = base_query.where(
            or_(
                Employee.firstname.ilike(f"%{search}%"),
                Employee.email.ilike(f"%{search}%")
            )
        )
    if country:
        base_query = base_query.where(
            Employee.country.ilike(f"%{country}%")
        )

    if employment_type:
        base_query = base_query.where(
            Employee.employment_type == EmploymentType(employment_type)
        )

    count_query = select(func.count()).select_from(base_query.subquery())
    total = await db.scalar(count_query)

    sort_column = getattr(Employee, sort_by, None)
    if not sort_column:
        raise HTTPException(400, "Invalid sort field")
    
    base_query = base_query.order_by(
        desc(sort_column) if order == "desc" else asc(sort_column)
    )

    base_query = base_query.offset((page - 1) * limit).limit(limit)

    result = await db.execute(base_query)
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": result.scalars().all()
    }