from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings
import uuid

# --- sqlalchemy engine
engine = create_async_engine(settings.DATABASE_URL, echo=True)

# --- session factory
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

# --- class for sqlalchemy models
Base = declarative_base()

# --- get db session
async def get_db():
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()

# --- get transaction db session
async def get_transaction_db():
    async with AsyncSessionLocal() as session:
        async with session.begin():
            yield session
            



