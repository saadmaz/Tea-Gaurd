import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import envelope, get_current_user, get_db
from app.models.detection import Detection
from app.models.user import User
from app.services.s3_service import generate_presigned_url

router = APIRouter()


@router.get('/history')
def history(
    detection_type: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    page: int = 1,
    page_size: int = Query(default=20, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Detection).filter(Detection.estate_id == user.estate_id)
    if detection_type:
        q = q.filter(Detection.detection_type == detection_type)
    if start_date:
        q = q.filter(Detection.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        q = q.filter(Detection.created_at <= datetime.fromisoformat(end_date))

    total = q.count()
    rows = q.order_by(Detection.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    results = [{
        'id': str(r.id),
        'detection_type': r.detection_type.value,
        'label': r.result_label,
        'confidence': r.confidence,
        'damage_pct': r.damage_pct,
        'created_at': r.created_at.isoformat(),
    } for r in rows]
    return envelope('success', {'total': total, 'page': page, 'results': results}, None)


@router.get('/{detection_id}')
def get_detection(detection_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(Detection).filter(Detection.id == detection_id, Detection.estate_id == user.estate_id).first()
    if not row:
        return envelope('error', None, {'code': 'NOT_FOUND', 'message': 'Detection not found'})
    return envelope('success', {
        'id': str(row.id),
        'detection_type': row.detection_type.value,
        'result_label': row.result_label,
        'confidence': row.confidence,
        'damage_pct': row.damage_pct,
        'image_url': generate_presigned_url(settings.S3_BUCKET, row.image_s3_key) if row.image_s3_key else None,
        'annotated_image_url': generate_presigned_url(settings.S3_BUCKET, row.annotated_s3_key) if row.annotated_s3_key else None,
        'audio_url': generate_presigned_url(settings.S3_BUCKET, row.audio_s3_key) if row.audio_s3_key else None,
        'metadata': row.metadata_json,
        'created_at': row.created_at.isoformat(),
    }, None)
