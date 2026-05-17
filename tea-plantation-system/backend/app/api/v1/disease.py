import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import envelope, get_current_user, get_db
from app.models.detection import Detection, DetectionType
from app.models.user import User
from app.preprocessing.image_pipeline import preprocess_image
from app.services.damage_service import run_damage_assessment
from app.services.disease_service import run_disease_detection
from app.services.s3_service import generate_presigned_url, upload_file

router = APIRouter()


@router.post('/detect')
async def detect_disease(
    request: Request,
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if image.content_type not in {'image/jpeg', 'image/png'}:
        return envelope('error', None, {'code': 'INVALID_FILE_TYPE', 'message': 'JPEG/PNG only'})

    content = await image.read()
    try:
        processed = preprocess_image(content)
    except ValueError:
        return envelope('error', None, {'code': 'IMAGE_TOO_SMALL', 'message': 'Minimum size is 100x100'})

    image_id = str(uuid.uuid4())
    raw_key = f'raw-uploads/{user.estate_id}/{image_id}.jpg'
    upload_file(content, settings.S3_RAW_UPLOADS_BUCKET, raw_key)

    pred = run_disease_detection(getattr(request.app.state, 'disease_model', None), processed)
    label = pred['label']
    is_diseased = label in {'tea_blister_blight', 'stem_branch_canker'}
    damage_pct, annotated_key = None, None

    if is_diseased:
        damage = run_damage_assessment(content, label, getattr(request.app.state, 'damage_maskrcnn', None))
        damage_pct = damage['damage_pct']
        annotated_key = f'processed-outputs/{user.estate_id}/{image_id}_annotated.jpg'
        upload_file(damage['annotated_image_bytes'], settings.S3_PROCESSED_BUCKET, annotated_key)

    if label == 'tea_blister_blight':
        detection_type = DetectionType.disease_blight
    elif label == 'stem_branch_canker':
        detection_type = DetectionType.disease_canker
    else:
        detection_type = DetectionType.healthy

    detection = Detection(
        user_id=user.id,
        estate_id=user.estate_id,
        detection_type=detection_type,
        result_label=label,
        confidence=pred['confidence'],
        damage_pct=damage_pct,
        image_s3_key=raw_key,
        annotated_s3_key=annotated_key,
        latitude=latitude,
        longitude=longitude,
    )
    db.add(detection)
    db.commit()
    db.refresh(detection)

    return envelope('success', {
        'label': label,
        'confidence': pred['confidence'],
        'is_diseased': is_diseased,
        'damage_pct': damage_pct,
        'annotated_image_url': generate_presigned_url(settings.S3_PROCESSED_BUCKET, annotated_key) if annotated_key else None,
        'gps_marker_id': str(detection.id),
    }, None)
