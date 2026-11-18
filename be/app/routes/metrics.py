from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract, desc
from app.core.security import get_current_user, get_db
from app.models.employee import Employee
from app.models.employee_salary import EmployeeSalary
from app.models.user import User
from app.models.employee_base_pay import EmployeeBasePay
from datetime import datetime

router = APIRouter(
    prefix="/api/v1/metrics",
    tags=["Metrics"],
    dependencies=[Depends(get_current_user)]
    )

@router.get("/")
async def dashboard_metrics(
    db: AsyncSession = Depends(get_db)
):
    #total emp
    total_employees = await db.scalar(select(func.count(Employee.id)))
    #total management professionals
    total_management_professionals = await db.scalar(select(func.count(User.id)))
    print('total employees', total_employees)
    #top 3 highest paid
    top_paid_query = (
        select(
            Employee.id,
            Employee.firstname,
            Employee.lastname,
            Employee.email,
            Employee.country,
            Employee.department,
            EmployeeBasePay.base_salary
        ).join(
            EmployeeBasePay,
            EmployeeBasePay.employee_id == Employee.id
        ).order_by(desc(EmployeeBasePay.base_salary))
        .limit(3)
    )

    top_paid_result = await db.execute(top_paid_query)
    top_paid_result = top_paid_result.mappings().all()
    print("top paid result", top_paid_result)

    # top_paid_employees = [
    #     dict(row._mapping)
    #     for row in top_paid_result.all()
    # ]

    #latest added employee:
    latest_employee_query = (
        select(
            Employee.id,
            Employee.firstname,
            Employee.lastname,
            Employee.email,
            Employee.department,
            Employee.country,
            Employee.created_at
        ).order_by(desc(Employee.created_at))
        .limit(3)
    )
    latest_employee_result = await db.execute(
        latest_employee_query
    )
    latest_employee_result = latest_employee_result.mappings().all()
    print('latest employees ', latest_employee_result)

    #oldest employees
    oldest_employee_query = (
        select(
            Employee.id,
            Employee.firstname,
            Employee.lastname,
            Employee.email,
            Employee.department,
            Employee.country,
            Employee.created_at
        ).order_by(Employee.created_at.asc())
        .limit(3)
    )
    oldest_employee_result = await db.execute(
        oldest_employee_query
    )
    oldest_employee_result = oldest_employee_result.mappings().all()

    #department wise employee count
    department_query = (
        select(
            Employee.department,
            func.count(Employee.id).label("total_employees")
        )
        .group_by(Employee.department)
        .order_by(desc("total_employees"))
    )
    department_result = await db.execute(department_query)
    department_result = department_result.mappings().all()

    #country wise employee count
    country_query = (
        select(
            Employee.country,
            func.count(Employee.id).label("total_employees")
        )
        .group_by(Employee.country)
        .order_by(desc("total_employees"))
    )
    country_result = await db.execute(country_query)
    country_result = country_result.mappings().all()

    #last month payroll
    now = datetime.now()
    if now.month == 1:
        last_month = 12
        last_year = now.year - 1
    else:
        last_month = now.month - 1
        last_year = now.year

    print("last month year : ", last_year, last_month)
    payroll_query = select(
        func.coalesce(
            func.sum(EmployeeSalary.net_salary), 0
        )
    ).where(
        extract("month", EmployeeSalary.created_at) == last_month,
        extract("year", EmployeeSalary.created_at) == last_year
    )
    total_paid = await db.scalar(payroll_query)

    return {
        "total_employees": total_employees or 0,
        "total_management_professionals": total_management_professionals or 0,
        "top_3_paid_employees": top_paid_result,
        "latest_employees": latest_employee_result,
        "oldest_employees": oldest_employee_result,
        "department_wise_employees": department_result,
        "country_wise_employees": country_result,
        "last_month_total_net_pay": total_paid
    }



    