import uuid

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import envelope, get_current_user, get_db
from app.models.detection import Detection, DetectionType
from app.models.user import User
from app.preprocessing.audio_pipeline import preprocess_audio
from app.services.pest_service import run_pest_detection
from app.services.s3_service import upload_file

router = APIRouter()


@router.post('/detect')
async def detect_pest(
    request: Request,
    audio: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if audio.content_type not in {'audio/wav', 'audio/x-wav'}:
        return envelope('error', None, {'code': 'INVALID_AUDIO_FORMAT', 'message': 'WAV only'})

    content = await audio.read()
    try:
        processed = preprocess_audio(content)
    except ValueError:
        return envelope('error', None, {'code': 'AUDIO_TOO_SHORT', 'message': 'Audio must be at least 1 second'})

    audio_id = str(uuid.uuid4())
    raw_key = f'raw-uploads/{user.estate_id}/{audio_id}.wav'
    upload_file(content, settings.S3_BUCKET, raw_key)

    pred = run_pest_detection(getattr(request.app.state, 'pest_model', None), processed)
    detection = Detection(
        user_id=user.id,
        estate_id=user.estate_id,
        detection_type=DetectionType.pest_shot_hole,
        result_label=pred['label'],
        confidence=pred['confidence'],
        audio_s3_key=raw_key,
        latitude=latitude,
        longitude=longitude,
    )
    db.add(detection)
    db.commit()
    db.refresh(detection)

    recommendation = 'TRI protocol: isolate affected blocks, set pheromone traps, and apply approved bio-control.' if pred['label'] == 'infested' else 'No infestation detected.'
    return envelope('success', {
        'label': pred['label'],
        'confidence': pred['confidence'],
        'gps_marker_id': str(detection.id),
        'recommendation': recommendation,
    }, None)
