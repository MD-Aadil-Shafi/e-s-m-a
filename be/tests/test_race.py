"""
test_race.py
============
Optimistic-locking tests for:

  PATCH /api/v1/salary/{id}             — update salary record
  PATCH /api/v1/salary/modify-base/{id} — update employee base pay

How the race is simulated
--------------------------
SQLite (the in-memory test DB) does not support SELECT … FOR UPDATE and shares
a single AsyncSession across all requests in a test.  True concurrent commits
are therefore not feasible.  Instead, the race is reproduced at the
*application layer*:

  1. Request A with version=N commits successfully → DB version is now N+1.
  2. Request B immediately follows, also carrying version=N (the stale token a
     second HR user would have fetched before A committed).
  3. The route's WHERE version = N now finds no row → 404.

This covers the identical scenario that asyncio.gather would test, without the
IllegalStateChangeError / Lock errors caused by two coroutines racing over one
SQLite session.
"""

import pytest
from datetime import date
from decimal import Decimal
from unittest.mock import patch

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee
from app.models.employee_base_pay import EmployeeBasePay
from app.models.employee_salary import EmployeeSalary
from app.models.user import User


# ─── helpers ─────────────────────────────────────────────────────────────────

def _make_employee(suffix: str) -> Employee:
    return Employee(
        firstname=f"Race{suffix}",
        lastname="Tester",
        email=f"race.{suffix.lower()}@example.com",
        country="USA",
        state="California",
        city="San Jose",
        zipcode="95101",
        address="1 Test Lane",
        phone_number="4085550000",
        department="Engineering",
        designation="Engineer",
        joining_date=date(2024, 1, 1),
        added_by="test-user-id",
    )


async def _seed_base_pay(
    db: AsyncSession,
    employee_id: int,
    user_id,
    base_salary: str = "6000.00",
    allowances: str = "600.00",
    version: int = 1,
) -> EmployeeBasePay:
    bp = EmployeeBasePay(
        employee_id=employee_id,
        base_salary=Decimal(base_salary),
        allowances=Decimal(allowances),
        added_by=user_id,
        version=version,
    )
    db.add(bp)
    await db.commit()
    await db.refresh(bp)
    return bp


async def _seed_salary(
    db: AsyncSession,
    employee_id: int,
    user_id,
    version: int = 1,
) -> EmployeeSalary:
    sal = EmployeeSalary(
        employee_id=employee_id,
        payroll_month=1,
        payroll_year=2024,
        base_salary=Decimal("6000.00"),
        allowances=Decimal("600.00"),
        gross_salary=Decimal("6600.00"),
        net_salary=Decimal("6600.00"),
        deductions=Decimal("0.00"),
        total_days=30,
        working_days=22,
        paid_days=22,
        unpaid_days=0,
        payment_status="PENDING",
        added_by=user_id,
        version=version,
    )
    db.add(sal)
    await db.commit()
    await db.refresh(sal)
    return sal


# ─────────────────────────────────────────────────────────────────────────────
# SALARY UPDATE  — PATCH /api/v1/salary/{id}
# ─────────────────────────────────────────────────────────────────────────────

