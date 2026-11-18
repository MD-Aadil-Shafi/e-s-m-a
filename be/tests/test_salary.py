import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from decimal import Decimal
from app.models.employee import Employee
from app.models.employee_base_pay import EmployeeBasePay
from app.models.employee_salary import EmployeeSalary
from app.models.user import User
from app.core.security import hash_password
from app.enums.user_role import UserRole
from unittest.mock import patch


class TestCreateBasePay:
    """Test cases for creating base pay record."""

    @pytest.mark.asyncio
    async def test_create_base_pay_success(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """Test successful base pay creation."""
        # Create an employee first
        employee = Employee(
            firstname="John",
            lastname="Doe",
            email="john.doe@example.com",
            country="USA",
            state="California",
            city="Los Angeles",
            zipcode="90001",
            address="123 Main St",
            phone_number="1234567890",
            department="Engineering",
            designation="Software Engineer",
            joining_date=date(2024, 1, 15),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay_data = {
            "employee_id": employee.id,
            "base_salary": "5000.00",
            "allowances": "500.00"
        }

        with patch('app.routes.salary.add_employee_log'):
            response = await client.post("/api/v1/salary/base", json=base_pay_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["employee_id"] == employee.id
        assert Decimal(str(data["base_salary"])) == Decimal("5000.00")
        assert Decimal(str(data["allowances"])) == Decimal("500.00")

    @pytest.mark.asyncio
    async def test_create_base_pay_no_auth(self, client: AsyncClient):
        """Test base pay creation without authentication."""
        base_pay_data = {
            "employee_id": 1,
            "base_salary": "5000.00",
            "allowances": "500.00"
        }
        response = await client.post("/api/v1/salary/base", json=base_pay_data)
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_base_pay_invalid_salary(self, client: AsyncClient, auth_headers: dict):
        """Test base pay creation with invalid salary (negative)."""
        base_pay_data = {
            "employee_id": 1,
            "base_salary": "-100.00",
            "allowances": "500.00"
        }
        response = await client.post("/api/v1/salary/base", json=base_pay_data, headers=auth_headers)
        assert response.status_code == 422


class TestGetBasePay:
    """Test cases for getting base pay record."""

    @pytest.mark.asyncio
    async def test_get_base_pay_success(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """Test successful retrieval of base pay."""
        # Create employee and base pay
        employee = Employee(
            firstname="Jane",
            lastname="Smith",
            email="jane.smith@example.com",
            country="USA",
            state="New York",
            city="New York City",
            zipcode="10001",
            address="456 Oak Ave",
            phone_number="9876543210",
            department="Marketing",
            designation="Marketing Manager",
            joining_date=date(2024, 2, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay = EmployeeBasePay(
            employee_id=employee.id,
            base_salary=Decimal("6000.00"),
            allowances=Decimal("600.00"),
            added_by=test_user.id
        )
        db_session.add(base_pay)
        await db_session.commit()

        response = await client.get(f"/api/v1/salary/base-pay/{employee.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["employee_id"] == employee.id
        assert Decimal(str(data["base_salary"])) == Decimal("6000.00")

    @pytest.mark.asyncio
    async def test_get_base_pay_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test getting base pay for non-existent employee."""
        response = await client.get("/api/v1/salary/base-pay/99999", headers=auth_headers)
        assert response.status_code == 404
        assert "No base pay record found" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_get_base_pay_no_auth(self, client: AsyncClient):
        """Test getting base pay without authentication."""
        response = await client.get("/api/v1/salary/base-pay/1")
        assert response.status_code == 401


class TestCreateSalary:
    """Test cases for creating salary record."""

    @pytest.mark.asyncio
    async def test_create_salary_success(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """Test successful salary creation."""
        # Create employee and base pay
        employee = Employee(
            firstname="Bob",
            lastname="Johnson",
            email="bob.johnson@example.com",
            country="USA",
            state="Texas",
            city="Austin",
            zipcode="78701",
            address="789 Pine St",
            phone_number="5551234567",
            department="Sales",
            designation="Sales Rep",
            joining_date=date(2024, 3, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay = EmployeeBasePay(
            employee_id=employee.id,
            base_salary=Decimal("5000.00"),
            allowances=Decimal("500.00"),
            added_by=test_user.id
        )
        db_session.add(base_pay)
        await db_session.commit()

        salary_data = {
            "employee_id": employee.id,
            "payroll_month": 1,
            "payroll_year": 2024,
            "total_days": 30,
            "working_days": 22,
            "paid_days": 22,
            "unpaid_days": 0
        }

        response = await client.post("/api/v1/salary/", json=salary_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["employee_id"] == employee.id
        assert data["payroll_month"] == 1
        assert data["payroll_year"] == 2024
        # gross_salary = base_salary + allowances = 5000 + 500 = 5500
        assert Decimal(str(data["gross_salary"])) == Decimal("5500.00")

    @pytest.mark.asyncio
    async def test_create_salary_no_base_pay(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession):
        """Test salary creation without base pay record."""
        # Create employee without base pay
        employee = Employee(
            firstname="Alice",
            lastname="Wonder",
            email="alice@example.com",
            country="USA",
            state="California",
            city="San Francisco",
            zipcode="94102",
            address="1 Test St",
            phone_number="1234567890",
            department="Engineering",
            designation="Developer",
            joining_date=date(2024, 1, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        salary_data = {
            "employee_id": employee.id,
            "payroll_month": 1,
            "payroll_year": 2024,
            "total_days": 30,
            "working_days": 22,
            "paid_days": 22,
            "unpaid_days": 0
        }

        response = await client.post("/api/v1/salary/", json=salary_data, headers=auth_headers)
        assert response.status_code == 404
        assert "Not base pay record found" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_create_salary_no_auth(self, client: AsyncClient):
        """Test salary creation without authentication."""
        salary_data = {
            "employee_id": 1,
            "payroll_month": 1,
            "payroll_year": 2024,
            "total_days": 30,
            "working_days": 22,
            "paid_days": 22
        }
        response = await client.post("/api/v1/salary/", json=salary_data)
        assert response.status_code == 401


class TestGetLastSalary:
    """Test cases for getting last salary record."""

    @pytest.mark.asyncio
    async def test_get_last_salary_success(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """Test successful retrieval of last salary."""
        # Create employee, base pay, and salary
        employee = Employee(
            firstname="Charlie",
            lastname="Brown",
            email="charlie@example.com",
            country="USA",
            state="Florida",
            city="Miami",
            zipcode="33101",
            address="321 Orange St",
            phone_number="5559876543",
            department="Finance",
            designation="Accountant",
            joining_date=date(2024, 4, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay = EmployeeBasePay(
            employee_id=employee.id,
            base_salary=Decimal("4500.00"),
            allowances=Decimal("400.00"),
            added_by=test_user.id
        )
        db_session.add(base_pay)
        await db_session.commit()

        salary = EmployeeSalary(
            employee_id=employee.id,
            payroll_month=1,
            payroll_year=2024,
            base_salary=Decimal("4500.00"),
            allowances=Decimal("400.00"),
            gross_salary=Decimal("4900.00"),
            net_salary=Decimal("4900.00"),
            deductions=Decimal("0.00"),
            total_days=30,
            working_days=22,
            paid_days=22,
            unpaid_days=0,
            payment_status="PENDING",
            added_by=test_user.id
        )
        db_session.add(salary)
        await db_session.commit()

        response = await client.get(f"/api/v1/salary/last/{employee.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["employee_id"] == employee.id
        assert data["payroll_month"] == 1

    @pytest.mark.asyncio
    async def test_get_last_salary_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test getting last salary for non-existent employee."""
        response = await client.get("/api/v1/salary/last/99999", headers=auth_headers)
        assert response.status_code == 404
        assert "No salary found" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_get_last_salary_no_auth(self, client: AsyncClient):
        """Test getting last salary without authentication."""
        response = await client.get("/api/v1/salary/last/1")
        assert response.status_code == 401


class TestUpdateSalary:
    """Test cases for updating salary record."""

    @pytest.mark.asyncio
    async def test_update_salary_success(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """Test successful salary update."""
        # Create employee, base pay, and salary
        employee = Employee(
            firstname="David",
            lastname="Lee",
            email="david@example.com",
            country="USA",
            state="Washington",
            city="Seattle",
            zipcode="98101",
            address="987 Pine St",
            phone_number="5551112222",
            department="Engineering",
            designation="Senior Developer",
            joining_date=date(2024, 5, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay = EmployeeBasePay(
            employee_id=employee.id,
            base_salary=Decimal("7000.00"),
            allowances=Decimal("700.00"),
            added_by=test_user.id
        )
        db_session.add(base_pay)
        await db_session.commit()

        salary = EmployeeSalary(
            employee_id=employee.id,
            payroll_month=1,
            payroll_year=2024,
            base_salary=Decimal("7000.00"),
            allowances=Decimal("700.00"),
            gross_salary=Decimal("7700.00"),
            net_salary=Decimal("7700.00"),
            deductions=Decimal("0.00"),
            total_days=30,
            working_days=22,
            paid_days=22,
            unpaid_days=0,
            payment_status="PENDING",
            added_by=test_user.id
        )
        db_session.add(salary)
        await db_session.commit()
        await db_session.refresh(salary)

        update_data = {
            "version": 1,
            "payment_status": "PAID",
            "payment_date": "2024-01-31"
        }

        with patch('app.routes.salary.add_employee_log'):
            response = await client.patch(f"/api/v1/salary/{salary.id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["payment_status"] == "PAID"

    @pytest.mark.asyncio
    async def test_update_salary_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test updating non-existent salary."""
        update_data = {"version": 1, "payment_status": "PAID"}
        response = await client.patch("/api/v1/salary/99999", json=update_data, headers=auth_headers)
        assert response.status_code == 404
        assert "No salary record found" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_update_salary_no_auth(self, client: AsyncClient):
        """Test updating salary without authentication."""
        update_data = {"version": 1, "payment_status": "PAID"}
        response = await client.patch("/api/v1/salary/1", json=update_data)
        assert response.status_code == 401


class TestGetAllSalariesByEmployee:
    """Test cases for getting all salaries by employee."""

    @pytest.mark.asyncio
    async def test_get_all_salaries_success(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """Test successful retrieval of all salaries for an employee."""
        # Create employee, base pay, and multiple salaries
        employee = Employee(
            firstname="Eve",
            lastname="Wilson",
            email="eve@example.com",
            country="USA",
            state="Oregon",
            city="Portland",
            zipcode="97201",
            address="456 Elm St",
            phone_number="5553334444",
            department="HR",
            designation="HR Manager",
            joining_date=date(2024, 6, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay = EmployeeBasePay(
            employee_id=employee.id,
            base_salary=Decimal("5500.00"),
            allowances=Decimal("550.00"),
            added_by=test_user.id
        )
        db_session.add(base_pay)
        await db_session.commit()

        # Create multiple salary records
        for month in [1, 2, 3]:
            salary = EmployeeSalary(
                employee_id=employee.id,
                payroll_month=month,
                payroll_year=2024,
                base_salary=Decimal("5500.00"),
                allowances=Decimal("550.00"),
                gross_salary=Decimal("6050.00"),
                net_salary=Decimal("6050.00"),
                deductions=Decimal("0.00"),
                total_days=30,
                working_days=22,
                paid_days=22,
                unpaid_days=0,
                payment_status="PENDING",
                added_by=test_user.id
            )
            db_session.add(salary)
        await db_session.commit()

        response = await client.get(f"/api/v1/salary/employee/{employee.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    @pytest.mark.asyncio
    async def test_get_all_salaries_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test getting salaries for non-existent employee."""
        response = await client.get("/api/v1/salary/employee/99999", headers=auth_headers)
        assert response.status_code == 404
        assert "No salary records found" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_get_all_salaries_no_auth(self, client: AsyncClient):
        """Test getting salaries without authentication."""
        response = await client.get("/api/v1/salary/employee/1")
        assert response.status_code == 401


class TestUpdateBasePay:
    """Test cases for updating base pay record."""

    @pytest.mark.asyncio
    async def test_update_base_pay_success(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """Test successful base pay update (promotion)."""
        # Create employee and base pay
        employee = Employee(
            firstname="Frank",
            lastname="Miller",
            email="frank@example.com",
            country="USA",
            state="Colorado",
            city="Denver",
            zipcode="80201",
            address="789 Maple St",
            phone_number="5555556666",
            department="Sales",
            designation="Sales Director",
            joining_date=date(2024, 7, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay = EmployeeBasePay(
            employee_id=employee.id,
            base_salary=Decimal("6000.00"),
            allowances=Decimal("600.00"),
            added_by=test_user.id
        )
        db_session.add(base_pay)
        await db_session.commit()

        update_data = {
            "version": 1,
            "base_salary": "7000.00",
            "allowances": "700.00",
            "remark": "Promotion to Senior Director"
        }

        with patch('app.routes.salary.add_employee_log'):
            response = await client.patch(f"/api/v1/salary/modify-base/{employee.id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert Decimal(str(data["base_salary"])) == Decimal("7000.00")
        assert Decimal(str(data["allowances"])) == Decimal("700.00")

    @pytest.mark.asyncio
    async def test_update_base_pay_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test updating base pay for non-existent employee."""
        update_data = {
            "version": 1,
            "base_salary": "7000.00",
            "allowances": "700.00",
            "remark": "Promotion"
        }
        response = await client.patch("/api/v1/salary/modify-base/99999", json=update_data, headers=auth_headers)
        assert response.status_code == 404
        assert "No base pay record found" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_update_base_pay_no_auth(self, client: AsyncClient):
        """Test updating base pay without authentication."""
        update_data = {
            "version": 1,
            "base_salary": "7000.00",
            "allowances": "700.00",
            "remark": "Promotion"
        }
        response = await client.patch("/api/v1/salary/modify-base/1", json=update_data)
        assert response.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# Additional test cases — edge cases, validation, and salary math
# ─────────────────────────────────────────────────────────────────────────────

class TestCreateSalaryValidation:
    """Pydantic field-validation edge cases for POST /api/v1/salary/."""

    @pytest.mark.asyncio
    async def test_create_salary_invalid_month_zero(self, client: AsyncClient, auth_headers: dict):
        """payroll_month=0 violates ge=1 → 422."""
        salary_data = {
            "employee_id": 1,
            "payroll_month": 0,
            "payroll_year": 2024,
            "total_days": 30,
            "working_days": 22,
            "paid_days": 22,
            "unpaid_days": 0
        }
        response = await client.post("/api/v1/salary/", json=salary_data, headers=auth_headers)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_salary_invalid_month_thirteen(self, client: AsyncClient, auth_headers: dict):
        """payroll_month=13 violates le=12 → 422."""
        salary_data = {
            "employee_id": 1,
            "payroll_month": 13,
            "payroll_year": 2024,
            "total_days": 30,
            "working_days": 22,
            "paid_days": 22,
            "unpaid_days": 0
        }
        response = await client.post("/api/v1/salary/", json=salary_data, headers=auth_headers)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_salary_year_before_2000(self, client: AsyncClient, auth_headers: dict):
        """payroll_year=1999 violates ge=2000 → 422."""
        salary_data = {
            "employee_id": 1,
            "payroll_month": 6,
            "payroll_year": 1999,
            "total_days": 30,
            "working_days": 22,
            "paid_days": 22,
            "unpaid_days": 0
        }
        response = await client.post("/api/v1/salary/", json=salary_data, headers=auth_headers)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_salary_total_days_zero(self, client: AsyncClient, auth_headers: dict):
        """total_days=0 violates gt=0 → 422."""
        salary_data = {
            "employee_id": 1,
            "payroll_month": 1,
            "payroll_year": 2024,
            "total_days": 0,
            "working_days": 22,
            "paid_days": 22,
            "unpaid_days": 0
        }
        response = await client.post("/api/v1/salary/", json=salary_data, headers=auth_headers)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_salary_negative_working_days(self, client: AsyncClient, auth_headers: dict):
        """working_days=-1 violates ge=0 → 422."""
        salary_data = {
            "employee_id": 1,
            "payroll_month": 1,
            "payroll_year": 2024,
            "total_days": 30,
            "working_days": -1,
            "paid_days": 22,
            "unpaid_days": 0
        }
        response = await client.post("/api/v1/salary/", json=salary_data, headers=auth_headers)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_salary_negative_unpaid_days(self, client: AsyncClient, auth_headers: dict):
        """unpaid_days=-1 violates ge=0 → 422."""
        salary_data = {
            "employee_id": 1,
            "payroll_month": 1,
            "payroll_year": 2024,
            "total_days": 30,
            "working_days": 22,
            "paid_days": 22,
            "unpaid_days": -1
        }
        response = await client.post("/api/v1/salary/", json=salary_data, headers=auth_headers)
        assert response.status_code == 422


class TestSalaryMathWithUnpaidDays:
    """Verify the salary calculation when an employee has unpaid absences."""

    @pytest.mark.asyncio
    async def test_net_salary_with_unpaid_days(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """
        gross = base + allowances = 5000 + 500 = 5500
        per_day = base / working_days = 5000 / 20 = 250
        deduction = per_day * unpaid_days = 250 * 2 = 500
        net = gross - deduction = 5500 - 500 = 5000
        """
        employee = Employee(
            firstname="Grace",
            lastname="Hall",
            email="grace.hall@example.com",
            country="USA",
            state="Nevada",
            city="Las Vegas",
            zipcode="89101",
            address="1 Casino Blvd",
            phone_number="7025551234",
            department="Finance",
            designation="Analyst",
            joining_date=date(2024, 1, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay = EmployeeBasePay(
            employee_id=employee.id,
            base_salary=Decimal("5000.00"),
            allowances=Decimal("500.00"),
            added_by=test_user.id
        )
        db_session.add(base_pay)
        await db_session.commit()

        salary_data = {
            "employee_id": employee.id,
            "payroll_month": 3,
            "payroll_year": 2024,
            "total_days": 31,
            "working_days": 20,
            "paid_days": 18,
            "unpaid_days": 2
        }

        response = await client.post("/api/v1/salary/", json=salary_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert Decimal(str(data["gross_salary"])) == Decimal("5500.00")
        expected_deduction = Decimal("5000.00") / Decimal("20") * Decimal("2")
        assert Decimal(str(data["deductions"])) == expected_deduction
        expected_net = Decimal("5500.00") - expected_deduction
        assert Decimal(str(data["net_salary"])) == expected_net

    @pytest.mark.asyncio
    async def test_net_salary_zero_unpaid_days(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """With no unpaid days, net_salary equals gross_salary."""
        employee = Employee(
            firstname="Henry",
            lastname="Ford",
            email="henry.ford@example.com",
            country="USA",
            state="Michigan",
            city="Detroit",
            zipcode="48201",
            address="1 Ford Ave",
            phone_number="3135551234",
            department="Production",
            designation="Manager",
            joining_date=date(2024, 1, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay = EmployeeBasePay(
            employee_id=employee.id,
            base_salary=Decimal("4000.00"),
            allowances=Decimal("400.00"),
            added_by=test_user.id
        )
        db_session.add(base_pay)
        await db_session.commit()

        salary_data = {
            "employee_id": employee.id,
            "payroll_month": 4,
            "payroll_year": 2024,
            "total_days": 30,
            "working_days": 22,
            "paid_days": 22,
            "unpaid_days": 0
        }

        response = await client.post("/api/v1/salary/", json=salary_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert Decimal(str(data["deductions"])) == Decimal("0")
        assert Decimal(str(data["net_salary"])) == Decimal(str(data["gross_salary"]))

    @pytest.mark.asyncio
    async def test_payment_date_set_to_today(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """payment_date in the response should equal today's date."""
        employee = Employee(
            firstname="Isla",
            lastname="Turner",
            email="isla.turner@example.com",
            country="USA",
            state="Arizona",
            city="Phoenix",
            zipcode="85001",
            address="2 Desert Rd",
            phone_number="6025559876",
            department="IT",
            designation="SysAdmin",
            joining_date=date(2024, 1, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay = EmployeeBasePay(
            employee_id=employee.id,
            base_salary=Decimal("3500.00"),
            allowances=Decimal("350.00"),
            added_by=test_user.id
        )
        db_session.add(base_pay)
        await db_session.commit()

        salary_data = {
            "employee_id": employee.id,
            "payroll_month": 5,
            "payroll_year": 2024,
            "total_days": 31,
            "working_days": 23,
            "paid_days": 23,
            "unpaid_days": 0
        }

        response = await client.post("/api/v1/salary/", json=salary_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["payment_date"] == date.today().isoformat()

    @pytest.mark.asyncio
    async def test_new_salary_defaults_to_pending_status(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """A newly created salary record should have payment_status='PENDING'."""
        employee = Employee(
            firstname="Jack",
            lastname="Cole",
            email="jack.cole@example.com",
            country="USA",
            state="Utah",
            city="Salt Lake",
            zipcode="84101",
            address="3 Lake Rd",
            phone_number="8015551234",
            department="Ops",
            designation="Ops Lead",
            joining_date=date(2024, 1, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay = EmployeeBasePay(
            employee_id=employee.id,
            base_salary=Decimal("4800.00"),
            allowances=Decimal("480.00"),
            added_by=test_user.id
        )
        db_session.add(base_pay)
        await db_session.commit()

        salary_data = {
            "employee_id": employee.id,
            "payroll_month": 6,
            "payroll_year": 2024,
            "total_days": 30,
            "working_days": 22,
            "paid_days": 22,
            "unpaid_days": 0
        }

        response = await client.post("/api/v1/salary/", json=salary_data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["payment_status"] == "PENDING"


class TestUpdateSalaryExtended:
    """Additional PATCH /api/v1/salary/{id} scenarios."""

    @pytest.mark.asyncio
    async def test_update_salary_deductions_field(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """PATCH with unpaid_days should trigger recalculation and produce a non-zero deduction."""
        employee = Employee(
            firstname="Karl",
            lastname="Mann",
            email="karl.mann@example.com",
            country="Germany",
            state="Bavaria",
            city="Munich",
            zipcode="80333",
            address="4 Marienplatz",
            phone_number="4915551234",
            department="R&D",
            designation="Researcher",
            joining_date=date(2024, 1, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay = EmployeeBasePay(
            employee_id=employee.id,
            base_salary=Decimal("6000.00"),
            allowances=Decimal("600.00"),
            added_by=test_user.id
        )
        db_session.add(base_pay)
        await db_session.commit()

        salary = EmployeeSalary(
            employee_id=employee.id,
            payroll_month=2,
            payroll_year=2024,
            base_salary=Decimal("6000.00"),
            allowances=Decimal("600.00"),
            gross_salary=Decimal("6600.00"),
            net_salary=Decimal("6600.00"),
            deductions=Decimal("0.00"),
            total_days=29,
            working_days=21,
            paid_days=21,
            unpaid_days=0,
            payment_status="PENDING",
            added_by=test_user.id
        )
        db_session.add(salary)
        await db_session.commit()
        await db_session.refresh(salary)

        update_data = {"version": 1, "unpaid_days": 2, "working_days": 20, "paid_days": 18}

        with patch('app.routes.salary.add_employee_log'):
            response = await client.patch(f"/api/v1/salary/{salary.id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        # deduction = base_salary / working_days * unpaid_days = 6000 / 20 * 2 = 600
        expected_deduction = Decimal("6000.00") / Decimal("20") * Decimal("2")
        assert Decimal(str(response.json()["deductions"])) == expected_deduction

    @pytest.mark.asyncio
    async def test_update_salary_negative_deductions(self, client: AsyncClient, auth_headers: dict):
        """deductions < 0 violates ge=0 → 422."""
        response = await client.patch(
            "/api/v1/salary/1",
            json={"deductions": "-50.00"},
            headers=auth_headers
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_update_salary_payment_date_field(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """PATCH updating payment_date should persist correctly."""
        employee = Employee(
            firstname="Lena",
            lastname="Park",
            email="lena.park@example.com",
            country="South Korea",
            state="Seoul",
            city="Gangnam",
            zipcode="06035",
            address="5 Teheran-ro",
            phone_number="821055551234",
            department="Marketing",
            designation="CMO",
            joining_date=date(2024, 1, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay = EmployeeBasePay(
            employee_id=employee.id,
            base_salary=Decimal("8000.00"),
            allowances=Decimal("800.00"),
            added_by=test_user.id
        )
        db_session.add(base_pay)
        await db_session.commit()

        salary = EmployeeSalary(
            employee_id=employee.id,
            payroll_month=3,
            payroll_year=2024,
            base_salary=Decimal("8000.00"),
            allowances=Decimal("800.00"),
            gross_salary=Decimal("8800.00"),
            net_salary=Decimal("8800.00"),
            deductions=Decimal("0.00"),
            total_days=31,
            working_days=21,
            paid_days=21,
            unpaid_days=0,
            payment_status="PENDING",
            added_by=test_user.id
        )
        db_session.add(salary)
        await db_session.commit()
        await db_session.refresh(salary)

        update_data = {"version": 1, "payment_date": "2024-03-28", "payment_status": "PAID"}

        with patch('app.routes.salary.add_employee_log'):
            response = await client.patch(f"/api/v1/salary/{salary.id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["payment_date"] == "2024-03-28"
        assert data["payment_status"] == "PAID"


class TestUpdateBasePayValidation:
    """Validation edge cases for PATCH /api/v1/salary/modify-base/{id}."""

    @pytest.mark.asyncio
    async def test_update_base_pay_missing_remark(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """remark is required in EmployeePromote → missing it returns 422."""
        employee = Employee(
            firstname="Mike",
            lastname="Nolan",
            email="mike.nolan@example.com",
            country="Ireland",
            state="Leinster",
            city="Dublin",
            zipcode="D01",
            address="6 O'Connell St",
            phone_number="35315551234",
            department="Legal",
            designation="Lawyer",
            joining_date=date(2024, 1, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay = EmployeeBasePay(
            employee_id=employee.id,
            base_salary=Decimal("7000.00"),
            allowances=Decimal("700.00"),
            added_by=test_user.id
        )
        db_session.add(base_pay)
        await db_session.commit()

        # remark is omitted — should fail Pydantic validation
        response = await client.patch(
            f"/api/v1/salary/modify-base/{employee.id}",
            json={"base_salary": "8000.00"},
            headers=auth_headers
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_update_base_pay_negative_base_salary(self, client: AsyncClient, auth_headers: dict):
        """base_salary <= 0 violates gt=0 → 422."""
        response = await client.patch(
            "/api/v1/salary/modify-base/1",
            json={"base_salary": "-100.00", "remark": "Raise"},
            headers=auth_headers
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_update_base_pay_only_allowances(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """Partial promote — update only allowances (base_salary left as-is)."""
        employee = Employee(
            firstname="Nina",
            lastname="Okafor",
            email="nina.okafor@example.com",
            country="Nigeria",
            state="Lagos",
            city="Lagos",
            zipcode="100001",
            address="7 Victoria Island",
            phone_number="2341555234",
            department="Finance",
            designation="CFO",
            joining_date=date(2024, 1, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay = EmployeeBasePay(
            employee_id=employee.id,
            base_salary=Decimal("9000.00"),
            allowances=Decimal("900.00"),
            added_by=test_user.id
        )
        db_session.add(base_pay)
        await db_session.commit()

        update_data = {"version": 1, "allowances": "1200.00", "remark": "Allowance increment"}

        with patch('app.routes.salary.add_employee_log'):
            response = await client.patch(
                f"/api/v1/salary/modify-base/{employee.id}",
                json=update_data,
                headers=auth_headers
            )
        assert response.status_code == 200
        data = response.json()
        # base_salary should be unchanged
        assert Decimal(str(data["base_salary"])) == Decimal("9000.00")
        assert Decimal(str(data["allowances"])) == Decimal("1200.00")

    @pytest.mark.asyncio
    async def test_update_base_pay_only_base_salary(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """Partial promote — update only base_salary (allowances left as-is)."""
        employee = Employee(
            firstname="Omar",
            lastname="Patel",
            email="omar.patel@example.com",
            country="India",
            state="Gujarat",
            city="Ahmedabad",
            zipcode="380001",
            address="8 CG Road",
            phone_number="917955551234",
            department="Engineering",
            designation="VP Engineering",
            joining_date=date(2024, 1, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay = EmployeeBasePay(
            employee_id=employee.id,
            base_salary=Decimal("10000.00"),
            allowances=Decimal("1000.00"),
            added_by=test_user.id
        )
        db_session.add(base_pay)
        await db_session.commit()

        update_data = {"version": 1, "base_salary": "12000.00", "remark": "Annual raise"}

        with patch('app.routes.salary.add_employee_log'):
            response = await client.patch(
                f"/api/v1/salary/modify-base/{employee.id}",
                json=update_data,
                headers=auth_headers
            )
        assert response.status_code == 200
        data = response.json()
        assert Decimal(str(data["base_salary"])) == Decimal("12000.00")
        # allowances should be unchanged
        assert Decimal(str(data["allowances"])) == Decimal("1000.00")


class TestCreateBasePayExtended:
    """Additional POST /api/v1/salary/base scenarios."""

    @pytest.mark.asyncio
    async def test_create_base_pay_zero_allowances(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """allowances defaults to 0.00 when not provided."""
        employee = Employee(
            firstname="Paul",
            lastname="Quinn",
            email="paul.quinn@example.com",
            country="UK",
            state="England",
            city="London",
            zipcode="EC1A 1BB",
            address="9 Cheapside",
            phone_number="4420755551234",
            department="Accounting",
            designation="Accountant",
            joining_date=date(2024, 1, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay_data = {
            "employee_id": employee.id,
            "base_salary": "3000.00"
            # allowances omitted — should default to 0
        }

        with patch('app.routes.salary.add_employee_log'):
            response = await client.post("/api/v1/salary/base", json=base_pay_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert Decimal(str(data["allowances"])) == Decimal("0")

    @pytest.mark.asyncio
    async def test_create_base_pay_zero_base_salary(self, client: AsyncClient, auth_headers: dict):
        """base_salary=0 violates gt=0 → 422."""
        base_pay_data = {
            "employee_id": 1,
            "base_salary": "0.00",
            "allowances": "500.00"
        }
        response = await client.post("/api/v1/salary/base", json=base_pay_data, headers=auth_headers)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_base_pay_missing_employee_id(self, client: AsyncClient, auth_headers: dict):
        """Missing employee_id in body → 422."""
        base_pay_data = {
            "base_salary": "3000.00",
            "allowances": "300.00"
        }
        response = await client.post("/api/v1/salary/base", json=base_pay_data, headers=auth_headers)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_base_pay_response_contains_employee_id(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession, test_user: User):
        """Response body for base pay creation contains the correct employee_id."""
        employee = Employee(
            firstname="Rose",
            lastname="Stone",
            email="rose.stone@example.com",
            country="Canada",
            state="Ontario",
            city="Toronto",
            zipcode="M5H 2N2",
            address="10 King St W",
            phone_number="14165551234",
            department="HR",
            designation="HR Director",
            joining_date=date(2024, 1, 1),
            added_by="test-user-id"
        )
        db_session.add(employee)
        await db_session.commit()
        await db_session.refresh(employee)

        base_pay_data = {
            "employee_id": employee.id,
            "base_salary": "7500.00",
            "allowances": "750.00"
        }

        with patch('app.routes.salary.add_employee_log'):
            response = await client.post("/api/v1/salary/base", json=base_pay_data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["employee_id"] == employee.id
