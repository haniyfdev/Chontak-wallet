import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config, create_async_engine # Async engine uchun
from app.config import settings
from alembic import context
from app.database import Base
from app.models import * 

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def do_run_migrations(connection: Connection) -> None:
    """Asinxron ulanish ichida bajariladigan haqiqiy migratsiya logikasi"""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    """Asinxron engine yaratish va ulanishni boshqarish"""
    
    connectable = create_async_engine(
        settings.DATABASE_URL,
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        # run_sync: asinxron ulanish ichida sinxron funksiyani chaqirish usuli
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

def run_migrations_online() -> None:
    """Online rejimda migratsiyani ishga tushirish (Asinxron wrapper)"""
    asyncio.run(run_async_migrations())

# Offline rejim (agar kerak bo'lsa, o'zgarishsiz qoldi)
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()