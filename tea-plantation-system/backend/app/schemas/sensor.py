from pydantic import BaseModel


class SensorUploadRequest(BaseModel):
    device_id: str
    nitrogen: float
    phosphorus: float
    potassium: float
    ph_level: float
    latitude: float
    longitude: float
