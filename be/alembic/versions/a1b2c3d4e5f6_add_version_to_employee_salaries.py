"""add version to employee_salaries

Revision ID: a1b2c3d4e5f6
Revises: 58c640c485dd
Create Date: 2026-11-18 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '58c640c485dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'employee_salaries',
        sa.Column('version', sa.Integer(), nullable=False, server_default=sa.text('1'))
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('employee_salaries', 'version')
