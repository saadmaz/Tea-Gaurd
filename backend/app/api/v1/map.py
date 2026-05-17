from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import envelope, get_current_user, get_db
from app.models.detection import Detection
from app.models.user import User

router = APIRouter()


@router.get('/markers')
def markers(detection_type: str | None = None, days: int = 30, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    q = db.query(Detection).filter(
        Detection.estate_id == user.estate_id,
        Detection.latitude.is_not(None),
        Detection.created_at >= cutoff,
    )
    if detection_type:
        q = q.filter(Detection.detection_type == detection_type)

    def color(item: Detection):
        if item.detection_type.value.startswith('disease'):
            return 'red'
        if item.detection_type.value.startswith('pest'):
            return 'orange'
        return 'green'

    out = [{
        'id': str(d.id),
        'latitude': d.latitude,
        'longitude': d.longitude,
        'detection_type': d.detection_type.value,
        'label': d.result_label,
        'damage_pct': d.damage_pct,
        'created_at': d.created_at.isoformat(),
        'marker_color': color(d),
    } for d in q.order_by(Detection.created_at.desc()).all()]
    return envelope('success', out, None)
