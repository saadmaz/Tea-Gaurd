import boto3

from app.core.config import settings


s3_client = boto3.client(
    "s3",
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    endpoint_url=settings.S3_ENDPOINT_URL if settings.ENV == "development" else None,
)


def upload_file(file_bytes, bucket, key) -> str:
    s3_client.put_object(Bucket=bucket, Key=key, Body=file_bytes)
    return key


def generate_presigned_url(bucket, key, expiry_seconds=3600) -> str:
    return s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=expiry_seconds,
    )
