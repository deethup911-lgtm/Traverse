import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017/traverse"
    JWT_SECRET: str = "super_secret_traverse_jwt_key_1234"
    GEMINI_API_KEY: str = ""
    PORT: int = 5000

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        extra = "ignore"

settings = Settings()