class TestSalaryOptimisticLocking:
    """Optimistic-locking behaviour for PATCH /api/v1/salary/{id}."""

    # ── version field is required ────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_update_salary_missing_version_returns_422(
        self,
        client: AsyncClient,
        auth_headers: dict,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Omitting 'version' from the request body must return 422."""
        emp = _make_employee("SalV422")
        db_session.add(emp)
        await db_session.commit()
        await db_session.refresh(emp)

        sal = await _seed_salary(db_session, emp.id, test_user.id)

        response = await client.patch(
            f"/api/v1/salary/{sal.id}",
            json={"payment_status": "PROCESSED"},   # no version
            headers=auth_headers,
        )
        assert response.status_code == 422

    # ── correct version → success, version incremented ───────────────────────

    @pytest.mark.asyncio
    async def test_update_salary_correct_version_increments(
        self,
        client: AsyncClient,
        auth_headers: dict,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Correct version must succeed and version in response must be N+1."""
        emp = _make_employee("SalOK")
        db_session.add(emp)
        await db_session.commit()
        await db_session.refresh(emp)

        sal = await _seed_salary(db_session, emp.id, test_user.id, version=1)

        with patch("app.routes.salary.add_employee_log"):
            response = await client.patch(
                f"/api/v1/salary/{sal.id}",
                json={"version": 1, "payment_status": "PROCESSED"},
                headers=auth_headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["version"] == 2
        assert data["payment_status"] == "PROCESSED"

    # ── stale version → 404 ───────────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_update_salary_stale_version_returns_404(
        self,
        client: AsyncClient,
        auth_headers: dict,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Client sending an older version than what the DB holds must get 404."""
        emp = _make_employee("SalStale")
        db_session.add(emp)
        await db_session.commit()
        await db_session.refresh(emp)

        # DB is at version 3; client only knows about version 1
        sal = await _seed_salary(db_session, emp.id, test_user.id, version=3)

        with patch("app.routes.salary.add_employee_log"):
            response = await client.patch(
                f"/api/v1/salary/{sal.id}",
                json={"version": 1, "payment_status": "PROCESSED"},
                headers=auth_headers,
            )

        assert response.status_code == 404
        assert "refresh" in response.json()["message"].lower()

    # ── future version → 404 ─────────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_update_salary_future_version_returns_404(
        self,
        client: AsyncClient,
        auth_headers: dict,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Version higher than the DB value must also return 404."""
        emp = _make_employee("SalFuture")
        db_session.add(emp)
        await db_session.commit()
        await db_session.refresh(emp)

        sal = await _seed_salary(db_session, emp.id, test_user.id, version=1)

        with patch("app.routes.salary.add_employee_log"):
            response = await client.patch(
                f"/api/v1/salary/{sal.id}",
                json={"version": 99, "payment_status": "PROCESSED"},
                headers=auth_headers,
            )

        assert response.status_code == 404

    # ── sequential updates each using the returned version ───────────────────

    @pytest.mark.asyncio
    async def test_update_salary_sequential_updates_succeed(
        self,
        client: AsyncClient,
        auth_headers: dict,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Two back-to-back updates using each response's version must both succeed."""
        emp = _make_employee("SalSeq")
        db_session.add(emp)
        await db_session.commit()
        await db_session.refresh(emp)

        sal = await _seed_salary(db_session, emp.id, test_user.id, version=1)

        with patch("app.routes.salary.add_employee_log"):
            r1 = await client.patch(
                f"/api/v1/salary/{sal.id}",
                json={"version": 1, "payment_status": "HOLD"},
                headers=auth_headers,
            )
            assert r1.status_code == 200
            assert r1.json()["version"] == 2

            r2 = await client.patch(
                f"/api/v1/salary/{sal.id}",
                json={"version": 2, "payment_status": "PROCESSED"},
                headers=auth_headers,
            )
            assert r2.status_code == 200
            assert r2.json()["version"] == 3
            assert r2.json()["payment_status"] == "PROCESSED"

    # ── race: first writer wins, second writer with stale version loses ───────

    @pytest.mark.asyncio
    async def test_update_salary_second_writer_with_stale_version_loses(
        self,
        client: AsyncClient,
        auth_headers: dict,
        db_session: AsyncSession,
        test_user: User,
    ):
        """
        Simulates two HR users both reading version=1 then independently
        trying to update.  The first commit succeeds (version → 2).
        The second, still carrying version=1, is rejected with 404.
        """
        emp = _make_employee("SalRace")
        db_session.add(emp)
        await db_session.commit()
        await db_session.refresh(emp)

        sal = await _seed_salary(db_session, emp.id, test_user.id, version=1)

        with patch("app.routes.salary.add_employee_log"):
            # HR user A commits first — version 1 → 2
            r_a = await client.patch(
                f"/api/v1/salary/{sal.id}",
                json={"version": 1, "payment_status": "HOLD"},
                headers=auth_headers,
            )
            assert r_a.status_code == 200
            assert r_a.json()["version"] == 2

            # HR user B arrives with the old version token — must be rejected
            r_b = await client.patch(
                f"/api/v1/salary/{sal.id}",
                json={"version": 1, "payment_status": "PROCESSED"},
                headers=auth_headers,
            )
            assert r_b.status_code == 404
            assert "refresh" in r_b.json()["message"].lower()


# ─────────────────────────────────────────────────────────────────────────────
# BASE PAY UPDATE  — PATCH /api/v1/salary/modify-base/{id}
# ─────────────────────────────────────────────────────────────────────────────

class TestBasePayOptimisticLocking:
    """Optimistic-locking behaviour for PATCH /api/v1/salary/modify-base/{id}."""

    # ── version field is required ────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_update_base_pay_missing_version_returns_422(
        self,
        client: AsyncClient,
        auth_headers: dict,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Omitting 'version' from the request body must return 422."""
        emp = _make_employee("BpV422")
        db_session.add(emp)
        await db_session.commit()
        await db_session.refresh(emp)

        await _seed_base_pay(db_session, emp.id, test_user.id)

        response = await client.patch(
            f"/api/v1/salary/modify-base/{emp.id}",
            json={"base_salary": "7000.00", "remark": "Raise"},   # no version
            headers=auth_headers,
        )
        assert response.status_code == 422

    # ── correct version → success, version incremented ───────────────────────

    @pytest.mark.asyncio
    async def test_update_base_pay_correct_version_increments(
        self,
        client: AsyncClient,
        auth_headers: dict,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Correct version must succeed and version in response must be N+1."""
        emp = _make_employee("BpOK")
        db_session.add(emp)
        await db_session.commit()
        await db_session.refresh(emp)

        await _seed_base_pay(db_session, emp.id, test_user.id, version=1)

        with patch("app.routes.salary.add_employee_log"):
            response = await client.patch(
                f"/api/v1/salary/modify-base/{emp.id}",
                json={"version": 1, "base_salary": "7000.00", "remark": "Annual raise"},
                headers=auth_headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["version"] == 2
        assert Decimal(str(data["base_salary"])) == Decimal("7000.00")

    # ── stale version → 404 ───────────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_update_base_pay_stale_version_returns_404(
        self,
        client: AsyncClient,
        auth_headers: dict,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Client sending an older version than what the DB holds must get 404."""
        emp = _make_employee("BpStale")
        db_session.add(emp)
        await db_session.commit()
        await db_session.refresh(emp)

        # DB is at version 5; client only knows about version 2
        await _seed_base_pay(db_session, emp.id, test_user.id, version=5)

        with patch("app.routes.salary.add_employee_log"):
            response = await client.patch(
                f"/api/v1/salary/modify-base/{emp.id}",
                json={"version": 2, "base_salary": "8000.00", "remark": "Stale raise"},
                headers=auth_headers,
            )

        assert response.status_code == 404
        assert "refresh" in response.json()["message"].lower()

    # ── future version → 404 ─────────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_update_base_pay_future_version_returns_404(
        self,
        client: AsyncClient,
        auth_headers: dict,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Version higher than the DB value must also return 404."""
        emp = _make_employee("BpFuture")
        db_session.add(emp)
        await db_session.commit()
        await db_session.refresh(emp)

        await _seed_base_pay(db_session, emp.id, test_user.id, version=1)

        with patch("app.routes.salary.add_employee_log"):
            response = await client.patch(
                f"/api/v1/salary/modify-base/{emp.id}",
                json={"version": 99, "base_salary": "9000.00", "remark": "Future raise"},
                headers=auth_headers,
            )

        assert response.status_code == 404

    # ── sequential updates each using the returned version ───────────────────

    @pytest.mark.asyncio
    async def test_update_base_pay_sequential_updates_succeed(
        self,
        client: AsyncClient,
        auth_headers: dict,
        db_session: AsyncSession,
        test_user: User,
    ):
        """Two back-to-back updates using each response's version must both succeed."""
        emp = _make_employee("BpSeq")
        db_session.add(emp)
        await db_session.commit()
        await db_session.refresh(emp)

        await _seed_base_pay(db_session, emp.id, test_user.id, version=1)

        with patch("app.routes.salary.add_employee_log"):
            r1 = await client.patch(
                f"/api/v1/salary/modify-base/{emp.id}",
                json={"version": 1, "base_salary": "7000.00", "remark": "First raise"},
                headers=auth_headers,
            )
            assert r1.status_code == 200
            assert r1.json()["version"] == 2

            r2 = await client.patch(
                f"/api/v1/salary/modify-base/{emp.id}",
                json={"version": 2, "base_salary": "8000.00", "remark": "Second raise"},
                headers=auth_headers,
            )
            assert r2.status_code == 200
            assert r2.json()["version"] == 3
            assert Decimal(str(r2.json()["base_salary"])) == Decimal("8000.00")

    # ── race: first writer wins, second writer with stale version loses ───────

    @pytest.mark.asyncio
    async def test_update_base_pay_second_writer_with_stale_version_loses(
        self,
        client: AsyncClient,
        auth_headers: dict,
        db_session: AsyncSession,
        test_user: User,
    ):
        """
        Simulates two HR users both reading version=1 then independently
        trying to update base pay.  The first commit succeeds (version → 2).
        The second, still carrying version=1, is rejected with 404.
        """
        emp = _make_employee("BpRace")
        db_session.add(emp)
        await db_session.commit()
        await db_session.refresh(emp)

        await _seed_base_pay(db_session, emp.id, test_user.id, version=1)

        with patch("app.routes.salary.add_employee_log"):
            # HR user A commits first — version 1 → 2
            r_a = await client.patch(
                f"/api/v1/salary/modify-base/{emp.id}",
                json={"version": 1, "base_salary": "7500.00", "remark": "HR update A"},
                headers=auth_headers,
            )
            assert r_a.status_code == 200
            assert r_a.json()["version"] == 2

            # HR user B arrives with the old version token — must be rejected
            r_b = await client.patch(
                f"/api/v1/salary/modify-base/{emp.id}",
                json={"version": 1, "base_salary": "8000.00", "remark": "HR update B"},
                headers=auth_headers,
            )
            assert r_b.status_code == 404
            assert "refresh" in r_b.json()["message"].lower()
