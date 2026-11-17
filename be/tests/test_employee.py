import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from app.models.employee import Employee
from app.models.user import User
from app.core.security import hash_password
from app.enums.user_role import UserRole
from app.enums.employment_type import EmploymentType


class TestCreateEmployee:
    """Test cases for creating an employee."""

    @pytest.mark.asyncio
    async def test_create_employee_success(self, client: AsyncClient, auth_headers: dict):
        """Test successful employee creation."""
        employee_data = {
            "firstname": "John",
            "lastname": "Doe",
            "email": "john.doe@example.com",
            "country": "USA",
            "state": "California",
            "city": "Los Angeles",
            "zipcode": "90001",
            "address": "123 Main St",
            "phone_number": "1234567890",
            "department": "Engineering",
            "designation": "Software Engineer",
            "joining_date": "2024-01-15"
        }
        response = await client.post("/api/v1/employee/", json=employee_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["firstname"] == "John"
        assert data["lastname"] == "Doe"
        assert data["email"] == "john.doe@example.com"
        assert "id" in data
        assert "created_at" in data

    @pytest.mark.asyncio
    async def test_create_employee_no_auth(self, client: AsyncClient):
        """Test employee creation without authentication."""
        employee_data = {
            "firstname": "John",
            "lastname": "Doe",
            "email": "john.doe@example.com",
            "country": "USA",
            "state": "California",
            "city": "Los Angeles",
            "zipcode": "90001",
            "address": "123 Main St",
            "phone_number": "1234567890",
            "department": "Engineering",
            "designation": "Software Engineer",
            "joining_date": "2024-01-15"
        }
        response = await client.post("/api/v1/employee/", json=employee_data)
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_employee_invalid_email(self, client: AsyncClient, auth_headers: dict):
        """Test employee creation with invalid email."""
        employee_data = {
            "firstname": "John",
            "lastname": "Doe",
            "email": "invalid-email",
            "country": "USA",
            "state": "California",
            "city": "Los Angeles",
            "zipcode": "90001",
            "address": "123 Main St",
            "phone_number": "1234567890",
            "department": "Engineering",
            "designation": "Software Engineer",
            "joining_date": "2024-01-15"
        }
        response = await client.post("/api/v1/employee/", json=employee_data, headers=auth_headers)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_employee_missing_required_field(self, client: AsyncClient, auth_headers: dict):
        """Test employee creation with missing required field."""
        employee_data = {
            "firstname": "John",
            "lastname": "Doe",
            "email": "john.doe@example.com",
            "country": "USA",
            "state": "California",
            "city": "Los Angeles",
            "zipcode": "90001",
            "address": "123 Main St",
            "phone_number": "1234567890",
            "department": "Engineering",
            "designation": "Software Engineer"
            # Missing joining_date
        }
        response = await client.post("/api/v1/employee/", json=employee_data, headers=auth_headers)
        assert response.status_code == 422


class TestGetEmployee:
    """Test cases for getting a single employee."""

    @pytest.mark.asyncio
    async def test_get_employee_success(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession):
        """Test successful retrieval of an employee."""
        # Create an employee
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

        response = await client.get(f"/api/v1/employee/{employee.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == employee.id
        assert data["firstname"] == "Jane"
        assert data["lastname"] == "Smith"

    @pytest.mark.asyncio
    async def test_get_employee_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test getting a non-existent employee."""
        response = await client.get("/api/v1/employee/99999", headers=auth_headers)
        assert response.status_code == 404
        assert "No employee found" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_get_employee_no_auth(self, client: AsyncClient):
        """Test getting employee without authentication."""
        response = await client.get("/api/v1/employee/1")
        assert response.status_code == 401


class TestUpdateEmployee:
    """Test cases for updating an employee."""

    @pytest.mark.asyncio
    async def test_update_employee_success(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession):
        """Test successful employee update."""
        # Create an employee
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

        # Update the employee
        update_data = {
            "firstname": "Robert",
            "designation": "Senior Sales Rep"
        }
        from unittest.mock import patch
        with patch('app.routes.employee.add_employee_log'):
            response = await client.patch(f"/api/v1/employee/{employee.id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["firstname"] == "Robert"
        assert data["designation"] == "Senior Sales Rep"

    @pytest.mark.asyncio
    async def test_update_employee_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test updating a non-existent employee."""
        update_data = {"firstname": "Robert"}
        response = await client.patch("/api/v1/employee/99999", json=update_data, headers=auth_headers)
        assert response.status_code == 404
        assert "No employee found" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_update_employee_no_auth(self, client: AsyncClient):
        """Test updating employee without authentication."""
        update_data = {"firstname": "Robert"}
        response = await client.patch("/api/v1/employee/1", json=update_data)
        assert response.status_code == 401


class TestListEmployees:
    """Test cases for listing employees."""

    @pytest.mark.asyncio
    async def test_list_employees_success(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession):
        """Test successful employee listing."""
        # Create multiple employees
        for i in range(3):
            employee = Employee(
                firstname=f"Employee{i}",
                lastname=f"Test{i}",
                email=f"employee{i}@example.com",
                country="USA",
                state="California",
                city="San Francisco",
                zipcode="94102",
                address=f"{i} Test St",
                phone_number=f"123456789{i}",
                department="Engineering",
                designation="Developer",
                joining_date=date(2024, 1, i + 1),
                added_by="test-user-id"
            )
            db_session.add(employee)
        await db_session.commit()

        response = await client.get("/api/v1/employee/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert len(data["items"]) >= 3

    @pytest.mark.asyncio
    async def test_list_employees_with_search(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession):
        """Test employee listing with search filter."""
        # Create employees
        employee1 = Employee(
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
        employee2 = Employee(
            firstname="Bob",
            lastname="Builder",
            email="bob@example.com",
            country="USA",
            state="California",
            city="San Francisco",
            zipcode="94102",
            address="2 Test St",
            phone_number="1234567891",
            department="Engineering",
            designation="Developer",
            joining_date=date(2024, 1, 2),
            added_by="test-user-id"
        )
        db_session.add_all([employee1, employee2])
        await db_session.commit()

        response = await client.get("/api/v1/employee/?search=Alice", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["firstname"] == "Alice"

    @pytest.mark.asyncio
    async def test_list_employees_with_pagination(self, client: AsyncClient, auth_headers: dict, db_session: AsyncSession):
        """Test employee listing with pagination."""
        # Create employees
        for i in range(5):
            employee = Employee(
                firstname=f"User{i}",
                lastname=f"Test{i}",
                email=f"user{i}@example.com",
                country="USA",
                state="California",
                city="San Francisco",
                zipcode="94102",
                address=f"{i} Test St",
                phone_number=f"123456789{i}",
                department="Engineering",
                designation="Developer",
                joining_date=date(2024, 1, i + 1),
                added_by="test-user-id"
            )
            db_session.add(employee)
        await db_session.commit()

        response = await client.get("/api/v1/employee/?page=1&limit=2", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["limit"] == 2
        assert len(data["items"]) == 2

    @pytest.mark.asyncio
    async def test_list_employees_no_auth(self, client: AsyncClient):
        """Test listing employees without authentication."""
        response = await client.get("/api/v1/employee/")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_list_employees_invalid_sort(self, client: AsyncClient, auth_headers: dict):
        """Test employee listing with invalid sort field."""
        response = await client.get("/api/v1/employee/?sort_by=invalid_field", headers=auth_headers)
        assert response.status_code == 400
        assert "Invalid sort field" in response.json()["message"]
