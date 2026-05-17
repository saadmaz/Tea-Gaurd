from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.dependencies import envelope, get_current_user, get_db
from app.models.detection import Detection, DetectionType
from app.models.user import User
from app.schemas.weather import WeatherPredictRequest
from app.services.weather_service import get_weather_prediction

router = APIRouter()


@router.post('/predict')
def predict_weather(payload: WeatherPredictRequest, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = get_weather_prediction(request.app.state, payload.latitude, payload.longitude, payload.date)
    detection = Detection(
        user_id=user.id,
        estate_id=user.estate_id,
        detection_type=DetectionType.weather,
        result_label=result['weather_category'],
        latitude=payload.latitude,
        longitude=payload.longitude,
        metadata_json=result['raw_params'],
    )
    db.add(detection)
    db.commit()
    return envelope('success', result, None)
