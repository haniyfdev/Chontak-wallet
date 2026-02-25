from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int
    PLATFORM_CARD: str

    class Config:
        env_file = ".env"
    
settings = Settings()
