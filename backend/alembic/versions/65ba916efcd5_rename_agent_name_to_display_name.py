"""rename agent name to display_name

Revision ID: 65ba916efcd5
Revises: b76e12419c08
Create Date: 2025-11-07 23:38:48.068430

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '65ba916efcd5'
down_revision: Union[str, None] = 'b76e12419c08'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename column from name to display_name (preserves data)
    op.alter_column('agents', 'name', new_column_name='display_name')
    
    # Rename index
    op.execute('ALTER INDEX ix_agents_name RENAME TO ix_agents_display_name')


def downgrade() -> None:
    # Reverse: Rename index back
    op.execute('ALTER INDEX ix_agents_display_name RENAME TO ix_agents_name')
    
    # Reverse: Rename column back
    op.alter_column('agents', 'display_name', new_column_name='name')
