import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.core.security import hash_password
from app.enums.user_role import UserRole
from jose import jwt
from app.core.config import settings
import uuid


class TestRegister:
    """Test cases for user registration endpoint."""

    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient, test_user_data: dict):
        """Test successful user registration."""
        response = await client.post("/api/v1/auth/register", json=test_user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "user created"

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient, test_user_data: dict):
        """Test registration with duplicate email."""
        # First registration
        response1 = await client.post("/api/v1/auth/register", json=test_user_data)
        assert response1.status_code == 200

        # Second registration with same email
        response2 = await client.post("/api/v1/auth/register", json=test_user_data)
        # Returns 401 when exception is caught in the try-except block
        assert response2.status_code == 401
        detail = response2.json()
        assert "Email already exists" in detail.get("message", "")

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client: AsyncClient):
        """Test registration with invalid email."""
        data = {
            "email": "invalid-email",
            "firstname": "John",
            "lastname": "Doe",
            "password": "Password123!"
        }
        response = await client.post("/api/v1/auth/register", json=data)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_weak_password(self, client: AsyncClient):
        """Test registration with weak password (no special character)."""
        data = {
            "email": "test@example.com",
            "firstname": "John",
            "lastname": "Doe",
            "password": "Password123"
        }
        response = await client.post("/api/v1/auth/register", json=data)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_password_without_number(self, client: AsyncClient):
        """Test registration with password without number."""
        data = {
            "email": "test@example.com",
            "firstname": "John",
            "lastname": "Doe",
            "password": "Password!"
        }
        response = await client.post("/api/v1/auth/register", json=data)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_password_too_short(self, client: AsyncClient):
        """Test registration with password too short."""
        data = {
            "email": "test@example.com",
            "firstname": "John",
            "lastname": "Doe",
            "password": "P1!"
        }
        response = await client.post("/api/v1/auth/register", json=data)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_invalid_phone_format(self, client: AsyncClient):
        """Test registration with invalid phone number format."""
        data = {
            "email": "test@example.com",
            "firstname": "John",
            "lastname": "Doe",
            "password": "Password123!",
            "country_code": "+91",
            "phone_number": "12345"
        }
        response = await client.post("/api/v1/auth/register", json=data)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_country_code_without_phone(self, client: AsyncClient):
        """Test registration with country code but no phone number."""
        data = {
            "email": "test@example.com",
            "firstname": "John",
            "lastname": "Doe",
            "password": "Password123!",
            "country_code": "+91"
        }
        response = await client.post("/api/v1/auth/register", json=data)
        assert response.status_code == 422


