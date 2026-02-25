from redis import asyncio as aioredis
from app.config import settings

redis_client = aioredis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    encoding="utf-8"
)

async def get_redis():
    try:
        yield redis_client
    finally:
        pass