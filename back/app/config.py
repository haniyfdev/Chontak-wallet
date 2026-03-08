from pydantic_settings import BaseSettings
from decimal import Decimal

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int
    PLATFORM_CARD: str
    REDIS_URL: str = "redis://redis:6379"
    SUBSCRIPTION_PRICE: Decimal

    class Config:
        env_file = ".env"
    
settings = Settings()
