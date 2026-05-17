import uuid

from pydantic import BaseModel


class FertilizerRequest(BaseModel):
    nitrogen: float
    phosphorus: float
    potassium: float
    ph_level: float
    plant_type: str
    cultivar: str
    latitude: float
    longitude: float
    sensor_reading_id: uuid.UUID | None = None
