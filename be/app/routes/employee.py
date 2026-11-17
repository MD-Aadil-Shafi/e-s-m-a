from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, asc, desc
from sqlalchemy.orm import joinedload
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.schemas.common import PaginatedResponse
from app.models.employee import Employee
from app.core.security import get_current_user, get_db
from datetime import datetime
from app.utils.log_helper import add_employee_log
from app.enums.employment_type import EmploymentType
from app.models.logs import Log
from app.schemas.logs import LogResponse

router = APIRouter(
    prefix="/api/v1/employee",
    tags=["Employees"],
    dependencies=[Depends(get_current_user)]
    )

@router.post("/", response_model=EmployeeResponse)
async def create(
    employee: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    db_employee = Employee(
        **employee.dict(),
        added_by = str(user.id)
    )
    db.add(db_employee)
    await db.commit()
    await db.refresh(db_employee)
    return db_employee

@router.get("/{id}", response_model=EmployeeResponse)
async def getSingle(
    id: int, 
    db: AsyncSession = Depends(get_db)
    ):
    result = await db.execute(
        select(Employee).where(Employee.id == id)
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(404, "No employee found with this ID.")

    return employee

@router.get("/logs/{id}", response_model=LogResponse)
async def getLogs(
    id: int, 
    db: AsyncSession = Depends(get_db)
    ):
    result = await db.execute(
        select(Log)
        .options(joinedload(Log.employee))
        .where(Log.employee_id == id)
    )
    logs = result.scalar_one_or_none()
    if not logs:
        raise HTTPException(404, "No logs found with this ID.")

    return logs


@router.patch("/{id}", response_model=EmployeeResponse)
async def update(
    id: int,
    employee: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    result = await db.execute(
            select(Employee).where(Employee.id == id)
        )
    db_employee = result.scalar_one_or_none()
    if not db_employee:
        raise HTTPException(404, "No employee found with this ID.")

    for key, value in employee.model_dump(exclude_unset=True, exclude={"id"}).items():
        setattr(db_employee, key, value)

    await db.commit()
    await db.refresh(db_employee)
    #return db_employee
    current_datetime = datetime.now().astimezone()
    # //2026-11-15 22:53:45+05:30
    message = f"An update made for employee id : {id}. By {user.firstname} {user.lastname}, id: {user.id}. At {current_datetime}"

    try:
        await add_employee_log(db=db, employee_id=id, message=message)
    except Exception as e:
        print("Error : ", e)

    return db_employee



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