from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import joinedload
from app.schemas.employee_salary import ( EmployeeSalaryCreate,
                                          EmployeePromote, EmployeeSalaryUpdate, EmployeeSalaryResponse,
                                            EmployeeBasePayCreate, EmployeeBasePayResponse,
                                              EmployeeBasePayUpdateResponse)
from app.models.employee_salary import EmployeeSalary
from app.models.employee_base_pay import EmployeeBasePay
from app.core.security import get_current_user, get_db
from datetime import datetime
from app.utils.log_helper import add_employee_log
from datetime import date

router = APIRouter(
    prefix="/api/v1/salary",
    tags=["Salaries"],
    dependencies=[Depends(get_current_user)]
    )

#to create salary record
@router.post("/", response_model=EmployeeSalaryResponse)
async def create(
    salary: EmployeeSalaryCreate,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    query = (
        select(EmployeeBasePay).where(EmployeeBasePay.employee_id == salary.employee_id)
    )
    result = await db.execute(query)
    base_pay = result.scalar_one_or_none()
    if not base_pay:
        raise HTTPException(404, "Not base pay record found with this employee id.")
    #id, month, year unique already applied on db level.

    gross_salary = base_pay.base_salary + base_pay.allowances
    per_day_salary = base_pay.base_salary / salary.working_days
    unpaid_deduction = per_day_salary * salary.unpaid_days
    net_salary = gross_salary - unpaid_deduction
    db_salary = EmployeeSalary(
        **salary.dict(),
        added_by = user.id,
        base_salary = base_pay.base_salary,
        allowances = base_pay.allowances,
        gross_salary = gross_salary,
        net_salary = net_salary,
        deductions = unpaid_deduction,
        payment_date = date.today()

    )
    db.add(db_salary)
    await db.commit()
    await db.refresh(db_salary)
    return db_salary


# to create base pay record
@router.post("/base", response_model=EmployeeBasePayResponse)
async def create(
    data: EmployeeBasePayCreate,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    db_base_pay = EmployeeBasePay(
        **data.dict(),
        added_by = user.id,
    )
    db.add(db_base_pay)
    await db.commit()
    await db.refresh(db_base_pay, ["employee"])
    current_datetime = datetime.now().astimezone()
    # //2026-11-15 22:53:45+05:30
    message = f"Base pay record created for employee id : {db_base_pay.employee_id} with base ${data.base_salary} and allowances ${data.allowances}. By {user.firstname} {user.lastname}, id: {user.id}. At {current_datetime}"
    try:
        await add_employee_log(db=db, employee_id=db_base_pay.employee_id, message=message)
    except Exception as e:
        print("Error : ", e)

    return db_base_pay


# to get last added salary record on an employee.
@router.get("/last/{id}", response_model=EmployeeSalaryResponse)
async def getSingle(
    id: int, 
    db: AsyncSession = Depends(get_db)
    ):
    query = (
        select(EmployeeSalary)
        .where(EmployeeSalary.employee_id == id)
        .order_by(desc(EmployeeSalary.created_at))
        .limit(1)
        )
    result = await db.execute(query)
    salary = result.scalar_one_or_none()
    if not salary:
        raise HTTPException(404, "No salary found with this ID.")

    return salary


# to get base pay of an  employee with base pay and allowances.
@router.get("/base-pay/{id}", response_model=EmployeeBasePayResponse)
async def getSingle(
    id: int, 
    db: AsyncSession = Depends(get_db)
    ):
    query = (
        select(EmployeeBasePay)
        .options(joinedload(EmployeeBasePay.employee))
        .where(EmployeeBasePay.employee_id == id)
        )
    result = await db.execute(query)
    base_pay = result.scalar_one_or_none()
    if not base_pay:
        raise HTTPException(404, "No base pay record found with this ID.")

    return base_pay


#to update a salary record by salary record id
@router.patch("/{id}", response_model=EmployeeSalaryResponse)
async def update(
    id: int,
    salary: EmployeeSalaryUpdate,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    result = await db.execute(
            select(EmployeeSalary)
            .where(EmployeeSalary.id == id, EmployeeSalary.version == salary.version)
            .with_for_update()
        )
    db_salary = result.scalar_one_or_none()
    if not db_salary:
        raise HTTPException(404, "No salary record found with this ID or it was modified by someone else. Please refresh to get the latest version.")

    # for key, value in salary.model_dump(exclude_unset=True, exclude={"id"}).items():
    #     setattr(db_salary, key, value)
    payload = salary.model_dump(exclude_unset=True, exclude={"id"})

    deduction_fields = {"unpaid_days", "working_days", "paid_days", "total_days", "deductions"}
    if deduction_fields.intersection(payload):
        result = await db.execute(
            select(EmployeeBasePay).where(
                EmployeeBasePay.employee_id == db_salary.employee_id
            )
        )
        base_pay = result.scalar_one_or_none()
        if not base_pay:
            raise HTTPException(404, "Employee base pay not found")

        # if exists use it else use default form db salary
        working_days = payload.get("working_days", db_salary.working_days)
        unpaid_days = payload.get("unpaid_days", db_salary.unpaid_days) 
        if working_days <= 0:
            raise HTTPException(400, "Working days must be greater than zero.")

        if unpaid_days < 0 or unpaid_days > working_days:
            raise HTTPException(400, "Invalid unpaid days.")

        gross_salary = base_pay.base_salary + base_pay.allowances
        per_day_salary = base_pay.base_salary / working_days
        unpaid_deduction = per_day_salary * unpaid_days
        net_salary = gross_salary - unpaid_deduction

        payload["gross_salary"] = gross_salary
        payload["deductions"] = unpaid_deduction
        payload["net_salary"] = net_salary

    for key, value in payload.items():
        setattr(db_salary, key, value)
    db_salary.version += 1
        
    await db.commit()
    await db.refresh(db_salary)
    print('db sal : ', db_salary)
    #return db_salary
    current_datetime = datetime.now().astimezone()
    # //2026-11-15 22:53:45+05:30
    message = f"An update made in salary for employee id : {db_salary.employee_id}. By {user.firstname} {user.lastname}, id: {user.id}. At {current_datetime}"

    try:
        await add_employee_log(db=db, employee_id=db_salary.employee_id, message=message)
    except Exception as e:
        print("Error : ", e)

    return db_salary



# to get all salary record of an employee by employee id.
@router.get("/employee/{id}", response_model=list[EmployeeSalaryResponse])
async def getAllByEmployee(
    id: int, 
    db: AsyncSession = Depends(get_db)
    ):
    query = (
        select(EmployeeSalary)
        .where(EmployeeSalary.employee_id == id)
        .order_by(desc(EmployeeSalary.created_at))
        )
    result = await db.execute(query)
    salaries = result.scalars().all()
    if not salaries:
        raise HTTPException(404, "No salary records found with this ID.")

    return salaries


# to modify base pay and allowances of an employee by employee id.
@router.patch("/modify-base/{id}", response_model=EmployeeBasePayUpdateResponse)
async def update(
    id: int,
    data: EmployeePromote,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    
    result = await db.execute(
                select(EmployeeBasePay).where(
                    EmployeeBasePay.employee_id == id,
                    EmployeeBasePay.version == data.version)
                .with_for_update()
            )
    db_base_pay = result.scalar_one_or_none()
    if not db_base_pay:
        raise HTTPException(404, "No base pay record found with this ID Or it got modified by another HR. Please refresh to get new version of this record if it exists.")
    
    for key, value in data.model_dump(exclude_unset=True, exclude={"id", "version"}).items():
        setattr(db_base_pay, key, value)
    db_base_pay.version += 1

    await db.commit()
    await db.refresh(db_base_pay)
    current_datetime = datetime.now().astimezone()
    # //2026-11-15 22:53:45+05:30
    message = f"An update made in Base pay record created for employee id : {db_base_pay.employee_id} with new base ${data.base_salary} and new allowances ${data.allowances}. By {user.firstname} {user.lastname}, id: {user.id}. At {current_datetime}"

    try:
        await add_employee_log(db=db, employee_id=id, message=message)
    except Exception as e:
        print("Error : ", e)

    return db_base_pay