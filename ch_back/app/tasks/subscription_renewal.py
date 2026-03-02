from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.sql import func
from decimal import Decimal
from datetime import date, timedelta
from app.database import AsyncSessionLocal
from app.models import (User, Subscription, Card, Transaction, 
                        TypeTransaction, StatusTransaction, UserRole)
from app.config import settings

async def renew_subscriptions():
    async with AsyncSessionLocal() as session:
        session: AsyncSession
        async with session.begin():
            result = await session.execute(select(Subscription).where(
                Subscription.is_active == True, Subscription.next_payment_at <= date.today()
            ))
            expired_subs = result.scalars().all()

            for sub in expired_subs:
                sub: Subscription
                # Card object
                card: Card
                resultt = await session.execute(select(Card).where(
                    Card.id == sub.card_id).with_for_update(of=Card)
                    )
                card = resultt.scalar_one_or_none()

                # User object
                user = await session.execute(select(User).where(User.id == sub.user_id))
                user = user.scalar_one()

                # is platform card 
                platform = await session.execute(
                    select(Card).where(
                        Card.card_number == settings.PLATFORM_CARD).with_for_update(of=Card))
                platform = platform.scalar_one()

                if not card or card.balance < sub.price:
                    sub.is_active = False
                    user.role = UserRole.USER
                    continue

                card.balance -= sub.price
                platform.balance += sub.price
                sub.next_payment_at = date.today() + timedelta(days=31)

                session.add(Transaction(
                    from_card_id = card.id,
                    to_card_id = platform.id,
                    amount = sub.price,
                    commission = Decimal("0"),
                    type = TypeTransaction.TRANSFER,
                    status = StatusTransaction.SUCCESS,
                    description = "Premium obuna yangilandi",
                    completed_at = func.now()
                ))

scheduler = AsyncIOScheduler()
scheduler.add_job(renew_subscriptions, "cron", hour=3, minute=0)
