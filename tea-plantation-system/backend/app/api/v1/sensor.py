import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import envelope, get_current_user, get_db
from app.models.sensor_reading import SensorReading
from app.models.user import User
from app.schemas.sensor import SensorUploadRequest

router = APIRouter()


@router.post('/upload')
def upload_sensor(payload: SensorUploadRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reading = SensorReading(estate_id=user.estate_id, **payload.model_dump())
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return envelope('success', {'reading_id': str(reading.id), 'created_at': reading.created_at.isoformat()}, None)


@router.get('/latest')
def latest_sensor(estate_id: uuid.UUID, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reading = db.query(SensorReading).filter(SensorReading.estate_id == estate_id).order_by(SensorReading.created_at.desc()).first()
    if not reading:
        raise HTTPException(status_code=404, detail='No readings found')
    return envelope('success', {
        'id': str(reading.id),
        'device_id': reading.device_id,
        'nitrogen': reading.nitrogen,
        'phosphorus': reading.phosphorus,
        'potassium': reading.potassium,
        'ph_level': reading.ph_level,
        'latitude': reading.latitude,
        'longitude': reading.longitude,
        'created_at': reading.created_at.isoformat(),
    }, None)
