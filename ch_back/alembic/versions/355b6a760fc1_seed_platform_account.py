"""seed platform account

Revision ID: 355b6a760fc1
Revises: 361c04e39b8f
Create Date: 2026-02-18 16:58:02.438591

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '355b6a760fc1'
down_revision: Union[str, Sequence[str], None] = '361c04e39b8f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    from sqlalchemy import text
    op.execute(text("""
        INSERT INTO users (id, full_name, phone_number, hashed_password, role)
        VALUES ('00000000-0000-0000-0000-000000000001', 
                'Chontak Platform', '+998000000000', 'no-login', 'ADMIN')
    """))
    op.execute(text("""
        INSERT INTO cards (id, user_id, card_number, balance, status, expiry_date)
        VALUES (gen_random_uuid(),
                '00000000-0000-0000-0000-000000000001',
                '7777000000000000', 0.00, 'ACTIVE', '2099-12-31')
    """))

def downgrade():
    from sqlalchemy import text
    op.execute(text("DELETE FROM cards WHERE card_number = '7777000000000000'"))
    op.execute(text("DELETE FROM users WHERE phone_number = '+998000000000'"))