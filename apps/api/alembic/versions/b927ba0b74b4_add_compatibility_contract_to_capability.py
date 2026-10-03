"""add_compatibility_contract_to_capability

Revision ID: b927ba0b74b4
Revises: 
Create Date: 2026-10-03 23:04:24.525897
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'b927ba0b74b4'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('capabilities', sa.Column('compatibility_contract', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('capabilities', 'compatibility_contract')
