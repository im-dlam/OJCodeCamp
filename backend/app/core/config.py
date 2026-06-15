
from pydantic import Field
from pydantic_settings import BaseSettings
from functools import lru_cache



class Settings(BaseSettings):
    # ==
    # ENVIROMENT
    # ==
    ENV: str = Field(default="development")
    DEBUG: bool = Field(default=False)
    SECRET_KEY: str
    DEPLOY: str = Field(default="local")
    BASE_URL: str
    ALGORITHM: str = Field(default="chacha20")
    # ==
    # DATABASE
    # ==
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./devwebdata.db"
    )
    DB_POOL_SIZE: int = 40
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_RECYCLE: int = 1800
    
    # ==
    # REDIS
    # ==
    REDIS_HOST: str = Field(default="localhost")
    REDIS_PORT: int = Field(default=6379)
    REDIS_DB: int = 0
    REDIS_DECODE: bool = True
    REDIS_CONNECTION: int = 1000
    REDIS_MAX_LEN: int = 10000
    # ==
    # REDIS WORKER BANK
    # == 
    REDIS_CONSUMER: str = Field(default="worker_%s")
    REDIS_STREAM: str = Field(default="bank_stream")
    REDIS_STREAM_USDT: str = Field(default="usdt_stream")
    REDIS_GROUP: str = Field(default="bank_group")
    REDIS_XBATH_SIZE: int = Field(default=1000)
    REDIS_BANK_WORKERS: int = Field(default=10)
    REDIS_BLOCK_MS: int = 50
    # =============
    # PRODUCT
    # =============
    BATCH_SIZE_SOLD: int = 1000
    TELEGRAM: str = Field(default="https://t.me/im_dlam")
    
    # AUTH
    PREFIX: str = "bit_"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache 
def get_settings() -> Settings:
    return Settings(_env_file=".env")

settings = get_settings()
settings.SECRET_KEY = bytes.fromhex(settings.SECRET_KEY) # convert to hex