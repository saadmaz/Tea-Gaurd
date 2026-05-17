from datetime import date

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.dependencies import envelope, get_current_user, get_db
from app.models.detection import Detection, DetectionType
from app.models.sensor_reading import FertilizerRecommendation
from app.models.user import User
from app.schemas.fertilizer import FertilizerRequest
from app.services.fertilizer_service import recommend_fertilizer
from app.services.weather_service import get_weather_prediction

router = APIRouter()


@router.post('/recommend')
def recommend(payload: FertilizerRequest, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    weather = get_weather_prediction(request.app.state, payload.latitude, payload.longitude, str(date.today()))
    result = recommend_fertilizer(request.app.state, payload.model_dump(), weather['weather_category'], weather['rain_warning'])

    rec = FertilizerRecommendation(
        sensor_reading_id=payload.sensor_reading_id,
        user_id=user.id,
        weather_condition=result['weather_condition'],
        fertilizer_type=result['fertilizer_type'],
        quantity_kg_ha=result['quantity_kg_ha'],
        application_safe=result['application_safe'],
    )
    db.add(rec)
    db.add(Detection(user_id=user.id, estate_id=user.estate_id, detection_type=DetectionType.fertilizer, result_label=result['fertilizer_type'], latitude=payload.latitude, longitude=payload.longitude, metadata_json=result))
    db.commit()
    return envelope('success', result, None)