class TestLogin:
    """Test cases for user login endpoint."""

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, test_user: User):
        """Test successful login."""
        login_data = {
            "email": test_user.email,
            "password": "Test123!"
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert isinstance(data["access_token"], str)
        assert isinstance(data["refresh_token"], str)

    @pytest.mark.asyncio
    async def test_login_invalid_email(self, client: AsyncClient):
        """Test login with non-existent email."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "Test123!"
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401
        # The error is wrapped in the exception handler with a message field
        detail = response.json()
        assert "Invalid" in detail.get("message", "")

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient, test_user: User):
        """Test login with wrong password."""
        login_data = {
            "email": test_user.email,
            "password": "WrongPassword123!"
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401
        # The error is wrapped in the exception handler with a message field
        detail = response.json()
        assert "Invalid" in detail.get("message", "")

    @pytest.mark.asyncio
    async def test_login_missing_email(self, client: AsyncClient):
        """Test login without email."""
        login_data = {
            "password": "Test123!"
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_login_missing_password(self, client: AsyncClient):
        """Test login without password."""
        login_data = {
            "email": "test@example.com"
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_login_empty_credentials(self, client: AsyncClient):
        """Test login with empty credentials."""
        login_data = {
            "email": "",
            "password": ""
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        # Empty email fails Pydantic validation (email format)
        assert response.status_code == 422


class TestGetMe:
    """Test cases for get-me endpoint."""

    @pytest.mark.asyncio
    async def test_get_me_success(self, client: AsyncClient, auth_headers: dict, test_user: User):
        """Test successful get current user."""
        response = await client.get("/api/v1/auth/get-me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["firstname"] == test_user.firstname
        assert data["lastname"] == test_user.lastname

    @pytest.mark.asyncio
    async def test_get_me_no_token(self, client: AsyncClient):
        """Test get-me without authentication token."""
        response = await client.get("/api/v1/auth/get-me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me_invalid_token(self, client: AsyncClient):
        """Test get-me with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await client.get("/api/v1/auth/get-me", headers=headers)
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me_non_hr_user(self, client: AsyncClient, db_session: AsyncSession):
        """Test get-me with non-HR user (ADMIN role)."""
        # Since the enum only has ADMIN and HR, and the code checks for HR only,
        # let's test with ADMIN which should be rejected
        user = User(
            email="admin@example.com",
            firstname="Admin",
            lastname="User",
            hashed_password=hash_password("Test123!"),
            role=UserRole.ADMIN
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Login to get token
        login_data = {
            "email": user.email,
            "password": "Test123!"
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Try to access get-me - ADMIN should be rejected since only HR is allowed
        response = await client.get("/api/v1/auth/get-me", headers=headers)
        assert response.status_code == 409
        detail = response.json()
        assert "Not authorized" in detail.get("message", "")


class TestRefresh:
    """Test cases for token refresh endpoint."""

    @pytest.mark.asyncio
    async def test_refresh_success(self, client: AsyncClient, test_user: User):
        """Test successful token refresh."""
        # First login to get refresh token
        login_data = {
            "email": test_user.email,
            "password": "Test123!"
        }
        login_response = await client.post("/api/v1/auth/login", json=login_data)
        refresh_token = login_response.json()["refresh_token"]

        # Use refresh token to get new tokens
        headers = {"refreshToken": refresh_token}
        response = await client.get("/api/v1/auth/refresh", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_refresh_missing_header(self, client: AsyncClient):
        """Test refresh without refresh token header."""
        response = await client.get("/api/v1/auth/refresh")
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_refresh_invalid_token(self, client: AsyncClient):
        """Test refresh with invalid token."""
        headers = {"refreshToken": "invalid_token"}
        response = await client.get("/api/v1/auth/refresh", headers=headers)
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_access_token(self, client: AsyncClient, test_user: User):
        """Test refresh using access token instead of refresh token."""
        # Login to get access token
        login_data = {
            "email": test_user.email,
            "password": "Test123!"
        }
        login_response = await client.post("/api/v1/auth/login", json=login_data)
        access_token = login_response.json()["access_token"]

        # Try to use access token as refresh token
        headers = {"refreshToken": access_token}
        response = await client.get("/api/v1/auth/refresh", headers=headers)
        assert response.status_code == 401


class TestLogout:
    """Test cases for logout endpoint."""

    @pytest.mark.asyncio
    async def test_logout_success(self, client: AsyncClient, test_user: User):
        """Test successful logout."""
        # Login to get refresh token
        login_data = {
            "email": test_user.email,
            "password": "Test123!"
        }
        login_response = await client.post("/api/v1/auth/login", json=login_data)
        refresh_token = login_response.json()["refresh_token"]

        # Logout
        logout_data = {"refresh_token": refresh_token}
        response = await client.post("/api/v1/auth/logout", json=logout_data)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Logged out successfully"
        assert data["status"] is True

    @pytest.mark.asyncio
    async def test_logout_invalid_token(self, client: AsyncClient):
        """Test logout with invalid token."""
        logout_data = {"refresh_token": "invalid_token"}
        response = await client.post("/api/v1/auth/logout", json=logout_data)
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_logout_missing_token(self, client: AsyncClient):
        """Test logout without refresh token."""
        logout_data = {"refresh_token": ""}
        response = await client.post("/api/v1/auth/logout", json=logout_data)
        # Empty string will fail JWT decode
        assert response.status_code == 401


class TestUpdateProfile:
    """Test cases for update profile endpoint."""

    @pytest.mark.asyncio
    async def test_update_profile_firstname(self, client: AsyncClient, auth_headers: dict):
        """Test updating user's first name."""
        update_data = {"firstname": "UpdatedName"}
        response = await client.put("/api/v1/auth/update-profile", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["firstname"] == "UpdatedName"

    @pytest.mark.asyncio
    async def test_update_profile_lastname(self, client: AsyncClient, auth_headers: dict):
        """Test updating user's last name."""
        update_data = {"lastname": "UpdatedLast"}
        response = await client.put("/api/v1/auth/update-profile", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["lastname"] == "UpdatedLast"

    @pytest.mark.asyncio
    async def test_update_profile_phone(self, client: AsyncClient, auth_headers: dict):
        """Test updating user's phone number."""
        update_data = {
            "country_code": "+1",
            "phone_number": "9876543210"
        }
        response = await client.put("/api/v1/auth/update-profile", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["country_code"] == "+1"
        assert data["phone_number"] == "9876543210"

    @pytest.mark.asyncio
    async def test_update_profile_multiple_fields(self, client: AsyncClient, auth_headers: dict):
        """Test updating multiple fields at once."""
        update_data = {
            "firstname": "NewFirst",
            "lastname": "NewLast",
            "avatar": "https://example.com/avatar.jpg"
        }
        response = await client.put("/api/v1/auth/update-profile", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["firstname"] == "NewFirst"
        assert data["lastname"] == "NewLast"
        assert data["avatar"] == "https://example.com/avatar.jpg"

    @pytest.mark.asyncio
    async def test_update_profile_no_auth(self, client: AsyncClient):
        """Test updating profile without authentication."""
        update_data = {"firstname": "UpdatedName"}
        response = await client.put("/api/v1/auth/update-profile", json=update_data)
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_profile_invalid_phone_format(self, client: AsyncClient, auth_headers: dict):
        """Test updating profile with invalid phone number."""
        update_data = {
            "country_code": "+91",
            "phone_number": "12345"
        }
        response = await client.put("/api/v1/auth/update-profile", json=update_data, headers=auth_headers)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_update_profile_partial_phone(self, client: AsyncClient, auth_headers: dict):
        """Test updating profile with only country code (no phone)."""
        update_data = {"country_code": "+91"}
        response = await client.put("/api/v1/auth/update-profile", json=update_data, headers=auth_headers)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_update_profile_empty_body(self, client: AsyncClient, auth_headers: dict):
        """Test updating profile with empty body (no changes)."""
        update_data = {}
        response = await client.put("/api/v1/auth/update-profile", json=update_data, headers=auth_headers)
        assert response.status_code == 200
