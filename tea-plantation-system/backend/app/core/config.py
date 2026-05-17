from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENV: str = "development"
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/tea_guard"
    SECRET_KEY: str = "change-me-use-32-char-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # S3 / LocalStack
    AWS_REGION: str = "ap-south-1"
    AWS_ACCESS_KEY_ID: str = "test"
    AWS_SECRET_ACCESS_KEY: str = "test"
    S3_ENDPOINT_URL: str | None = None

    # Bucket names
    S3_RAW_UPLOADS_BUCKET: str = "raw-uploads"
    S3_PROCESSED_BUCKET: str = "processed-outputs"
    S3_MODEL_BUCKET: str = "model-artifacts"

    # Legacy single-bucket alias (kept for backwards compat)
    S3_BUCKET: str = "model-artifacts"

    # Admin dashboard
    ADMIN_EMAIL: str = "admin@tea.lk"
    ADMIN_PASSWORD: str = ""

    # Backend URL (used by dashboard)
    BACKEND_URL: str = "http://localhost:8000"


settings = Settings()
