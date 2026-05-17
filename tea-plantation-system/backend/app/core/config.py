from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENV: str = "development"
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/tea_guard"
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str = "model-artifacts"
    AWS_ACCESS_KEY_ID: str = "test"
    AWS_SECRET_ACCESS_KEY: str = "test"
    S3_ENDPOINT_URL: str | None = None


settings = Settings()
