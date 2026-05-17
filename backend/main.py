import logging
from contextlib import asynccontextmanager

import boto3
from botocore.exceptions import ClientError
from fastapi import FastAPI

from app.api.v1 import auth, weather, fertilizer, disease, pest, sensor, detections, map as map_router
from app.core.config import settings
from app.core.database import Base, engine
from app.ml.model_loader import load_models

logger = logging.getLogger(__name__)


def _ensure_s3_buckets() -> None:
    """Create S3 buckets if they don't exist (idempotent; handles LocalStack and real AWS)."""
    kwargs = dict(
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    if settings.S3_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL

    s3 = boto3.client("s3", **kwargs)
    for bucket in (settings.S3_RAW_UPLOADS_BUCKET, settings.S3_PROCESSED_BUCKET, settings.S3_MODEL_BUCKET):
        try:
            s3.head_bucket(Bucket=bucket)
        except ClientError as exc:
            code = exc.response["Error"]["Code"]
            if code in ("404", "NoSuchBucket"):
                try:
                    if settings.AWS_REGION == "us-east-1":
                        s3.create_bucket(Bucket=bucket)
                    else:
                        s3.create_bucket(
                            Bucket=bucket,
                            CreateBucketConfiguration={"LocationConstraint": settings.AWS_REGION},
                        )
                    logger.info("Created S3 bucket: %s", bucket)
                except ClientError as create_err:
                    logger.warning("Could not create bucket %s: %s", bucket, create_err)
            else:
                logger.warning("S3 bucket check failed for %s: %s", bucket, exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    try:
        _ensure_s3_buckets()
    except Exception as exc:
        logger.warning("S3 bucket init skipped: %s", exc)
    load_models(app)
    yield


app = FastAPI(title="Tea Plantation Smart Monitoring API", lifespan=lifespan)


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(weather.router, prefix="/api/v1/weather", tags=["weather"])
app.include_router(fertilizer.router, prefix="/api/v1/fertilizer", tags=["fertilizer"])
app.include_router(disease.router, prefix="/api/v1/disease", tags=["disease"])
app.include_router(pest.router, prefix="/api/v1/pest", tags=["pest"])
app.include_router(sensor.router, prefix="/api/v1/sensor", tags=["sensor"])
app.include_router(detections.router, prefix="/api/v1/detections", tags=["detections"])
app.include_router(map_router.router, prefix="/api/v1/map", tags=["map"])
